# Swap Integration Guide

Complete guide for token swap functionality using AVNU DEX aggregator on Starknet.

## Overview

The swap integration uses AVNU SDK v4 to provide:
- Real-time quotes from all DEXs, CLOBs, and market makers
- Optimal routing with competing solver algorithms
- Gasless transactions via AVNU Paymaster (optional)
- Slippage protection
- Security validations

## Architecture

**Direct User Swap**
- User executes swap directly through their wallet
- Tokens sent directly to user's wallet
- No custody risk, no intermediary account

## Hook: useSwapRouter

Location: `frontend/hooks/useSwapRouter.ts`

### Features

1. **getQuote()** - Fetch real-time swap quotes
2. **executeSwap()** - Execute swap with optional gasless feature
3. **Security validations** - Address, amount, slippage, rate limiting
4. **Error handling** - Comprehensive error messages

### Usage Example

```typescript
import { useSwapRouter } from '@/hooks/useSwapRouter'

function SwapComponent() {
  const { getQuote, executeSwap, isLoading, error } = useSwapRouter()
  
  // Get quote
  const quote = await getQuote({
    fromToken: '0x...', // USDC address
    toToken: '0x...',   // wBTC address
    amount: '1000000',  // 1 USDC (6 decimals)
  })
  
  // Execute swap
  const result = await executeSwap({
    fromToken: '0x...',
    toToken: '0x...',
    amount: '1000000',
    slippage: 0.5,      // 0.5%
    gasless: true,      // Use Paymaster (requires setup)
  })
  
  console.log('Transaction hash:', result.transactionHash)
}
```

## AVNU SDK Integration

### Installation

```bash
pnpm install @avnu/avnu-sdk@latest
```

Current version: `4.0.1`

### Key Functions

#### getQuotes()

Fetches optimized swap quotes from all liquidity sources.

```typescript
import { getQuotes } from '@avnu/avnu-sdk'

const quotes = await getQuotes({
  sellTokenAddress: '0x...',
  buyTokenAddress: '0x...',
  sellAmount: BigInt('1000000'),
  takerAddress: account.address,
})

// Returns array sorted by best price
const bestQuote = quotes[0]
```

#### executeSwap()

Executes the swap transaction.

```typescript
import { executeSwap } from '@avnu/avnu-sdk'

const result = await executeSwap({
  provider: account,           // Starknet account
  quote: bestQuote,            // Quote from getQuotes()
  slippage: 0.005,             // 0.5% as decimal
})

console.log(result.transactionHash)
```

## Gasless Transactions (Paymaster)

AVNU Paymaster allows users to swap without paying gas fees.

### Setup Required

1. **Sign up**: Go to [portal.avnu.fi](https://portal.avnu.fi)
2. **Create API key**: Generate API key for your environment
3. **Add credits**: Fund your API key with STRK (mainnet only)
4. **Server-side proxy**: Implement API key proxy (security)

### Network Endpoints

| Network | Endpoint | Credits |
|---------|----------|---------|
| Sepolia | `sepolia.paymaster.avnu.fi` | Unlimited (free) |
| Mainnet | `starknet.paymaster.avnu.fi` | Real (costs STRK) |

### Implementation (Future)

```typescript
// Server-side API route (Next.js)
// /app/api/paymaster/route.ts
export async function POST(request: Request) {
  const { calls } = await request.json()
  
  // Call AVNU Paymaster with your API key
  const response = await fetch('https://starknet.paymaster.avnu.fi/v1/execute', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.AVNU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ calls }),
  })
  
  return response
}
```

### Current Status

⚠️ Paymaster integration requires server-side API key setup. Currently disabled in the hook.

To enable:
1. Set up server-side proxy
2. Update `executeSwap` to use Paymaster
3. Set `gasless: true` in swap params

## Quote Response Structure

```typescript
interface SwapQuote {
  fromToken: string           // Sell token address
  toToken: string             // Buy token address
  fromAmount: string          // Sell amount
  toAmount: string            // Expected buy amount
  priceImpact: number         // Price impact percentage
  route: SwapRoute[]          // DEX routing information
  estimatedGas: string        // Gas cost in USD
  expiresAt: number           // Quote expiry timestamp
  provider: 'avnu'            // Provider identifier
  avnuQuote?: Quote           // Original AVNU quote object
}

interface SwapRoute {
  dex: string                 // DEX name (e.g., "Ekubo", "JediSwap")
  percentage: number          // Percentage of swap through this DEX
  poolAddress: string         // Pool contract address
}
```

## Security Validations

All swaps are validated for:

1. **Address validation** - Valid Starknet addresses
2. **Amount validation** - Within min/max limits
3. **Slippage validation** - Between 0.1% and 50%
4. **Rate limiting** - Max 10 transactions per minute per address

## Error Handling

```typescript
try {
  const result = await executeSwap(params)
} catch (error) {
  if (error.message.includes('No quotes available')) {
    // Handle insufficient liquidity
  } else if (error.message.includes('Slippage')) {
    // Handle slippage validation error
  } else if (error.message.includes('rate limit')) {
    // Handle rate limit error
  }
}
```

## Token Addresses

### Sepolia Testnet

```typescript
const TOKENS = {
  USDC: '0x053b40a647cedfca6ca84f542a0fe36736031905a9639a7f19a3c1e66bfd5080',
  wBTC: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
}
```

### Mainnet

```typescript
const TOKENS = {
  USDC: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
  wBTC: '0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac',
}
```

## Best Practices

1. **Always get fresh quotes** - Quotes expire after 1 minute
2. **Set reasonable slippage** - 0.5% for stable pairs, 1-2% for volatile pairs
3. **Handle errors gracefully** - Show user-friendly error messages
4. **Monitor gas costs** - Display estimated gas to users
5. **Test on Sepolia first** - Use testnet before mainnet deployment

## Resources

- [AVNU Documentation](https://docs.avnu.fi)
- [AVNU SDK GitHub](https://github.com/avnu-labs/avnu-sdk)
- [Paymaster Setup Guide](https://docs.avnu.fi/docs/paymaster/gasfree)
- [AVNU Portal](https://portal.avnu.fi)

## Requirements Mapping

- **AC-5.2**: Token swap functionality with real-time quotes
- **AC-5.4**: Slippage protection and security validations
- **TR-4.5**: Direct user swap architecture (no custody)
