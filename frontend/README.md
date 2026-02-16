# PayMejor - Private NGN Liquidity Vault

PayMejor is a production-ready private liquidity vault that enables Lagos BTC holders to unlock NGN liquidity without exposing their Bitcoin holdings on-chain. The system integrates with live protocols on Starknet: Atomiq for trustless BTC bridging, Tongo for privacy-preserving transactions, and a custom vault for decentralized lending.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Xverse wallet (for BTC + Starknet support)
- Access to Starknet Sepolia testnet

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment template
cp .env.local.example .env.local

# Configure environment variables (see below)
# Edit .env.local with your configuration

# Run development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🔧 Environment Configuration

### Required Environment Variables

These variables **must** be configured for the application to work:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_STARKNET_RPC_URL` | Starknet RPC endpoint URL | `https://starknet-sepolia.public.blastapi.io/rpc/v0_7` |
| `NEXT_PUBLIC_NETWORK` | Network name (sepolia or mainnet) | `sepolia` |
| `NEXT_PUBLIC_CHAIN_ID` | Starknet chain ID | `SN_SEPOLIA` |

### Optional Environment Variables (Contract Addresses)

These variables are optional during initial setup but **required** for full functionality after contracts are deployed:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_VAULT_ADDRESS` | PayMejor Vault contract address | `0x...` |
| `NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS` | Tongo Protocol contract address | `0x...` |
| `NEXT_PUBLIC_VESU_POOL_ADDRESS` | Vesu lending pool address | `0x...` |
| `NEXT_PUBLIC_WBTC_ADDRESS` | Wrapped Bitcoin token address | `0x...` |
| `NEXT_PUBLIC_USDC_ADDRESS` | USD Coin token address | `0x...` |

### Environment Variable Validation

The application automatically validates environment variables on startup:

- **Development Mode**: Validation errors and warnings are logged to the browser console
- **Production Mode**: Missing required variables will prevent the app from starting
- **Contract Addresses**: Missing contract addresses show warnings but don't block startup (useful during initial development)

### Example .env.local

```bash
# Starknet Network Configuration
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Network Configuration
NEXT_PUBLIC_NETWORK=sepolia
NEXT_PUBLIC_CHAIN_ID=SN_SEPOLIA

# Contract Addresses (Sepolia Testnet)
# Update these after contract deployment
NEXT_PUBLIC_VAULT_ADDRESS=0x1234...
NEXT_PUBLIC_TONGO_PROTOCOL_ADDRESS=0x5678...
NEXT_PUBLIC_VESU_POOL_ADDRESS=0x9abc...
NEXT_PUBLIC_WBTC_ADDRESS=0xdef0...
NEXT_PUBLIC_USDC_ADDRESS=0x1111...
```

## 🏗️ Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain**: Starknet.js v6+
- **Wallet**: Xverse SDK
- **Privacy**: Tongo SDK
- **Bridge**: Atomiq SDK

### Key Features

1. **Xverse Wallet Integration**: Connect with BTC + Starknet support
2. **Atomiq Bridge**: Trustless BTC → wBTC bridging
3. **Tongo Privacy Layer**: Encrypted on-chain balances
4. **Custom Vault**: Lending with mock oracle (MVP)
5. **Leverage Loop**: Automated position leveraging
6. **Position Management**: View and manage encrypted positions

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with env validation
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── tabs/             # Tab components (Dashboard, Deposit, Borrow, etc.)
│   ├── ui/               # shadcn/ui components
│   ├── env-validator.tsx # Environment validation component
│   ├── navbar.tsx        # Navigation bar
│   └── sidebar.tsx       # Sidebar navigation
├── hooks/                # Custom React hooks
│   ├── use-mobile.tsx   # Mobile detection
│   └── use-toast.ts     # Toast notifications
├── lib/                  # Utility libraries
│   ├── constants.ts     # Network config & contract addresses
│   ├── env-validation.ts # Environment validation logic
│   ├── utils.ts         # Utility functions
│   └── wallet-context.tsx # Wallet state management
└── styles/              # Additional styles
```

