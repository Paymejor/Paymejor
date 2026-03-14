# PayMejor Issues - Analysis & Fixes

## Issues Summary

### 1. RPC URL Version Mismatch ✅ FIXED
**Problem:** Using v0_10 RPC endpoints which are not compatible with current Starknet.js version
**Error:** "Method not found" errors across all contract calls
**Fix:** Changed RPC URLs from v0_10 to v0_7 in `.env.local`

```bash
# Before
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/...
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_10/...

# After
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/...
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.g.alchemy.com/starknet/version/rpc/v0_7/...
```

### 2. Vesu Contract Entrypoint Errors ⚠️ NEEDS VERIFICATION
**Problem:** Contract calls failing with "Requested entrypoint does not exist"
**Errors:**
- `get_user_position` - entrypoint not found
- `get_borrowing_capacity` - entrypoint not found  
- `get_pool_parameters` - entrypoint not found

**Root Cause:** The Vesu contract addresses may be incorrect OR the contract ABI doesn't match expectations

**Action Required:**
1. Verify Vesu pool addresses are correct for your network
2. Check Vesu documentation for correct entrypoint names
3. The contract might use different method names like:
   - `position` instead of `get_user_position`
   - `borrowing_power` instead of `get_borrowing_capacity`
   - `pool_config` instead of `get_pool_parameters`

**Current Addresses:**
- Sepolia: `0x01f2a34db9536bc52e54ddbbb43b914f796e35bb7d8a1960e8af33b9cbf56248`
- Mainnet: `0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf`

### 3. Tongo "PubKey is not an EcPoint" Error ⚠️ NEEDS INVESTIGATION
**Problem:** Tongo balance decryption failing with invalid public key format
**Error:** `Contract error: "PubKey is not an EcPoint"`

**Root Cause:** The public key being passed to Tongo's `get_balance` is malformed

**Possible Issues:**
1. The calldata format for `get_balance` is incorrect
2. The Tongo account address derivation is wrong
3. The public key needs to be properly formatted as an EC point

**Current Implementation Issue:**
```typescript
// In useTongo.ts line 183
const result = await provider.callContract({
  contractAddress: config.contracts.tongoProtocol,
  entrypoint: 'get_balance',
  calldata: [tongoAccount.address, token], // ❌ This format may be wrong
})
```

**Action Required:**
1. Check Tongo SDK documentation for correct `get_balance` calldata format
2. Verify the Tongo account creation process
3. May need to derive proper EC point from wallet public key

### 4. Wallet Balance Formatting 🔧 NEEDS FIX
**Problem:** Balances showing as "0.0000000" with too many zeros
**Root Cause:** Decimal formatting not respecting token decimals

**Fix Needed:** Update balance display components to use proper decimal places:
- wBTC: 8 decimals
- USDC: 6 decimals
- ETH: 18 decimals

### 5. Shielded Position Not Active ⚠️ DEPENDENCY
**Problem:** Can't decrypt "Reveal Position" button
**Root Cause:** Depends on fixing Tongo integration (Issue #3)

**Action:** Once Tongo balance retrieval works, this should resolve automatically

### 6. Quick Actions Buttons Not Active ⚠️ DEPENDENCY
**Problem:** Dashboard quick action buttons not working
**Root Cause:** Depends on fixing Vesu integration (Issue #2)

**Action:** Once Vesu contract calls work, buttons should become active

### 7. Xverse Wallet Connection ✅ SHOULD WORK
**Problem:** User reports Xverse wallet not connecting
**Analysis:** The wallet context uses `@starknet-io/get-starknet` which supports:
- Argent X
- Braavos
- Xverse (if installed)

**Verification Steps:**
1. Ensure Xverse wallet extension is installed
2. Ensure Xverse is unlocked
3. Check browser console for connection errors
4. Try clearing browser cache and reconnecting

**Code is correct:** The `connect()` function properly handles multiple wallets via the modal

## Priority Action Items

### Immediate (Critical)
1. ✅ Fix RPC URL versions (DONE)
2. 🔍 Verify Vesu contract addresses and entrypoint names
3. 🔍 Check Tongo SDK documentation for correct integration

### High Priority
4. 🔧 Fix balance decimal formatting
5. 🧪 Test Xverse wallet connection thoroughly

### Medium Priority  
6. 📝 Add better error messages for contract failures
7. 📝 Add loading states for async operations

## Testing Checklist

After fixes:
- [ ] Dashboard loads without errors
- [ ] Wallet balance displays correctly (proper decimals)
- [ ] Vesu position data loads
- [ ] Tongo shielded balance can be decrypted
- [ ] Borrow tab shows borrowing capacity
- [ ] Position tab shows current positions
- [ ] Quick actions buttons are clickable
- [ ] Xverse wallet connects successfully
- [ ] Argent X wallet connects successfully
- [ ] Braavos wallet connects successfully

## Next Steps

1. **Verify Contract Addresses:**
   - Check Vesu docs: https://docs.vesu.xyz/developers/contract-addresses
   - Check Tongo docs: https://docs.tongo.cash
   - Verify on Voyager explorer

2. **Update Contract Integration:**
   - Get correct Vesu ABI and entrypoint names
   - Get correct Tongo SDK usage examples
   - Update `useVesu.ts` and `useTongo.ts` accordingly

3. **Test on Sepolia:**
   - Use testnet tokens
   - Verify all features work
   - Check console for any remaining errors

4. **Deploy Fixes:**
   - Test locally first
   - Deploy to staging
   - Verify on production

## Resources

- Vesu Docs: https://docs.vesu.xyz
- Tongo Docs: https://docs.tongo.cash
- Starknet.js: https://www.starknetjs.com
- Get Starknet: https://github.com/starknet-io/get-starknet
