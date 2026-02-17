pub mod interfaces;
use starknet::ContractAddress;

/// Position struct with encrypted fields for privacy
#[derive(Drop, Serde, starknet::Store)]
pub struct Position {
    pub owner: ContractAddress,
    pub shielded_collateral: felt252, // Encrypted wBTC amount (Tongo ciphertext)
    pub shielded_debt: felt252, // Encrypted USDC amount (Tongo ciphertext)
    pub tongo_account: ContractAddress, // User's Tongo account address
    pub last_updated: u64 // Timestamp of last update
}

/// Interface for PayMejor Vault contract
#[starknet::interface]
pub trait IPayMejorVault<TContractState> {
    /// Initialize the vault with Tongo protocol address
    fn initialize(
        ref self: TContractState,
        tongo_protocol: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
    );

    /// Get the Tongo protocol address
    fn get_tongo_protocol(self: @TContractState) -> ContractAddress;

    /// Get a user's position
    fn get_position(self: @TContractState, user: ContractAddress) -> Position;

    /// Deposit wBTC collateral (shielded via Tongo)
    fn deposit(ref self: TContractState, tongo_account: ContractAddress, amount: u256) -> felt252;

    /// Borrow USDC against collateral
    fn borrow(ref self: TContractState, amount: u256) -> felt252;

    /// Get borrowing capacity for a user
    fn get_borrowing_capacity(self: @TContractState, user: ContractAddress) -> u256;

    /// Get BTC price from mock oracle
    fn get_btc_price(self: @TContractState) -> u256;

    /// Mint USDC from mock pool (faucet for testing)
    fn mint_usdc(ref self: TContractState, to: ContractAddress, amount: u256);

    /// Set BTC price in mock oracle (owner only)
    fn set_btc_price(ref self: TContractState, price: u256);

    /// Execute leverage loop: borrow → re-deposit as collateral
    fn leverage_loop(ref self: TContractState, borrow_amount: u256) -> felt252;
}

/// PayMejor Vault Contract
#[starknet::contract]
mod PayMejorVault {
    use core::num::traits::Zero;
    use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::{
        Map, StoragePathEntry, StoragePointerReadAccess, StoragePointerWriteAccess,
    };
    use starknet::{get_block_timestamp, get_caller_address};
    use super::interfaces::tongo::{ITongoProtocolDispatcher, ITongoProtocolDispatcherTrait};
    use super::{ContractAddress, Position};

    // Constants for mock oracle and LTV
    const MAX_LTV: u256 = 70; // 70% LTV
    const LIQUIDATION_THRESHOLD: u256 = 80; // 80%
    const DECIMALS_MULTIPLIER: u256 = 100; // For percentage calculations

    #[storage]
    struct Storage {
        positions: Map<ContractAddress, Position>,
        tongo_protocol: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
        initialized: bool,
        owner: ContractAddress,
        // Mock oracle
        btc_price_usd: u256, // BTC price in USD (8 decimals)
        // Mock USDC pool
        usdc_pool_balance: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VaultInitialized: VaultInitialized,
        Deposited: Deposited,
        Borrowed: Borrowed,
        BtcPriceUpdated: BtcPriceUpdated,
        UsdcMinted: UsdcMinted,
        LeverageLoopExecuted: LeverageLoopExecuted,
    }

