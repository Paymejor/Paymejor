# MavaPay Integration Setup

This document describes the MavaPay API client setup for BTC ↔ NGN on/off-ramp functionality.

## Overview

The MavaPay integration provides:
- Quote management for BTC ↔ NGN conversions
- Payout operations to Nigerian bank accounts
- Bank account verification
- Webhook signature verification
- Automatic retry logic with exponential backoff

## Files Created

### 1. Type Definitions (`types/mavapay.ts`)
- `MavaPayConfig`: Client configuration
- `QuoteParams` / `QuoteResponse`: Quote management types
- `PayoutParams` / `PayoutResponse`: Payout operation types
- `BankListResponse` / `BankVerificationParams`: Bank operation types
- `WebhookEvent`: Webhook event types
- `MavaPayError`: Custom error class

### 2. API Client (`lib/mavapay-client.ts`)
Main client class with methods:
- `createQuote()`: Request exchange rate quotes
- `getQuote()`: Retrieve existing quote
- `createPayout()`: Initiate bank payout
- `getTransaction()`: Get transaction details
- `getBanks()`: List supported Nigerian banks
- `verifyBankAccount()`: Verify bank account details
- `verifyWebhookSignature()`: Verify webhook authenticity

Features:
- Automatic retry with exponential backoff (up to 3 attempts)
- Request timeout handling (30 seconds)
- Proper error handling with retryable error detection
- Server-side only webhook verification

### 3. Currency Converter (`lib/currency-converter.ts`)
Utility functions for currency conversions:

**NGN Conversions:**
- `ngnToKobo()`: Convert NGN to kobo (smallest unit)
- `koboToNgn()`: Convert kobo to NGN
- `formatNGN()`: Format kobo as "₦1,234.56"
- `parseNGNToKobo()`: Parse NGN string to kobo

**BTC Conversions:**
- `btcToSatoshis()`: Convert BTC to satoshis
- `satoshisToBtc()`: Convert satoshis to BTC
- `formatBTC()`: Format satoshis as "0.12345678 BTC"
- `formatSatoshis()`: Format satoshis as "123,456 sats"
- `parseBTCToSatoshis()`: Parse BTC string to satoshis

**Validation:**
- `isValidKoboAmount()`: Validate kobo amount
- `isValidSatoshisAmount()`: Validate satoshis amount
- `meetsMinimumNGN()`: Check minimum 2000 NGN requirement
- `getMinimumNGNKobo()`: Get minimum amount (200,000 kobo)

## Environment Variables

Add these to your `.env.local` file:

```bash
# MavaPay API URLs
NEXT_PUBLIC_MAVAPAY_API_URL=https://api.mavapay.co
NEXT_PUBLIC_MAVAPAY_SANDBOX_URL=https://staging.api.mavapay.co

# MavaPay API Keys (Get from MavaPay dashboard)
MAVAPAY_API_KEY=your_production_api_key
MAVAPAY_SANDBOX_API_KEY=your_sandbox_api_key

# MavaPay Webhook Secrets
MAVAPAY_WEBHOOK_SECRET=your_production_webhook_secret
MAVAPAY_SANDBOX_WEBHOOK_SECRET=your_sandbox_webhook_secret

# Feature Flag
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true

# Minimum NGN Amount (in kobo) - Default: 200000 (2000 NGN)
NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT=200000
```

## Usage Examples

### Creating a Client

```typescript
import { createMavaPayClient } from '@/lib/mavapay-client';

// Production client
const client = createMavaPayClient(false);

// Sandbox client (for testing)
const sandboxClient = createMavaPayClient(true);
```

### Requesting a Quote

```typescript
const quote = await client.createQuote({
  sourceCurrency: 'BTCSAT',
  targetCurrency: 'NGNKOBO',
  amount: 500000, // 500,000 satoshis
  paymentMethod: 'LIGHTNING',
  autopayout: true,
  beneficiary: {
    accountName: 'John Doe',
    accountNumber: '1234567890',
    bankName: 'ACCESS BANK',
  },
});

console.log(`Exchange rate: ${quote.exchangeRate}`);
console.log(`You will receive: ${formatNGN(quote.amountInTargetCurrency)}`);
```

