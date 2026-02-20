# Design Document: MavaPay BTC ↔ NGN On/Off-Ramp Integration

## Overview

This design document outlines the integration of MavaPay into Paymejor to enable Nigerian users to convert between Bitcoin (BTC) and Nigerian Naira (NGN). The integration provides two primary flows:

1. **Off-Ramp Flow**: Users borrow USDT/USDC from Vesu → swap to BTC via Autoswap → convert to NGN via MavaPay → receive funds in Nigerian bank account
2. **On-Ramp Flow**: Users purchase BTC with NGN via MavaPay → bridge to Starknet via Atomiq → use as collateral in Vesu

MavaPay leverages the Lightning Network for fast, low-cost BTC transactions and provides direct integration with Nigerian banks. The system will be built as a new tab in the Paymejor frontend, with backend API routes handling MavaPay integration, webhook processing, and transaction management.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Paymejor Frontend                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Ramp Tab UI  │  │ Bank Account │  │ Transaction  │      │
│  │              │  │ Management   │  │ History      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Next.js API Routes                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/ramp/   │  │ /api/ramp/   │  │ /api/ramp/   │      │
│  │ quote        │  │ payout       │  │ webhook      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MavaPay API Client                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Quote        │  │ Payout       │  │ Bank         │      │
│  │ Management   │  │ Processing   │  │ Verification │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼──────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MavaPay API                               │
│         (staging.api.mavapay.co / api.mavapay.co)           │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Autoswap Integration**: Existing hook for swapping USDT/USDC to BTC
2. **Atomiq Integration**: Existing hook for bridging BTC between Bitcoin and Starknet
3. **Vesu Integration**: Existing hooks for collateral management and borrowing
4. **MavaPay API**: New integration for BTC ↔ NGN conversion
5. **Transaction Manager**: Existing system extended to track ramp transactions

## Components and Interfaces

### Frontend Components

#### 1. Ramp Tab Component (`frontend/components/tabs/ramp-tab.tsx`)

Main UI component for on/off-ramp operations.

```typescript
interface RampTabProps {
  walletAddress: string;
  btcBalance: bigint;
  usdtBalance: bigint;
  usdcBalance: bigint;
}

interface RampTabState {
  mode: 'off-ramp' | 'on-ramp';
  amount: string;
  currency: 'USDT' | 'USDC' | 'BTC' | 'NGN';
  selectedBank: BankAccount | null;
  quote: MavaPayQuote | null;
  isLoading: boolean;
  error: string | null;
}
```

**Responsibilities**:
- Toggle between off-ramp and on-ramp modes
- Input amount and currency selection
- Display real-time exchange rates and fees
- Show transaction progress and status
- Handle user confirmations

#### 2. Bank Account Manager Component (`frontend/components/bank-account-manager.tsx`)

Manages saved Nigerian bank accounts.

```typescript
interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  nipBankCode: string;
  isVerified: boolean;
  createdAt: Date;
}

interface BankAccountManagerProps {
  accounts: BankAccount[];
  onAdd: (account: Omit<BankAccount, 'id' | 'createdAt'>) => Promise<void>;
  onDelete: (accountId: string) => Promise<void>;
  onSelect: (account: BankAccount) => void;
}
```

**Responsibilities**:
- Display list of saved bank accounts
- Add new bank account with validation
- Verify account via MavaPay API
- Delete saved accounts
- Select account for payout

#### 3. Ramp Transaction History Component (`frontend/components/ramp-transaction-history.tsx`)

Displays history of on/off-ramp transactions.

```typescript
interface RampTransaction {
  id: string;
  type: 'on-ramp' | 'off-ramp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  exchangeRate: number;
  fees: string;
  mavaPayOrderId?: string;
  mavaPayHash?: string;
  bankReference?: string;
  createdAt: Date;
  updatedAt: Date;
  estimatedCompletion?: Date;
  errorMessage?: string;
}
```

