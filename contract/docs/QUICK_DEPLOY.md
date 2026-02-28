# Quick Deployment Guide

## TL;DR - Deploy Now

```bash
cd contract
./deploy_nowait.sh
```

If that fails due to RPC issues, try:

```bash
# Option 1: Update RPC in snfoundry.toml, then retry
# Option 2: Wait 10-15 minutes and retry
# Option 3: Use a paid RPC endpoint (Alchemy/Infura)
```

## What's Ready

✅ Contracts compiled  
✅ Account configured  
✅ Deployment scripts ready  
⏳ Waiting for RPC connectivity

## After Deployment

1. Copy the Factory Address from output
2. Update `frontend/.env.local`:
   ```
   NEXT_PUBLIC_SEPOLIA_ORGANIZATION_FACTORY_ADDRESS=0x...
   ```
3. Verify on Voyager: https://sepolia.voyager.online/contract/YOUR_ADDRESS

## Troubleshooting

**"RPC error"** → Try different RPC in `snfoundry.toml`  
**"Insufficient funds"** → Get Sepolia ETH from faucet  
**"Account not found"** → Run account import command from DEPLOYMENT_STATUS.md

## Files

- `deploy_nowait.sh` - Main deployment script
- `snfoundry.toml` - Configuration
- `DEPLOYMENT_STATUS.md` - Full documentation
- `TASK_3_SUMMARY.md` - Complete task summary
