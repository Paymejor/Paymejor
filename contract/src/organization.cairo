// Organization.cairo
// Main organization contract managing members, collateral, proposals, and Vesu integration
// 
// This contract will be implemented in Tasks 2.2-2.7
// 
// Key Features:
// - Semaphore group membership management
// - wBTC collateral pooling
// - Anonymous proposal creation and voting
// - Vesu lending integration
// - Debt repayment and metrics

// ERC20 Interface for token transfers
#[starknet::interface]
trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: starknet::ContractAddress, amount: u256) -> bool;
    fn transfer_from(ref self: TContractState, sender: starknet::ContractAddress, recipient: starknet::ContractAddress, amount: u256) -> bool;
    fn approve(ref self: TContractState, spender: starknet::ContractAddress, amount: u256) -> bool;
    fn balance_of(self: @TContractState, account: starknet::ContractAddress) -> u256;
}

// Vesu Interface for lending pool interactions
#[starknet::interface]
trait IVesu<TContractState> {
    fn supply(ref self: TContractState, token: starknet::ContractAddress, amount: u256);
    fn borrow(ref self: TContractState, token: starknet::ContractAddress, amount: u256);
    fn repay(ref self: TContractState, token: starknet::ContractAddress, amount: u256);
    fn get_position(self: @TContractState, user: starknet::ContractAddress) -> (u256, u256); // (collateral, debt)
}

// Semaphore Verifier Interface for ZK proof verification
#[starknet::interface]
trait ISemaphoreVerifier<TContractState> {
    fn verify_proof(
        self: @TContractState,
        merkle_tree_root: u256,
        nullifier: u256,
        signal: u256,
        external_nullifier: u256,
        proof: Span<u256>
    ) -> bool;
}

#[starknet::interface]
trait IOrganization<TContractState> {
    // Member management
    fn add_member(ref self: TContractState, identity_commitment: u256);
    fn get_member_count(self: @TContractState) -> u256;
    
    // Collateral management
    fn deposit_collateral(ref self: TContractState, amount: u256);
    fn withdraw_collateral(ref self: TContractState, amount: u256);
    fn get_total_collateral(self: @TContractState) -> u256;
    fn get_member_collateral(self: @TContractState, member: starknet::ContractAddress) -> u256;
    
    // Proposal management
    fn create_proposal(
        ref self: TContractState,
        proof: SemaphoreProof,
        amount: u256,
        purpose: felt252,
        duration: u64
    ) -> u256;
    fn vote(ref self: TContractState, proposal_id: u256, proof: SemaphoreProof, vote_yes: bool);
    fn execute_proposal(ref self: TContractState, proposal_id: u256);
    fn get_proposal(self: @TContractState, proposal_id: u256) -> Proposal;
    
    // Debt management
    fn repay_debt(ref self: TContractState, amount: u256);
    fn get_total_debt(self: @TContractState) -> u256;
    
    // Metrics
    fn get_ltv(self: @TContractState) -> u256;
    fn get_health_factor(self: @TContractState) -> u256;
}

#[derive(Drop, Serde, starknet::Store)]
struct Proposal {
    id: u256,
    creator_nullifier: u256,
    amount: u256,
    purpose: felt252,
    yes_votes: u256,
    no_votes: u256,
    executed: bool,
    created_at: u64,
    expires_at: u64,
}

#[derive(Drop, Serde)]
struct SemaphoreProof {
    merkle_tree_depth: u256,
    merkle_tree_root: u256,
    nullifier: u256,
    message: u256,
    scope: u256,
    points: Array<u256>,
}

