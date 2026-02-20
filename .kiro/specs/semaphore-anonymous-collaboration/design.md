# Semaphore Anonymous Collaboration Module Design

## 1. System Architecture

### 1.1 Overview

This design document describes the implementation of anonymous group coordination for Paymejor using Semaphore V4 zero-knowledge proofs verified on Starknet via Garaga. The module enables privacy-preserving collective decision-making for shared liquidity vaults.

**Core Architecture Principle**: Wrap existing Paymejor vault operations (Tongo + Vesu) with Semaphore-based anonymous signaling, verified on-chain through Garaga's Cairo proof verifier.

### 1.2 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + TypeScript)               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Semaphore   │  │   Garaga     │  │ Organization │          │
│  │  Identity    │  │   Verifier   │  │  Management  │          │
│  │  + Proof Gen │  │   Client     │  │   UI         │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                     Starknet.js v6+                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
┌───────────────────────────┐  ┌───────────────────────────┐
│  Starknet Sepolia         │  │   Starknet Mainnet        │
│                           │  │                           │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ GaragaVerifier.cairo│ │  │  │ GaragaVerifier.cairo│ │
│  │ (Groth16 verifier)  │ │  │  │ (Groth16 verifier)  │ │
│  └──────────┬──────────┘ │  │  └──────────┬──────────┘ │
│             │             │  │             │             │
│             ▼             │  │             ▼             │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ SemaphoreOrg.cairo  │ │  │  │ SemaphoreOrg.cairo  │ │
│  │ • Merkle root       │ │  │  │ • Merkle root       │ │
│  │ • Nullifiers        │ │  │  │ • Nullifiers        │ │
│  │ • Approvals         │ │  │  │ • Approvals         │ │
│  │ • Admin control     │ │  │  │ • Admin control     │ │
│  └──────────┬──────────┘ │  │  └──────────┬──────────┘ │
│             │             │  │             │             │
│             ▼             │  │             ▼             │
│  ┌─────────────────────┐ │  │  ┌─────────────────────┐ │
│  │ Existing Paymejor   │ │  │  │ Existing Paymejor   │ │
│  │ • Tongo (privacy)   │ │  │  │ • Tongo (privacy)   │ │
│  │ • Vesu (lending)    │ │  │  │ • Vesu (lending)    │ │
│  │ • Shared vault      │ │  │  │ • Shared vault      │ │
│  └─────────────────────┘ │  │  └─────────────────────┘ │
└───────────────────────────┘  └───────────────────────────┘
```


### 1.3 Integration with Existing Paymejor

The collaboration module extends Paymejor without modifying existing vault logic:

- **Existing**: Individual users deposit → borrow → manage positions
- **New**: Organizations pool deposits → collectively approve borrows → share positions
- **Shared Infrastructure**: Same Tongo privacy layer, same Vesu lending pools
- **Key Difference**: Anonymous coordination layer on top

## 2. Data Models

### 2.1 Semaphore Identity (Client-Side, Secret)

```typescript
// Stored encrypted in browser local storage
interface SemaphoreIdentity {
  trapdoor: bigint;           // Secret value 1
  nullifier: bigint;          // Secret value 2
  commitment: bigint;         // Public commitment = hash(trapdoor, nullifier)
}

// Derived from identity
interface IdentityProof {
  merkleProof: string[];      // Path from leaf to root
  root: bigint;               // Current Merkle root
  nullifierHash: bigint;      // Unique per signal
  signal: bigint;             // Action being signaled
  externalNullifier: bigint;  // Scope (groupId + action type)
  proof: Groth16Proof;        // ZK proof
}
```

### 2.2 Organization (On-Chain State)

```typescript
// Cairo contract state
interface OrganizationState {
  groupId: felt252;           // Unique organization identifier
  merkleRoot: felt252;        // Current root of member tree
  depth: u8;                  // Tree depth (fixed at 7)
  memberCount: u32;           // Public member count
  admin: ContractAddress;     // Creator with execution privileges
  threshold: u8;              // Approval threshold (fixed at 4)
  sharedVaultAddress: ContractAddress; // Tongo-shielded Vesu vault
  
  // Mappings
  nullifiers: LegacyMap<felt252, bool>;  // Prevent double-signaling
  proposals: LegacyMap<felt252, Proposal>; // Active proposals
  approvalCounts: LegacyMap<felt252, u32>; // Approvals per proposal
}

interface Proposal {
  proposalId: felt252;
  borrowAmount: u256;
  reason: ByteArray;          // Optional description
  createdAt: u64;
  approvalCount: u32;
  executed: bool;
}
```

### 2.3 Frontend State

```typescript
// Organization management
interface OrganizationContext {
  // User's identity
  identity: SemaphoreIdentity | null;
  hasIdentity: boolean;
  
  // Organizations user is part of
  organizations: Organization[];
  currentOrg: Organization | null;
  