**Responsibilities**:
- Fetch and display transaction history
- Show transaction status with progress indicators
- Display transaction details (amounts, fees, rates)
- Provide retry option for failed transactions
- Link to blockchain explorers for completed transactions

### Backend API Routes

#### 1. Quote Endpoint (`/api/ramp/quote`)

Fetches real-time exchange rate quotes from MavaPay.

**Request**:
```typescript
interface QuoteRequest {
  direction: 'btc-to-ngn' | 'ngn-to-btc';
  amount: string; // Amount in smallest unit (satoshis or kobo)
  sourceCurrency: 'BTCSAT' | 'NGNKOBO';
  targetCurrency: 'NGNKOBO' | 'BTCSAT';
}
```

**Response**:
```typescript
interface QuoteResponse {
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
  expiry: string; // ISO 8601 timestamp
  isValid: boolean;
  invoice?: string; // Lightning invoice for off-ramp
  totalAmountInSourceCurrency: number;
}
```

**MavaPay API Call**:
```
POST https://api.mavapay.co/v1/quotes
Headers:
  Authorization: Bearer {API_KEY}
  Content-Type: application/json
Body:
  {
    "sourceCurrency": "BTCSAT",
    "targetCurrency": "NGNKOBO",
    "amount": 500000,
    "paymentMethod": "LIGHTNING",
    "autopayout": true,
    "paymentCurrency": "NGNKOBO",
    "beneficiary": {
      "accountName": "John Doe",
      "accountNumber": "1234567890",
      "bankName": "ACCESS BANK"
    }
  }
```

#### 2. Payout Endpoint (`/api/ramp/payout`)

Initiates off-ramp payout to Nigerian bank account.

**Request**:
```typescript
interface PayoutRequest {
  quoteId: string;
  bankAccountId: string;
  walletAddress: string;
}
```

**Response**:
```typescript
interface PayoutResponse {
  transactionId: string;
  mavaPayOrderId: string;
  invoice: string; // Lightning invoice to pay
  amount: number;
  status: 'pending_payment';
  expiresAt: string;
}
```

**Flow**:
1. Validate quote is still valid (not expired)
2. Retrieve bank account details
3. Pay Lightning invoice using user's BTC
4. Create transaction record in database
5. Return transaction details to frontend

#### 3. On-Ramp Endpoint (`/api/ramp/on-ramp`)

Initiates on-ramp purchase of BTC with NGN.

**Request**:
```typescript
interface OnRampRequest {
  amount: string; // Amount in kobo
  lightningAddress: string; // User's Lightning wallet address
}
```

**Response**:
```typescript
interface OnRampResponse {
  transactionId: string;
  mavaPayOrderId: string;
  paymentInstructions: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number; // In kobo
    reference: string;
  };
  btcAmount: number; // In satoshis
  exchangeRate: number;
  expiresAt: string;
}
```

**Flow**:
1. Request quote from MavaPay for NGN → BTC
2. Generate payment instructions
3. Create transaction record
4. Return payment details to user
5. Wait for webhook confirmation of NGN receipt

#### 4. Webhook Endpoint (`/api/ramp/webhook`)

Processes MavaPay webhook events for transaction status updates.

**Request** (from MavaPay):
```typescript
interface WebhookEvent {
  event: 'payment.received' | 'payment.sent' | 'payout.completed' | 'payout.failed';
  data: {
    id: string;
    walletId: string;
    ref: string;
    hash: string; // Lightning payment hash
    amount: number;
    fees: number;
    currency: 'NGN' | 'BTC';
    type: 'DEPOSIT' | 'WITHDRAWAL';
    status: 'SUCCESS' | 'PENDING' | 'FAILED';
    autopayout: boolean;
    createdAt: string;
    updatedAt: string;
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

**Response**:
```typescript
{ status: 'ok' }
```

**Flow**:
1. Verify webhook signature
2. Parse event type and data
3. Update transaction status in database
4. Trigger next step in flow (e.g., bridge BTC for on-ramp)
5. Send notification to user
6. Return 200 OK within 5 seconds

#### 5. Bank List Endpoint (`/api/ramp/banks`)

Fetches list of supported Nigerian banks.

**Request**:
```
GET /api/ramp/banks?country=NG
```

**Response**:
```typescript
interface BankListResponse {
  banks: Array<{
    name: string;
    code: string;
    nipBankCode: string;
  }>;
}
```

**MavaPay API Call**:
```
GET https://api.mavapay.co/v1/banks?country=NG
Headers:
  Authorization: Bearer {API_KEY}
