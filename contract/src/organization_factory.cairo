// OrganizationFactory.cairo
// Factory contract for deploying organization instances
// 
// This contract will be implemented in Task 2.1
// 
// Key Features:
// - Deploy new organization contracts
// - Track all created organizations
// - Emit OrganizationCreated events

#[starknet::interface]
trait IOrganizationFactory<TContractState> {
    fn create_organization(
        ref self: TContractState,
        name: felt252,
        admin: starknet::ContractAddress,
        semaphore_address: starknet::ContractAddress,
        vesu_pool: starknet::ContractAddress,
        wbtc_token: starknet::ContractAddress,
        usdc_token: starknet::ContractAddress
    ) -> starknet::ContractAddress;
    
    fn get_organization_count(self: @TContractState) -> u256;
    fn get_organization_by_index(self: @TContractState, index: u256) -> starknet::ContractAddress;
}

#[starknet::contract]
mod OrganizationFactory {
    use starknet::ContractAddress;
    use starknet::ClassHash;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess, StoragePathEntry, Map};
    use starknet::syscalls::deploy_syscall;
    
    #[storage]
    struct Storage {
        organizations: Map<u256, ContractAddress>,
        organization_count: u256,
        organization_class_hash: ClassHash,
    }
    
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        OrganizationCreated: OrganizationCreated,
    }
    
    #[derive(Drop, starknet::Event)]
    struct OrganizationCreated {
        organization: ContractAddress,
        admin: ContractAddress,
        group_id: u256,
    }
    
    #[constructor]
    fn constructor(ref self: ContractState, organization_class_hash: ClassHash) {
        self.organization_class_hash.write(organization_class_hash);
        self.organization_count.write(0);
    }
    
    #[abi(embed_v0)]
    impl OrganizationFactoryImpl of super::IOrganizationFactory<ContractState> {
        fn create_organization(
            ref self: ContractState,
            name: felt252,
            admin: ContractAddress,
            semaphore_address: ContractAddress,
            vesu_pool: ContractAddress,
            wbtc_token: ContractAddress,
            usdc_token: ContractAddress
        ) -> ContractAddress {
            // Generate a unique group ID for the Semaphore group
            let current_count = self.organization_count.read();
            let group_id = current_count + 1;
            
            // Deploy new Organization contract using deploy_syscall
            let organization_address = self._deploy_organization(
                name,
                admin,
                semaphore_address,
                group_id,
                vesu_pool,
                wbtc_token,
                usdc_token
            );
            
            // Store organization in registry
            self.organizations.entry(current_count).write(organization_address);
            self.organization_count.write(group_id);
            
            // Emit OrganizationCreated event
            self.emit(OrganizationCreated {
                organization: organization_address,
                admin: admin,
                group_id: group_id,
            });
            
            organization_address
        }
        
        fn get_organization_count(self: @ContractState) -> u256 {
            self.organization_count.read()
        }
        
        fn get_organization_by_index(self: @ContractState, index: u256) -> ContractAddress {
            self.organizations.entry(index).read()
        }
    }
    
    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn _deploy_organization(
            ref self: ContractState,
            name: felt252,
            admin: ContractAddress,
            semaphore_address: ContractAddress,
            group_id: u256,
            vesu_pool: ContractAddress,
            wbtc_token: ContractAddress,
            usdc_token: ContractAddress
        ) -> ContractAddress {
            // Get the Organization contract class hash
            let class_hash = self.organization_class_hash.read();
            
            // Prepare constructor calldata
            // Constructor params: admin, semaphore_address, group_id, vesu_pool, wbtc_token, usdc_token
            let mut constructor_calldata = array![];
            constructor_calldata.append(admin.into());
            constructor_calldata.append(semaphore_address.into());
            constructor_calldata.append(group_id.low.into());
            constructor_calldata.append(group_id.high.into());
            constructor_calldata.append(vesu_pool.into());
            constructor_calldata.append(wbtc_token.into());
            constructor_calldata.append(usdc_token.into());
            
            // Generate unique salt from name and group_id
            let salt = self._generate_salt(name, group_id);
            
            // Deploy the contract
            let (deployed_address, _) = deploy_syscall(
                class_hash,
                salt,
                constructor_calldata.span(),
                false // deploy_from_zero
            ).unwrap();
            
            deployed_address
        }
        
        fn _generate_salt(self: @ContractState, name: felt252, group_id: u256) -> felt252 {
            // Generate deterministic salt from name and group_id
            // This ensures unique addresses for each organization
            let mut data = array![name, group_id.low.into(), group_id.high.into()];
            let hash: felt252 = core::poseidon::poseidon_hash_span(data.span());
            hash
        }
    }
}