  // Proposals
  proposals: Proposal[];
  userApprovals: Set<string>; // ProposalIds user has approved
  
  // Network
  network: 'sepolia' | 'mainnet';
}

interface Organization {
  groupId: string;
  inviteCode: string;
  memberCount: number;
  merkleRoot: string;
  admin: string;
  threshold: number;
  sharedVaultBalance: string; // Encrypted via Tongo
  isUserMember: boolean;
  isUserAdmin: boolean;
}
```


## 3. Core Workflows

### 3.1 Organization Creation Flow

```typescript
async function createOrganization(network: 'sepolia' | 'mainnet') {
  // 1. Ensure user has Semaphore identity
  const identity = await getOrCreateIdentity();
  
  // 2. Create Semaphore group (depth 7)
  const group = new Group(identity.commitment, 7);
  const groupId = generateGroupId();
  
  // 3. Deploy organization contract
  const orgContract = await deployOrganizationContract({
    groupId,
    initialRoot: group.root,
    admin: userAddress,
    threshold: 4,
    depth: 7,
  });
  
  // 4. Create shared Tongo-shielded Vesu vault
  const sharedVault = await createSharedVault(orgContract.address);
  
  // 5. Link vault to organization
  await orgContract.setSharedVault(sharedVault.address);
  
  // 6. Generate invite code
  const inviteCode = encodeInviteCode(groupId, network);
  
  return { groupId, inviteCode, orgContract };
}
```

### 3.2 Anonymous Join Flow

```typescript
async function joinOrganization(inviteCode: string) {
  // 1. Decode invite code
  const { groupId, network } = decodeInviteCode(inviteCode);
  
  // 2. Ensure user has identity
  const identity = await getOrCreateIdentity();
  
  // 3. Fetch current group state
  const orgContract = await getOrganizationContract(groupId, network);
  const currentRoot = await orgContract.getMerkleRoot();
  const currentMembers = await fetchGroupMembers(groupId);
  
  // 4. Add identity to local group
  const group = new Group(7);
  currentMembers.forEach(c => group.addMember(c));
  group.addMember(identity.commitment);
  
  // 5. Submit transaction to update on-chain root
  await orgContract.addMember(identity.commitment, group.root);
  
  // 6. Wait for confirmation
  await waitForTransaction(txHash);
  
  return { joined: true, groupId };
}
```

### 3.3 Anonymous Deposit Flow

```typescript
async function anonymousDeposit(
  groupId: string,
  amount: string,
  network: 'sepolia' | 'mainnet'
) {
  // 1. Get organization and identity
  const orgContract = await getOrganizationContract(groupId, network);
  const identity = await getIdentity();
  
  // 2. Fetch current group state
  const group = await fetchGroup(groupId);
  const merkleProof = group.generateMerkleProof(identity.commitment);
  
  // 3. Create signal (deposit intent)
  const signal = hashSignal('DEPOSIT', amount);
  const externalNullifier = hashExternalNullifier(groupId, 'DEPOSIT');
  
  // 4. Generate Semaphore proof
  const proof = await generateProof({
    identity,
    group,
    externalNullifier,
    signal,
  });
  
  // 5. Verify proof on-chain via Garaga
  await orgContract.verifyAndDeposit({
    proof: proof.proof,
    merkleRoot: proof.merkleTreeRoot,
    nullifierHash: proof.nullifierHash,
    signal: proof.signal,
    amount,
  });
  
  // 6. Execute deposit to shared vault (Tongo + Vesu)
  // This happens in the contract after proof verification
  
  return { deposited: true, txHash };
}
```

### 3.4 Proposal Creation and Approval Flow

```typescript
async function createProposal(
  groupId: string,
  borrowAmount: string,
  reason: string
) {
  const orgContract = await getOrganizationContract(groupId);
  
  // 1. Validate amount against vault capacity
  const capacity = await getSharedVaultCapacity(groupId);
  if (borrowAmount > capacity) throw new Error('Insufficient collateral');
  
  // 2. Create proposal on-chain
  const proposalId = generateProposalId();
  await orgContract.createProposal({
    proposalId,
    borrowAmount,
    reason,
  });
  
  return { proposalId };
}

