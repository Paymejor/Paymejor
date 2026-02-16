# PayMejor Environment Configuration Guide

This guide provides comprehensive instructions for setting up environment variables for both Starknet Sepolia testnet and Mainnet deployments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables Reference](#environment-variables-reference)
3. [Network-Specific Configuration](#network-specific-configuration)
4. [RPC Endpoints](#rpc-endpoints)
5. [Contract Addresses](#contract-addresses)
6. [Setup Instructions](#setup-instructions)
7. [Deployment Configuration](#deployment-configuration)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

1. Copy the example environment file:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. Fill in the required values in `.env.local`

3. Start the development server:
   ```bash
   pnpm dev
   ```

---

## Environment Variables Reference

### Required Variables

These variables are **required** for the application to function:

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_DEFAULT_NETWORK` | Default network on app load (`sepolia` or `mainnet`) | `sepolia` |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | RPC endpoint for Starknet Sepolia | Public Blast API |
| `NEXT_PUBLIC_MAINNET_RPC_URL` | RPC endpoint for Starknet Mainnet | Public Blast API |

### Optional Variables (Required for Full Functionality)

These variables are needed for complete protocol integration:

#### Sepolia Testnet

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS` | Vesu lending pool address | [Vesu Docs](https://docs.vesu.xyz/developers/contract-addresses) |
| `NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS` | Tongo privacy protocol address | [Tongo Docs](https://docs.tongo.cash) |
| `NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS` | Wrapped Bitcoin token address | Starknet token registry |
| `NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS` | USD Coin token address | Starknet token registry |

#### Mainnet

| Variable | Description | Source |
|----------|-------------|--------|
| `NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS` | Vesu lending pool address | [Vesu Docs](https://docs.vesu.xyz/developers/contract-addresses) |
| `NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS` | Tongo privacy protocol address | [Tongo Docs](https://docs.tongo.cash) |
| `NEXT_PUBLIC_MAINNET_WBTC_ADDRESS` | Wrapped Bitcoin token address | Starknet token registry |
| `NEXT_PUBLIC_MAINNET_USDC_ADDRESS` | USD Coin token address | Starknet token registry |

#### AutoSwap

| Variable | Description | Source |
|----------|-------------|--------|
| `AUTOSWAPPR_CONTRACT_ADDRESS` | AutoSwap DEX aggregator address | [AutoSwap SDK](https://github.com/BlockheaderWeb3-Community/autoswap-sdk) |

---

## Network-Specific Configuration

### Sepolia Testnet (Development & Testing)

**Purpose**: Development, testing, and demo with testnet tokens

**Characteristics**:
- Free testnet tokens available via faucets
- No real value transactions
- Faster block times
- May have network resets

**Use Cases**:
- Local development
- Integration testing
- User acceptance testing
- Demo presentations

### Mainnet (Production)

**Purpose**: Production deployment with real assets

**Characteristics**:
- Real value transactions
- Production-grade infrastructure
- Stable network
- Requires real tokens

**Use Cases**:
- Production deployment
- Real user transactions
- Live demonstrations with small amounts

---

## RPC Endpoints

### Public RPC Endpoints (Free, Rate-Limited)

#### Sepolia Testnet
```
https://starknet-sepolia.public.blastapi.io/rpc/v0_7
```

#### Mainnet
```
https://starknet-mainnet.public.blastapi.io/rpc/v0_7
```

**Limitations**:
- Rate limited (typically 25-50 requests/second)
- May have downtime
- Not recommended for production

### Authenticated RPC Endpoints (Recommended for Production)

#### Infura

**Sepolia**:
```
https://starknet-sepolia.infura.io/v3/YOUR_API_KEY
```

**Mainnet**:
```
https://starknet-mainnet.infura.io/v3/YOUR_API_KEY
```

**Setup**: Sign up at [infura.io](https://infura.io)

#### Alchemy

**Sepolia**:
```
https://starknet-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Mainnet**:
```
https://starknet-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

**Setup**: Sign up at [alchemy.com](https://alchemy.com)

#### Blast API

**Sepolia**:
```
https://starknet-sepolia.blastapi.io/YOUR_PROJECT_ID/rpc/v0_7
```

**Mainnet**:
```
https://starknet-mainnet.blastapi.io/YOUR_PROJECT_ID/rpc/v0_7
```

**Setup**: Sign up at [blastapi.io](https://blastapi.io)

---

## Contract Addresses

### How to Find Contract Addresses

1. **Vesu Protocol**:
   - Visit [Vesu Documentation](https://docs.vesu.xyz/developers/contract-addresses)
   - Look for "Contract Addresses" section
   - Copy addresses for your target network

2. **Tongo Protocol**:
   - Visit [Tongo Documentation](https://docs.tongo.cash)
   - Check SDK documentation or contract deployments
   - Contact Tongo team if addresses not public

3. **Token Addresses (wBTC, USDC)**:
   - Check [Starknet Token Registry](https://www.starknet.io/ecosystem)
   - Use Voyager explorer to verify addresses
   - Sepolia: [sepolia.voyager.online](https://sepolia.voyager.online)
   - Mainnet: [voyager.online](https://voyager.online)

4. **AutoSwap**:
   - Check [AutoSwap SDK README](https://github.com/BlockheaderWeb3-Community/autoswap-sdk/blob/main/lib/README.md)
   - Current address: `0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b`

### Verifying Contract Addresses

Always verify contract addresses before using them:

1. Check on Voyager explorer
2. Verify contract is verified on-chain
3. Check contract deployment date
4. Confirm with official protocol documentation

---

## Setup Instructions

### For Local Development (Sepolia)

1. **Copy environment file**:
   ```bash
   cd frontend
   cp .env.example .env.local
   ```

2. **Configure Sepolia network**:
   ```bash
   # .env.local
   NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
   NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
   ```

3. **Add Sepolia contract addresses**:
   - Get addresses from protocol documentation
   - Add to `.env.local`:
   ```bash
   NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x...
   NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x...
   NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x...
   NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x...
   ```

4. **Get testnet tokens**:
   - Connect wallet to Sepolia
   - Use Starknet faucet for ETH
   - Use protocol-specific faucets for wBTC/USDC

5. **Start development server**:
   ```bash
   pnpm dev
   ```

### For Production Deployment (Mainnet)

1. **Set up authenticated RPC endpoint**:
   - Sign up for Infura, Alchemy, or Blast API
   - Get API key
   - Configure in environment:
   ```bash
   NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.infura.io/v3/YOUR_API_KEY
   ```

2. **Configure Mainnet contract addresses**:
   ```bash
   NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x...
   NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x...
   NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x...
   NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x...
   ```

3. **Set default network**:
   ```bash
   NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
   ```

4. **Verify all addresses**:
   - Check each address on Voyager
   - Confirm contracts are verified
   - Test with small amounts first

5. **Deploy** (see [Deployment Configuration](#deployment-configuration))

---

## Deployment Configuration

### Vercel Deployment

#### Step 1: Prepare Environment Variables

Create a file `vercel-env-vars.txt` with all required variables:

```bash
# Network Configuration
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet

# Sepolia Configuration
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.infura.io/v3/YOUR_API_KEY
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x...

# Mainnet Configuration
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.infura.io/v3/YOUR_API_KEY
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x...

# AutoSwap
AUTOSWAPPR_CONTRACT_ADDRESS=0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b
```

#### Step 2: Configure Vercel Project

1. **Via Vercel Dashboard**:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add each variable from `vercel-env-vars.txt`
   - Set environment: Production, Preview, Development

2. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Add environment variables
   vercel env add NEXT_PUBLIC_DEFAULT_NETWORK
   # Enter value: mainnet

   vercel env add NEXT_PUBLIC_MAINNET_RPC_URL
   # Enter value: https://starknet-mainnet.infura.io/v3/YOUR_API_KEY

   # Repeat for all variables...
   ```

#### Step 3: Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

#### Step 4: Verify Deployment

1. Visit deployed URL
2. Check network selector shows both networks
3. Test wallet connection
4. Verify contract interactions work
5. Check browser console for errors

### Environment-Specific Deployments

#### Preview Deployments (Sepolia)

For preview/staging deployments, use Sepolia:

```bash
# Set preview environment variables in Vercel
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
# ... Sepolia addresses ...
```

#### Production Deployment (Mainnet)

For production, use Mainnet:

```bash
# Set production environment variables in Vercel
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
# ... Mainnet addresses ...
```

---

## Troubleshooting

### Common Issues

#### 1. "RPC URL not configured"

**Symptom**: Application shows error about missing RPC URL

**Solution**:
- Check `.env.local` has `NEXT_PUBLIC_SEPOLIA_RPC_URL` and `NEXT_PUBLIC_MAINNET_RPC_URL`
- Restart development server after adding variables
- Verify variable names match exactly (case-sensitive)

#### 2. "Contract address not found"

**Symptom**: Transactions fail or features don't work

**Solution**:
- Verify all contract addresses are set in `.env.local`
- Check addresses are correct for the selected network
- Verify addresses on Voyager explorer
- Ensure addresses start with `0x`

#### 3. "Network mismatch"

**Symptom**: Wallet shows different network than app

**Solution**:
- Use network selector to switch networks
- Ensure wallet is connected to correct network
- Check `NEXT_PUBLIC_DEFAULT_NETWORK` setting

#### 4. "Rate limit exceeded"

**Symptom**: Requests fail with 429 error

**Solution**:
- Switch to authenticated RPC endpoint (Infura/Alchemy)
- Implement request caching
- Add retry logic with exponential backoff

#### 5. "Transaction failed"

**Symptom**: Transactions fail without clear error

**Solution**:
- Check wallet has sufficient ETH for gas
- Verify contract addresses are correct
- Check network is not congested
- Try with smaller amounts first

### Debugging Tips

1. **Check environment variables are loaded**:
   ```typescript
   console.log('Sepolia RPC:', process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);
   console.log('Mainnet RPC:', process.env.NEXT_PUBLIC_MAINNET_RPC_URL);
   ```

2. **Verify network configuration**:
   - Open browser console
   - Check network selector shows correct options
   - Verify RPC endpoints are accessible

3. **Test contract addresses**:
   - Visit Voyager explorer
   - Search for each contract address
   - Verify contracts exist and are verified

4. **Check RPC connectivity**:
   ```bash
   curl -X POST https://starknet-sepolia.public.blastapi.io/rpc/v0_7 \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"starknet_chainId","params":[],"id":1}'
   ```

### Getting Help

- **Vesu Protocol**: [Discord](https://discord.gg/vesu) | [Docs](https://docs.vesu.xyz)
- **Tongo Protocol**: [Docs](https://docs.tongo.cash)
- **Starknet**: [Discord](https://discord.gg/starknet) | [Docs](https://docs.starknet.io)
- **AutoSwap**: [GitHub](https://github.com/BlockheaderWeb3-Community/autoswap-sdk)

---

## Security Best Practices

1. **Never commit `.env.local`** to version control
2. **Use authenticated RPC endpoints** for production
3. **Rotate API keys** regularly
4. **Verify all contract addresses** before deployment
5. **Test with small amounts** on Mainnet first
6. **Monitor RPC usage** to avoid rate limits
7. **Use environment-specific configurations** (dev/staging/prod)

---

## Additional Resources

- [Starknet Documentation](https://docs.starknet.io)
- [Vesu Protocol Docs](https://docs.vesu.xyz)
- [Tongo SDK Quick Start](https://docs.tongo.cash/sdk/quick-start.html)
- [AutoSwap SDK](https://github.com/BlockheaderWeb3-Community/autoswap-sdk)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## Changelog

- **2024-02-16**: Initial documentation created
- Added dual network support (Sepolia + Mainnet)
- Documented all required environment variables
- Added deployment configuration for Vercel
- Included troubleshooting guide