```

#### 6. Bank Verification Endpoint (`/api/ramp/verify-bank`)

Verifies Nigerian bank account details.

**Request**:
```typescript
interface BankVerificationRequest {
  accountNumber: string;
  bankCode: string;
}
```

**Response**:
```typescript
interface BankVerificationResponse {
  isValid: boolean;
  accountName?: string;
  errorMessage?: string;
}
```

### Custom Hooks

#### 1. useMavaPay Hook (`frontend/hooks/useMavaPay.ts`)

Main hook for MavaPay operations.

```typescript
interface UseMavaPayReturn {
  // Quote management
  fetchQuote: (params: QuoteRequest) => Promise<QuoteResponse>;
  quote: QuoteResponse | null;
  quoteLoading: boolean;
  quoteError: Error | null;
  
  // Off-ramp
  initiateOffRamp: (params: PayoutRequest) => Promise<PayoutResponse>;
  offRampLoading: boolean;
  offRampError: Error | null;
  
  // On-ramp
  initiateOnRamp: (params: OnRampRequest) => Promise<OnRampResponse>;
  onRampLoading: boolean;
  onRampError: Error | null;
  
  // Bank management
  banks: BankListResponse['banks'];
  fetchBanks: () => Promise<void>;
  verifyBank: (params: BankVerificationRequest) => Promise<BankVerificationResponse>;
  
  // Transaction history
  transactions: RampTransaction[];
  fetchTransactions: () => Promise<void>;
  getTransaction: (id: string) => RampTransaction | null;
}
```

#### 2. useBankAccounts Hook (`frontend/hooks/useBankAccounts.ts`)

Manages user's saved bank accounts.

```typescript
interface UseBankAccountsReturn {
  accounts: BankAccount[];
  loading: boolean;
  error: Error | null;
  addAccount: (account: Omit<BankAccount, 'id' | 'createdAt'>) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  refreshAccounts: () => Promise<void>;
}
```

### Data Models

#### Transaction Storage

Transactions will be stored in browser localStorage with the following schema:

```typescript
interface StoredRampTransaction {
  id: string;
  walletAddress: string;
  type: 'on-ramp' | 'off-ramp';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Amounts
  sourceAmount: string;
  sourceCurrency: string;
  targetAmount: string;
  targetCurrency: string;
  
  // Rates and fees
  exchangeRate: number;
  transactionFees: string;
  networkFees: string;
  totalFees: string;
  
  // MavaPay details
  mavaPayQuoteId?: string;
  mavaPayOrderId?: string;
  mavaPayHash?: string;
  lightningInvoice?: string;
  
  // Bank details (for off-ramp)
  bankAccountId?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankReference?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  
  // Error handling
  errorMessage?: string;
  retryCount: number;
}
```

#### Bank Account Storage

Bank accounts will be encrypted and stored in localStorage:

```typescript
interface StoredBankAccount {
  id: string;
  walletAddress: string;
  bankName: string;
  accountNumber: string; // Encrypted
  accountName: string;
  nipBankCode: string;
  isVerified: boolean;
  createdAt: string;
}
```

## Data Models

### MavaPay API Integration Layer

#### API Client Configuration

```typescript
interface MavaPayConfig {
  apiKey: string;
  baseUrl: string; // staging.api.mavapay.co or api.mavapay.co
  webhookSecret: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

class MavaPayClient {
  private config: MavaPayConfig;
  private axiosInstance: AxiosInstance;
  