## 🔐 Security Considerations

- **Private Keys**: Never expose private keys in code or logs
- **RPC Endpoints**: Use authenticated/rate-limited endpoints in production
- **Input Validation**: All user inputs are validated before blockchain submission
- **Error Messages**: Error messages don't leak sensitive information
- **Environment Variables**: Use `.env.local` (gitignored) for sensitive config

## 🧪 Development

### Running the Development Server

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Type Checking

```bash
pnpm type-check
```

### Linting

```bash
pnpm lint
```

## 🚢 Deployment

### Quick Deployment Guide

For detailed deployment instructions, see:
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Environment configuration guide

### Pre-Deployment Checklist

Run the pre-deployment verification script:

```bash
./scripts/pre-deployment-check.sh
```

This will verify:
- Dependencies are installed
- TypeScript compiles without errors
- Production build succeeds
- Environment variables are configured
- No critical issues exist

### Vercel Deployment

1. **Prepare Environment Variables**:
   - Copy `vercel-env-template.txt` and fill in actual values
   - See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for details

2. **Deploy via Vercel Dashboard**:
   - Push code to GitHub
   - Import project in Vercel
   - Configure environment variables
   - Deploy

3. **Deploy via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login
   vercel login
   
   # Deploy to production
   vercel --prod
   ```

4. **Post-Deployment Verification**:
   ```bash
   ./scripts/deployment-checklist.sh https://your-deployment-url.vercel.app
   ```

### Environment Variables in Production

Ensure all required environment variables are set in Vercel:

**Required**:
- `NEXT_PUBLIC_DEFAULT_NETWORK` (sepolia or mainnet)
- `NEXT_PUBLIC_SEPOLIA_RPC_URL`
- `NEXT_PUBLIC_MAINNET_RPC_URL`

**Optional (Required for full functionality)**:
- Sepolia contract addresses (Vesu, Tongo, wBTC, USDC)
- Mainnet contract addresses (Vesu, Tongo, wBTC, USDC)
- `AUTOSWAPPR_CONTRACT_ADDRESS`

See [vercel-env-template.txt](./vercel-env-template.txt) for complete list.

## 📚 Integration Documentation

### Xverse Wallet

- **SDK**: Check xverse.app/dev for Starknet integration
- **Network**: Starknet Sepolia testnet
- **Features**: BTC bridging + Starknet connect

### Atomiq Bridge

- **SDK**: `@atomiqlabs/sdk`
- **Purpose**: BTC → wBTC bridging
- **Integration**: In-app bridge widget

### Tongo Protocol

- **SDK**: `@fatsolutions/tongo-sdk`
- **Docs**: https://docs.tongo.cash/sdk/quick-start.html
- **Purpose**: Privacy layer for shielded balances

### Custom Vault

- **Purpose**: Lending and borrowing (MVP)
- **Features**: Mock USDC pool, mock oracle
- **Network**: Sepolia testnet

## 🔗 Useful Links

- **Voyager Explorer (Sepolia)**: https://sepolia.voyager.online
- **Starknet Docs**: https://docs.starknet.io
- **Tongo Docs**: https://docs.tongo.cash
- **Xverse Wallet**: https://xverse.app

## 🐛 Troubleshooting

### Environment Validation Errors

If you see environment validation errors in the console:

1. Check that all required variables are set in `.env.local`
2. Verify RPC URL is accessible and properly formatted
3. Ensure network value is either `sepolia` or `mainnet`
4. Restart the development server after changing `.env.local`

### Contract Address Warnings

If you see warnings about missing contract addresses:

- These are expected during initial development
- Update addresses in `.env.local` after contracts are deployed
- Restart the development server after updating

### Wallet Connection Issues

- Ensure Xverse wallet is installed and configured for Starknet
- Check that you're on the correct network (Sepolia)
- Try disconnecting and reconnecting the wallet

## 📝 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📧 Support

For issues or questions:
- Open an issue on GitHub
- Contact the development team
- Check the troubleshooting section above
