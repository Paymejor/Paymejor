# Environment Configuration Guide

## Overview

This document describes the environment configuration for the PayMejor application, including MavaPay integration for BTC ↔ NGN on/off-ramp functionality.

## Requirements

- Requirements: 3.1, 3.2

## Environment Variables

### Required Variables

#### Network Configuration

```bash
# Starknet Sepolia RPC URL (required)
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7

# Starknet Mainnet RPC URL (required)
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_7
```

### Optional Variables

#### Contract Addresses

```bash
# Sepolia Contract Addresses
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=

# Mainnet Contract Addresses
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=
```

#### MavaPay Configuration

```bash
# MavaPay API URLs (pre-configured with defaults)
NEXT_PUBLIC_MAVAPAY_API_URL=https://api.mavapay.co
NEXT_PUBLIC_MAVAPAY_SANDBOX_URL=https://staging.api.mavapay.co

# MavaPay API Keys (server-side only)
MAVAPAY_API_KEY=your_production_api_key
MAVAPAY_SANDBOX_API_KEY=your_sandbox_api_key

# MavaPay Webhook Secrets (server-side only)
MAVAPAY_WEBHOOK_SECRET=your_production_webhook_secret
MAVAPAY_SANDBOX_WEBHOOK_SECRET=your_sandbox_webhook_secret

# Feature Flag - Enable/Disable MavaPay Ramp
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true

# Environment Selection (optional)
# If not set, automatically uses sandbox in development/sepolia and production in mainnet
NEXT_PUBLIC_MAVAPAY_USE_SANDBOX=true

# Minimum NGN Amount in kobo (default: 200000 = 2000 NGN)
NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT=200000
```

## MavaPay Environment Selection

### Automatic Environment Detection

The application automatically determines whether to use MavaPay sandbox or production based on:

1. **Explicit Configuration**: If `NEXT_PUBLIC_MAVAPAY_USE_SANDBOX` is set, it takes precedence
2. **Development Mode**: Uses sandbox when `NODE_ENV=development`
3. **Network Selection**: Uses sandbox when default network is `sepolia`
4. **Production Mode**: Uses production when `NODE_ENV=production` and default network is `mainnet`

### Environment Selection Logic

```typescript
// Automatic detection
useMavaPaySandbox() // Returns true in development or on sepolia

// Explicit control
NEXT_PUBLIC_MAVAPAY_USE_SANDBOX=true  // Force sandbox
NEXT_PUBLIC_MAVAPAY_USE_SANDBOX=false // Force production
```

### Recommended Configurations

#### Local Development (Sepolia)

```bash
NODE_ENV=development
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true
MAVAPAY_SANDBOX_API_KEY=your_sandbox_key
MAVAPAY_SANDBOX_WEBHOOK_SECRET=your_sandbox_secret
```

#### Staging Environment (Sepolia)

```bash
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true
NEXT_PUBLIC_MAVAPAY_USE_SANDBOX=true
MAVAPAY_SANDBOX_API_KEY=your_sandbox_key
MAVAPAY_SANDBOX_WEBHOOK_SECRET=your_sandbox_secret
```

#### Production Environment (Mainnet)

```bash
NODE_ENV=production
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true
MAVAPAY_API_KEY=your_production_key
MAVAPAY_WEBHOOK_SECRET=your_production_secret
```

## Feature Flags

### MavaPay Ramp Feature

The MavaPay on/off-ramp feature can be enabled or disabled using the feature flag:

```bash
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true  # Enable ramp feature
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=false # Disable ramp feature
```

When disabled:
- The "Ramp" tab is hidden from the navigation
- All MavaPay API routes return 404
- MavaPay-related components are not rendered

When enabled:
- The "Ramp" tab appears in the bottom navigation
- Users can access on/off-ramp functionality
- MavaPay API routes are active

## Environment Validation

The application validates environment configuration on startup:

### Validation Checks

1. **RPC URLs**: Validates format and accessibility
2. **Contract Addresses**: Validates Starknet address format
3. **MavaPay URLs**: Validates URL format
4. **MavaPay API Keys**: Checks presence (server-side only)
5. **Minimum Amount**: Validates numeric format and minimum threshold

### Validation Results

- **Errors**: Critical issues that prevent the application from functioning
- **Warnings**: Non-critical issues that may limit functionality

### Viewing Validation Results

In development mode, validation results are logged to the console:

```
✅ Environment validation passed
⚠️  Environment warnings:
  - MAVAPAY_API_KEY not configured. Production on/off-ramp will not work.
```

## Security Considerations

### Server-Side Variables

The following variables are server-side only and never exposed to the client:

- `MAVAPAY_API_KEY`
- `MAVAPAY_SANDBOX_API_KEY`
- `MAVAPAY_WEBHOOK_SECRET`
- `MAVAPAY_SANDBOX_WEBHOOK_SECRET`

These variables are only accessible in:
- Next.js API routes (`/app/api/*`)
- Server-side rendering functions
- Server components

### Client-Side Variables

Variables prefixed with `NEXT_PUBLIC_` are exposed to the client:

- `NEXT_PUBLIC_MAVAPAY_API_URL`
- `NEXT_PUBLIC_MAVAPAY_SANDBOX_URL`
- `NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP`
- `NEXT_PUBLIC_MAVAPAY_USE_SANDBOX`
- `NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT`

Never include sensitive data in `NEXT_PUBLIC_` variables.

## Deployment

### Vercel Deployment

1. Add environment variables in Vercel dashboard
2. Set different values for Preview and Production environments
3. Use Preview environment for testing with sandbox
4. Use Production environment with production API keys

### Environment-Specific Configuration

```bash
# Preview/Staging
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
NEXT_PUBLIC_MAVAPAY_USE_SANDBOX=true
MAVAPAY_SANDBOX_API_KEY=...

# Production
NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
MAVAPAY_API_KEY=...
```

## Troubleshooting

### Ramp Tab Not Showing

Check:
1. `NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true` is set
2. Environment variables are properly loaded
3. Browser cache is cleared

### API Errors

Check:
1. Correct API key is configured for the environment
2. API key has sufficient permissions
3. Webhook secret matches MavaPay dashboard configuration

### Sandbox vs Production Issues

Check:
1. `NEXT_PUBLIC_MAVAPAY_USE_SANDBOX` setting
2. `NODE_ENV` value
3. `NEXT_PUBLIC_DEFAULT_NETWORK` value
4. Correct API keys are configured for the selected environment

## References

- [MavaPay API Documentation](https://docs.mavapay.co)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