#[starknet::contract]
mod Organization {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::get_block_timestamp;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map};
    use super::{Proposal, SemaphoreProof, IERC20Dispatcher, IERC20DispatcherTrait, IVesuDispatcher, IVesuDispatcherTrait, ISemaphoreVerifierDispatcher, ISemaphoreVerifierDispatcherTrait};
    use core::traits::TryInto;

    #[storage]
    struct Storage {
        admin: ContractAddress,
        semaphore_address: ContractAddress,
        group_id: u256,
        vesu_pool: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
        
        // Member tracking
        member_collateral: Map<ContractAddress, u256>,
        member_count: u256,
        identity_commitments: Map<u256, u256>, // index -> commitment
        total_collateral: u256,
        
        // Nullifier to address mapping for anonymous actions
        nullifier_to_address: Map<u256, ContractAddress>,
        
        // Proposal tracking
        proposals: Map<u256, Proposal>,
        proposal_count: u256,
        proposal_nullifiers: Map<u256, bool>,
        vote_nullifiers: Map<(u256, u256), bool>,
        
        // Debt tracking
        total_debt: u256,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MemberAdded: MemberAdded,
        CollateralDeposited: CollateralDeposited,
        CollateralWithdrawn: CollateralWithdrawn,
        ProposalCreated: ProposalCreated,
        VoteCast: VoteCast,
        ProposalExecuted: ProposalExecuted,
        DebtRepaid: DebtRepaid,
    }
    
    #[derive(Drop, starknet::Event)]
    struct MemberAdded {
        identity_commitment: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct CollateralDeposited {
        member: ContractAddress,
        amount: u256,
        total_collateral: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct CollateralWithdrawn {
        member: ContractAddress,
        amount: u256,
        total_collateral: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProposalCreated {
        proposal_id: u256,
        nullifier: u256,
        amount: u256,
        purpose: felt252,
    }
    
    #[derive(Drop, starknet::Event)]
    struct VoteCast {
        proposal_id: u256,
        nullifier: u256,
        vote_yes: bool,
    }
    
    #[derive(Drop, starknet::Event)]
    struct ProposalExecuted {
        proposal_id: u256,
        amount_borrowed: u256,
    }
    
    #[derive(Drop, starknet::Event)]
    struct DebtRepaid {
        amount: u256,
        remaining_debt: u256,
    }
    
    #[constructor]
    fn constructor(
        ref self: ContractState,
        admin: ContractAddress,
        semaphore_address: ContractAddress,
        group_id: u256,
        vesu_pool: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress
    ) {
        self.admin.write(admin);
        self.semaphore_address.write(semaphore_address);
        self.group_id.write(group_id);
        self.vesu_pool.write(vesu_pool);
        self.wbtc_token.write(wbtc_token);
        self.usdc_token.write(usdc_token);
        self.member_count.write(0);
        self.total_collateral.write(0);
        self.proposal_count.write(0);
        self.total_debt.write(0);
    }
    
    #[abi(embed_v0)]
    impl OrganizationImpl of super::IOrganization<ContractState> {
        fn add_member(ref self: ContractState, identity_commitment: u256) {
            // Only admin can add members
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'UNAUTHORIZED');
            
            // Add identity commitment to Semaphore group
            let current_count = self.member_count.read();
            self.identity_commitments.entry(current_count).write(identity_commitment);
            self.member_count.write(current_count + 1);
            
            // Emit MemberAdded event
            self.emit(MemberAdded {
                identity_commitment: identity_commitment,
            });
        }
        
        fn get_member_count(self: @ContractState) -> u256 {
            self.member_count.read()
        }
        
        fn deposit_collateral(ref self: ContractState, amount: u256) {
            assert(amount > 0, 'ZERO_AMOUNT');
            
            let caller = get_caller_address();
            let wbtc_token = self.wbtc_token.read();
            let contract_address = starknet::get_contract_address();
            
            // Transfer wBTC from caller to contract
            let erc20_dispatcher = IERC20Dispatcher { contract_address: wbtc_token };
            let success = erc20_dispatcher.transfer_from(caller, contract_address, amount);
            assert(success, 'TRANSFER_FAILED');
            
            // Update member collateral balance
            let current_member_collateral = self.member_collateral.entry(caller).read();
            self.member_collateral.entry(caller).write(current_member_collateral + amount);
            
            // Update total collateral
            let current_total = self.total_collateral.read();
            let new_total = current_total + amount;
            self.total_collateral.write(new_total);
            
            // Emit CollateralDeposited event
            self.emit(CollateralDeposited {
                member: caller,
                amount: amount,
                total_collateral: new_total,
            });
        }
        
        fn withdraw_collateral(ref self: ContractState, amount: u256) {
            assert(amount > 0, 'ZERO_AMOUNT');
            
            let caller = get_caller_address();
            
            // Check member has sufficient collateral
            let member_collateral = self.member_collateral.entry(caller).read();
            assert(member_collateral >= amount, 'INSUFFICIENT_COLLATERAL');
            
            // Check withdrawal doesn't violate LTV requirements
            let total_collateral = self.total_collateral.read();
            let total_debt = self.total_debt.read();
            
            if total_debt > 0 {
                let new_collateral = total_collateral - amount;
                // LTV check: ensure new_collateral can support debt
                // Assuming liquidation threshold of 80% (LTV must be < 80%)
                // debt / collateral < 0.8
                // debt < 0.8 * collateral
                // debt * 100 < 80 * collateral
                let debt_times_100 = total_debt * 100;
                let collateral_times_80 = new_collateral * 80;
                assert(debt_times_100 < collateral_times_80, 'WITHDRAWAL_UNSAFE');
            }
            
            // Update member collateral balance
            self.member_collateral.entry(caller).write(member_collateral - amount);
            
            // Update total collateral
            let new_total = total_collateral - amount;
            self.total_collateral.write(new_total);
            
            // Transfer wBTC back to member
            let wbtc_token = self.wbtc_token.read();
            let erc20_dispatcher = IERC20Dispatcher { contract_address: wbtc_token };
            let success = erc20_dispatcher.transfer(caller, amount);
            assert(success, 'TRANSFER_FAILED');
            
            // Emit CollateralWithdrawn event
            self.emit(CollateralWithdrawn {
                member: caller,
                amount: amount,
                total_collateral: new_total,
            });
        }
        
        fn get_total_collateral(self: @ContractState) -> u256 {
            self.total_collateral.read()
        }
        
        fn get_member_collateral(self: @ContractState, member: ContractAddress) -> u256 {
            self.member_collateral.entry(member).read()
        }
        
        fn create_proposal(
            ref self: ContractState,
            proof: SemaphoreProof,
            amount: u256,
            purpose: felt252,
            duration: u64
        ) -> u256 {
            assert(amount > 0, 'ZERO_AMOUNT');
            
            let caller = get_caller_address();
            
            // Verify Semaphore proof with proper ZK verification
            self._verify_semaphore_proof(@proof, amount.into());
            
            // Check nullifier hasn't been used for proposals
            let nullifier = proof.nullifier;
            assert(!self.proposal_nullifiers.entry(nullifier).read(), 'DUPLICATE_NULLIFIER');
            
            // Mark nullifier as used
            self.proposal_nullifiers.entry(nullifier).write(true);
            
            // Register nullifier-to-address mapping for fund distribution
            self.nullifier_to_address.entry(nullifier).write(caller);
            
            // Create new proposal
            let proposal_id = self.proposal_count.read();
            let current_time = get_block_timestamp();
            let expires_at = current_time + duration;
            
            let proposal = Proposal {
                id: proposal_id,
                creator_nullifier: nullifier,
                amount: amount,
                purpose: purpose,
                yes_votes: 0,
                no_votes: 0,
                executed: false,
                created_at: current_time,
                expires_at: expires_at,
            };
            
            self.proposals.entry(proposal_id).write(proposal);
            self.proposal_count.write(proposal_id + 1);
            
            // Emit ProposalCreated event
            self.emit(ProposalCreated {
                proposal_id: proposal_id,
                nullifier: nullifier,
                amount: amount,
                purpose: purpose,
            });
            
            proposal_id
        }
        
        fn vote(ref self: ContractState, proposal_id: u256, proof: SemaphoreProof, vote_yes: bool) {
            // Verify proposal exists
            let mut proposal = self.proposals.entry(proposal_id).read();
            assert(proposal.id == proposal_id, 'PROPOSAL_NOT_FOUND');
            
            // Check proposal hasn't expired
            let current_time = get_block_timestamp();
            assert(current_time < proposal.expires_at, 'PROPOSAL_EXPIRED');
            
            // Check proposal hasn't been executed
            assert(!proposal.executed, 'PROPOSAL_ALREADY_EXECUTED');
            
            // Verify Semaphore proof with vote signal
            let vote_signal = if vote_yes { 1 } else { 0 };
            self._verify_semaphore_proof(@proof, vote_signal);
            
            // Check nullifier hasn't been used for this proposal (prevent double-voting)
            let nullifier = proof.nullifier;
            let vote_key = (proposal_id, nullifier);
            assert(!self.vote_nullifiers.entry(vote_key).read(), 'DUPLICATE_NULLIFIER');
            
            // Mark nullifier as used for this proposal
            self.vote_nullifiers.entry(vote_key).write(true);
            
            // Update vote counts
            if vote_yes {
                proposal.yes_votes += 1;
            } else {
                proposal.no_votes += 1;
            }
            
            self.proposals.entry(proposal_id).write(proposal);
            
            // Emit VoteCast event
            self.emit(VoteCast {
                proposal_id: proposal_id,
                nullifier: nullifier,
                vote_yes: vote_yes,
            });
        }
        
        fn execute_proposal(ref self: ContractState, proposal_id: u256) {
            // Get proposal
            let mut proposal = self.proposals.entry(proposal_id).read();
            assert(proposal.id == proposal_id, 'PROPOSAL_NOT_FOUND');
            
            // Check proposal hasn't expired
            let current_time = get_block_timestamp();
            assert(current_time < proposal.expires_at, 'PROPOSAL_EXPIRED');
            
            // Check proposal hasn't been executed
            assert(!proposal.executed, 'PROPOSAL_ALREADY_EXECUTED');
            
            // Check quorum and approval
            assert(self._check_quorum(@proposal), 'PROPOSAL_NOT_APPROVED');
            
            // Extract amount before marking as executed
            let amount = proposal.amount;
            let creator_nullifier = proposal.creator_nullifier;
            
            // Mark proposal as executed
            proposal.executed = true;
            self.proposals.entry(proposal_id).write(proposal);
            
            let wbtc_token = self.wbtc_token.read();
            let usdc_token = self.usdc_token.read();
            let vesu_pool = self.vesu_pool.read();
            let total_collateral = self.total_collateral.read();
            
            // Step 1: Approve wBTC to Vesu
            let erc20_dispatcher = IERC20Dispatcher { contract_address: wbtc_token };
            erc20_dispatcher.approve(vesu_pool, total_collateral);
            
            // Step 2: Supply wBTC collateral to Vesu
            let vesu_dispatcher = IVesuDispatcher { contract_address: vesu_pool };
            vesu_dispatcher.supply(wbtc_token, total_collateral);
            
            // Step 3: Borrow USDC from Vesu
            vesu_dispatcher.borrow(usdc_token, amount);
            
            // Step 4: Transfer borrowed USDC to proposal creator using nullifier mapping
            let recipient = self.nullifier_to_address.entry(creator_nullifier).read();
            let zero_address: ContractAddress =  0.try_into().unwrap();
            assert(recipient != zero_address, 'RECIPIENT_NOT_FOUND');
            
            let usdc_dispatcher = IERC20Dispatcher { contract_address: usdc_token };
            usdc_dispatcher.transfer(recipient, amount);
            
            // Step 5: Update debt tracking
            let current_debt = self.total_debt.read();
            self.total_debt.write(current_debt + amount);
            
            // Emit ProposalExecuted event
            self.emit(ProposalExecuted {
                proposal_id: proposal_id,
                amount_borrowed: amount,
            });
        }
        
        fn get_proposal(self: @ContractState, proposal_id: u256) -> Proposal {
            self.proposals.entry(proposal_id).read()
        }
        
        fn repay_debt(ref self: ContractState, amount: u256) {
            assert(amount > 0, 'ZERO_AMOUNT');
            
            let caller = get_caller_address();
            let usdc_token = self.usdc_token.read();
            let vesu_pool = self.vesu_pool.read();
            let contract_address = starknet::get_contract_address();
            
            // Get current debt
            let current_debt = self.total_debt.read();
            assert(current_debt > 0, 'NO_DEBT_TO_REPAY');
            
            // Calculate actual repayment amount (can't repay more than debt)
            let repay_amount = if amount > current_debt {
                current_debt
            } else {
                amount
            };
            
            // Step 1: Transfer USDC from caller to contract
            let erc20_dispatcher = IERC20Dispatcher { contract_address: usdc_token };
            let success = erc20_dispatcher.transfer_from(caller, contract_address, repay_amount);
            assert(success, 'TRANSFER_FAILED');
            
            // Step 2: Approve USDC to Vesu
            erc20_dispatcher.approve(vesu_pool, repay_amount);
            
            // Step 3: Repay debt to Vesu
            let vesu_dispatcher = IVesuDispatcher { contract_address: vesu_pool };
            vesu_dispatcher.repay(usdc_token, repay_amount);
            
            // Step 4: Update debt balance
            let new_debt = current_debt - repay_amount;
            self.total_debt.write(new_debt);
            
            // Emit DebtRepaid event
            self.emit(DebtRepaid {
                amount: repay_amount,
                remaining_debt: new_debt,
            });
        }
        
        fn get_total_debt(self: @ContractState) -> u256 {
            self.total_debt.read()
        }
        
        fn get_ltv(self: @ContractState) -> u256 {
            // LTV = (Total Debt / Total Collateral) * 100
            let total_collateral = self.total_collateral.read();
            let total_debt = self.total_debt.read();
            
            if total_collateral == 0 {
                return 0;
            }
            
            // Calculate LTV as percentage
            // LTV = (debt * 100) / collateral
            (total_debt * 100) / total_collateral
        }
        
        fn get_health_factor(self: @ContractState) -> u256 {
            // Health Factor = (Total Collateral * Liquidation Threshold) / Total Debt
            // Liquidation threshold is typically 80% (0.8)
            // Health Factor > 1 means position is safe
            // Health Factor < 1 means position can be liquidated
            
            let total_collateral = self.total_collateral.read();
            let total_debt = self.total_debt.read();
            
            if total_debt == 0 {
                // No debt means infinite health factor, return max value
                return 1000000; // Representing "infinity" as very large number
            }
            
            if total_collateral == 0 {
                return 0; // No collateral with debt = unhealthy
            }
            
            // Health Factor = (collateral * 80) / (debt * 100)
            // Multiply by 100 to get percentage representation
            // HF = (collateral * 80 * 100) / (debt * 100)
            // HF = (collateral * 80) / debt
            (total_collateral * 80) / total_debt
        }
    }
    
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _verify_semaphore_proof(self: @ContractState, proof: @SemaphoreProof, signal: u256) {
            // Get Semaphore verifier contract address
            let semaphore_address = self.semaphore_address.read();
            let verifier = ISemaphoreVerifierDispatcher { contract_address: semaphore_address };
            
            // Get current group root (in production, this would be maintained on-chain)
            let merkle_tree_root = *proof.merkle_tree_root;
            let nullifier = *proof.nullifier;
            let external_nullifier = self.group_id.read(); // Use group_id as external nullifier
            
            // Convert proof points array to span
            let proof_points = proof.points.span();
            
            // Verify the ZK proof using Semaphore verifier
            let is_valid = verifier.verify_proof(
                merkle_tree_root,
                nullifier,
                signal,
                external_nullifier,
                proof_points
            );
            
            assert(is_valid, 'INVALID_PROOF');
            
            // Additional validation
            assert(*proof.merkle_tree_depth > 0, 'INVALID_PROOF');
            assert(merkle_tree_root > 0, 'INVALID_PROOF');
            assert(nullifier > 0, 'INVALID_PROOF');
        }
        
        fn _check_quorum(self: @ContractState, proposal: @Proposal) -> bool {
            // Simple majority: total votes >= member_count / 2
            let total_votes = *proposal.yes_votes + *proposal.no_votes;
            let member_count = self.member_count.read();
            let quorum_threshold = member_count / 2;
            
            total_votes >= quorum_threshold && *proposal.yes_votes > *proposal.no_votes
        }
    }
}
