# PayMejor Contract Addresses Reference

This document provides a reference for all contract addresses needed for PayMejor deployment on both Starknet Sepolia and Mainnet.

## Table of Contents

1. [How to Find Addresses](#how-to-find-addresses)
2. [Sepolia Testnet Addresses](#sepolia-testnet-addresses)
3. [Mainnet Addresses](#mainnet-addresses)
4. [Verification Instructions](#verification-instructions)
5. [Updating Addresses](#updating-addresses)

---

## How to Find Addresses

### Vesu Protocol

**Documentation**: https://docs.vesu.xyz/developers/contract-addresses

1. Visit Vesu documentation
2. Navigate to "Contract Addresses" section
3. Look for "Isolated Lending Pools"
4. Copy addresses for your target network

**Note**: Vesu has multiple pools. Ensure you're using the correct pool that supports wBTC collateral and USDC borrowing.

### Tongo Protocol

**Documentation**: https://docs.tongo.cash

1. Visit Tongo documentation
2. Check SDK documentation or deployment section
3. Look for protocol contract addresses
4. Contact Tongo team if addresses are not publicly listed

**Alternative**: Check Tongo SDK source code or examples for deployed addresses.

### Token Addresses (wBTC, USDC)

**Starknet Token Registry**: https://www.starknet.io/ecosystem

**Voyager Explorer**:
- Sepolia: https://sepolia.voyager.online
- Mainnet: https://voyager.online

**Steps**:
1. Search for token name (e.g., "wBTC" or "USDC")
2. Verify token contract is verified on Voyager
3. Check token decimals (wBTC: 8, USDC: 6)
4. Copy contract address

### AutoSwap

**GitHub**: https://github.com/BlockheaderWeb3-Community/autoswap-sdk

**Current Address**: `0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b`

Check the SDK README for the latest deployed address.

---

## Sepolia Testnet Addresses

### Protocol Contracts

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| Vesu Pool | N/A | ⚠️ NOT DEPLOYED | ❌ |
| Tongo Protocol (USDC) | `0x2caae365e67921979a4e5c16dd70eaa5776cfc6a9592bcb903d91933aaf2552` | ✅ DEPLOYED | ✅ |

**Note**: Vesu V2 may not be deployed on Sepolia testnet. Check [Vesu documentation](https://docs.vesu.xyz/developers/contract-addresses) for testnet pool availability.

### Token Contracts

| Token | Address | Decimals | Status | Verified |
|-------|---------|----------|--------|----------|
| wBTC | N/A | 8 | ⚠️ NOT AVAILABLE | ❌ |
| USDC | `0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080` | 6 | ✅ DEPLOYED | ✅ |

**Note**: wBTC may not be available on Sepolia. Use testnet equivalent or test with USDC only.

### DEX Aggregator

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| AutoSwap | `0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b` | ✅ CONFIRMED | ✅ |

### Faucets (Testnet Only)

- **Starknet ETH Faucet**: https://faucet.starknet.io
- **wBTC Faucet**: Check Vesu or Starknet community faucets
- **USDC Faucet**: Check Vesu or Starknet community faucets

---

## Mainnet Addresses

### Protocol Contracts

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| Vesu Pool (Re7 xBTC) | `0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf` | ✅ DEPLOYED | ✅ |
| Tongo Protocol (wBTC) | `0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27` | ✅ DEPLOYED | ✅ |

**Vesu Pool Details**:
- Pool Name: Re7 xBTC
- Supports: wBTC collateral
- Source: [Vesu Contract Addresses](https://docs.vesu.xyz/developers/contract-addresses)

**Tongo Instance Details**:
- Token: wBTC
- Rate: 10
- Source: [Tongo Contracts](https://docs.tongo.cash/protocol/contracts.html)

### Token Contracts

| Token | Address | Decimals | Status | Verified |
|-------|---------|----------|--------|----------|
| wBTC | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` | 8 | ✅ DEPLOYED | ✅ |
| USDC (Native) | `0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb` | 6 | ✅ DEPLOYED | ✅ |

**Token Details**:
- wBTC: Wrapped Bitcoin on Starknet
- USDC: Native USDC (not bridged USDC.e)
- Source: [Tongo Contracts](https://docs.tongo.cash/protocol/contracts.html)

**Additional Tongo Instances Available on Mainnet**:
- STRK: `0x3a542d7eb73b3e33a2c54e9827ec17a6365e289ec35ccc94dde97950d9db498`
- ETH: `0x276e11a5428f6de18a38b7abc1d60abc75ce20aa3a925e20a393fcec9104f89`
- USDC.e (Bridged): `0x72098b84989a45cc00697431dfba300f1f5d144ae916e98287418af4e548d96`
- USDC (Native): `0x026f79017c3c382148832c6ae50c22502e66f7a2f81ccbdb9e1377af31859d3a`
- USDT: `0x659c62ba8bc3ac92ace36ba190b350451d0c767aa973dd63b042b59cc065da0`
- DAI: `0x511741b1ad1777b4ad59fbff49d64b8eb188e2aeb4fc72438278a589d8a10d8`

**Additional Vesu Pools Available on Mainnet**:
- Prime Pool: `0x451fe483d5921a2919ddd81d0de6696669bccdacd859f72a4fba7656b97c3b5`
- Re7 USDC Core: `0x3976cac265a12609934089004df458ea29c776d77da423c96dc761d09d24124`
- Re7 USDC Prime: `0x2eef0c13b10b487ea5916b54c0a7f98ec43fb3048f60fdeedaf5b08f6f88aaf`
- Re7 USDC Frontier: `0x5c03e7e0ccfe79c634782388eb1e6ed4e8e2a013ab0fcc055140805e46261bd`
- Re7 USDC Stable Core: `0x73702fce24aba36da1eac539bd4bae62d4d6a76747b7cdd3e016da754d7a135`

For the latest pool list, see the [Vesu Curator Dashboard](https://app.vesu.xyz).

### DEX Aggregator

| Contract | Address | Status | Verified |
|----------|---------|--------|----------|
| AutoSwap | `0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b` | ✅ CONFIRMED | ✅ |

---

## Verification Instructions

### Step 1: Verify on Voyager

For each address, verify on Voyager explorer:

**Sepolia**: https://sepolia.voyager.online
**Mainnet**: https://voyager.online

1. Search for the contract address
2. Check that contract exists
3. Verify contract is verified (green checkmark)
4. Check deployment date (should be recent)
5. Review contract code if available

### Step 2: Verify Contract Type

Ensure the contract is the correct type:

**Vesu Pool**:
- Should implement ERC-4626 vault interface
- Should have supply/borrow/withdraw/repay functions
- Check pool parameters (supported assets, LTV ratios)

**Tongo Protocol**:
- Should have fund/decrypt functions
- Should support ElGamal encryption
- Check supported tokens

**Token Contracts**:
- Should implement ERC-20 interface
- Verify decimals (wBTC: 8, USDC: 6)
- Check total supply is reasonable

**AutoSwap**:
- Should have swap/getQuote functions
- Should aggregate multiple DEXs
- Check supported token pairs

### Step 3: Test with Small Amounts

Before using in production:

1. Test token approvals
2. Test small deposits/borrows
3. Verify transactions confirm successfully
4. Check balances update correctly

---

## Updating Addresses

### When to Update

Update contract addresses when:
- New protocol version is deployed
- Migrating to different pool/protocol
- Token contract is upgraded
- Network is changed (Sepolia ↔ Mainnet)

### How to Update

#### 1. Update Environment Variables

Edit `.env.local`:

```bash
# Sepolia
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x_NEW_ADDRESS

# Mainnet
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x_NEW_ADDRESS
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x_NEW_ADDRESS
```

#### 2. Update Vercel Environment Variables

Via Dashboard:
1. Go to Project Settings → Environment Variables
2. Find the variable to update
3. Click Edit
4. Enter new value
5. Save

Via CLI:
```bash
vercel env rm NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS
vercel env add NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS
# Enter new value
```

#### 3. Update This Document

Update the tables above with:
- New address
- Verification status
- Date of update

#### 4. Verify Changes

1. Restart development server (local)
2. Redeploy (production)
3. Test contract interactions
4. Verify transactions work correctly

---

## Address Format

All Starknet addresses should:
- Start with `0x`
- Be 64 characters long (including `0x`)
- Contain only hexadecimal characters (0-9, a-f)

**Example**: `0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7`

---

## Security Checklist

Before using any contract address:

- [ ] Verified on Voyager explorer
- [ ] Contract is verified (source code available)
- [ ] Deployment date is reasonable
- [ ] Contract type matches expected interface
- [ ] Tested with small amounts
- [ ] Address format is correct (0x + 64 chars)
- [ ] Network matches (Sepolia vs Mainnet)
- [ ] No typos in address

---

## Common Issues

### Issue: "Contract not found"

**Cause**: Address is incorrect or contract not deployed on selected network

**Solution**:
- Verify address on Voyager
- Check you're on correct network (Sepolia vs Mainnet)
- Ensure address is for the correct network

### Issue: "Transaction fails with contract error"

**Cause**: Contract interface mismatch or incorrect parameters

**Solution**:
- Verify contract type matches expected interface
- Check function signatures in contract code
- Verify parameters are correct format

### Issue: "Token decimals incorrect"

**Cause**: Using wrong token contract or incorrect decimal assumption

**Solution**:
- Verify token decimals on Voyager (wBTC: 8, USDC: 6)
- Check token contract address is correct
- Update decimal handling in code if needed

---

## Resources

### Official Documentation

- **Vesu**: https://docs.vesu.xyz/developers/contract-addresses
- **Tongo**: https://docs.tongo.cash
- **Starknet**: https://docs.starknet.io
- **AutoSwap**: https://github.com/BlockheaderWeb3-Community/autoswap-sdk

### Explorers

- **Sepolia Voyager**: https://sepolia.voyager.online
- **Mainnet Voyager**: https://voyager.online
- **Starkscan**: https://starkscan.co

### Community

- **Starknet Discord**: https://discord.gg/starknet
- **Vesu Discord**: https://discord.gg/vesu
- **Starknet Forum**: https://community.starknet.io

---

## Changelog

| Date | Network | Contract | Old Address | New Address | Reason |
|------|---------|----------|-------------|-------------|--------|
| 2024-02-16 | - | - | - | - | Initial document created |
| 2024-02-16 | Mainnet | Vesu Pool | N/A | `0x3a8416bf20d036df5b1cf3447630a2e1cb04685f6b0c3a70ed7fb1473548ecf` | Added Re7 xBTC pool address |
| 2024-02-16 | Mainnet | Tongo (wBTC) | N/A | `0x6d82c8c467eac77f880a1d5a090e0e0094a557bf67d74b98ba1881200750e27` | Added wBTC Tongo instance |
| 2024-02-16 | Mainnet | wBTC Token | N/A | `0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac` | Added wBTC token address |
| 2024-02-16 | Mainnet | USDC Token | N/A | `0x033068F6539f8e6e6b131e6B2B814e6c34A5224bC66947c47DaB9dFeE93b35fb` | Added USDC native token |
| 2024-02-16 | Sepolia | Tongo (USDC) | N/A | `0x2caae365e67921979a4e5c16dd70eaa5776cfc6a9592bcb903d91933aaf2552` | Added USDC Tongo instance |
| 2024-02-16 | Sepolia | USDC Token | N/A | `0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080` | Added USDC token address |

---

## Notes

- Always verify addresses on Voyager before using
- Test with small amounts on Mainnet first
- Keep this document updated when addresses change
- Document all address changes in changelog
- Coordinate address updates across team

---

**⚠️ IMPORTANT**: Never use contract addresses without verification. Always check on Voyager explorer first!

