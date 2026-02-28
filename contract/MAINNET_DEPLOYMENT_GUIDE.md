# Mainnet Deployment Guide

## ⚠️ IMPORTANT WARNINGS

**READ THIS CAREFULLY BEFORE DEPLOYING TO MAINNET**

1. **Real Funds**: Mainnet deployment uses real ETH for gas fees
2. **Immutable**: Once deployed, contracts cannot be modified
3. **Public**: All transactions and contract code are publicly visible
4. **Irreversible**: Mistakes cannot be undone
5. **Security**: Ensure contracts are thoroughly tested on Sepolia first

## Prerequisites

### 1. Account Setup

Ensure you have a Starknet account configured with sufficient ETH for gas:

```bash
# Check your account
sncast account list

# Expected output should show 'limitlxx' account
```

### 2. Verify Account Balance

Check that you have enough ETH for deployment (recommended: at least 0.01 ETH):

```bash
# Check balance on mainnet
sncast call \
  --contract-address 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7 \
  --function balanceOf \
  --calldata <YOUR_ACCOUNT_ADDRESS> \
  --url https://rpc.starknet.lava.build
```

### 3. Compile Contracts

```bash
cd contract
scarb build
```

Verify that the following files exist:
- `target/dev/semaphore_organization_pooling_Organization.contract_class.json`
- `target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json`

## Deployment Steps

### Step 1: Review Contracts

Before deploying, review the contract code one final time:

```bash
# Review Organization contract
cat src/organization.cairo

# Review Factory contract
cat src/organization_factory.cairo
```

### Step 2: Run Deployment Script

```bash
cd contract
./deploy_mainnet.sh
```

The script will:
1. Ask for confirmation (type `yes` to proceed)
2. Declare the Organization contract
3. Declare the OrganizationFactory contract
4. Deploy the OrganizationFactory instance
5. Save deployment info to `deployments/mainnet_deployment.json`

### Step 3: Verify Deployment

After deployment completes, verify on Voyager:

1. Visit the Factory contract URL (printed by script)
2. Check that the contract is verified
3. Verify the Organization class hash is correct
4. Check deployment transaction status

### Step 4: Update Configuration

#### Update Frontend Environment Variables

Edit `frontend/.env.local`:

```bash
# Add the deployed factory address
NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=<FACTORY_ADDRESS_FROM_DEPLOYMENT>
```

#### Update Documentation

Edit `contract/DEPLOYED_ADDRESSES.md` to add mainnet section:

```markdown
## Mainnet

### OrganizationFactory
```
<FACTORY_ADDRESS>
```

**Voyager:** https://voyager.online/contract/<FACTORY_ADDRESS>

### Organization (Class Hash)
```
<ORG_CLASS_HASH>
```

**Voyager:** https://voyager.online/class/<ORG_CLASS_HASH>
```

### Step 5: Test with Small Amounts

**CRITICAL**: Test the deployment with minimal amounts first!

1. Create a test organization with minimal collateral (e.g., 0.0001 wBTC)
2. Add a test member
3. Create a small proposal
4. Vote on the proposal
5. Execute the proposal with minimal borrow amount

```bash
# Example: Create test organization
sncast invoke \
  --contract-address <FACTORY_ADDRESS> \
  --function create_organization \
  --calldata <NAME> <ADMIN_ADDRESS> <SEMAPHORE_ADDRESS> \
  --url https://rpc.starknet.lava.build \
  --account limitlxx \
  --keystore ./signer.json
```

### Step 6: Monitor Transactions

For the first few transactions:

1. Watch Voyager for transaction status
2. Check event emissions
3. Verify state changes
4. Monitor gas costs

## Post-Deployment Checklist

- [ ] Factory contract deployed and verified on Voyager
- [ ] Organization class hash declared and verified
- [ ] Frontend `.env.local` updated with mainnet address
- [ ] `DEPLOYED_ADDRESSES.md` updated with mainnet section
- [ ] Test organization created successfully
- [ ] Test member added successfully
- [ ] Test proposal created and voted on
- [ ] Test proposal executed successfully
- [ ] Small borrow transaction completed
- [ ] All events emitted correctly
- [ ] Documentation updated

## Rollback Plan

If issues are discovered after deployment:

1. **DO NOT** use the deployed contracts
2. Update frontend to disable mainnet organization feature
3. Deploy new contracts with fixes
4. Update configuration to point to new contracts
5. Communicate changes to users

## Cost Estimates

Approximate gas costs for mainnet deployment (as of Feb 2025):

- Declare Organization: ~0.001-0.002 ETH
- Declare Factory: ~0.001-0.002 ETH
- Deploy Factory: ~0.002-0.003 ETH
- **Total**: ~0.004-0.007 ETH

Actual costs may vary based on network congestion.

## Troubleshooting

### Issue: "Insufficient balance"

**Solution**: Add more ETH to your account

### Issue: "Class already declared"

**Solution**: This is OK - the script will use the existing class hash

### Issue: "Transaction reverted"

**Solution**: 
1. Check transaction on Voyager for error message
2. Verify constructor parameters are correct
3. Ensure account has sufficient balance

### Issue: "RPC connection failed"

**Solution**: 
1. Check internet connection
2. Try alternative RPC URL
3. Wait and retry (RPC may be temporarily down)

## Security Considerations

### Before Mainnet Deployment

- [ ] All contracts tested thoroughly on Sepolia
- [ ] Property-based tests passing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing completed
- [ ] Code reviewed by team
- [ ] Security audit completed (if applicable)

### After Mainnet Deployment

- [ ] Monitor for unusual activity
- [ ] Set up alerts for large transactions
- [ ] Have emergency response plan ready
- [ ] Document all admin actions
- [ ] Keep private keys secure

## Support

If you encounter issues during deployment:

1. Check Voyager for transaction details
2. Review deployment logs
3. Consult Starknet documentation
4. Ask in Starknet Discord/Telegram

## References

- [Starknet Documentation](https://docs.starknet.io/)
- [Starknet Foundry](https://foundry-rs.github.io/starknet-foundry/)
- [Voyager Explorer](https://voyager.online/)
- [Semaphore Protocol](https://semaphore.pse.dev/)

---

**Last Updated**: February 28, 2025  
**Status**: Ready for Mainnet Deployment
