use starknet::ContractAddress;

#[starknet::interface]
pub trait ITongoProtocol<TContractState> {
    /// Fund a shielded account with tokens (deposit)
    fn fund(
        ref self: TContractState,
        account: ContractAddress,
        token: ContractAddress,
        amount: u256
    );

    /// Get encrypted balance for an account
    fn get_shielded_balance(
        self: @TContractState,
        account: ContractAddress,
        token: ContractAddress
    ) -> felt252;

    /// Transfer shielded tokens between accounts
    fn shielded_transfer(
        ref self: TContractState,
        from: ContractAddress,
        to: ContractAddress,
        token: ContractAddress,
        encrypted_amount: felt252
    );
}