  constructor(config: MavaPayConfig);
  
  // Quote operations
  async createQuote(params: QuoteParams): Promise<QuoteResponse>;
  async getQuote(quoteId: string): Promise<QuoteResponse>;
  
  // Payout operations
  async createPayout(params: PayoutParams): Promise<PayoutResponse>;
  async getTransaction(transactionId: string): Promise<TransactionResponse>;
  async getTransactionByHash(hash: string): Promise<TransactionResponse[]>;
  
  // Bank operations
  async getBanks(country: string): Promise<BankListResponse>;
  async verifyBankAccount(params: BankVerificationParams): Promise<BankVerificationResponse>;
  
  // Webhook verification
  verifyWebhookSignature(payload: string, signature: string): boolean;
}
```

### Currency Conversion Utilities

```typescript
// Convert between display units and smallest units
class CurrencyConverter {
  // NGN conversions
  static ngnToKobo(ngn: number): number;
  static koboToNgn(kobo: number): number;
  
  // BTC conversions
  static btcToSatoshis(btc: number): number;
  static satoshisToBtc(satoshis: number): number;
  
  // Format for display
  static formatNGN(kobo: number): string; // "₦1,234.56"
  static formatBTC(satoshis: number): string; // "0.00123456 BTC"
  static formatSatoshis(satoshis: number): string; // "123,456 sats"
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Balance Validation
*For any* user balance and transaction amount, the system should only allow off-ramp transactions when the user's USDT or USDC balance is greater than or equal to the requested amount.
**Validates: Requirements 1.1**

### Property 2: Quote Request After Swap
*For any* completed BTC swap, the system should immediately request a quote from MavaPay with the swapped BTC amount.
**Validates: Requirements 1.3**

### Property 3: Quote Display Completeness
*For any* MavaPay quote response, the displayed UI should contain the NGN amount, all fees, and the exchange rate.
**Validates: Requirements 1.4, 2.2**

### Property 4: Invoice Generation on Acceptance
*For any* accepted quote, the system should generate a Lightning invoice via the MavaPay API with the correct quote ID.
**Validates: Requirements 1.5**

### Property 5: Payout Initiation After Payment
*For any* confirmed Lightning payment, the system should initiate a payout request to MavaPay with the correct bank account details.
**Validates: Requirements 1.7**

### Property 6: Webhook Signature Verification
*For any* incoming webhook, the system should only process it if the signature matches the expected value computed from the webhook secret.
**Validates: Requirements 3.5, 9.1**

### Property 7: API Request Structure
*For any* quote request to MavaPay, the request should include amount, source currency, and destination currency fields.
**Validates: Requirements 3.3**

### Property 8: Bank Account Format Validation
*For any* bank account number input, the system should only accept strings that are exactly 10 digits.
**Validates: Requirements 4.1**

### Property 9: Encryption Round Trip
*For any* bank account details, encrypting then decrypting should produce the original account details.
**Validates: Requirements 4.3, 10.3**

### Property 10: Transaction Record Uniqueness
*For any* two ramp transactions, they should have different unique IDs.
**Validates: Requirements 5.1**

### Property 11: Status Update Timestamp
*For any* transaction status change, the updated timestamp should be greater than the previous timestamp.
**Validates: Requirements 5.2**

### Property 12: Minimum Amount Enforcement
*For any* off-ramp amount less than 2000 NGN (200,000 kobo), the system should reject the transaction with an error message.
**Validates: Requirements 7.1, 7.2**

### Property 13: Retry with Exponential Backoff
*For any* failed API request, the system should retry up to 3 times with exponentially increasing delays between attempts.
**Validates: Requirements 3.6**

### Property 14: Webhook Event Routing
*For any* webhook event of type `payment.received`, the system should update the corresponding on-ramp transaction status to "NGN Received".
**Validates: Requirements 9.2**

### Property 15: Input Sanitization
*For any* user input containing SQL injection patterns or XSS payloads, the system should reject or sanitize the input before processing.
**Validates: Requirements 10.4**

### Property 16: Sensitive Data Exclusion from Logs
*For any* log entry, it should not contain API keys, bank account numbers, or Lightning invoices in plain text.
**Validates: Requirements 10.7**

## Error Handling

### Error Categories

1. **Validation Errors**: Input validation failures (invalid amounts, formats, etc.)
2. **API Errors**: MavaPay API failures (timeouts, rate limits, server errors)
3. **Network Errors**: Connection failures, DNS issues
4. **Payment Errors**: Lightning payment failures, insufficient balance
5. **Webhook Errors**: Invalid signatures, processing failures
6. **State Errors**: Invalid state transitions, expired quotes

### Error Handling Strategy

#### Validation Errors
- Catch at input level before API calls
- Display user-friendly error messages
- Highlight invalid fields in UI
- Provide correction suggestions

```typescript
class ValidationError extends Error {
  constructor(
    public field: string,
    public message: string,
    public suggestion?: string
  ) {
    super(message);
  }
}
```

#### API Errors
- Implement retry logic with exponential backoff
- Maximum 3 retry attempts
- Log all API errors with request/response details
- Display generic error message to user
- Provide support contact for persistent failures

```typescript
class APIError extends Error {
  constructor(
    public statusCode: number,
    public endpoint: string,
    public message: string,
    public retryable: boolean
  ) {
    super(message);
  }
}
```

#### Payment Errors
- Distinguish between user errors and system errors
- For insufficient balance: show current balance and required amount
- For Lightning failures: provide invoice details and retry option
- For timeout: poll transaction status via API

```typescript
class PaymentError extends Error {
  constructor(
    public type: 'insufficient_balance' | 'payment_failed' | 'timeout',
    public message: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}
```

#### Webhook Errors
- Log all webhook processing errors
- Retry webhook processing up to 3 times
- If retries fail, poll API for transaction status
- Alert monitoring system for investigation

```typescript
class WebhookError extends Error {
  constructor(
    public webhookId: string,
    public event: string,
    public message: string
  ) {
    super(message);
  }
}
```

### Error Recovery Flows

#### Quote Expiration
1. Detect quote expiration (5 minutes from creation)
2. Automatically fetch new quote
3. Notify user of rate change if >2%
4. Require user re-confirmation if rate changed significantly

#### Payment Timeout
1. Wait for webhook up to 2 minutes
2. If no webhook, poll MavaPay API for transaction status
3. Update UI with current status
4. If still pending after 5 minutes, show "Processing" state with support contact

#### Webhook Failure
1. Attempt to process webhook
2. If processing fails, log error and retry
3. After 3 failed retries, fall back to API polling
4. Poll every 30 seconds for up to 10 minutes
5. If still no status, mark transaction as "Unknown" and alert user

#### API Unavailability
1. Detect API unavailability (5xx errors, timeouts)
2. Display maintenance message to user
3. Disable ramp functionality temporarily
4. Poll API health endpoint every minute
5. Re-enable functionality when API is healthy

## Testing Strategy

### Dual Testing Approach

This feature will use both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

Both testing approaches are complementary and necessary for comprehensive coverage. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across many inputs.

### Property-Based Testing Configuration

- **Library**: fast-check (for TypeScript/JavaScript)
- **Minimum iterations**: 100 runs per property test
- **Test tagging**: Each property test must reference its design document property
- **Tag format**: `Feature: mavapay-btc-ngn-ramp, Property {number}: {property_text}`

### Unit Testing Focus

Unit tests should focus on:
- Specific examples that demonstrate correct behavior
- Integration points between components (Autoswap, Atomiq, MavaPay)
- Edge cases (minimum amounts, maximum amounts, expired quotes)
- Error conditions (API failures, invalid inputs, webhook errors)

Avoid writing too many unit tests for scenarios that property-based tests already cover (e.g., testing many different valid amounts).

### Property Testing Focus

Property tests should focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must always be true
- Round-trip properties (encryption/decryption, serialization)

### Test Organization

```
frontend/
  hooks/
    __tests__/
      useMavaPay.test.ts          # Unit tests
      useMavaPay.property.test.ts # Property tests
      useBankAccounts.test.ts
      useBankAccounts.property.test.ts
  lib/
    __tests__/
      mavapay-client.test.ts
      mavapay-client.property.test.ts
      currency-converter.test.ts
      currency-converter.property.test.ts
  components/
    tabs/
      __tests__/
        ramp-tab.test.tsx
        ramp-tab.property.test.tsx
  app/
    api/
      ramp/
        __tests__/
          quote.test.ts
          quote.property.test.ts
          payout.test.ts
          webhook.test.ts
          webhook.property.test.ts
```

### Example Property Test

```typescript
import fc from 'fast-check';

// Feature: mavapay-btc-ngn-ramp, Property 1: Balance Validation
describe('Balance Validation Property', () => {
  it('should only allow off-ramp when balance >= amount', () => {
    fc.assert(
      fc.property(
        fc.nat(), // balance
        fc.nat(), // amount
        (balance, amount) => {
          const canOffRamp = validateBalance(balance, amount);
          if (balance >= amount) {
            expect(canOffRamp).toBe(true);
          } else {
            expect(canOffRamp).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: mavapay-btc-ngn-ramp, Property 9: Encryption Round Trip
describe('Encryption Round Trip Property', () => {
  it('should preserve bank account details through encrypt/decrypt', () => {
    fc.assert(
      fc.property(
        fc.record({
          accountNumber: fc.stringOf(fc.integer(0, 9), { minLength: 10, maxLength: 10 }),
          accountName: fc.string({ minLength: 1, maxLength: 100 }),
          bankName: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        (bankAccount) => {
          const encrypted = encryptBankAccount(bankAccount);
          const decrypted = decryptBankAccount(encrypted);
          expect(decrypted).toEqual(bankAccount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

Integration tests will verify:
- End-to-end off-ramp flow (mock MavaPay API)
- End-to-end on-ramp flow (mock MavaPay API)
- Webhook processing with real signature verification
- Transaction state transitions
- Error recovery flows

### Manual Testing Checklist

Before deployment, manually test:
- [ ] Off-ramp with real Nigerian bank account (sandbox)
- [ ] On-ramp with real NGN payment (sandbox)
- [ ] Quote expiration and refresh
- [ ] Rate change re-confirmation
- [ ] Bank account verification
- [ ] Transaction history display
- [ ] Error messages for all error types
- [ ] Webhook processing (use MavaPay webhook simulator)
- [ ] Mobile responsiveness
- [ ] Accessibility (keyboard navigation, screen readers)

## Security Considerations

### API Key Management
- Store MavaPay API keys in environment variables
- Never commit API keys to version control
- Use different keys for sandbox and production
- Rotate keys periodically (every 90 days)
- Implement key rotation without downtime

### Data Encryption
- Encrypt bank account details at rest using AES-256
- Use unique encryption key per user (derived from wallet address)
- Store encryption keys in secure key management system
- Never log decrypted bank account details

### Webhook Security
- Verify webhook signatures using HMAC-SHA256
- Reject webhooks with invalid signatures
- Implement replay attack prevention (check timestamp)
- Rate limit webhook endpoint to prevent DoS

### Input Validation
- Validate all user inputs on both client and server
- Sanitize inputs to prevent XSS and injection attacks
- Use parameterized queries for database operations
- Implement Content Security Policy (CSP) headers

### Rate Limiting
- Limit API requests per user per minute
- Implement exponential backoff for retries
- Use distributed rate limiting for multi-instance deployments
- Monitor for abuse patterns

### Audit Logging
- Log all transaction attempts with user ID, amount, timestamp
- Log all API requests and responses (sanitized)
- Log all webhook events
- Implement log retention policy (90 days)
- Use structured logging for easy querying

### Compliance
- Implement KYC/AML checks as required by MavaPay
- Store transaction records for regulatory compliance
- Implement data retention and deletion policies
- Provide user data export functionality (GDPR)

## Performance Considerations

### API Response Times
- Target: <500ms for quote requests
- Target: <1s for payout initiation
- Target: <200ms for webhook processing
- Implement caching for bank list (1 hour TTL)
- Implement caching for exchange rates (30 second TTL)

### Frontend Performance
- Lazy load ramp tab component
- Debounce amount input for quote requests (500ms)
- Use optimistic UI updates for better perceived performance
- Implement skeleton loaders for async operations
- Minimize bundle size (code splitting)

### Database Performance
- Index transactions by wallet address and status
- Index transactions by MavaPay order ID and hash
- Implement pagination for transaction history (20 per page)
- Use localStorage for client-side caching

### Monitoring
- Track API response times
- Track error rates by error type
- Track transaction success rates
- Track webhook processing times
- Set up alerts for anomalies

## Deployment Considerations

### Environment Variables

```bash
# MavaPay Configuration
NEXT_PUBLIC_MAVAPAY_API_URL=https://api.mavapay.co
MAVAPAY_API_KEY=your_production_api_key
MAVAPAY_WEBHOOK_SECRET=your_webhook_secret

# Sandbox Configuration (for testing)
NEXT_PUBLIC_MAVAPAY_SANDBOX_URL=https://staging.api.mavapay.co
MAVAPAY_SANDBOX_API_KEY=your_sandbox_api_key
MAVAPAY_SANDBOX_WEBHOOK_SECRET=your_sandbox_webhook_secret

# Feature Flags
NEXT_PUBLIC_ENABLE_MAVAPAY_RAMP=true
NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT=200000 # 2000 NGN in kobo
```

### Rollout Strategy

1. **Phase 1: Sandbox Testing** (Week 1)
   - Deploy to staging with sandbox API
   - Internal testing with test bank accounts
   - Verify all flows work correctly

2. **Phase 2: Beta Testing** (Week 2-3)
   - Enable for limited users (whitelist)
   - Monitor transaction success rates
   - Gather user feedback
   - Fix any issues discovered

3. **Phase 3: General Availability** (Week 4)
   - Enable for all users
   - Monitor closely for first 48 hours
   - Have rollback plan ready
   - Provide user support

### Rollback Plan

If critical issues are discovered:
1. Disable feature via feature flag (no deployment needed)
2. Display maintenance message to users
3. Investigate and fix issues
4. Re-enable after verification

### Monitoring and Alerts

Set up alerts for:
- API error rate >5%
- Transaction failure rate >10%
- Webhook processing failures >5%
- API response time >2s
- Unusual transaction volumes

## Future Enhancements

### Phase 2 Features
- Support for additional Nigerian banks
- Support for mobile money (MTN MoMo, Airtel Money)
- Batch payouts for multiple users
- Scheduled recurring conversions
- Price alerts for favorable rates

### Phase 3 Features
- Support for other African currencies (KES, ZAR, GHS)
- Direct USDT/USDC to NGN conversion (if MavaPay adds support)
- Integration with other on/off-ramp providers for redundancy
- Advanced analytics and reporting
- Tax reporting features

## References

- [MavaPay API Documentation](https://github.com/stealthmoney/mavapay-docs)
- [MavaPay ZAR API Examples](https://gist.github.com/Extheoisah/f4bd8cb86e8fb6e153fd261fa80e90f9)
- [Lightning Network Documentation](https://lightning.engineering/api-docs/)
- [Autoswap Integration](../paymejor-private-liquidity-vault/design.md)
- [Atomiq Bridge Integration](../paymejor-private-liquidity-vault/design.md)
- [Vesu Protocol Documentation](https://docs.vesu.xyz/)
