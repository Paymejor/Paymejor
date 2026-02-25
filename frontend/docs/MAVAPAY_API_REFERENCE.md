# MavaPay API Reference

## Overview

This document provides comprehensive documentation for all API endpoints used in the MavaPay BTC ↔ NGN on/off-ramp integration. These endpoints are implemented as Next.js API routes and interact with the MavaPay API.

## Table of Contents

- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [API Endpoints](#api-endpoints)
  - [Quote Endpoint](#quote-endpoint)
  - [Payout Endpoint](#payout-endpoint)
  - [On-Ramp Endpoint](#on-ramp-endpoint)
  - [Webhook Endpoint](#webhook-endpoint)
  - [Banks Endpoint](#banks-endpoint)
  - [Bank Verification Endpoint](#bank-verification-endpoint)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Security](#security)

---

## Authentication

### API Key Authentication

All requests to MavaPay API require authentication using an API key.

**Header Format**:
```
Authorization: Bearer {MAVAPAY_API_KEY}
```

**Environment Variables**:
- `MAVAPAY_API_KEY`: Production API key
- `MAVAPAY_SANDBOX_API_KEY`: Sandbox API key for testing

**Note**: API keys are stored securely in environment variables and never exposed to the client.

---

## Base URLs

### PayMejor API Routes

All PayMejor API routes are prefixed with `/api/ramp/`:

```
https://your-domain.com/api/ramp/{endpoint}
```

### MavaPay API

**Production**:
```
https://api.mavapay.co/v1
```

**Sandbox** (for testing):
```
https://staging.api.mavapay.co/v1
```

---

## API Endpoints

### Quote Endpoint

Fetches real-time exchange rate quotes from MavaPay.

#### Endpoint

```
POST /api/ramp/quote
```

#### Request Body

```typescript
{
  direction: 'btc-to-ngn' | 'ngn-to-btc';
  amount: string;              // Amount in smallest unit (satoshis or kobo)
  sourceCurrency: 'BTCSAT' | 'NGNKOBO';
  targetCurrency: 'NGNKOBO' | 'BTCSAT';
  bankAccount?: {              // Required for off-ramp
    accountName: string;
    accountNumber: string;
    bankName: string;
  };
}
```

#### Example Request

```bash
curl -X POST https://your-domain.com/api/ramp/quote \
  -H "Content-Type: application/json" \
  -d '{
    "direction": "btc-to-ngn",
    "amount": "500000",
    "sourceCurrency": "BTCSAT",
    "targetCurrency": "NGNKOBO",
    "bankAccount": {
      "accountName": "John Doe",
      "accountNumber": "1234567890",
      "bankName": "ACCESS BANK"
    }
  }'
```

#### Response

```typescript
{
  id: string;                                    // Quote ID
  exchangeRate: number;                          // Exchange rate
  usdToTargetCurrencyRate: number;              // USD to target currency rate
  sourceCurrency: string;                        // Source currency code
  targetCurrency: string;                        // Target currency code
  transactionFeesInSourceCurrency: number;      // Fees in source currency
  transactionFeesInTargetCurrency: number;      // Fees in target currency
  amountInSourceCurrency: number;               // Amount in source currency
  amountInTargetCurrency: number;               // Amount in target currency
  paymentMethod: 'LIGHTNING';                   // Payment method
  expiry: string;                               // ISO 8601 timestamp
  isValid: boolean;                             // Quote validity
  invoice?: string;                             // Lightning invoice (off-ramp)
  totalAmountInSourceCurrency: number;          // Total including fees
}
```

#### Example Response

```json
{
  "id": "quote_abc123",
  "exchangeRate": 45000,
  "usdToTargetCurrencyRate": 1500,
  "sourceCurrency": "BTCSAT",
  "targetCurrency": "NGNKOBO",
  "transactionFeesInSourceCurrency": 5000,
  "transactionFeesInTargetCurrency": 50000,
  "amountInSourceCurrency": 500000,
  "amountInTargetCurrency": 4500000,
  "paymentMethod": "LIGHTNING",
  "expiry": "2024-02-16T12:35:00Z",
  "isValid": true,
  "invoice": "lnbc4500000n1...",
  "totalAmountInSourceCurrency": 505000
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid request parameters",
  "details": "Amount must be a positive number"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch quote",
  "details": "MavaPay API unavailable"
}
```

---

### Payout Endpoint

Initiates an off-ramp payout to a Nigerian bank account.

#### Endpoint

```
POST /api/ramp/payout
```

#### Request Body

```typescript
{
  quoteId: string;           // Quote ID from /quote endpoint
  bankAccountId: string;     // Saved bank account ID
  walletAddress: string;     // User's wallet address
}
```

#### Example Request

```bash
curl -X POST https://your-domain.com/api/ramp/payout \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "quote_abc123",
    "bankAccountId": "bank_xyz789",
    "walletAddress": "0x1234..."
  }'
```

#### Response

```typescript
{
  transactionId: string;      // PayMejor transaction ID
  mavaPayOrderId: string;     // MavaPay order ID
  invoice: string;            // Lightning invoice to pay
  amount: number;             // Amount in satoshis
  status: 'pending_payment';  // Transaction status
  expiresAt: string;          // ISO 8601 timestamp
}
```

#### Example Response

```json
{
  "transactionId": "tx_def456",
  "mavaPayOrderId": "order_mava123",
  "invoice": "lnbc4500000n1...",
  "amount": 500000,
  "status": "pending_payment",
  "expiresAt": "2024-02-16T12:35:00Z"
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "error": "Quote expired",
  "details": "Please request a new quote"
}
```

**404 Not Found**:
```json
{
  "error": "Bank account not found",
  "details": "Invalid bank account ID"
}
```

---

### On-Ramp Endpoint

Initiates an on-ramp purchase of BTC with NGN.

#### Endpoint

```
POST /api/ramp/on-ramp
```

#### Request Body

```typescript
{
  amount: string;              // Amount in kobo
  lightningAddress: string;    // User's Lightning wallet address
  walletAddress: string;       // User's Starknet wallet address
}
```

#### Example Request

```bash
curl -X POST https://your-domain.com/api/ramp/on-ramp \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "2000000",
    "lightningAddress": "user@lightning.wallet",
    "walletAddress": "0x1234..."
  }'
```

#### Response

```typescript
{
  transactionId: string;       // PayMejor transaction ID
  mavaPayOrderId: string;      // MavaPay order ID
  paymentInstructions: {
    bankName: string;          // Bank to send NGN to
    accountNumber: string;     // Account number
    accountName: string;       // Account name
    amount: number;            // Amount in kobo
    reference: string;         // Payment reference (important!)
  };
  btcAmount: number;           // BTC amount in satoshis
  exchangeRate: number;        // Exchange rate
  expiresAt: string;           // ISO 8601 timestamp
}
```

#### Example Response

```json
{
  "transactionId": "tx_ghi789",
  "mavaPayOrderId": "order_mava456",
  "paymentInstructions": {
    "bankName": "WEMA BANK",
    "accountNumber": "9876543210",
    "accountName": "MavaPay Limited",
    "amount": 2000000,
    "reference": "MAVA-REF-123456"
  },
  "btcAmount": 44444,
  "exchangeRate": 45000,
  "expiresAt": "2024-02-16T12:35:00Z"
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "error": "Amount below minimum",
  "details": "Minimum amount is ₦2,000 (200,000 kobo)"
}
```

---

### Webhook Endpoint

Processes MavaPay webhook events for transaction status updates.

#### Endpoint

```
POST /api/ramp/webhook
```

#### Request Headers

```
X-MavaPay-Signature: {HMAC-SHA256 signature}
Content-Type: application/json
```

#### Request Body

```typescript
{
  event: 'payment.received' | 'payment.sent' | 'payout.completed' | 'payout.failed';
  data: {
    id: string;                    // Transaction ID
    walletId: string;              // MavaPay wallet ID
    ref: string;                   // Reference
    hash: string;                  // Lightning payment hash
    amount: number;                // Amount
    fees: number;                  // Fees
    currency: 'NGN' | 'BTC';       // Currency
    type: 'DEPOSIT' | 'WITHDRAWAL';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    autopayout: boolean;
    createdAt: string;             // ISO 8601 timestamp
    updatedAt: string;             // ISO 8601 timestamp
    transactionMetadata: {
      orderId: string;
      reference: string;
      merchantId: string;
      bankName?: string;
      bankAccountNumber?: string;
      customerInternalFee: string;
    };
  };
}
```

#### Example Request

```json
{
  "event": "payment.received",
  "data": {
    "id": "txn_123",
    "walletId": "wallet_456",
    "ref": "MAVA-REF-123456",
    "hash": "abc123def456",
    "amount": 2000000,
    "fees": 20000,
    "currency": "NGN",
    "type": "DEPOSIT",
    "status": "SUCCESS",
    "autopayout": false,
    "createdAt": "2024-02-16T12:30:00Z",
    "updatedAt": "2024-02-16T12:31:00Z",
    "transactionMetadata": {
      "orderId": "order_mava456",
      "reference": "MAVA-REF-123456",
      "merchantId": "merchant_789",
      "customerInternalFee": "20000"
    }
  }
}
```

#### Response

```typescript
{
  status: 'ok';
}
```

#### Example Response

```json
{
  "status": "ok"
}
```

#### Error Responses

**401 Unauthorized**:
```json
{
  "error": "Invalid signature",
  "details": "Webhook signature verification failed"
}
```

**500 Internal Server Error**:
```json
{
  "error": "Webhook processing failed",
  "details": "Failed to update transaction status"
}
```

#### Webhook Events

| Event | Description | Triggered When |
|-------|-------------|----------------|
| `payment.received` | NGN payment received | User completes bank transfer (on-ramp) |
| `payment.sent` | BTC payment sent | Lightning payment successful (off-ramp) |
| `payout.completed` | Bank payout completed | NGN deposited to user's bank (off-ramp) |
| `payout.failed` | Bank payout failed | Payout to bank account failed |

---

### Banks Endpoint

Fetches list of supported Nigerian banks.

#### Endpoint

```
GET /api/ramp/banks?country=NG
```

#### Query Parameters

- `country`: Country code (default: "NG")

#### Example Request

```bash
curl https://your-domain.com/api/ramp/banks?country=NG
```

#### Response

```typescript
{
  banks: Array<{
    name: string;          // Bank name
    code: string;          // Bank code
    nipBankCode: string;   // NIP bank code
  }>;
}
```

#### Example Response

```json
{
  "banks": [
    {
      "name": "ACCESS BANK",
      "code": "044",
      "nipBankCode": "000014"
    },
    {
      "name": "GUARANTY TRUST BANK",
      "code": "058",
      "nipBankCode": "000013"
    },
    {
      "name": "FIRST BANK OF NIGERIA",
      "code": "011",
      "nipBankCode": "000016"
    }
  ]
}
```

#### Error Responses

**500 Internal Server Error**:
```json
{
  "error": "Failed to fetch banks",
  "details": "MavaPay API unavailable"
}
```

---

### Bank Verification Endpoint

Verifies Nigerian bank account details.

#### Endpoint

```
POST /api/ramp/verify-bank
```

#### Request Body

```typescript
{
  accountNumber: string;   // 10-digit account number
  bankCode: string;        // Bank code from /banks endpoint
}
```

#### Example Request

```bash
curl -X POST https://your-domain.com/api/ramp/verify-bank \
  -H "Content-Type: application/json" \
  -d '{
    "accountNumber": "1234567890",
    "bankCode": "044"
  }'
```

#### Response

```typescript
{
  isValid: boolean;        // Account validity
  accountName?: string;    // Account holder name (if valid)
  errorMessage?: string;   // Error message (if invalid)
}
```

#### Example Response (Valid)

```json
{
  "isValid": true,
  "accountName": "JOHN DOE"
}
```

#### Example Response (Invalid)

```json
{
  "isValid": false,
  "errorMessage": "Account not found"
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "error": "Invalid account number",
  "details": "Account number must be 10 digits"
}
```

---

## Data Models

### Quote

```typescript
interface Quote {
  id: string;
  exchangeRate: number;
  usdToTargetCurrencyRate: number;
  sourceCurrency: string;
  targetCurrency: string;
  transactionFeesInSourceCurrency: number;
  transactionFeesInTargetCurrency: number;
  amountInSourceCurrency: number;
  amountInTargetCurrency: number;
  paymentMethod: 'LIGHTNING';
  expiry: string;
  isValid: boolean;
  invoice?: string;
  totalAmountInSourceCurrency: number;
}
```

### Transaction

```typescript
interface RampTransaction {
  id: string;
  walletAddress: string;
  type: 'on-ramp' | 'off-ramp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  exchangeRate: number;
  transactionFees: string;
  networkFees: string;
  totalFees: string;
  mavaPayQuoteId?: string;
  mavaPayOrderId?: string;
  mavaPayHash?: string;
  lightningInvoice?: string;
  bankAccountId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankReference?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  errorMessage?: string;
  retryCount: number;
}
```

### Bank Account

```typescript
interface BankAccount {
  id: string;
  walletAddress: string;
  bankName: string;
  accountNumber: string;  // Encrypted
  accountName: string;
  nipBankCode: string;
  isVerified: boolean;
  createdAt: string;
}
```

---

## Error Handling

### Error Response Format

All error responses follow this format:

```typescript
{
  error: string;      // Error message
  details?: string;   // Additional details
  code?: string;      // Error code
}
```

### HTTP Status Codes

| Status Code | Description | When Used |
|-------------|-------------|-----------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Invalid or missing authentication |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | MavaPay API unavailable |

### Common Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `QUOTE_EXPIRED` | Quote has expired | Request a new quote |
| `INSUFFICIENT_BALANCE` | Insufficient balance | Add funds to wallet |
| `INVALID_BANK_ACCOUNT` | Invalid bank account | Verify account details |
| `AMOUNT_BELOW_MINIMUM` | Amount below minimum | Increase amount to minimum |
| `AMOUNT_ABOVE_MAXIMUM` | Amount above maximum | Decrease amount to maximum |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `API_UNAVAILABLE` | MavaPay API unavailable | Try again later |

### Retry Logic

The API implements automatic retry logic for transient failures:

- **Retry Attempts**: Up to 3 attempts
- **Backoff Strategy**: Exponential backoff
- **Delays**: 1s, 2s, 4s
- **Retryable Errors**: Network errors, 5xx errors, timeouts

---

## Rate Limiting

### Limits

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| `/api/ramp/quote` | 10 requests | 1 minute |
| `/api/ramp/payout` | 5 requests | 1 minute |
| `/api/ramp/on-ramp` | 5 requests | 1 minute |
| `/api/ramp/webhook` | 100 requests | 1 minute |
| `/api/ramp/banks` | 20 requests | 1 minute |
| `/api/ramp/verify-bank` | 10 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1708089600
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded",
  "details": "Too many requests. Please try again in 30 seconds.",
  "retryAfter": 30
}
```

---

## Security

### API Key Security

- API keys are stored in environment variables
- Never exposed to client-side code
- Rotated periodically (every 90 days)
- Different keys for sandbox and production

### Webhook Signature Verification

All webhooks are verified using HMAC-SHA256:

```typescript
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(JSON.stringify(payload))
  .digest('hex');

if (signature !== receivedSignature) {
  throw new Error('Invalid signature');
}
```

### Input Validation

All inputs are validated:
- Type checking
- Range validation
- Format validation
- Sanitization to prevent injection attacks

### Data Encryption

Sensitive data is encrypted:
- Bank account numbers: AES-256 encryption
- Encryption keys derived from wallet address
- Data stored locally, never on servers

### HTTPS Only

All API requests must use HTTPS:
- TLS 1.2 or higher required
- Certificate validation enforced
- No plain HTTP allowed

---

## Testing

### Sandbox Environment

Use sandbox environment for testing:

```bash
# Set environment variables
NEXT_PUBLIC_MAVAPAY_API_URL=https://staging.api.mavapay.co
MAVAPAY_API_KEY=your_sandbox_api_key
```

### Test Data

**Test Bank Accounts**:
- Account Number: `0123456789`
- Bank Code: `044` (Access Bank)
- Account Name: `TEST ACCOUNT`

**Test Amounts**:
- Minimum: `200000` kobo (₦2,000)
- Maximum: `10000000` kobo (₦100,000)

### Example Test Flow

```bash
# 1. Get quote
curl -X POST http://localhost:3000/api/ramp/quote \
  -H "Content-Type: application/json" \
  -d '{"direction":"btc-to-ngn","amount":"500000","sourceCurrency":"BTCSAT","targetCurrency":"NGNKOBO"}'

# 2. Initiate payout
curl -X POST http://localhost:3000/api/ramp/payout \
  -H "Content-Type: application/json" \
  -d '{"quoteId":"quote_abc123","bankAccountId":"bank_xyz789","walletAddress":"0x1234..."}'

# 3. Simulate webhook
curl -X POST http://localhost:3000/api/ramp/webhook \
  -H "Content-Type: application/json" \
  -H "X-MavaPay-Signature: test_signature" \
  -d '{"event":"payout.completed","data":{...}}'
```

---

## Additional Resources

- **User Guide**: [MAVAPAY_USER_GUIDE.md](./MAVAPAY_USER_GUIDE.md)
- **Troubleshooting**: [MAVAPAY_TROUBLESHOOTING.md](./MAVAPAY_TROUBLESHOOTING.md)
- **Setup Guide**: [MAVAPAY_SETUP.md](./MAVAPAY_SETUP.md)
- **MavaPay API Docs**: https://docs.mavapay.co

---

**Last Updated**: February 2024

**API Version**: v1
