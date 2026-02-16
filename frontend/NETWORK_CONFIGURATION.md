# Network Configuration Implementation

## Overview

This document describes the dual network configuration system implemented for PayMejor, supporting both Starknet Sepolia testnet and Mainnet.

## Implementation Summary

### 1. Network Configuration System (`lib/constants.ts`)

**Features:**
- Dual network support (Sepolia + Mainnet)
- Network-specific contract addresses
- Network-specific RPC URLs
- Network-specific explorer URLs
- Helper functions for network operations

**Key Functions:**
- `getNetworkConfig(network)` - Get configuration for a specific network
- `getDefaultNetwork()` - Get default network from environment
- `getTokenAddress(token, network)` - Get token address for specific network
- `getTxUrl(txHash, network)` - Get transaction URL for specific network
- `isNetworkConfigured(network)` - Check if network is configured
- `areContractsConfigured(network)` - Check if contracts are configured for network

### 2. Network Hook (`hooks/useNetwork.ts`)

**Features:**
- Network selection state management
- Network switching functionality
- LocalStorage persistence
- Multi-tab synchronization
- Type-safe network validation

**API:**
```typescript
const { network, switchNetwork, config, isNetworkSupported } = useNetwork()
```

### 3. Network Selector Component (`components/network-selector.tsx`)

**Features:**
- Dropdown UI for network selection
- Visual indicators (badges) for testnet/mainnet
- Network descriptions
- Current network highlighting
- Responsive design

### 4. Environment Variables

**Required Variables:**
- `NEXT_PUBLIC_SEPOLIA_RPC_URL` - Sepolia RPC endpoint
- `NEXT_PUBLIC_MAINNET_RPC_URL` - Mainnet RPC endpoint

**Optional Variables (per network):**
- `NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS`
- `NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS`
- `NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS`
- `NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS`
- `NEXT_PUBLIC_MAINNET_WBTC_ADDRESS`
- `NEXT_PUBLIC_MAINNET_USDC_ADDRESS`
- `NEXT_PUBLIC_DEFAULT_NETWORK` - Default network (sepolia or mainnet)

### 5. Updated Components

**Navbar (`components/navbar.tsx`):**
- Integrated NetworkSelector component
- Removed old network indicator badge
- Network selector appears before theme toggle

**Wallet Context (`lib/wallet-context.tsx`):**
- Added `setNetwork` method for network synchronization
- Updated TokenBalances to include network reference
- Network state management

**useStarknet Hook (`hooks/useStarknet.ts`):**
- Uses network-specific RPC URLs from config
- Network-aware transaction URLs
- Dynamic provider creation based on selected network

**Environment Validation (`lib/env-validation.ts`):**
- Validates both Sepolia and Mainnet configurations
- Network-specific contract address validation
- Improved error messages per network

### 6. Documentation

**Created Files:**
- `.env.example` - Complete environment variable documentation
- `NETWORK_CONFIGURATION.md` - This file

## Usage

### Switching Networks

Users can switch networks using the network selector in the navbar:

```typescript
import { useNetwork } from '@/hooks/useNetwork'

function MyComponent() {
  const { network, switchNetwork, config } = useNetwork()
  
  // Switch to mainnet
  switchNetwork('mainnet')
  
  // Access network-specific config
  console.log(config.rpcUrl)
  console.log(config.contracts.wBTC)
}
```

### Getting Network-Specific Addresses

```typescript
import { getNetworkConfig, getTokenAddress } from '@/lib/constants'

// Get full config
const config = getNetworkConfig('sepolia')

// Get specific token address
const wbtcAddress = getTokenAddress('wBTC', 'mainnet')
```

### Network-Aware Transactions

```typescript
import { useStarknet } from '@/hooks/useStarknet'
import { useNetwork } from '@/hooks/useNetwork'

function MyComponent() {
  const { sendTransaction } = useStarknet()
  const { network, config } = useNetwork()
  
  // Transaction automatically uses correct network RPC
  await sendTransaction({
    contractAddress: config.contracts.vesuPool,
    entrypoint: 'supply',
    calldata: [...],
    type: 'deposit'
  })
}
```

## Requirements Satisfied

✅ **TR-4.1**: Support both Starknet Sepolia testnet AND Mainnet with network selector
✅ **TR-4.9**: Configure different RPC endpoints per network (Sepolia vs Mainnet)
✅ **TR-4.10**: Use environment variables for network-specific contract addresses
✅ **TR-4.26**: Use environment variables for all contract addresses and RPC URLs per network
✅ **TR-4.27**: Network selector updates all protocol addr