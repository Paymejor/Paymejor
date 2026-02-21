# Gasless Swap Implementation Guide

Complete implementation of AVNU Paymaster for gasless token swaps on Starknet.

## Overview

The gasless swap feature allows users to execute token swaps without paying gas fees. The application sponsors the gas costs using AVNU Paymaster, providing a seamless user experience.

## Architecture

```
User Wallet → useSwapRouter Hook → AVNU SDK → Paymaster RPC → Starknet
                                                    ↓
                                            Your Credits (STRK)
```

## Implementation

### 1. Hook: useSwapRouter

Location: `frontend/hooks/useSwapRouter.ts`

Key features:
- Initializes PaymasterRpc with API key
- Automatically detects if Paymaster is available
- Falls back to regular transactions if Paymaster unavailable
- Supports both Sepolia (free) and Mainnet (paid)

```typescript
import { PaymasterRpc } from 'starknet'
import { executeSwap as avnuExecuteSwap } from '@avnu/avnu-sdk'

// Initialize Paymaster
const paymaster = new PaymasterRpc({
  nodeUrl: 'https://sepolia.paymaster.avnu.fi',
  headers: {
    'x-paymaster-api-key': process.env.NEXT_PUBLIC_PAYMASTER_API,
  },
})

// Execute gasless swap
const result = await avnuExecuteSwap({
  provider: account,
  quote: quote,
  slippage: 0.005,
  paymaster: {
    active: true,
    provider: paymaster,
    params: {
      version: '0x1',
      feeMode: { mode: 'sponsored' },
    },
  },
})
```

### 2. Environment Configuration

Required environment variables:

```bash
# AVNU Paymaster API Key (get from portal.avnu.fi)
NEXT_PUBLIC_PAYMASTER_API=your_api_key_here

# Paymaster URLs (pre-configured)
NEXT_PUBLIC_PAYMASTER_URL=https://sepolia.paymaster.avnu.fi
NEXT_PUBLIC_PAYMASTER_URL_MAINNET=https://starknet.paymaster.avnu.fi

# AVNU API URLs (pre-configured)
NEXT_PUBLIC_PAYMASTER_API_URL=https://sepolia.api.avnu.fi
NEXT_PUBLIC_PAYMASTER_API_MAINNET_URL=https://starknet.api.avnu.fi
```

### 3. Usage in Components

Example from `borrow-tab.tsx`:

```typescript
import { useSwapRouter } from '@/hooks/useSwapRouter'

function BorrowTab() {
  const { executeSwap } = useSwapRouter()
  
  // Execute gasless swap
  const result = await executeSwap({
    fromToken: config.contracts.USDC,
    toToken: config.contracts.wBTC,
    amount: '1000000', // 1 USDC
    slippage: 0.5,
    gasless: true, // Enable gasless transaction
  })
  
  // Check if transaction was gasless
  if (result.gasless) {
    toast.success('Swap completed (gas-free)!')
  }
}
```

## Setup Guide

### Step 1: Sign Up for AVNU Paymaster