async function anonymousApprove(
  groupId: string,
  proposalId: string
) {
  // 1. Get identity and group
  const identity = await getIdentity();
  const group = await fetchGroup(groupId);
  const orgContract = await getOrganizationContract(groupId);
  
  // 2. Create approval signal
  const signal = hashSignal(proposalId, 'YES');
  const externalNullifier = hashExternalNullifier(groupId, 'APPROVE');
  
  // 3. Generate proof
  const proof = await generateProof({
    identity,
    group,
    externalNullifier,
    signal,
  });
  
  // 4. Submit approval with proof
  await orgContract.submitApproval({
    proposalId,
    proof: proof.proof,
    merkleRoot: proof.merkleTreeRoot,
    nullifierHash: proof.nullifierHash,
    signal: proof.signal,
  });
  
  // 5. Contract verifies proof and increments counter
  
  return { approved: true };
}
```

### 3.5 Admin Execution Flow

```typescript
async function executeProposal(
  groupId: string,
  proposalId: string
) {
  const orgContract = await getOrganizationContract(groupId);
  
  // 1. Verify caller is admin
  const admin = await orgContract.getAdmin();
  if (admin !== userAddress) throw new Error('Not admin');
  
  // 2. Verify threshold reached
  const approvalCount = await orgContract.getApprovalCount(proposalId);
  const threshold = await orgContract.getThreshold();
  if (approvalCount < threshold) throw new Error('Threshold not reached');
  
  // 3. Execute borrow on shared vault
  const proposal = await orgContract.getProposal(proposalId);
  await orgContract.executeBorrow({
    proposalId,
    amount: proposal.borrowAmount,
  });
  
  // 4. Contract calls Vesu borrow on shared vault
  // Borrowed USDC goes to shared Tongo-shielded balance
  
  return { executed: true };
}
```


## 4. Protocol Integration Design

### 4.1 Semaphore V4 Integration

**Client-Side Libraries**:
```typescript
import { Identity } from '@semaphore-protocol/identity';
import { Group } from '@semaphore-protocol/group';
import { generateProof } from '@semaphore-protocol/proof';

// Identity management
const identity = new Identity();
const commitment = identity.commitment;

// Group management (depth 7)
const group = new Group(7);
group.addMember(commitment);

// Proof generation
const proof = await generateProof({
  identity,
  group,
  externalNullifier: groupId,
  signal: actionHash,
});
```

**Proof Structure**:
```typescript
interface SemaphoreProof {
  merkleTreeRoot: bigint;     // Group's Merkle root
  nullifierHash: bigint;      // Unique per identity + signal
  signal: bigint;             // Action being signaled
  externalNullifier: bigint;  // Scope (prevents cross-group reuse)
  proof: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]; // Groth16 proof
}
```

### 4.2 Garaga Verifier Integration

**Cairo Verifier Contract**:
```cairo
#[starknet::contract]
mod GaragaVerifier {
    use starknet::ContractAddress;
    
    #[storage]
    struct Storage {
        verification_key: VerificationKey,
    }
    
    #[external(v0)]
    fn verify_semaphore_proof(
        ref self: ContractState,
        proof: Span<felt252>,
        public_inputs: Span<felt252>
    ) -> bool {
        // Garaga-generated Groth16 verification logic
        // Verifies Semaphore proof on-chain
        garaga::verify_groth16(proof, public_inputs, self.verification_key.read())
    }
}
```

**Deployment**:
1. Generate Cairo verifier from Semaphore circuit using Garaga SDK
2. Deploy verifier contract on Sepolia and Mainnet
3. Store verifier addresses in frontend config

### 4.3 Organization Contract (Cairo)

```cairo
#[starknet::contract]
mod SemaphoreOrganization {
    use starknet::{ContractAddress, get_caller_address};
    use core::hash::HashStateTrait;
    
    #[storage]
    struct Storage {
        group_id: felt252,
        merkle_root: felt252,
        depth: u8,
        member_count: u32,
        admin: ContractAddress,
        threshold: u8,
        shared_vault: ContractAddress,
        verifier: ContractAddress,
        
        // Mappings
        nullifiers: LegacyMap<felt252, bool>,
        proposals: LegacyMap<felt252, Proposal>,
        approval_counts: LegacyMap<felt252, u32>,
    }
    
    #[derive(Drop, Serde, starknet::Store)]
    struct Proposal {
        proposal_id: felt252,
        borrow_amount: u256,
        reason: ByteArray,
        created_at: u64,
        executed: bool,
    }
    
    #[constructor]
    fn constructor(
        ref self: ContractState,
        group_id: felt252,
        initial_root: felt252,
        admin: ContractAddress,
        threshold: u8,
        verifier: ContractAddress,
    ) {
        self.group_id.write(group_id);
        self.merkle_root.write(initial_root);
        self.depth.write(7);
        self.member_count.write(1); // Creator is first member
        self.admin.write(admin);
        self.threshold.write(threshold);
        self.verifier.write(verifier);
    }
    
    #[external(v0)]
    fn add_member(
        ref self: ContractState,
        commitment: felt252,
        new_root: felt252
    ) {
        // Open join - no admin approval needed
        self.merkle_root.write(new_root);
        self.member_count.write(self.member_count.read() + 1);
        
        self.emit(MemberAdded { commitment, new_root });
    }
    
