# Network Switching Implementation

## Overview

This document describes the network switching functionality implemented for PayMejor, allowing users to seamlessly switch between Starknet Sepolia (testnet) and Mainnet.

## Requirements

- **TR-4.1**: Support both Starknet Sepolia testnet AND Mainnet with network selector
- **TR-4.9**: Configure different RPC endpoints per network (Sepolia vs Mainnet)
- **TR-4.27**: Network selector updates all protocol addresses dynamically
- **TR-4.34**: Verify network matches user selection before transactions
- **AC-1.4**: System displays network indicator showing current network

## Architecture

### Core Components

1. **useNetwork Hook** (`hooks/useNetwork.ts`)
   - Manages network state (sepolia/mainnet)
   - Persists selection to localStorage
   - Provides async `switchNetwork()` function
   - Dispatches custom events for network changes
   - Supports multi-tab synchronization

2. **NetworkSelector Component** (`components/network-selector.tsx`)
   - Dropdown UI for network selection
   - Shows loading state during switch
   - Displays current network with badge
   - Toast notifications for success/failure

3. **Network Configuration** (`lib/constants.ts`)
   - Centralized network configs (RPC URLs, contract addresses)
   - Helper functions: `getNetworkConfig()`, `verifyNetworkMatch()`
   - Network-specific explorer URLs

### Network Change Event System

When a network is switched, a custom event `paymejor_network_changed` is dispatched:

```typescript
window.dispatchEvent(new CustomEvent('paymejor_network_changed', {
  detail: { 
    previousNetwork: 'sepolia',
    newNetwork: 'mainnet',
    config: NetworkConfig
  }
}))
```

Components listen for this event to refresh their data:

```typescript
useEffect(() => {
  const handleNetworkChange = () => {
    // Refresh data for new network
    fetchData()
  }
  
  window.addEventListener('paymejor_network_changed', handleNetworkChange)
  return () => window.removeEventListener('paymejor_network_changed', handleNetworkChange)
}, [dependencies])
```

## Updated Components

### Tabs with Network Change Listeners

All tabs now refresh their data when the network changes:

1. **Dashboard Tab** (`components/tabs/dashboard-tab.tsx`)
   - Refreshes wBTC and USDC balances
   - Updates bridge widget for new network

2. **Deposit Tab** (`components/tabs/deposit-tab.tsx`)
   - Refreshes wBTC balance
   - Updates contract addresses for transactions

3. **Borrow Tab** (`components/tabs/borrow-tab.tsx`)
   - Refreshes Vesu position data
   - Updates borrowing capacity
   - Recalculates projected positions

4. **Positions Tab** (`components/tabs/positions-tab.tsx`)
   - Refreshes user positions from Vesu
   - Updates health factor and LTV
   - Shows network-specific explorer links

5. **Exit Tab** (`components/tabs/exit-tab.tsx`)
   - Refreshes USDC balance
   - Updates exchange rate display

### Hooks with Network Awareness

All protocol hooks use the network from `useNetwork()`:

1. **useStarknet** - Uses network-specific RPC provider
2. **useVesu** - Uses network-specific Vesu pool address
3. **useTongo** - Uses network-specific Tongo protocol address
4. **useAtomiq** - Supports both Sepolia and Mainnet bridges
5. **useAutoswap** - Uses network-specific DEX aggregator

## Network Configuration

### Environment Variables

Each network requires its own set of environment variables:

```bash
# Sepolia Testnet
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
NEXT_PUBLIC_SEPOLIA_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_WBTC_ADDRESS=0x...
NEXT_PUBLIC_SEPOLIA_USDC_ADDRESS=0x...

# Mainnet
NEXT_PUBLIC_MAINNET_RPC_URL=https://starknet-mainnet.public.blastapi.io/rpc/v0_7
NEXT_PUBLIC_MAINNET_VESU_POOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_TONGO_PROTOCOL_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_WBTC_ADDRESS=0x...
NEXT_PUBLIC_MAINNET_USDC_ADDRESS=0x...

# Default Network
NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
```

### Contract Addresses

Contract addresses are automatically updated when switching networks:

```typescript
const config = getNetworkConfig(network)
// config.contracts.vesuPool - Network-specific Vesu pool
// config.contracts.tongoProtocol - Network-specific Tongo protocol
// config.contracts.wBTC - Network-specific wBTC token
// config.contracts.USDC - Network-specific USDC token
```

## User Flow

1. User clicks network selector in navbar
2. Dropdown shows Sepolia and Mainnet options
3. User selects new network
4. `switchNetwork()` is called (async)
5. Loading state shown in selector
6. Network state updated in localStorage
7. Custom event dispatched
8. All components refresh their data
9. Toast notification confirms switch
10. Explorer links update to new network

## Network Verification

Before executing transactions, verify the wallet is on the correct network:

```typescript
import { verifyNetworkMatch, getNetworkMismatchError } from '@/lib/constants'

// Get wallet's chain ID
const walletChainId = await account.getChainId()

// Verify it matches selected network
const isCorrectNetwork = await verifyNetworkMatch(walletChainId, network)

if (!isCorrectNetwork) {
  throw new Error(getNetworkMismatchError(network))
}
```

## Multi-Tab Support

Network selection is synchronized across browser tabs:

1. User switches network in Tab A
2. Change saved to localStorage
3. Storage event fires in Tab B
4. Tab B updates to new network
5. Tab B refreshes its data

## Testing

### Manual Testing Checklist

- [ ] Switch from Sepolia to Mainnet
- [ ] Verify all balances refresh
- [ ] Verify positions refresh
- [ ] Verify explorer links update
- [ ] Switch back to Sepolia
- [ ] Verify data refreshes again
- [ ] Open second tab, switch network
- [ ] Verify first tab updates
- [ ] Execute transaction on Sepolia
- [ ] Verify transaction uses Sepolia contracts
- [ ] Switch to Mainnet mid-session
- [ ] Verify no stale data from Sepolia

### Edge Cases

1. **Network switch during transaction**: Transaction should complete on original network
2. **Wallet on wrong network**: Show error before transaction
3. **Missing contract addresses**: Show configuration error
4. **RPC endpoint failure**: Show connection error
5. **Rapid network switching**: Debounce to prevent race conditions

## Performance Considerations

1. **Debouncing**: Network switches are debounced to prevent rapid toggling
2. **Caching**: Previous network data is cleared on switch
3. **Lazy Loading**: Data is only fetched when needed
4. **Event Cleanup**: All event listeners are properly cleaned up

## Future Enhancements

1. **Network Auto-Detection**: Detect wallet's network and auto-switch
2. **Network Warnings**: Warn before switching with active positions
3. **Transaction Queue**: Queue transactions during network switch
4. **Network Status**: Show RPC endpoint health status
5. **Custom Networks**: Allow users to add custom RPC endpoints

## Troubleshooting

### Network not switching
- Check localStorage permissions
- Verify environment variables are set
- Check browser console for errors

### Data not refreshing
- Verify event listeners are attached
- Check network change event is firing
- Verify RPC endpoint is accessible

### Wrong contract addresses
- Verify environment variables for both networks
- Check `getNetworkConfig()` returns correct addresses
- Verify network state matches selected network

## Related Files

- `frontend/hooks/useNetwork.ts` - Network state management
- `frontend/components/network-selector.tsx` - Network selector UI
- `frontend/lib/constants.ts` - Network configuration
- `frontend/components/navbar.tsx` - Navbar with network selector
- `frontend/components/tabs/*.tsx` - All tabs with network listeners
- `frontend/.env.local` - Environment variables
- `frontend/.env.example` - Environment variable template
