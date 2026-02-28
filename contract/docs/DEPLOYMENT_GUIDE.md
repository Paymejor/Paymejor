# Deployment Guide - Production Ready Contracts

## Prerequisites

1. **Starknet CLI Tools**
   ```bash
   # Install starkli
   curl https://get.starkli.sh | sh
   starkliup
   
   # Install scarb
   curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
   ```

2. **Wallet Setup**
   ```bash
   # Create or import wallet
   starkli signer keystore from-key ~/.starkli-wallets/deployer.json
   
   # Create account
   starkli account oz init ~/.starkli-wallets/account.json
   ```

3. **Required Contract Addresses**
   - Semaphore Verifier Contract (deploy or use existing)
   - Vesu Lending Pool
   - wBTC Token
   - USDC Token

## Step-by-Step Deployment

### Step 1: Compile Contracts

```bash
cd contract
scarb build
```

Expected output:
```
Compiling semaphore_organization_pooling v0.1.0
Finished `dev` profile target(s) in X seconds
```

### Step 2: Declare Organization Contract

```bash
# Declare Organization contract to get class hash
starkli declare \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  target/dev/semaphore_organization_pooling_Organization.contract_class.json
```

**Save the class hash output!** Example:
```
Class hash declared: 0x1234...abcd
```

### Step 3: Declare OrganizationFactory Contract

```bash
starkli declare \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json
```

### Step 4: Deploy OrganizationFactory

```bash
# Replace <ORGANIZATION_CLASS_HASH> with the hash from Step 2
starkli deploy \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  <FACTORY_CLASS_HASH> \
  <ORGANIZATION_CLASS_HASH>
```

**Save the factory address!** Example:
```
Contract deployed: 0x5678...efgh
```

### Step 5: Create Your First Organization

```bash
# Prepare parameters
FACTORY_ADDRESS="0x5678...efgh"
ORG_NAME="0x4d794f7267"  # "MyOrg" in felt252
ADMIN_ADDRESS="0xYourAddress"
SEMAPHORE_VERIFIER="0xSemaphoreAddress"
VESU_POOL="0xVesuPoolAddress"
WBTC_TOKEN="0xWbtcTokenAddress"
USDC_TOKEN="0xUsdcTokenAddress"

# Create organization
starkli invoke \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  $FACTORY_ADDRESS \
  create_organization \
  $ORG_NAME \
  $ADMIN_ADDRESS \
  $SEMAPHORE_VERIFIER \
  $VESU_POOL \
  $WBTC_TOKEN \
  $USDC_TOKEN
```

### Step 6: Get Organization Address

```bash
# Query organization count
starkli call \
  --network sepolia \
  $FACTORY_ADDRESS \
  get_organization_count

# Get organization by index (0 for first org)
starkli call \
  --network sepolia \
  $FACTORY_ADDRESS \
  get_organization_by_index \
  0
```

## Configuration

### Token Addresses Setup

The factory now accepts token addresses as parameters when creating organizations. You need to provide:

1. **Vesu Pool Address**: The Vesu lending pool contract
2. **wBTC Token Address**: Wrapped Bitcoin token for collateral
3. **USDC Token Address**: USD Coin token for borrowing

### Sepolia Testnet Addresses

```bash
# Example addresses (verify these are current!)
VESU_POOL="0x..."
WBTC_TOKEN="0x..."
USDC_TOKEN="0x..."
SEMAPHORE_VERIFIER="0x..."
```

### How to Get Testnet Tokens

1. **Get Sepolia ETH**: Use Starknet faucet
2. **Get wBTC**: Use testnet wBTC faucet or swap
3. **Get USDC**: Use testnet USDC faucet or swap

## Verification

### Verify Factory Deployment

```bash
# Check organization count
starkli call --network sepolia $FACTORY_ADDRESS get_organization_count

# Should return: 0 (if no orgs created yet)
```

### Verify Organization Deployment

```bash
# Get organization address
ORG_ADDRESS=$(starkli call --network sepolia $FACTORY_ADDRESS get_organization_by_index 0)

# Check member count
starkli call --network sepolia $ORG_ADDRESS get_member_count

# Check total collateral
starkli call --network sepolia $ORG_ADDRESS get_total_collateral
```

## Testing Flow

### 1. Add Member to Organization

```bash
IDENTITY_COMMITMENT="0x1234..."  # From Semaphore identity

starkli invoke \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  $ORG_ADDRESS \
  add_member \
  $IDENTITY_COMMITMENT
```

### 2. Deposit Collateral

```bash
# First approve wBTC
starkli invoke \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  $WBTC_TOKEN \
  approve \
  $ORG_ADDRESS \
  1000000  # amount in smallest unit

# Then deposit
starkli invoke \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  $ORG_ADDRESS \
  deposit_collateral \
  1000000
```

### 3. Create Proposal (with Semaphore Proof)

```bash
# Generate proof off-chain first using Semaphore SDK
# Then submit proposal
starkli invoke \
  --account ~/.starkli-wallets/account.json \
  --keystore ~/.starkli-wallets/deployer.json \
  --network sepolia \
  $ORG_ADDRESS \
  create_proposal \
  <PROOF_PARAMS> \
  500000 \  # amount
  0x426f72726f77 \  # purpose "Borrow"
  86400  # duration (1 day)
```

## Troubleshooting

### Common Issues

1. **"Class hash not found"**
   - Ensure you declared the contract first
   - Check you're using the correct network

2. **"Insufficient balance"**
   - Fund your account with testnet ETH
   - Get testnet tokens from faucet

3. **"Invalid proof"**
   - Verify Semaphore verifier is deployed
   - Check proof generation matches expected format
   - Ensure merkle root is current

4. **"Recipient not found"**
   - Ensure proposal creator registered nullifier mapping
   - Check nullifier-to-address mapping is set

### Debug Commands

```bash
# Check account balance
starkli balance --network sepolia $ACCOUNT_ADDRESS

# View transaction details
starkli transaction --network sepolia $TX_HASH

# Get contract class hash
starkli class-hash --network sepolia $CONTRACT_ADDRESS
```

## Mainnet Deployment

⚠️ **Before deploying to mainnet:**

1. Complete full security audit
2. Test extensively on testnet
3. Verify all external contract integrations
4. Set up monitoring and alerting
5. Prepare emergency response plan
6. Review gas optimization
7. Ensure proper access controls

### Mainnet Checklist

- [ ] Security audit completed
- [ ] Testnet testing passed (minimum 2 weeks)
- [ ] All integration tests passing
- [ ] Gas costs optimized
- [ ] Emergency procedures documented
- [ ] Multi-sig admin setup
- [ ] Monitoring infrastructure ready
- [ ] Legal compliance verified
- [ ] Insurance/risk management in place

## Monitoring

### Events to Monitor

1. **OrganizationCreated**: Track new organizations
2. **MemberAdded**: Monitor membership growth
3. **CollateralDeposited/Withdrawn**: Track collateral changes
4. **ProposalCreated**: Monitor borrowing requests
5. **VoteCast**: Track governance participation
6. **ProposalExecuted**: Monitor successful borrows
7. **DebtRepaid**: Track repayments

### Metrics to Track

- Total organizations created
- Total collateral locked
- Total debt outstanding
- Average LTV across organizations
- Proposal success rate
- Member participation rate

## Support

For issues or questions:
- GitHub Issues: [Your repo]
- Discord: [Your server]
- Email: [Your email]

## License

[Specify your license]