    #[external(v0)]
    fn verify_and_deposit(
        ref self: ContractState,
        proof: Span<felt252>,
        merkle_root: felt252,
        nullifier_hash: felt252,
        signal: felt252,
        amount: u256
    ) {
        // 1. Verify proof via Garaga
        let verifier = IVerifierDispatcher { contract_address: self.verifier.read() };
        let public_inputs = array![merkle_root, nullifier_hash, signal, self.group_id.read()];
        assert(verifier.verify_semaphore_proof(proof, public_inputs.span()), 'Invalid proof');
        
        // 2. Check nullifier not used
        assert(!self.nullifiers.read(nullifier_hash), 'Nullifier already used');
        self.nullifiers.write(nullifier_hash, true);
        
        // 3. Execute deposit to shared vault
        let vault = ISharedVaultDispatcher { contract_address: self.shared_vault.read() };
        vault.deposit(amount);
        
        self.emit(AnonymousDeposit { nullifier_hash, amount });
    }
    
    #[external(v0)]
    fn create_proposal(
        ref self: ContractState,
        proposal_id: felt252,
        borrow_amount: u256,
        reason: ByteArray
    ) {
        let proposal = Proposal {
            proposal_id,
            borrow_amount,
            reason,
            created_at: starknet::get_block_timestamp(),
            executed: false,
        };
        
        self.proposals.write(proposal_id, proposal);
        self.approval_counts.write(proposal_id, 0);
        
        self.emit(ProposalCreated { proposal_id, borrow_amount });
    }
    
    #[external(v0)]
    fn submit_approval(
        ref self: ContractState,
        proposal_id: felt252,
        proof: Span<felt252>,
        merkle_root: felt252,
        nullifier_hash: felt252,
        signal: felt252
    ) {
        // 1. Verify proof
        let verifier = IVerifierDispatcher { contract_address: self.verifier.read() };
        let public_inputs = array![merkle_root, nullifier_hash, signal, self.group_id.read()];
        assert(verifier.verify_semaphore_proof(proof, public_inputs.span()), 'Invalid proof');
        
        // 2. Check nullifier not used
        assert(!self.nullifiers.read(nullifier_hash), 'Already voted');
        self.nullifiers.write(nullifier_hash, true);
        
        // 3. Increment approval count
        let current_count = self.approval_counts.read(proposal_id);
        self.approval_counts.write(proposal_id, current_count + 1);
        
        self.emit(ApprovalRecorded { proposal_id, new_count: current_count + 1 });
    }
    
    #[external(v0)]
    fn execute_proposal(
        ref self: ContractState,
        proposal_id: felt252
    ) {
        // 1. Verify caller is admin
        assert(get_caller_address() == self.admin.read(), 'Not admin');
        
        // 2. Verify threshold reached
        let approval_count = self.approval_counts.read(proposal_id);
        assert(approval_count >= self.threshold.read().into(), 'Threshold not reached');
        
        // 3. Verify not already executed
        let mut proposal = self.proposals.read(proposal_id);
        assert(!proposal.executed, 'Already executed');
        
        // 4. Execute borrow on shared vault
        let vault = ISharedVaultDispatcher { contract_address: self.shared_vault.read() };
        vault.borrow(proposal.borrow_amount);
        
        // 5. Mark as executed
        proposal.executed = true;
        self.proposals.write(proposal_id, proposal);
        
        self.emit(ProposalExecuted { proposal_id, amount: proposal.borrow_amount });
    }
}
```


## 5. Frontend Architecture

### 5.1 Component Structure

```
frontend/
├── components/
│   ├── organizations/
│   │   ├── OrganizationList.tsx
│   │   ├── CreateOrganizationDialog.tsx
│   │   ├── JoinOrganizationDialog.tsx
│   │   ├── OrganizationDashboard.tsx
│   │   ├── ProposalList.tsx
│   │   ├── CreateProposalDialog.tsx
│   │   ├── ApprovalProgress.tsx
│   │   └── IdentityManager.tsx
│   └── tabs/
│       └── organizations-tab.tsx
├── hooks/
│   ├── useOrganization.ts
│   ├── useSemaphore.ts
│   ├── useProposal.ts
│   └── useGaragaVerifier.ts
├── lib/
│   ├── semaphore/
│   │   ├── identity.ts
│   │   ├── group.ts
│   │   ├── proof.ts
│   │   └── storage.ts
│   └── garaga/
│       └── verifier-client.ts
└── types/
    ├── semaphore.ts
    └── organization.ts