1. Go to [portal.avnu.fi](https://portal.avnu.fi)
2. Connect your wallet (must be deployed on Starknet)
3. This becomes your login - no email/password needed

### Step 2: Create API Key

1. From the dashboard, click "Create API Key"
2. Name it (e.g., "production", "staging", "development")
3. Copy the API key

### Step 3: Add Credits (Mainnet Only)

For mainnet, you need to fund your API key with STRK:

1. Click "Add Credits" on your API key
2. Enter amount in STRK
3. Approve and confirm the transaction
4. Credits appear in ~30 seconds

**Sepolia testnet has unlimited free credits for testing.**

### Step 4: Configure Environment

Add your API key to `.env.local`:

```bash
NEXT_PUBLIC_PAYMASTER_API=your_api_key_here
```

### Step 5: Test

1. Start development server: `pnpm dev`
2. Connect wallet
3. Try a swap with `gasless: true`
4. Check console for "Using AVNU Paymaster for gasless transaction"
5. Verify transaction on Voyager (gas paid by your credits)

## Network Configuration

### Sepolia Testnet

- **Endpoint**: `https://sepolia.paymaster.avnu.fi`
- **Credits**: Unlimited (free testing)
- **Use case**: Development and testing

### Mainnet

- **Endpoint**: `https://starknet.paymaster.avnu.fi`
- **Credits**: Real STRK (costs money)
- **Use case**: Production

## Monitoring & Analytics

The AVNU Portal provides full visibility:

### Overview Dashboard
- Total credits remaining
- Burn rate (STRK per day)
- Runway projection ("credits running out in X months")
- Unique users reached

### API Key Details
- Gas consumed (STRK + USD equivalent)
- Success rate
- Efficiency metrics (avg cost per transaction, per user)
- Funding history

### Analytics
- Transaction volume charts
- Gas cost trends
- Filter by time range (7d / 30d / 90d / 1Y)
- Filter by API key

### Explorer
- Search transactions by hash or user address
- Filter by status (success/reverted)
- Export to CSV or JSON for reporting

## Cost Estimation

Typical swap transaction costs:
- **Gas cost**: ~0.001-0.005 STRK (~$0.001-0.005 USD)
- **Frequency**: Depends on your user volume
- **Example**: 1000 swaps/month = ~5 STRK/month (~$5 USD)

Monitor your burn rate in the portal to avoid running out of credits.

## Error Handling

The hook automatically handles Paymaster failures:

```typescript
// If Paymaster unavailable or fails
if (gasless && config.avnu.paymasterEnabled) {
  const paymaster = getPaymaster()
  if (paymaster) {
    // Use Paymaster
  } else {
    console.warn('Paymaster API key not configured, executing with gas')
    // Falls back to regular transaction
  }
}
```

Users will see:
- "Swap completed (gas-free)" if Paymaster succeeded
- "Swap completed" if regular transaction

## Security Considerations

### API Key Protection

⚠️ **IMPORTANT**: The API key is exposed in the client-side code via `NEXT_PUBLIC_*` environment variables.

**Recommendations**:
1. Use separate API keys for development and production
2. Monitor usage in the portal
3. Set up alerts for unusual activity
4. Rotate keys periodically
5. Consider implementing server-side proxy for production (see below)

### Server-Side Proxy (Recommended for Production)

For better security, proxy Paymaster requests through your backend:

```typescript
// app/api/paymaster/route.ts
export async function POST(request: Request) {
  const { calls } = await request.json()
  
  // Validate request (rate limiting, user authentication, etc.)
  
  // Call AVNU Paymaster with server-side API key
  const response = await fetch('https://starknet.paymaster.avnu.fi/v1/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AVNU_API_KEY}`, // Server-side only
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ calls }),
  })
  
  return response
}
```

Then update the hook to use your API route instead of direct Paymaster calls.

## Troubleshooting

### Paymaster Not Working

1. **Check API key**: Verify `NEXT_PUBLIC_PAYMASTER_API` is set
2. **Check credits**: Ensure you have credits (mainnet only)
3. **Check network**: Verify you're on the correct network
4. **Check console**: Look for Paymaster-related errors
5. **Check portal**: View transaction status in AVNU Portal

### Transaction Failed

1. **Insufficient credits**: Add more STRK to your API key
2. **Invalid API key**: Verify key is correct and active
3. **Network mismatch**: Ensure using correct Paymaster URL for network
4. **Rate limiting**: Check if you've exceeded rate limits

### Gasless Flag Not Working

1. **Check hook**: Verify `gasless: true` is passed to `executeSwap()`
2. **Check config**: Verify `config.avnu.paymasterEnabled` is true
3. **Check Paymaster**: Verify `getPaymaster()` returns valid instance
4. **Check result**: Verify `result.gasless` is true after execution

## Migration from useAutoswap

If you were using the old `useAutoswap` hook:

1. Replace import:
   ```typescript
   // Old
   import { useAutoswap } from '@/hooks/useAutoswap'
   
   // New
   import { useSwapRouter } from '@/hooks/useSwapRouter'
   ```

2. Update hook usage:
   ```typescript
   // Old
   const { executeSwap } = useAutoswap()
   
   // New
   const { executeSwap } = useSwapRouter()
   ```

3. Add gasless parameter:
   ```typescript
   const result = await executeSwap({
     fromToken,
     toToken,
     amount,
     slippage: 0.5,
     gasless: true, // NEW: Enable gasless
   })
   ```

4. Check result:
   ```typescript
   if (result.gasless) {
     console.log('Transaction was gasless!')
   }
   ```

## Resources

- [AVNU Portal](https://portal.avnu.fi) - Manage API keys and credits
- [AVNU Paymaster Docs](https://docs.avnu.fi/docs/paymaster/gasfree) - Official documentation
- [AVNU SDK Docs](https://docs.avnu.fi) - SDK reference
- [Starknet Docs](https://docs.starknet.io) - Starknet documentation

## Support

For issues or questions:
1. Check this documentation
2. Review AVNU documentation
3. Check AVNU Portal for transaction status
4. Contact AVNU support via their Discord

---

**Last Updated**: February 21, 2026

**Status**: ✅ Production Ready
