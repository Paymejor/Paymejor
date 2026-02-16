# Contract Addresses Update Summary

**Date**: February 16, 2024  
**Updated By**: Development Team  
**Source**: Official Tongo and Vesu documentation

## Summary

Updated all environment files and documentation with real contract addresses from Tongo and Vesu protocols on Starknet Mainnet and Sepolia testnet.

---

## Mainnet Addresses (✅ COMPLETE)

### Vesu Protocol
- **Pool**: Re7 xBTC
- **Address**: `0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf`
- **Purpose**: Lending pool that supports wBTC collateral
- **Source**: https://docs.vesu.xyz/developers/contract-addresses
- **Status**: ✅ Verified and deployed

### Tongo Protocol
- **Instance**: wBTC Tongo
- **Address**: `0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27`
- **Purpose**: Privacy layer for wBTC transactions
- **Rate**: 10
- **Source**: https://docs.tongo.cash/protocol/contracts.html
- **Status**: ✅ Verified and deployed

### Token Contracts
- **wBTC**: `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac`
  - Decimals: 8
  - Status: ✅ Verified
  
- **USDC (Native)**: `0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb`
  - Decimals: 6
  - Status: ✅ Verified
  - Note: This is native USDC, not bridged USDC.e

---

## Sepolia Testnet Addresses (⚠️ PARTIAL)

### Tongo Protocol
- **Instance**: USDC Tongo
- **Address**: `0x2caae365e67921979a4e5c16dd70eaa5776cfc6a9592bcb903d91933aaf2552`
- **Purpose**: Privacy layer for USDC transactions on testnet
- **Rate**: 10000
- **Source**: https://docs.tongo.cash/protocol/contracts.html
- **Status**: ✅ Verified and deployed

### Token Contracts
- **USDC**: `0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080`
  - Decimals: 6
  - Status: ✅ Verified

### Not Available on Sepolia
- **Vesu Pool**: ⚠️ Vesu V2 may not be deployed on Sepolia testnet
- **wBTC Token**: ⚠️ wBTC may not be available on Sepolia testnet

**Recommendation**: For Sepolia testing, use USDC-only flows or check Vesu documentation for testnet pool availability.

---

## Files Updated

### Environment Configuration
1. ✅ `frontend/.env.example` - Updated with real addresses
2. ✅ `frontend/.env.local` - Updated with real addresses
3. ✅ `frontend/vercel-env-template.txt` - Updated with real addresses

### Documentation
4. ✅ `frontend/CONTRACT_ADDRESSES.md` - Updated with:
   - Real Mainnet addresses
   - Real Sepolia addresses (where available)
   - Additional Tongo instances list
   - Additional Vesu pools list
   - Updated changelog

---

## Verification Status

### Mainnet (All Verified ✅)
- [x] Vesu Pool address verified on Voyager
- [x] Tongo Protocol address verified on Voyager
- [x] wBTC token address verified on Voyager
- [x] USDC token address verified on Voyager
- [x] All addresses match official documentation

### Sepolia (Partially Verified ⚠️)
- [x] Tongo Protocol address verified
- [x] USDC token address verified
- [ ] Vesu Pool - Not available on Sepolia
- [ ] wBTC token - Not available on Sepolia

---

## Next Steps

### For Development (Sepolia)
1. ✅ Tongo USDC instance is ready to use
2. ✅ USDC token is available for testing
3. ⚠️ Check if Vesu has testnet pools available
4. ⚠️ Consider testing with USDC-only flows on Sepolia
5. ⚠️ For wBTC testing, use Mainnet with small amounts

### For Production (Mainnet)
1. ✅ All contract addresses are ready
2. ✅ Vesu Re7 xBTC pool supports wBTC collateral
3. ✅ Tongo wBTC instance provides privacy layer
4. ✅ All tokens are verified and deployed
5. ⚠️ Test with small amounts first before production use

---

## Additional Resources

### Tongo Protocol
- **Documentation**: https://docs.tongo.cash
- **Contracts**: https://docs.tongo.cash/protocol/contracts.html
- **SDK**: https://docs.tongo.cash/sdk/quick-start.html

### Vesu Protocol
- **Documentation**: https://docs.vesu.xyz
- **Contract Addresses**: https://docs.vesu.xyz/developers/contract-addresses
- **Curator Dashboard**: https://app.vesu.xyz

### Explorers
- **Mainnet Voyager**: https://voyager.online
- **Sepolia Voyager**: https://sepolia.voyager.online

---

## Alternative Configurations

### Using Different Tongo Instances

If you want to use different tokens, Tongo has instances for:
- STRK, ETH, USDC.e, USDT, DAI on Mainnet
- STRK, ETH on Sepolia

Update the `NEXT_PUBLIC_*_TONGO_PROTOCOL_ADDRESS` to the appropriate instance address.

### Using Different Vesu Pools

Vesu has multiple pools available:
- Prime Pool (multi-asset)
- Re7 USDC Core/Prime/Frontier (USDC-focused)
- Re7 USDC Stable Core (stablecoin-focused)
- Re7 xBTC (BTC-focused) ← Currently configured

Update the `NEXT_PUBLIC_*_VESU_POOL_ADDRESS` to use a different pool.

---

## Important Notes

1. **Mainnet Ready**: All Mainnet addresses are verified and ready for production use
2. **Sepolia Limitations**: Vesu and wBTC may not be available on Sepolia
3. **Testing Strategy**: 
   - Use Sepolia for USDC-only flows
   - Use Mainnet with small amounts for full wBTC flows
4. **Address Verification**: All addresses have been verified against official documentation
5. **No Placeholders**: All Mainnet addresses are real and functional

---

## Security Checklist

Before deploying:
- [x] All Mainnet addresses verified on Voyager
- [x] Addresses match official protocol documentation
- [x] No placeholder values in Mainnet configuration
- [x] Sepolia addresses verified where available
- [ ] Test transactions on Sepolia (USDC flows)
- [ ] Test transactions on Mainnet with small amounts
- [ ] Verify gas estimates are reasonable
- [ ] Confirm privacy features work correctly

---

**Status**: ✅ Mainnet configuration complete and ready for deployment  
**Status**: ⚠️ Sepolia configuration partial - suitable for USDC testing only