```

### 5.2 Key Hooks

**useSemaphore.ts**:
```typescript
export function useSemaphore() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [hasIdentity, setHasIdentity] = useState(false);
  
  useEffect(() => {
    // Load identity from encrypted local storage
    const stored = loadIdentity();
    if (stored) {
      setIdentity(stored);
      setHasIdentity(true);
    }
  }, []);
  
  const createIdentity = useCallback(async () => {
    const newIdentity = new Identity();
    await saveIdentity(newIdentity);
    setIdentity(newIdentity);
    setHasIdentity(true);
    return newIdentity;
  }, []);
  
  const generateProof = useCallback(async (params: ProofParams) => {
    if (!identity) throw new Error('No identity');
    return await generateSemaphoreProof({ ...params, identity });
  }, [identity]);
  
  return { identity, hasIdentity, createIdentity, generateProof };
}
```

**useOrganization.ts**:
```typescript
export function useOrganization(groupId?: string) {
  const { network } = useNetwork();
  const { identity, generateProof } = useSemaphore();
  const { account } = useWallet();
  
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  
  const createOrganization = useCallback(async () => {
    if (!identity || !account) throw new Error('Not ready');
    
    // Deploy organization contract
    const contract = await deployOrganizationContract({
      network,
      admin: account.address,
      initialCommitment: identity.commitment,
    });
    
    return contract;
  }, [identity, account, network]);
  
  const joinOrganization = useCallback(async (inviteCode: string) => {
    if (!identity) throw new Error('No identity');
    
    const { groupId, network: orgNetwork } = decodeInviteCode(inviteCode);
    const contract = getOrganizationContract(groupId, orgNetwork);
    
    // Add member
    await contract.addMember(identity.commitment, newRoot);
    
    return { joined: true };
  }, [identity]);
  
  const anonymousDeposit = useCallback(async (amount: string) => {
    if (!currentOrg || !identity) throw new Error('Not ready');
    
    const group = await fetchGroup(currentOrg.groupId);
    const proof = await generateProof({
      group,
      externalNullifier: hashExternalNullifier(currentOrg.groupId, 'DEPOSIT'),
      signal: hashSignal('DEPOSIT', amount),
    });
    
    const contract = getOrganizationContract(currentOrg.groupId, network);
    await contract.verifyAndDeposit({
      proof: proof.proof,
      merkleRoot: proof.merkleTreeRoot,
      nullifierHash: proof.nullifierHash,
      signal: proof.signal,
      amount,
    });
    
    return { deposited: true };
  }, [currentOrg, identity, generateProof, network]);
  
  return {
    organizations,
    currentOrg,
    createOrganization,
    joinOrganization,
    anonymousDeposit,
  };
}
```

**useProposal.ts**:
```typescript
export function useProposal(groupId: string) {
  const { network } = useNetwork();
  const { generateProof } = useSemaphore();
  
  const [proposals, setProposals] = useState<Proposal[]>([]);
  
  const createProposal = useCallback(async (
    borrowAmount: string,
    reason: string
  ) => {
    const contract = getOrganizationContract(groupId, network);
    const proposalId = generateProposalId();
    
    await contract.createProposal({
      proposalId,
      borrowAmount,
      reason,
    });
    
    return { proposalId };
  }, [groupId, network]);
  
  const anonymousApprove = useCallback(async (proposalId: string) => {
    const group = await fetchGroup(groupId);
    const proof = await generateProof({
      group,
      externalNullifier: hashExternalNullifier(groupId, 'APPROVE'),
      signal: hashSignal(proposalId, 'YES'),
    });
    
    const contract = getOrganizationContract(groupId, network);
    await contract.submitApproval({
      proposalId,
      proof: proof.proof,
      merkleRoot: proof.merkleTreeRoot,
      nullifierHash: proof.nullifierHash,
      signal: proof.signal,
    });
    
    return { approved: true };
  }, [groupId, generateProof, network]);
  
  const executeProposal = useCallback(async (proposalId: string) => {
    const contract = getOrganizationContract(groupId, network);
    await contract.executeProposal(proposalId);
    return { executed: true };
  }, [groupId, network]);
  
  return {
    proposals,
    createProposal,
    anonymousApprove,
    executeProposal,
  };
}
```


## 6. Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### 6.1 Organization Creation Properties

**Property 1: Consistent Tree Depth**
*For any* organization creation, the resulting Semaphore group SHALL have depth 7
**Validates: Requirements 1.1**

**Property 2: Creator as First Member**
*For any* organization creation, the creator's identity commitment SHALL be the first member in the Merkle tree
**Validates: Requirements 1.2**

**Property 3: Unique Invite Codes**
*For any* two distinct organizations, their invite codes SHALL be different
**Validates: Requirements 1.3**

**Property 4: Contract Deployment**
*For any* organization creation, a Cairo contract SHALL be deployed with the correct initial state
**Validates: Requirements 1.4**

**Property 5: Admin Assignment**
*For any* organization creation, the creator SHALL be set as admin with execution privileges
**Validates: Requirements 1.5**

**Property 6: Threshold Initialization**
*For any* organization creation, the approval threshold SHALL be initialized to 4
**Validates: Requirements 1.6**

### 6.2 Identity Management Properties

**Property 7: Identity Derivation**
*For any* Semaphore identity, the commitment SHALL be correctly derived from trapdoor and nullifier
**Validates: Requirements 2.4**

**Property 8: Identity Persistence**
*For any* generated identity, it SHALL be stored in browser local storage and retrievable
**Validates: Requirements 2.3**

### 6.3 Anonymous Join Properties

**Property 9: Invite Code Validation**
*For any* invite code, the system SHALL correctly validate whether the groupId exists on-chain
**Validates: Requirements 3.1**

**Property 10: Merkle Tree Update**
*For any* member join, the identity commitment SHALL be added to the group's Merkle tree
**Validates: Requirements 3.2**

**Property 11: Member Count Increment**
*For any* successful join, the public member count SHALL increase by exactly 1
**Validates: Requirements 3.5**

**Property 12: Open Join**
*For any* join attempt with valid invite code, no admin approval SHALL be required
**Validates: Requirements 3.4**

### 6.4 Privacy Properties

**Property 13: Identity Privacy**
*For any* organization, individual member identities or commitments SHALL NOT be displayed in the UI
**Validates: Requirements 4.5**

**Property 14: Approver Anonymity**
*For any* proposal, the system SHALL NOT display which members approved
**Validates: Requirements 8.5**

### 6.5 Anonymous Deposit Properties

**Property 15: Proof Generation for Deposits**
*For any* valid member attempting to deposit, a valid Semaphore proof SHALL be generated
**Validates: Requirements 5.1**

**Property 16: Signal Construction**
*For any* deposit, the signal hash SHALL include the deposit amount
**Validates: Requirements 5.2**

**Property 17: Nullifier Recording**
*For any* successful deposit, the nullifier SHALL be recorded to prevent double-deposit
**Validates: Requirements 5.5**

**Property 18: Vault Balance Update**
*For any* successful deposit, the shared vault balance SHALL increase by the deposit amount
**Validates: Requirements 5.6**

### 6.6 Proposal Properties

**Property 19: Unique Proposal IDs**
*For any* two distinct proposals, their proposalIds SHALL be different
**Validates: Requirements 6.1**

**Property 20: Proposal Validation**
*For any* proposal creation, the borrow amount SHALL be validated against shared vault capacity
**Validates: Requirements 6.3**

**Property 21: Initial Approval Count**
*For any* newly created proposal, the approval counter SHALL be initialized to 0
**Validates: Requirements 6.5**

### 6.7 Approval Properties

**Property 22: Approval Counter Increment**
*For any* valid approval with unique nullifier, the proposal's approval counter SHALL increase by exactly 1
**Validates: Requirements 7.3**

**Property 23: Double-Vote Prevention**
*For any* member who has already approved a proposal, subsequent approval attempts SHALL be rejected
**Validates: Requirements 7.6**

**Property 24: Nullifier Uniqueness**
*For any* approval, the nullifier SHALL be recorded and prevent reuse
**Validates: Requirements 7.4**

### 6.8 Execution Properties

**Property 25: Threshold Verification**
*For any* execution attempt, the system SHALL verify approval count >= 4
**Validates: Requirements 9.1**

**Property 26: Admin Authorization**
*For any* execution attempt, the system SHALL verify the caller is the organization admin
**Validates: Requirements 9.2**

**Property 27: Execution Idempotence**
*For any* proposal, executing it twice SHALL fail on the second attempt
**Validates: Requirements 9.5**

**Property 28: Proposal State Update**
*For any* successful borrow execution, the proposal SHALL be marked as executed
**Validates: Requirements 9.4**

### 6.9 Exit Properties

**Property 29: Exit Signal Construction**
*For any* member exit, a Semaphore proof with signal = "EXIT" SHALL be generated
**Validates: Requirements 10.1**

**Property 30: Member Count Decrement**
*For any* member removal, the public member count SHALL decrease by exactly 1
**Validates: Requirements 10.5**


## 7. Error Handling

### 7.1 Common Errors

| Error Code | Cause | User Message | Recovery |
|------------|-------|--------------|----------|
| `NO_IDENTITY` | User hasn't generated identity | "Please create your anonymous identity first" | Show identity creation dialog |
| `INVALID_INVITE` | Invite code doesn't exist | "Invalid invite code. Please check and try again" | Allow re-entry |
| `PROOF_GENERATION_FAILED` | Browser proof gen error | "Failed to generate proof. Please try again" | Retry with same params |
| `PROOF_VERIFICATION_FAILED` | On-chain verification failed | "Proof verification failed. You may not be a member" | Check membership status |
| `NULLIFIER_USED` | Double-signaling attempt | "You have already performed this action" | Disable action button |
| `THRESHOLD_NOT_REACHED` | Premature execution | "Need 4 approvals. Currently: X" | Wait for more approvals |
| `NOT_ADMIN` | Non-admin execution attempt | "Only organization admin can execute" | Show admin address |
| `ALREADY_EXECUTED` | Proposal already executed | "This proposal has already been executed" | Refresh proposal list |
| `INSUFFICIENT_CAPACITY` | Borrow exceeds capacity | "Insufficient collateral. Max borrow: X USDC" | Adjust amount |

### 7.2 Proof Generation Errors

```typescript
async function safeGenerateProof(params: ProofParams): Promise<SemaphoreProof> {
  try {
    const proof = await generateProof(params);
    return proof;
  } catch (error) {
    if (error.message.includes('not in group')) {
      throw new Error('You are not a member of this organization');
    }
    if (error.message.includes('invalid identity')) {
      throw new Error('Invalid identity. Please regenerate');
    }
    throw new Error('Proof generation failed. Please try again');
  }
}
```

### 7.3 Contract Interaction Errors

```typescript
async function safeContractCall<T>(
  fn: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error.message.includes('Nullifier already used')) {
      throw new Error('You have already performed this action');
    }
    if (error.message.includes('Invalid proof')) {
      throw new Error('Proof verification failed');
    }
    if (error.message.includes('Not admin')) {
      throw new Error('Only admin can execute this action');
    }
    throw new Error(`${errorContext}: ${error.message}`);
  }
}
```

## 8. Testing Strategy

### 8.1 Dual Testing Approach

This feature requires both unit tests and property-based tests:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs using property-based testing libraries

Both types of tests are complementary and necessary for comprehensive coverage.

### 8.2 Property-Based Testing Configuration

**Library Selection**: Use `fast-check` for TypeScript/JavaScript property-based testing

**Configuration**:
- Minimum 100 iterations per property test
- Each property test references its design document property
- Tag format: `Feature: semaphore-anonymous-collaboration, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import fc from 'fast-check';

