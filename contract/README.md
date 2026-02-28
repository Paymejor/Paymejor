# Semaphore Organization Pooling - Smart Contracts

This directory contains the Cairo smart contracts for the Semaphore Organization Pooling feature.

## Prerequisites

### Install Scarb (Cairo Package Manager)

Scarb is the Cairo package manager and build tool. Install it using:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

Verify installation:
```bash
scarb --version
```

For more information, visit: https://docs.swmansion.com/scarb/

### Install Starknet Foundry (Testing Framework)

Starknet Foundry is a testing framework for Cairo contracts. Install it using:

```bash
curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
```

Verify installation:
```bash
snforge --version
```

For more information, visit: https://foundry-rs.github.io/starknet-foundry/

## Project Structure

```
contract/
├── src/
│   ├── organization_factory.cairo    # Factory contract for creating organizations
│   ├── organization.cairo             # Main organization contract
│   └── lib.cairo                      # Module declarations
├── tests/
│   ├── test_organization_factory.cairo
│   └── test_organization.cairo
├── Scarb.toml                         # Scarb configuration
└── README.md                          # This file
```

## Contracts

### OrganizationFactory.cairo
Factory contract that deploys new organization instances. Each organization is a separate contract with its own Semaphore group.

**Key Functions:**
- `create_organization(name, admin, semaphore_address, vesu_pool, wbtc_token, usdc_token)` - Deploy new organization with token addresses
- `get_organization_count()` - Get total number of organizations
- `get_organization_by_index(index)` - Get organization address by index

**Production Features:**
- Real contract deployment using `deploy_syscall`
- Deterministic address generation using Poseidon hash
- Configurable token addresses per organization

### Organization.cairo
Main organization contract managing members, collateral, proposals, and Vesu integration.

**Key Functions:**
- `add_member(identity_commitment)` - Add member to Semaphore group
- `deposit_collateral(amount)` - Deposit wBTC collateral
- `withdraw_collateral(amount)` - Withdraw wBTC collateral (with LTV safety checks)
- `create_proposal(proof, amount, purpose, duration)` - Create anonymous proposal with ZK proof
- `vote(proposal_id, proof, vote_yes)` - Cast anonymous vote with ZK proof
- `execute_proposal(proposal_id)` - Execute approved proposal (borrow from Vesu)
- `repay_debt(amount)` - Repay borrowed USDC
- `get_ltv()` - Get loan-to-value ratio
- `get_health_factor()` - Get position health factor

**Production Features:**
- Real Semaphore ZK proof verification via verifier contract
- Nullifier-to-address mapping for correct fund distribution
- Comprehensive safety checks and access controls

## Building

```bash
scarb build
```

## Testing

Run all tests:
```bash
snforge test
```

Run specific test:
```bash
snforge test test_organization_creation
```

Run tests with coverage:
```bash
snforge test --coverage
```

## Deployment

### Sepolia Testnet Deployment

Use the provided deployment script:

```bash
./deploy_sepolia.sh
```

This will:
1. Compile contracts
2. Declare Organization contract
3. Declare OrganizationFactory contract
4. Deploy OrganizationFactory with Organization class hash
5. Save deployment info to `deployments/sepolia_deployment.json`

### Mainnet Deployment

⚠️ **WARNING: Mainnet deployment uses real funds!**

Use the mainnet deployment script:

```bash
./deploy_mainnet.sh
```

This will:
1. Show a confirmation prompt (type "yes" to proceed)
2. Compile contracts
3. Declare Organization contract on mainnet
4. Declare OrganizationFactory contract on mainnet
5. Deploy OrganizationFactory with Organization class hash
6. Save deployment info to `deployments/mainnet_deployment.json`

**Important:** Always test with small amounts first on mainnet!

See [MAINNET_DEPLOYMENT_SUMMARY.md](MAINNET_DEPLOYMENT_SUMMARY.md) for complete mainnet deployment details.

### Create Organization (Automated)

Use the interactive script:

```bash
./create_organization.sh sepolia <FACTORY_ADDRESS>
```

This will prompt you for:
- Organization name
- Admin address
- Semaphore verifier address
- Vesu pool address
- wBTC token address
- USDC token address

### Manual Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed manual deployment instructions.

## Production Ready

This implementation is production-ready with:

✅ Real contract deployment via `deploy_syscall`
✅ Actual ZK proof verification via Semaphore verifier
✅ Correct fund distribution via nullifier-to-address mapping
✅ Comprehensive safety checks and access controls
✅ No compilation errors

See [PRODUCTION_READY.md](PRODUCTION_READY.md) for details on production features.
See [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) for complete list of improvements.

## Contract Addresses

### Sepolia Testnet
- **OrganizationFactory:** `0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2`
- **Organization Class Hash:** `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Voyager:** https://sepolia.voyager.online/contract/0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2

### Mainnet
- **OrganizationFactory:** `0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0`
- **Organization Class Hash:** `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Voyager:** https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0

See [DEPLOYED_ADDRESSES.md](DEPLOYED_ADDRESSES.md) for complete deployment details.

## Integration with Vesu

The Organization contract integrates with Vesu lending pools to:
1. Supply pooled wBTC as collateral
2. Borrow USDC against the collateral
3. Repay borrowed USDC

Vesu contract addresses are configured in `frontend/lib/constants.ts`.

## Integration with Semaphore

The Organization contract uses Semaphore Protocol for:
1. Anonymous membership verification
2. Anonymous proposal creation
3. Anonymous voting with double-vote prevention

Semaphore proofs are generated off-chain using `@semaphore-protocol/proof` and verified on-chain.

## Security Considerations

1. **Nullifier Tracking**: Prevents duplicate proposals and double-voting
2. **LTV Safety**: Prevents withdrawals that would violate liquidation threshold
3. **Admin Controls**: Only admin can add members
4. **Proof Verification**: All anonymous actions require valid Semaphore proofs

## Resources

- Cairo Book: https://book.cairo-lang.org/
- Starknet Docs: https://docs.starknet.io/
- Scarb Docs: https://docs.swmansion.com/scarb/
- Starknet Foundry: https://foundry-rs.github.io/starknet-foundry/
- Semaphore Protocol: https://semaphore.pse.dev/
- Vesu Protocol: https://docs.vesu.xyz/
