use core::num::traits::Zero;
use paymejor_vault::{IPayMejorVaultDispatcher, IPayMejorVaultDispatcherTrait};
use snforge_std::{ContractClassTrait, DeclareResultTrait, declare, start_cheat_caller_address};
use starknet::{ContractAddress, SyscallResultTrait};

fn contract_address(value: felt252) -> ContractAddress {
    value.try_into().unwrap()
}

fn deploy_vault() -> ContractAddress {
    let contract = declare("PayMejorVault").unwrap_syscall().contract_class();
    let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap_syscall();
    contract_address
}

#[test]
fn test_initialize_vault() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let stored_tongo = dispatcher.get_tongo_protocol();
    assert(stored_tongo == tongo_protocol, 'Tongo address mismatch');
}

#[test]
#[should_panic(expected: ('Already initialized',))]
fn test_cannot_initialize_twice() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);
    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);
}

#[test]
fn test_get_btc_price() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let price = dispatcher.get_btc_price();
    assert(price == 5000000000000_u256, 'Default price incorrect');
}

#[test]
fn test_set_btc_price() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    let owner = contract_address(0x1);
    start_cheat_caller_address(vault_address, owner);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let new_price = 6000000000000_u256;
    dispatcher.set_btc_price(new_price);

    let price = dispatcher.get_btc_price();
    assert(price == new_price, 'Price not updated');
}

#[test]
fn test_get_position_empty() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let user = contract_address(0xabc);
    let position = dispatcher.get_position(user);

    assert(position.owner.is_zero(), 'Position should be empty');
}

#[test]
fn test_get_borrowing_capacity_no_position() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let user = contract_address(0xabc);
    let capacity = dispatcher.get_borrowing_capacity(user);

    assert(capacity == 0, 'Capacity should be zero');
}

#[test]
#[should_panic(expected: ('No position found',))]
fn test_leverage_loop_no_position() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let user = contract_address(0xabc);
    start_cheat_caller_address(vault_address, user);

    // Should panic because user has no position
    dispatcher.leverage_loop(1000_u256);
}

#[test]
#[should_panic(expected: ('Amount must be positive',))]
fn test_leverage_loop_zero_amount() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    let user = contract_address(0xabc);
    start_cheat_caller_address(vault_address, user);

    // Should panic because amount is zero
    dispatcher.leverage_loop(0_u256);
}

#[test]
fn test_leverage_loop_basic_checks() {
    let vault_address = deploy_vault();
    let dispatcher = IPayMejorVaultDispatcher { contract_address: vault_address };

    let tongo_protocol = contract_address(0x123);
    let wbtc_token = contract_address(0x456);
    let usdc_token = contract_address(0x789);

    dispatcher.initialize(tongo_protocol, wbtc_token, usdc_token);

    // Verify initialization
    let price = dispatcher.get_btc_price();
    assert(price == 5000000000000_u256, 'Default price incorrect');
}