// Feature: semaphore-anonymous-collaboration, Property 1: Consistent Tree Depth
test('Property 1: All organizations have depth 7', () => {
  fc.assert(
    fc.asyncProperty(
      fc.string(), // org name
      async (orgName) => {
        const org = await createOrganization(orgName);
        const group = await fetchGroup(org.groupId);
        expect(group.depth).toBe(7);
      }
    ),
    { numRuns: 100 }
  );
});

// Feature: semaphore-anonymous-collaboration, Property 11: Member Count Increment
test('Property 11: Join increments member count by 1', () => {
  fc.assert(
    fc.asyncProperty(
      fc.string(), // invite code
      async (inviteCode) => {
        const org = await getOrganization(inviteCode);
        const initialCount = org.memberCount;
        
        await joinOrganization(inviteCode);
        
        const updatedOrg = await getOrganization(inviteCode);
        expect(updatedOrg.memberCount).toBe(initialCount + 1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### 8.3 Unit Testing Focus

Unit tests should cover:
- Identity generation and storage
- Invite code encoding/decoding
- Signal hash construction
- Nullifier derivation
- Error handling paths
- UI component rendering
- Integration between hooks

**Example Unit Tests**:
```typescript
describe('Identity Management', () => {
  test('should generate valid Semaphore identity', () => {
    const identity = new Identity();
    expect(identity.commitment).toBeDefined();
    expect(typeof identity.commitment).toBe('bigint');
  });
  
  test('should store and retrieve identity from local storage', async () => {
    const identity = new Identity();
    await saveIdentity(identity);
    const retrieved = await loadIdentity();
    expect(retrieved.commitment).toBe(identity.commitment);
  });
});

describe('Invite Code', () => {
  test('should encode and decode invite code correctly', () => {
    const groupId = 'test-group-123';
    const network = 'sepolia';
    const inviteCode = encodeInviteCode(groupId, network);
    const decoded = decodeInviteCode(inviteCode);
    expect(decoded.groupId).toBe(groupId);
    expect(decoded.network).toBe(network);
  });
});
```

### 8.4 Integration Testing

Test complete workflows:
1. Create organization → Join → Deposit → Approve → Execute
2. Multiple members joining same organization
3. Multiple proposals with different approval counts
4. Error scenarios (invalid proofs, double-voting, etc.)

### 8.5 Cairo Contract Testing

Use Starknet Foundry for Cairo contract tests:
```cairo
#[test]
fn test_add_member_increments_count() {
    let mut state = setup_organization();
    let initial_count = state.member_count.read();
    
    state.add_member(commitment, new_root);
    
    assert(state.member_count.read() == initial_count + 1, 'Count not incremented');
}

#[test]
fn test_nullifier_prevents_double_vote() {
    let mut state = setup_organization();
    let nullifier = 0x123;
    
    state.submit_approval(proposal_id, proof, root, nullifier, signal);
    
    // Second attempt should fail
    let result = state.submit_approval(proposal_id, proof, root, nullifier, signal);
    assert(result.is_err(), 'Should reject duplicate');
}
```


## 9. Deployment Strategy

### 9.1 Cairo Contract Deployment

**Garaga Verifier**:
1. Generate Cairo verifier from Semaphore circuit using Garaga SDK
2. Deploy on Sepolia testnet
3. Deploy on Mainnet
4. Store verifier addresses in environment variables

**Organization Contract**:
- Deployed per organization (not singleton)
- Factory pattern for easy deployment
- Each org has its own contract instance

### 9.2 Environment Configuration

```typescript
// .env.local
// Sepolia
NEXT_PUBLIC_SEPOLIA_GARAGA_VERIFIER=0x...
NEXT_PUBLIC_SEPOLIA_ORG_FACTORY=0x...

// Mainnet
NEXT_PUBLIC_MAINNET_GARAGA_VERIFIER=0x...
NEXT_PUBLIC_MAINNET_ORG_FACTORY=0x...
```

### 9.3 Frontend Deployment

- Deploy to Vercel alongside existing Paymejor frontend
- Add "Organizations" tab to existing UI
- No changes to existing vault functionality
- Network selector supports both Sepolia and Mainnet

## 10. Security Considerations

### 10.1 Zero-Knowledge Security

- **Identity Secret**: Never exposed, stored encrypted in browser
- **Proof Soundness**: Garaga verifies Groth16 proofs on-chain
- **Nullifier Unlinkability**: Cannot link nullifier to identity commitment
- **Signal Privacy**: Signal content is hashed before proof generation

### 10.2 Smart Contract Security

- **Nullifier Tracking**: Prevents double-signaling across all action types
- **Admin Control**: Only admin can execute after threshold
- **Threshold Enforcement**: Cannot execute without sufficient approvals
- **Reentrancy**: Cairo's ownership model prevents reentrancy
- **Access Control**: Proof verification required for all privileged actions

### 10.3 Frontend Security

- **Identity Storage**: Encrypted in browser local storage
- **Private Key**: Never sent to server or logged
- **RPC Security**: Use authenticated endpoints
- **Input Validation**: Sanitize all user inputs before proof generation

### 10.4 Privacy Considerations

- **Metadata Leakage**: Transaction timing may reveal patterns
- **IP Privacy**: Recommend VPN for sensitive operations
- **Browser Fingerprinting**: Standard web privacy concerns
- **Group Size**: Larger groups provide better anonymity

## 11. Performance Optimization

### 11.1 Proof Generation

- **Client-Side**: Generate proofs in browser (< 5 seconds)
- **Web Workers**: Use web workers for proof generation to avoid UI blocking
- **Caching**: Cache group state to avoid repeated fetches

### 11.2 Contract Queries

- **Batch Queries**: Use multicall for fetching multiple proposals
- **Caching**: Cache organization stats with TTL
- **Optimistic Updates**: Update UI optimistically, confirm on-chain

### 11.3 Merkle Tree Operations

- **Incremental Updates**: Only update affected branches
- **Off-Chain Storage**: Store full tree off-chain, only root on-chain
- **Lazy Loading**: Load tree data only when needed

## 12. Monitoring & Analytics

### 12.1 Key Metrics

- Organizations created
- Members per organization (average, median)
- Proposals created
- Approval rate (approvals / proposals)
- Execution rate (executed / threshold reached)
- Proof generation time (average)
- Proof verification success rate

### 12.2 Privacy-Preserving Analytics

- Track aggregate metrics only
- Never log individual identities or nullifiers
- Use anonymous event IDs for correlation

## 13. Future Enhancements (Post-MVP)

- Configurable approval thresholds per organization
- Percentage-based thresholds (e.g., 60% of members)
- Weighted voting based on contribution amount
- Time-locked proposals with expiration
- Proposal cancellation by creator
- Multiple admin roles (creator, executor, manager)
- Cross-organization coordination
- Advanced analytics dashboard
- Mobile app support
- Gasless transactions via meta-transactions
- Recursive proofs for larger groups (depth > 7)

## 14. Integration Checklist

### 14.1 Prerequisites

- [ ] Existing Paymejor vault system deployed
- [ ] Tongo SDK integrated
- [ ] Vesu SDK integrated
- [ ] Network selector implemented
- [ ] Wallet connection working

### 14.2 New Dependencies

- [ ] @semaphore-protocol/identity
- [ ] @semaphore-protocol/group
- [ ] @semaphore-protocol/proof
- [ ] Garaga SDK
- [ ] fast-check (for property testing)

### 14.3 Deployment Steps

1. [ ] Generate Garaga verifier from Semaphore circuit
2. [ ] Deploy verifier on Sepolia
3. [ ] Deploy verifier on Mainnet
4. [ ] Deploy organization factory on Sepolia
5. [ ] Deploy organization factory on Mainnet
6. [ ] Add environment variables
7. [ ] Deploy frontend with Organizations tab
8. [ ] Test end-to-end on Sepolia
9. [ ] Test with real users on Mainnet (small amounts)
10. [ ] Create demo video

## 15. Success Criteria

- User can create organization and generate invite code
- 5+ users can join same organization anonymously
- Members can generate valid Semaphore proofs in < 5 seconds
- Proofs verify successfully on-chain via Garaga
- Members can anonymously deposit to shared vault
- Members can anonymously approve borrow proposals
- Approval count reaches threshold (4) with distinct nullifiers
- Admin can execute borrow after threshold
- Zero identity leakage in on-chain data
- All 30 correctness properties pass property-based tests
- Demo video shows complete anonymous collaboration flow
- Hackathon judges can verify Semaphore + Garaga integration
