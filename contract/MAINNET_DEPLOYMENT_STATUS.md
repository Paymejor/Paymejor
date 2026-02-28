# Mainnet Deployment Status

## Current Status: ⏸️ Paused - Insufficient Funds

### Issue
The deployment to mainnet was attempted but failed due to insufficient balance in the `corelimitlxx` account.

### Account Details
- **Account**: corelimitlxx
- **Address**: 0x01ca91eac1c9300195ecade409648f4b03d64907e7cd3517fb82d9d336fd46f8
- **Network**: Starknet Mainnet
- **Current Balance**: ~0.013 STRK (13027256853961811136 wei)

### Required Resources
According to the error message, the transaction requires:
- **L1 Gas**: max_amount: 0, max_price_per_unit: 77728631009844
- **L2 Gas**: max_amount: 1145801280, max_price_per_unit: 31200000000
- **L1 Data Gas**: max_amount: 288, max_price_per_unit: 38438335057

**Estimated Total**: The account balance is insufficient for these resource bounds.

### Error Message
```
Contract failed the validation = Resources bounds ({ l1_gas: { max_amount: 0, max_price_per_unit: 77728631009844 }, l2_gas: { max_amount: 1145801280, max_price_per_unit: 31200000000 }, l1_data_gas: { max_amount: 288, max_price_per_unit: 38438335057 } }) exceed balance (13027256853961811136).
```

## Next Steps

### 1. Fund the Account
You need to add more STRK tokens to the corelimitlxx account:

**Account Address**: `0x01ca91eac1c9300195ecade409648f4b03d64907e7cd3517fb82d9d336fd46f8`

**Recommended Amount**: At least 0.05 STRK (to cover declaration + deployment with buffer)

**How to Fund**:
- Transfer STRK from another wallet
- Bridge STRK from L1 to L2 via StarkGate
- Purchase STRK on a CEX and withdraw to this address

### 2. Verify Balance
After funding, verify the balance:

```bash
sncast call \
  --contract-address 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d \
  --function balanceOf \
  --calldata 0x01ca91eac1c9300195ecade409648f4b03d64907e7cd3517fb82d9d336fd46f8 \
  --network mainnet
```

### 3. Resume Deployment
Once the account is funded, run:

```bash
cd contract
./deploy_mainnet.sh
```

Or manually declare and deploy:

```bash
# Declare Organization contract
sncast --account corelimitlxx \
  declare \
  --contract-name Organization \
  --network mainnet

# Declare OrganizationFactory contract
sncast --account corelimitlxx \
  declare \
  --contract-name OrganizationFactory \
  --network mainnet

# Deploy OrganizationFactory (use class hashes from above)
sncast --account corelimitlxx \
  deploy \
  --class-hash [FACTORY_CLASS_HASH] \
  --constructor-calldata [ORG_CLASS_HASH] \
  --network mainnet
```

## Deployment Preparation Status

### ✅ Completed
- [x] Contracts compiled successfully
- [x] Deployment scripts created
- [x] Documentation prepared
- [x] Account verified (corelimitlxx exists on mainnet)
- [x] RPC connectivity tested

### ⏳ Pending
- [ ] Account funded with sufficient STRK
- [ ] Organization contract declared
- [ ] OrganizationFactory contract declared
- [ ] OrganizationFactory deployed
- [ ] Configuration updated
- [ ] Testing completed

## Technical Details

### Contracts Ready
- **Organization.cairo**: Compiled ✅
- **OrganizationFactory.cairo**: Compiled ✅
- **Contract artifacts**: Available in `target/dev/` ✅

### Network Configuration
- **Network**: Starknet Mainnet (alpha-mainnet)
- **RPC**: Using default mainnet RPC via `--network mainnet` flag
- **Account**: corelimitlxx (deployed and verified)

### Deployment Script
- **Script**: `deploy_mainnet.sh`
- **Status**: Ready to execute
- **Account**: Configured for corelimitlxx
- **Safety**: Includes confirmation prompt

## Cost Breakdown

Based on the resource bounds, estimated costs:
- **Organization Declaration**: ~0.02-0.03 STRK
- **Factory Declaration**: ~0.02-0.03 STRK
- **Factory Deployment**: ~0.03-0.04 STRK
- **Total Estimated**: ~0.07-0.10 STRK
- **Recommended Buffer**: Add 50% extra = ~0.10-0.15 STRK total

**Current Balance**: 0.013 STRK  
**Additional Needed**: ~0.09-0.14 STRK

## Timeline

- **Preparation Started**: February 28, 2025 ✅
- **Deployment Attempted**: February 28, 2025 ⏸️
- **Funding Required**: Pending user action
- **Deployment Resume**: After funding
- **Estimated Completion**: 15-30 minutes after funding

## Support

If you need help funding the account:
1. Check your other Starknet wallets for STRK
2. Use a CEX (Binance, OKX, etc.) to purchase and withdraw STRK
3. Bridge from Ethereum L1 via StarkGate
4. Ask in Starknet Discord for testnet alternatives

## References

- **Account Explorer**: https://starkscan.co/contract/0x01ca91eac1c9300195ecade409648f4b03d64907e7cd3517fb82d9d336fd46f8
- **STRK Token**: 0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
- **StarkGate Bridge**: https://starkgate.starknet.io/

---

**Last Updated**: February 28, 2025  
**Status**: Awaiting Account Funding  
**Next Action**: Fund corelimitlxx account with ~0.10 STRK
