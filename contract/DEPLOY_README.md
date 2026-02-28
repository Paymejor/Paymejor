# Quick Deployment Guide

## TL;DR

```bash
# Option 1: Automated (when RPC is stable)
./deploy_sepolia.sh

# Option 2: Interactive Manual
./deploy_manual.sh
```

## Status

✅ Contracts compiled  
✅ Scripts ready  
⚠️ Waiting for RPC connectivity  

## What to Do

### If RPC Works:
```bash
./deploy_sepolia.sh
```

### If RPC Fails:
1. Try `./deploy_manual.sh` for step-by-step guidance
2. Or deploy via Argent X/Braavos wallet UI
3. Or wait 15 minutes and retry

## After Deployment

Update `frontend/.env.local`:
```env
NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=<YOUR_ADDRESS>
```

## Files

- `DEPLOYMENT_SUMMARY.md` - Full task summary
- `DEPLOYMENT_SEPOLIA.md` - Detailed deployment guide
- `deploy_sepolia.sh` - Automated script
- `deploy_manual.sh` - Interactive helper

## Verify

```bash
starkli call <FACTORY_ADDRESS> get_organization_count --rpc https://starknet-sepolia.public.blastapi.io
```

Should return: `0`
