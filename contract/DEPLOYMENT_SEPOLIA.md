# Sepolia Deployment Guide

## Status

✅ Contracts compiled successfully  
✅ Deployment script created  
⚠️ RPC connectivity issues encountered  

## What's Ready

The contracts have been successfully compiled and are ready for deployment:

- **Organization Contract**: `target/dev/semaphore_organization_pooling_Organization.contract_class.json`
- **OrganizationFactory Contract**: `target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json`

## Deployment Options

### Option 1: Using Automated Script (Recommended when RPC is stable)

```bash
cd contract
./deploy_sepolia.sh
```

This script will:
1. Declare the Organization contract
2. Declare the OrganizationFactory contract  
3. Deploy the OrganizationFactory with the Organization class hash
4. Save deployment info to `deployments/sepolia_deployment.json`

### Option 2: Manual Deployment via Starkli

If the automated script fails due to RPC issues, use starkli directly:

#### Step 1: Set Environment Variables

```bash
export STARKNET_ACCOUNT=~/.starknet_accounts/starknet_open_zeppelin_accounts.json
export STARKNET_KEYSTORE=./signer.json
export STARKNET_RPC=https://starknet-sepolia.public.blastapi.io
```

#### Step 2: Declare Organization Contract

```bash
starkli declare \
  target/dev/semaphore_organization_pooling_Organization.contract_class.json \
  --account $STARKNET_ACCOUNT \
  --keystore $STARKNET_KEYSTORE \
  --rpc $STARKNET_RPC
```

Save the class hash output (e.g., `0x1234...abcd`)

#### Step 3: Declare OrganizationFactory Contract

```bash
starkli declare \
  target/dev/semaphore_organization_pooling_OrganizationFactory.contract_class.json \
  --account $STARKNET_ACCOUNT \
  --keystore $STARKNET_KEYSTORE \
  --rpc $STARKNET_RPC
```

Save the class hash output (e.g., `0x5678...efgh`)

#### Step 4: Deploy OrganizationFactory

```bash
starkli deploy \
  <FACTORY_CLASS_HASH> \
  <ORGANIZATION_CLASS_HASH> \
  --account $STARKNET_ACCOUNT \
  --keystore $STARKNET_KEYSTORE \
  --rpc $STARKNET_RPC
```

Save the deployed contract address.

### Option 3: Using Voyager/StarkScan UI

1. Go to https://sepolia.voyager.online/
2. Connect your wallet
3. Use the "Declare Contract" feature to declare both contracts
4. Use the "Deploy Contract" feature to deploy the factory

### Option 4: Using Argent X or Braavos Wallet

1. Install Argent X or Braavos browser extension
2. Import your account using the private key
3. Use the wallet's contract deployment feature
4. Deploy via the wallet interface

## RPC Endpoints to Try

If you encounter RPC issues, try these alternatives:

1. **Blast API**: `https://starknet-sepolia.public.blastapi.io`
2. **Infura**: `https://starknet-sepolia.infura.io/v3/YOUR_API_KEY`
3. **Alchemy**: `https://starknet-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
4. **Nethermind**: `https://free-rpc.nethermind.io/sepolia-juno`

## Troubleshooting

### "Error while calling RPC method spec_version"

This indicates an RPC version compatibility issue. Try:

1. Wait 10-15 minutes and retry (RPC might be temporarily down)
2. Try a different RPC endpoint from the list above
3. Use a paid RPC service (Alchemy/Infura) for better reliability
4. Deploy via wallet UI (Option 4)

### "Mac Mismatch" Error

This means the keystore password is incorrect. The keystore file is encrypted and requires the password used during creation.

### "Insufficient Funds"

Get Sepolia ETH from a faucet:
- https://faucet.goerli.starknet.io/
- https://starknet-faucet.vercel.app/

## After Successful Deployment

### 1. Verify on Voyager

Visit: `https://sepolia.voyager.online/contract/<FACTORY_ADDRESS>`

### 2. Update Frontend Configuration

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=<FACTORY_ADDRESS>
```

### 3. Test the Deployment

```bash
# Get organization count (should be 0)
starkli call \
  <FACTORY_ADDRESS> \
  get_organization_count \
  --rpc https://starknet-sepolia.public.blastapi.io
```

## Contract Addresses

Once deployed, record the addresses here:

- **Organization Class Hash**: `TBD`
- **OrganizationFactory Class Hash**: `TBD`
- **OrganizationFactory Address**: `TBD`

## Next Steps

After successful deployment:

1. ✅ Verify contracts on Voyager
2. ✅ Update frontend/.env.local
3. ✅ Create first organization using `./script/create_organization.sh`
4. ✅ Test full flow: create org → add member → deposit → propose → vote → execute

## Support

If you continue to experience issues:

1. Check Starknet status: https://status.starknet.io/
2. Try deploying during off-peak hours
3. Consider using a paid RPC service for better reliability
4. Deploy via wallet UI as a fallback

## Files Created

- ✅ `Scarb.toml` - Project configuration
- ✅ `deploy_sepolia.sh` - Automated deployment script
- ✅ `snfoundry.toml` - Starknet Foundry configuration
- ✅ Compiled contracts in `target/dev/`

## Compilation Output

```
Compiling semaphore_organization_pooling v0.1.0
Finished `dev` profile target(s) in 14 seconds
```

All contracts compiled successfully with no errors.
