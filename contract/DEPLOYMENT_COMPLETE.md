# ✅ Deployment Complete - Sepolia Testnet

## Deployment Summary

**Date:** February 28, 2025  
**Network:** Starknet Sepolia Testnet  
**Account:** limitlxx (`0x6d271cbdeb3e79d932309bdfbc5f7e3c890bc35703734572f14a9d6d210245e`)

## Deployed Contracts

### Organization Contract (Class)

- **Class Hash:** `0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7`
- **Declaration Tx:** `0x0615c270f7c5681a08592d94a8355d090976ed601f670778752814fa34528f6f`
- **Voyager:** https://sepolia.voyager.online/class/0x0396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7

### OrganizationFactory Contract

- **Class Hash:** `0x0099e389a349fb594e4214f9c5727d4960a8ebb5b774e8ffa45c59205ec1d4ff`
- **Contract Address:** `0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2`
- **Declaration Tx:** `0x03f9af17a8094ccebc6ff73b6ad5323a01de7dc6cb4caef3db221f16cff8cbce`
- **Deployment Tx:** `0x05e9b691f09f6cb6b1ce649fa9794d2fd5f1c64efa8bd8707ac987d9a9ca7557`
- **Voyager:** https://sepolia.voyager.online/contract/0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2

## Verification

Contract verified and working:

```bash
$ sncast call --contract-address 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2 \
  --function get_organization_count

Response: 0_u256  ✅
```

## Frontend Configuration Updated

Updated `frontend/.env.local`:

```env
NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2
```

## Deployment Commands Used

### 1. Declare Organization Contract

```bash
sncast --account limitlxx \
  declare \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL \
  --contract-name Organization
```

### 2. Declare OrganizationFactory Contract

```bash
sncast --account limitlxx \
  declare \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL \
  --contract-name OrganizationFactory
```

### 3. Deploy OrganizationFactory

```bash
sncast --account limitlxx \
  deploy \
  --class-hash 0x99e389a349fb594e4214f9c5727d4960a8ebb5b774e8ffa45c59205ec1d4ff \
  --constructor-calldata 0x396ec254d7cac58ec36dbd1ae194bb0376f23f20ee451eae4ad94532e028da7 \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

## Next Steps

### 1. Create Your First Organization

Use the create organization script:

```bash
cd contract
./script/create_organization.sh sepolia 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2
```

Or manually:

```bash
sncast --account limitlxx \
  invoke \
  --contract-address 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2 \
  --function create_organization \
  --arguments \
    0x4d794f7267 \
    0x6d271cbdeb3e79d932309bdfbc5f7e3c890bc35703734572f14a9d6d210245e \
    0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D \
    0x01f2a34db9536bc52e54ddbbb43b914f796e35bb7d8a1960e8af33b9cbf56248 \
    0x00452bd5c0512a61df7c7be8cfea5e4f893cb40e126bdc40aee6054db955129e \
    0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080 \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

Parameters:
- `0x4d794f7267` - Organization name ("MyOrg" in felt252)
- `0x6d271cbdeb3e79d932309bdfbc5f7e3c890bc35703734572f14a9d6d210245e` - Admin address (your account)
- `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` - Semaphore verifier address
- `0x01f2a34db9536bc52e54ddbbb43b914f796e35bb7d8a1960e8af33b9cbf56248` - Vesu pool address
- `0x00452bd5c0512a61df7c7be8cfea5e4f893cb40e126bdc40aee6054db955129e` - wBTC token address
- `0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080` - USDC token address

### 2. Proceed to Task 4: Frontend Hooks Implementation

Now that contracts are deployed, you can:
- Implement `useSemaphore.ts` hook
- Implement `useOrganization.ts` hook
- Implement `useOrganizationData.ts` hook
- Build the frontend UI components

### 3. Test Full Flow

Once frontend is ready:
1. Create organization
2. Add members
3. Deposit wBTC collateral
4. Create anonymous proposals
5. Vote on proposals
6. Execute approved proposals
7. Borrow USDC from Vesu

## Contract Addresses Reference

### Sepolia Testnet

```typescript
// Add to frontend/lib/constants.ts
export const SEPOLIA_CONTRACTS = {
  organizationFactory: '0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2',
  semaphoreVerifier: '0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D',
  vesuPool: '0x01f2a34db9536bc52e54ddbbb43b914f796e35bb7d8a1960e8af33b9cbf56248',
  wBTC: '0x00452bd5c0512a61df7c7be8cfea5e4f893cb40e126bdc40aee6054db955129e',
  USDC: '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080',
}
```

## Useful Commands

### Check Organization Count

```bash
sncast call \
  --contract-address 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2 \
  --function get_organization_count \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

### Get Organization by Index

```bash
sncast call \
  --contract-address 0x0434978253e01b5a70802926760a3b1d0744b8deb14a536ae7db7cf40d100fc2 \
  --function get_organization_by_index \
  --arguments 0 \
  --url https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/b0ifhVAUx_eGAhR2jonGL
```

## Files Created

- ✅ `deployments/sepolia_deployment.json` - Deployment information
- ✅ `DEPLOYMENT_COMPLETE.md` - This file
- ✅ Updated `frontend/.env.local` - Frontend configuration

## Task 3 Status

✅ **COMPLETE**

All sub-tasks completed:
- ✅ Compile contracts with Scarb
- ✅ Deploy OrganizationFactory to Sepolia testnet
- ✅ Verify contracts on Voyager explorer
- ✅ Update frontend/.env.local with deployed addresses

## Support

- **Voyager Explorer:** https://sepolia.voyager.online/
- **StarkScan:** https://sepolia.starkscan.co/
- **Starknet Docs:** https://docs.starknet.io/

---

**Deployment completed successfully! 🎉**
