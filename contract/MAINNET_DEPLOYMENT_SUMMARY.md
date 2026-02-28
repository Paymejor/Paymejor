# Mainnet Deployment Summary

## 🎉 Deployment Complete

**Date:** February 28, 2025  
**Network:** Starknet Mainnet  
**Account:** corelimitlxx  
**Status:** ✅ Successfully Deployed and Verified

---

## Deployed Contracts

### Organization Contract (Class)
- **Class Hash:** `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Declaration Tx:** `0x04cba0f32488b9acc1bbe6c23fca389267936185d3fb99c1057988b71a598874`
- **Voyager:** https://voyager.online/class/0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7

### OrganizationFactory Contract
- **Address:** `0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0`
- **Class Hash:** `0x0099e389a349fb594e4214f9c5727d4960a8ebb5b774e8ffa45c59205ec1d4ff`
- **Declaration Tx:** `0x02ae1e0753fde00b916c0234c13dbe752e4bc511f140e57313f224fd01e23a3b`
- **Deployment Tx:** `0x05e4a30324f3503989de1d83f0273cef05e7e9dd20c2d944330766246dce98ae`
- **Voyager:** https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0

---

## Verification

### Contract Call Test
```bash
sncast call \
  --contract-address 0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0 \
  --function get_organization_count \
  --url https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

**Result:** ✅ `0_u256` (Expected - no organizations created yet)

---

## Frontend Configuration

### Environment Variables

Add the following to `frontend/.env.local`:

```env
# Mainnet Organization Factory
NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS=0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0

# Mainnet RPC (if not already set)
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL

# Set default network to mainnet (optional)
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
```

### Constants Update

The `frontend/lib/constants.ts` file has been updated with the mainnet factory address as a fallback:

```typescript
organizationFactory: process.env.NEXT_PUBLIC_MAINNET_ORGANIZATION_FACTORY_ADDRESS || '0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0'
```

---

## Next Steps

### 1. Test with Small Amounts ⚠️

Before using the mainnet contracts with significant funds, test with minimal amounts:

1. **Create a Test Organization**
   - Use the frontend or CLI to create an organization
   - Verify the organization is created correctly on Voyager

2. **Deposit Small Collateral**
   - Deposit a minimal amount of wBTC (e.g., 0.0001 wBTC)
   - Verify the deposit transaction on Voyager
   - Check that the organization's collateral balance updates

3. **Create a Test Proposal**
   - Create a proposal to borrow a small amount of USDC
   - Verify the proposal is created with Semaphore proof

4. **Vote and Execute**
   - Vote on the proposal (if you have multiple members)
   - Execute the proposal if approved
   - Verify USDC is borrowed from Vesu

### 2. Monitor Transactions

Watch all transactions closely on Voyager:
- Check for successful execution
- Verify events are emitted correctly
- Monitor gas costs

### 3. Security Checklist

- [ ] Verify contract addresses match deployment output
- [ ] Test organization creation
- [ ] Test collateral deposit/withdrawal
- [ ] Test proposal creation with Semaphore proofs
- [ ] Test voting mechanism
- [ ] Test proposal execution and Vesu integration
- [ ] Test debt repayment
- [ ] Monitor for any unexpected behavior

### 4. Documentation Updates

- [x] Update `DEPLOYED_ADDRESSES.md` with mainnet addresses
- [x] Update `frontend/lib/constants.ts` with mainnet factory address
- [x] Create `mainnet_deployment.json` with deployment details
- [ ] Update main README.md with mainnet information
- [ ] Create user guide for mainnet usage

---

## Important Notes

### ⚠️ Mainnet Considerations

1. **Real Funds:** All transactions on mainnet use real ETH and tokens
2. **Gas Costs:** Monitor gas costs for all operations
3. **Irreversible:** Mainnet transactions cannot be undone
4. **Security:** Always verify contract addresses before interacting
5. **Testing:** Start with minimal amounts before scaling up

### 🔒 Security Best Practices

1. **Verify Addresses:** Always double-check contract addresses
2. **Small Tests First:** Test with minimal amounts initially
3. **Monitor Closely:** Watch all transactions on Voyager
4. **Backup Keys:** Ensure wallet keys are securely backed up
5. **Gradual Rollout:** Increase usage gradually after successful tests

### 📊 Monitoring

Monitor the following on Voyager:
- Factory contract: https://voyager.online/contract/0x0125af63a365a165ec4747fbbbf9d54da56261b41573660567b8b75bbb16b2a0
- Organization class: https://voyager.online/class/0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7
- All deployment transactions linked above

---

## Deployment Details

### RPC Configuration
- **URL:** `https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL`
- **Network:** Starknet Mainnet
- **Chain ID:** `SN_MAIN`

### Account Information
- **Account Name:** corelimitlxx
- **Account Address:** `0x01ca91eac1c9300195ecade409648f4b03d64907e7cd3517fb82d9d336fd46f8`
- **Account Type:** OpenZeppelin

### Deployment Files
- **Deployment JSON:** `contract/deployments/mainnet_deployment.json`
- **Deployment Script:** `contract/deploy_mainnet.sh`
- **Address Documentation:** `contract/DEPLOYED_ADDRESSES.md`

---

## Support

If you encounter any issues:
1. Check Voyager for transaction status
2. Verify contract addresses match this document
3. Review the deployment logs in `mainnet_deployment.json`
4. Test on Sepolia first if unsure

---

**Deployment Status:** ✅ Complete  
**Verification Status:** ✅ Verified  
**Ready for Testing:** ✅ Yes (with small amounts)  
**Production Ready:** ⚠️ Test thoroughly first