    #[derive(Drop, starknet::Event)]
    struct VaultInitialized {
        tongo_protocol: ContractAddress,
        wbtc_token: ContractAddress,
        usdc_token: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct Deposited {
        user: ContractAddress,
        tongo_account: ContractAddress,
        amount: u256,
        shielded_collateral: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct Borrowed {
        user: ContractAddress,
        amount: u256,
        shielded_debt: felt252,
    }

    #[derive(Drop, starknet::Event)]
    struct BtcPriceUpdated {
        old_price: u256,
        new_price: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct UsdcMinted {
        to: ContractAddress,
        amount: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct LeverageLoopExecuted {
        user: ContractAddress,
        borrowed_amount: u256,
        redeposited_amount: u256,
        new_shielded_collateral: felt252,
    }

    #[abi(embed_v0)]
    impl PayMejorVaultImpl of super::IPayMejorVault<ContractState> {
        fn initialize(
            ref self: ContractState,
            tongo_protocol: ContractAddress,
            wbtc_token: ContractAddress,
            usdc_token: ContractAddress,
        ) {
            assert(!self.initialized.read(), 'Already initialized');
            assert(!tongo_protocol.is_zero(), 'Invalid Tongo address');
            assert(!wbtc_token.is_zero(), 'Invalid wBTC address');
            assert(!usdc_token.is_zero(), 'Invalid USDC address');

            let caller = get_caller_address();
            self.owner.write(caller);
            self.tongo_protocol.write(tongo_protocol);
            self.wbtc_token.write(wbtc_token);
            self.usdc_token.write(usdc_token);
            self.initialized.write(true);

            // Initialize mock oracle with default BTC price ($50,000 with 8 decimals)
            self.btc_price_usd.write(5000000000000_u256);

            // Initialize mock USDC pool with 1M USDC
            self.usdc_pool_balance.write(1000000000000_u256); // 1M USDC (6 decimals)

            self.emit(VaultInitialized { tongo_protocol, wbtc_token, usdc_token });
        }

        fn get_tongo_protocol(self: @ContractState) -> ContractAddress {
            self.tongo_protocol.read()
        }

        fn get_position(self: @ContractState, user: ContractAddress) -> Position {
            self.positions.entry(user).read()
        }

        fn deposit(
            ref self: ContractState, tongo_account: ContractAddress, amount: u256,
        ) -> felt252 {
            assert(self.initialized.read(), 'Not initialized');
            assert(!tongo_account.is_zero(), 'Invalid Tongo account');
            assert(amount > 0, 'Amount must be positive');

            let caller = get_caller_address();
            let wbtc_token = self.wbtc_token.read();
            let tongo_protocol = self.tongo_protocol.read();

            // Transfer wBTC from user to vault
            let wbtc = IERC20Dispatcher { contract_address: wbtc_token };
            let success = wbtc.transfer_from(caller, starknet::get_contract_address(), amount);
            assert(success, 'wBTC transfer failed');

            // Approve Tongo protocol to spend wBTC
            wbtc.approve(tongo_protocol, amount);

            // Call Tongo.fund() to shield the balance
            let tongo = ITongoProtocolDispatcher { contract_address: tongo_protocol };
            tongo.fund(tongo_account, wbtc_token, amount);

            // Get the shielded balance from Tongo
            let shielded_collateral = tongo.get_shielded_balance(tongo_account, wbtc_token);

            // Update or create position
            let mut position = self.positions.entry(caller).read();
            if position.owner.is_zero() {
                // New position
                position =
                    Position {
                        owner: caller,
                        shielded_collateral,
                        shielded_debt: 0,
                        tongo_account,
                        last_updated: get_block_timestamp(),
                    };
            } else {
                // Update existing position
                position.shielded_collateral = shielded_collateral;
                position.last_updated = get_block_timestamp();
            }

            self.positions.entry(caller).write(position);

            self.emit(Deposited { user: caller, tongo_account, amount, shielded_collateral });

            shielded_collateral
        }

        fn borrow(ref self: ContractState, amount: u256) -> felt252 {
            assert(self.initialized.read(), 'Not initialized');
            assert(amount > 0, 'Amount must be positive');

            let caller = get_caller_address();
            let position = self.positions.entry(caller).read();
            assert(!position.owner.is_zero(), 'No position found');

            // Check borrowing capacity
            let capacity = self.get_borrowing_capacity(caller);
            assert(amount <= capacity, 'Exceeds borrow capacity');

            // Check mock USDC pool has enough liquidity
            let pool_balance = self.usdc_pool_balance.read();
            assert(amount <= pool_balance, 'Insufficient pool liquidity');

            // Update pool balance
            self.usdc_pool_balance.write(pool_balance - amount);

            // Transfer USDC to user's Tongo account (shielded)
            let usdc_token = self.usdc_token.read();
            let tongo_protocol = self.tongo_protocol.read();

            // In a real implementation, we would mint/transfer USDC to Tongo
            // For MVP, we simulate by updating the shielded debt
            let tongo = ITongoProtocolDispatcher { contract_address: tongo_protocol };

            // Fund the user's Tongo account with borrowed USDC
            let usdc = IERC20Dispatcher { contract_address: usdc_token };
            usdc.approve(tongo_protocol, amount);
            tongo.fund(position.tongo_account, usdc_token, amount);

            // Get updated shielded debt
            let shielded_debt = tongo.get_shielded_balance(position.tongo_account, usdc_token);

            // Update position
            let mut updated_position = position;
            updated_position.shielded_debt = shielded_debt;
            updated_position.last_updated = get_block_timestamp();
            self.positions.entry(caller).write(updated_position);

            self.emit(Borrowed { user: caller, amount, shielded_debt });

            shielded_debt
        }

        fn get_borrowing_capacity(self: @ContractState, user: ContractAddress) -> u256 {
            let position = self.positions.entry(user).read();
            if position.owner.is_zero() {
                return 0;
            }

            // For MVP, we use a simplified calculation
            // In production, we would decrypt the shielded collateral
            // For now, we assume the shielded_collateral felt252 represents the amount
            // This is a mock implementation

            // Get BTC price from mock oracle
            let _btc_price = self.btc_price_usd.read();

            // Mock: assume shielded_collateral represents wBTC amount in satoshis (8 decimals)
            // Convert felt252 to u256 (simplified for MVP)
            let collateral_value_usd = 0_u256; // Placeholder - would need proper decryption

            // Calculate max borrow at MAX_LTV
            let max_borrow = (collateral_value_usd * MAX_LTV) / DECIMALS_MULTIPLIER;

            // For MVP, return a mock value based on BTC price
            // In production, this would use actual decrypted collateral
            max_borrow
        }

        fn get_btc_price(self: @ContractState) -> u256 {
            self.btc_price_usd.read()
        }

        fn mint_usdc(ref self: ContractState, to: ContractAddress, amount: u256) {
            assert(self.initialized.read(), 'Not initialized');
            assert(!to.is_zero(), 'Invalid recipient');
            assert(amount > 0, 'Amount must be positive');

            // Mock USDC faucet - in production this would be a real mint function
            // For MVP, we just emit an event
            // The actual USDC token would need to have a mint function

            self.emit(UsdcMinted { to, amount });
        }

        fn set_btc_price(ref self: ContractState, price: u256) {
            assert(self.initialized.read(), 'Not initialized');
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can set price');
            assert(price > 0, 'Price must be positive');

            let old_price = self.btc_price_usd.read();
            self.btc_price_usd.write(price);

            self.emit(BtcPriceUpdated { old_price, new_price: price });
        }

        fn leverage_loop(ref self: ContractState, borrow_amount: u256) -> felt252 {
            assert(self.initialized.read(), 'Not initialized');
            assert(borrow_amount > 0, 'Amount must be positive');

            let caller = get_caller_address();
            let position = self.positions.entry(caller).read();
            assert(!position.owner.is_zero(), 'No position found');

            // MVP: Max 1 iteration limit (as per task 14.3)
            // Simple loop: borrow USDC → re-deposit as collateral (task 14.2)
            // For MVP, we execute a single borrow → re-deposit cycle

            // Check borrowing capacity
            let capacity = self.get_borrowing_capacity(caller);
            assert(borrow_amount <= capacity, 'Exceeds borrow capacity');

            // Check mock USDC pool has enough liquidity
            let pool_balance = self.usdc_pool_balance.read();
            assert(borrow_amount <= pool_balance, 'Insufficient pool liquidity');

            // Basic slippage protection (task 14.5): ensure borrow amount is reasonable
            // For MVP, we check that borrow doesn't exceed 90% of capacity
            let max_safe_borrow = (capacity * 90) / 100;
            assert(borrow_amount <= max_safe_borrow, 'Borrow too high, risk limit');

            let usdc_token = self.usdc_token.read();
            let wbtc_token = self.wbtc_token.read();
            let tongo_protocol = self.tongo_protocol.read();
            let tongo = ITongoProtocolDispatcher { contract_address: tongo_protocol };

            // ===== STEP 1: BORROW USDC =====
            // Deduct from mock pool
            self.usdc_pool_balance.write(pool_balance - borrow_amount);

            // Fund the user's Tongo account with borrowed USDC (shielded debt)
            let usdc = IERC20Dispatcher { contract_address: usdc_token };
            usdc.approve(tongo_protocol, borrow_amount);
            tongo.fund(position.tongo_account, usdc_token, borrow_amount);

            // Get updated shielded debt
            let shielded_debt = tongo.get_shielded_balance(position.tongo_account, usdc_token);

            // ===== STEP 2: RE-DEPOSIT AS COLLATERAL =====
            // Simplified for MVP (task 14.4): NO DEX integration
            // In production: USDC → wBTC swap via Ekubo DEX, then deposit wBTC
            // For MVP: We simulate by treating borrowed USDC as if it were converted to wBTC
            // This is a simplified 1:1 conversion for testing purposes only

            // Calculate re-deposit amount (simplified for MVP without DEX)
            // In reality, this would be: swapped_wbtc = swap_usdc_to_wbtc_via_ekubo(borrow_amount)
            let redeposit_amount = borrow_amount; // Simplified 1:1 for MVP

            // Basic slippage check (task 14.5): ensure re-deposit amount is positive
            assert(redeposit_amount > 0, 'Re-deposit amount too low');

            // Simulate re-deposit by funding Tongo with "converted" wBTC
            // In production, this would:
            // 1. Withdraw USDC from Tongo (unshield)
            // 2. Swap USDC → wBTC on Ekubo DEX
            // 3. Deposit wBTC back to Tongo as collateral (shield)
            let wbtc = IERC20Dispatcher { contract_address: wbtc_token };
            wbtc.approve(tongo_protocol, redeposit_amount);
            tongo.fund(position.tongo_account, wbtc_token, redeposit_amount);

            // Get updated shielded collateral (after re-deposit)
            let new_shielded_collateral = tongo
                .get_shielded_balance(position.tongo_account, wbtc_token);

            // ===== UPDATE POSITION =====
            // Update position with new debt and collateral
            let mut updated_position = position;
            updated_position.shielded_debt = shielded_debt;
            updated_position.shielded_collateral = new_shielded_collateral;
            updated_position.last_updated = get_block_timestamp();
            self.positions.entry(caller).write(updated_position);

            // ===== EMIT EVENTS =====
            self.emit(Borrowed { user: caller, amount: borrow_amount, shielded_debt });
            self
                .emit(
                    LeverageLoopExecuted {
                        user: caller,
                        borrowed_amount: borrow_amount,
                        redeposited_amount: redeposit_amount,
                        new_shielded_collateral,
                    },
                );

            new_shielded_collateral
        }
    }
}
