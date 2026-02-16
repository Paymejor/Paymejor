# PayMejor Deployment Quick Start

This is a condensed deployment guide. For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- [ ] Vercel account
- [ ] RPC provider account (Infura/Alchemy/Blast)
- [ ] All contract addresses verified on Voyager

## Step 1: Verify Locally

```bash
# Run pre-deployment checks
./scripts/pre-deployment-check.sh

# Fix any errors before proceeding
```

## Step 2: Prepare Environment Variables

1. Copy `vercel-env-template.txt`
2. Fill in actual values:
   - RPC URLs with API keys
   - Contract addresses for both networks
3. Verify all addresses on Voyager

## Step 3: Deploy to Vercel

### Option A: Dashboard

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your repository
3. Set root directory: `frontend`
4. Add environment variables from template
5. Deploy

### Option B: CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_DEFAULT_NETWORK
# Enter: mainnet (for production) or sepolia (for preview)

vercel env add NEXT_PUBLIC_MAINNET_RPC_URL
# Enter: https://starknet-mainnet.infura.io/v3/YOUR_API_KEY

# ... repeat for all variables ...

# Deploy
vercel --prod
```

## Step 4: Verify Deployment

```bash
# Run post-deployment checks
./scripts/deployment-checklist.sh https://your-app.vercel.app
```

Manual verification:
- [ ] Site loads without errors
- [ ] Connect wallet works
- [ ] Network switching works
- [ ] Contract interactions work
- [ ] All tabs load correctly

## Step 5: Monitor

- Check Vercel deployment logs
- Monitor RPC usage
- Test with small amounts on Mainnet

## Environment Variables Reference

### Required

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.infura.io/v3/YOUR_KEY
```

### Contract Addresses (Sepolia)

```bash
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x...
```

### Contract Addresses (Mainnet)

```bash
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x...
```

### AutoSwap

```bash
AUTOSWAPPR_CONTRACT_ADDRESS=0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b
```

## Troubleshooting

### Build Fails

```bash
# Check TypeScript errors
pnpm tsc --noEmit

# Check build locally
pnpm build
```

### Environment Variables Not Loading

- Verify variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Contract Interactions Fail

- Verify contract addresses on Voyager
- Check network matches contract network
- Test RPC endpoint manually

## Resources

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Environment Setup Guide](./ENVIRONMENT_SETUP.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Starknet Documentation](https://docs.starknet.io)

## Support

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
- Review Vercel deployment logs
- Verify all contract addresses on Voyager

---

**Remember**: Always test with small amounts on Mainnet first!