### Currency Conversions

```typescript
import {
  ngnToKobo,
  formatNGN,
  btcToSatoshis,
  formatBTC,
} from '@/lib/currency-converter';

// Convert 2000 NGN to kobo
const kobo = ngnToKobo(2000); // 200000

// Format for display
const formatted = formatNGN(200000); // "₦2,000.00"

// Convert 0.005 BTC to satoshis
const sats = btcToSatoshis(0.005); // 500000

// Format for display
const btcFormatted = formatBTC(500000); // "0.00500000 BTC"
```

### Verifying Bank Accounts

```typescript
const verification = await client.verifyBankAccount({
  accountNumber: '1234567890',
  bankCode: '044', // Access Bank code
});

if (verification.isValid) {
  console.log(`Account name: ${verification.accountName}`);
} else {
  console.error(`Verification failed: ${verification.errorMessage}`);
}
```

### Webhook Verification (Server-side only)

```typescript
// In API route: /api/ramp/webhook
import { createMavaPayClient } from '@/lib/mavapay-client';

export async function POST(request: Request) {
  const client = createMavaPayClient();
  const signature = request.headers.get('x-mavapay-signature');
  const payload = await request.text();

  const isValid = await client.verifyWebhookSignature(payload, signature);

  if (!isValid) {
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook...
}
```

## Error Handling

The client automatically retries failed requests with exponential backoff:

```typescript
try {
  const quote = await client.createQuote(params);
} catch (error) {
  if (error instanceof MavaPayError) {
    console.error(`API Error: ${error.message}`);
    console.error(`Status Code: ${error.statusCode}`);
    console.error(`Endpoint: ${error.endpoint}`);
    console.error(`Retryable: ${error.retryable}`);
  }
}
```

## Retry Logic

- **Maximum attempts**: 3
- **Base delay**: 1 second
- **Backoff strategy**: Exponential (1s, 2s, 4s)
- **Timeout**: 30 seconds per request
- **Retryable errors**: 5xx status codes, 429 (rate limit), network errors

## Security Considerations

1. **API Keys**: Never expose API keys in client-side code
   - Use server-side API routes for all MavaPay operations
   - Store keys in environment variables only

2. **Webhook Verification**: Always verify webhook signatures
   - Use `verifyWebhookSignature()` on server-side only
   - Reject webhooks with invalid signatures

3. **Bank Account Data**: Encrypt sensitive data at rest
   - Use AES-256 encryption for stored bank accounts
   - Never log bank account numbers in plain text

## Next Steps

1. Set up API routes for MavaPay operations (Task 5-9)
2. Create custom hooks for frontend integration (Task 11-12)
3. Build UI components for ramp functionality (Task 14-17)
4. Implement webhook processing (Task 9)
5. Add comprehensive testing (Tasks 1.1, 2.1, 4.1, etc.)

## Requirements Satisfied

- ✅ 3.1: API authentication with secure keys
- ✅ 3.2: Sandbox and production environment support
- ✅ 3.3: Quote request with required parameters
- ✅ 3.6: Retry logic with exponential backoff
- ✅ 3.7: Error logging and user notifications
- ✅ 6.1: Currency conversion utilities
- ✅ 6.2: Display formatting functions

## References

- [MavaPay API Documentation](https://github.com/stealthmoney/mavapay-docs)
- [MavaPay ZAR API Examples](https://gist.github.com/Extheoisah/f4bd8cb86e8fb6e153fd261fa80e90f9)
- Design Document: `.kiro/specs/mavapay-btc-ngn-ramp/design.md`
- Requirements Document: `.kiro/specs/mavapay-btc-ngn-ramp/requirements.md`
