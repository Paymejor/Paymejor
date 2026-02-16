# PayMejor Deployment Guide

This guide covers deploying PayMejor to Vercel for both staging (Sepolia) and production (Mainnet) environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Vercel Configuration](#vercel-configuration)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Deployment Steps](#deployment-steps)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Accounts

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **RPC Provider Account**: Choose one:
   - [Infura](https://infura.io) (Recommended)
   - [Alchemy](https://alchemy.com)
   - [Blast API](https://blastapi.io)

### Required Information

Before deploying, gather:

- [ ] Sepolia RPC URL with API key
- [ ] Mainnet RPC URL with API key
- [ ] Vesu pool addresses (Sepolia + Mainnet)
- [ ] Tongo protocol addresses (Sepolia + Mainnet)
- [ ] Token addresses: wBTC, USDC (both networks)
- [ ] AutoSwap contract address

### Verify Contract Addresses

Use Voyager explorer to verify all addresses:

**Sepolia**: https://sepolia.voyager.online
**Mainnet**: https://voyager.online

---

## Vercel Configuration

### Project Setup

1. **Install Vercel CLI** (optional but recommended):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link Project** (from frontend directory):
   ```bash
   cd frontend
   vercel link
   ```

### Build Configuration

The project uses Next.js with the following build settings:

- **Framework**: Next.js
- **Build Command**: `pnpm build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`
- **Development Command**: `pnpm dev`

These are configured in `vercel.json` (see below).

---

## Environment Variables Setup

### Method 1: Vercel Dashboard (Recommended)

1. Go to your project on [vercel.com](https://vercel.com)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable below
4. Select environments: **Production**, **Preview**, **Development**

### Method 2: Vercel CLI

```bash
# Set environment for production
vercel env add NEXT_PUBLIC_DEFAULT_NETWORK production
# Enter: mainnet

vercel env add NEXT_PUBLIC_MAINNET_RPC_URL production
# Enter: https://starknet-mainnet.infura.io/v3/YOUR_API_KEY

# Repeat for all variables...
```

### Required Environment Variables

#### Network Configuration

```bash
# Default network (mainnet for production, sepolia for preview)
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
```

#### Sepolia Testnet (for Preview/Staging)

```bash
# RPC URL
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.infura.io/v3/YOUR_API_KEY

# Contract Addresses
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x...
```

#### Mainnet (for Production)

```bash
# RPC URL
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.infura.io/v3/YOUR_API_KEY

# Contract Addresses
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x...
```

#### AutoSwap

```bash
AUTOSWAPPR_CONTRACT_ADDRESS=0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b
```

### Environment-Specific Configuration

#### Production Environment

- Use **Mainnet** as default network
- Use authenticated RPC endpoints with high rate limits
- Verify all contract addresses on Mainnet
- Enable error tracking (Sentry, etc.)

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.infura.io/v3/YOUR_PRODUCTION_KEY
```

#### Preview Environment (Staging)

- Use **Sepolia** as default network
- Can use public RPC endpoints or authenticated
- Test with testnet tokens

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.infura.io/v3/YOUR_STAGING_KEY
```

#### Development Environment

- Use **Sepolia** as default network
- Can use public RPC endpoints
- For local development only

```bash
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

---

## Deployment Steps

### Initial Deployment

#### Step 1: Prepare Repository

1. **Commit all changes**:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Verify build locally**:
   ```bash
   cd frontend
   pnpm build
   pnpm start
   ```

3. **Test locally**:
   - Connect wallet
   - Test network switching
   - Verify contract interactions

#### Step 2: Deploy to Vercel

**Option A: Via Dashboard**

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - Framework Preset: **Next.js**
   - Root Directory: **frontend**
   - Build Command: **pnpm build**
   - Output Directory: **.next**
4. Add environment variables (see above)
5. Click **Deploy**

**Option B: Via CLI**

```bash
cd frontend

# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

#### Step 3: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

### Continuous Deployment

Vercel automatically deploys:

- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

To disable auto-deployment:
1. Go to **Settings** → **Git**
2. Configure deployment branches

---

## Post-Deployment Verification

### Automated Checks

Create a deployment checklist:

```bash
# deployment-checklist.sh
#!/bin/bash

DEPLOYMENT_URL=$1

echo "🔍 Verifying deployment: $DEPLOYMENT_URL"

# Check if site is accessible
echo "✓ Checking site accessibility..."
curl -f $DEPLOYMENT_URL > /dev/null 2>&1 && echo "  ✅ Site is accessible" || echo "  ❌ Site is not accessible"

# Check if environment variables are loaded
echo "✓ Checking environment configuration..."
curl -s $DEPLOYMENT_URL | grep -q "Starknet" && echo "  ✅ App loaded successfully" || echo "  ❌ App failed to load"

echo "✓ Manual checks required:"
echo "  - Connect wallet"
echo "  - Test network switching"
echo "  - Verify contract addresses"
echo "  - Test transaction flow"
```

### Manual Verification Steps

1. **Visit Deployment URL**
   - [ ] Site loads without errors
   - [ ] No console errors in browser
   - [ ] Network selector visible

2. **Test Wallet Connection**
   - [ ] Connect Xverse wallet
   - [ ] Wallet address displays correctly
   - [ ] Network indicator shows correct network

3. **Test Network Switching**
   - [ ] Switch from Sepolia to Mainnet
   - [ ] Switch from Mainnet to Sepolia
   - [ ] Contract addresses update correctly
   - [ ] RPC endpoints change correctly

4. **Test Contract Interactions**
   - [ ] Fetch wallet balances (wBTC, USDC)
   - [ ] Query Vesu pool data
   - [ ] Test transaction simulation (don't execute)
   - [ ] Verify gas estimates display

5. **Test UI Components**
   - [ ] Dashboard tab loads
   - [ ] Deposit tab loads
   - [ ] Borrow tab loads
   - [ ] Positions tab loads
   - [ ] Exit tab loads
   - [ ] All components render correctly

6. **Test Error Handling**
   - [ ] Disconnect wallet - shows correct state
   - [ ] Wrong network - shows warning
   - [ ] Invalid input - shows validation error
   - [ ] Failed transaction - shows error message

### Performance Checks

1. **Lighthouse Audit**:
   ```bash
   # Install Lighthouse
   npm install -g lighthouse

   # Run audit
   lighthouse https://your-deployment-url.vercel.app --view
   ```

   Target scores:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90

2. **Load Time**:
   - First Contentful Paint: < 1.5s
   - Time to Interactive: < 3.5s
   - Total Blocking Time: < 300ms

---

## Rollback Procedures

### Quick Rollback via Vercel Dashboard

1. Go to **Deployments**
2. Find previous working deployment
3. Click **⋯** → **Promote to Production**
4. Confirm promotion

### Rollback via CLI

```bash
# List recent deployments
vercel ls

# Promote specific deployment to production
vercel promote <deployment-url>
```

### Rollback via Git

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Emergency Rollback

If deployment is completely broken:

1. **Disable deployment**:
   - Go to **Settings** → **Git**
   - Disable auto-deployments

2. **Revert to last known good state**:
   - Use Vercel dashboard to promote previous deployment
   - Or use CLI: `vercel promote <previous-deployment-url>`

3. **Investigate issue**:
   - Check deployment logs
   - Review recent changes
   - Test locally

4. **Fix and redeploy**:
   - Fix the issue
   - Test thoroughly locally
   - Deploy again

---

## Monitoring & Maintenance

### Vercel Analytics

Enable Vercel Analytics for insights:

1. Go to **Analytics** tab
2. Enable Web Analytics
3. Monitor:
   - Page views
   - Unique visitors
   - Top pages
   - Performance metrics

### Error Tracking

Integrate error tracking (optional):

**Sentry**:
```bash
npm install @sentry/nextjs

# Configure in next.config.js
```

**LogRocket**:
```bash
npm install logrocket

# Initialize in _app.tsx
```

### RPC Monitoring

Monitor RPC usage to avoid rate limits:

1. **Infura Dashboard**:
   - Check request count
   - Monitor rate limit usage
   - Set up alerts

2. **Alchemy Dashboard**:
   - View API calls
   - Check compute units
   - Monitor errors

### Regular Maintenance Tasks

**Weekly**:
- [ ] Check deployment logs for errors
- [ ] Monitor RPC usage
- [ ] Review analytics data
- [ ] Test critical user flows

**Monthly**:
- [ ] Update dependencies
- [ ] Review and rotate API keys
- [ ] Check contract addresses still valid
- [ ] Performance audit
- [ ] Security audit

**Quarterly**:
- [ ] Review and update documentation
- [ ] Disaster recovery test
- [ ] Full security audit
- [ ] User feedback review

### Deployment Logs

Access logs via:

1. **Vercel Dashboard**:
   - Go to **Deployments**
   - Click on deployment
   - View **Build Logs** and **Function Logs**

2. **Vercel CLI**:
   ```bash
   # View logs for specific deployment
   vercel logs <deployment-url>

   # Follow logs in real-time
   vercel logs --follow
   ```

### Health Checks

Create a health check endpoint:

```typescript
// pages/api/health.ts
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: process.env.NEXT_PUBLIC_DEFAULT_NETWORK,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  });
}
```

Monitor this endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

---

## Troubleshooting Deployment Issues

### Build Failures

**Issue**: Build fails with dependency errors

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

**Issue**: Build fails with TypeScript errors

**Solution**:
```bash
# Check TypeScript errors locally
pnpm tsc --noEmit

# Fix errors and rebuild
pnpm build
```

### Runtime Errors

**Issue**: Environment variables not loaded

**Solution**:
- Verify variables are set in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Ensure variables are set for correct environment
- Redeploy after adding variables

**Issue**: RPC connection fails

**Solution**:
- Verify RPC URL is correct
- Check API key is valid
- Test RPC endpoint manually:
  ```bash
  curl -X POST YOUR_RPC_URL \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"starknet_chainId","params":[],"id":1}'
  ```

**Issue**: Contract interactions fail

**Solution**:
- Verify contract addresses are correct
- Check addresses on Voyager explorer
- Ensure network matches contract network
- Test with small amounts first

### Performance Issues

**Issue**: Slow page loads

**Solution**:
- Enable Vercel Edge Network
- Optimize images (use Next.js Image component)
- Implement code splitting
- Add caching headers

**Issue**: High RPC usage

**Solution**:
- Implement request caching
- Batch RPC calls where possible
- Use multicall for multiple queries
- Upgrade RPC plan if needed

---

## Security Checklist

Before deploying to production:

- [ ] All environment variables are set correctly
- [ ] No sensitive data in client-side code
- [ ] RPC endpoints use authentication
- [ ] Contract addresses verified on Voyager
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] CSP headers configured (if needed)
- [ ] Rate limiting implemented
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies are up to date
- [ ] Security audit completed

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Analytics](https://vercel.com/docs/analytics)

---

## Support

For deployment issues:

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Next.js Discord**: [nextjs.org/discord](https://nextjs.org/discord)
- **Project Issues**: [GitHub Issues](https://github.com/your-repo/issues)

---

## Changelog

- **2024-02-16**: Initial deployment guide created
- Added Vercel configuration
- Documented environment variables setup
- Added verification and rollback procedures
- Included monitoring and maintenance guidelines

