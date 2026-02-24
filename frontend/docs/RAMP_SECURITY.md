# MavaPay Ramp Security Implementation

This document describes the security features implemented for the MavaPay BTC ↔ NGN ramp integration.

## Overview

The security implementation includes three main components:
1. **Rate Limiting** - Prevents abuse by limiting API requests per user/IP
2. **Audit Logging** - Tracks all transaction attempts and system events
3. **Log Sanitization** - Removes sensitive data from logs

## Requirements

- **10.5**: Implement rate limiting on API endpoints to prevent abuse
- **10.6**: Log all transaction attempts with user ID, amount, and timestamp for audit purposes
- **10.7**: Never log sensitive data such as API keys, bank account numbers, or Lightning invoices in plain text

## Rate Limiting

### Implementation

Rate limiting is implemented using an in-memory rate limiter with configurable limits per endpoint:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/ramp/quote` | 20 requests | 60 seconds |
| `/api/ramp/payout` | 5 requests | 60 seconds |
| `/api/ramp/on-ramp` | 5 requests | 60 seconds |
| `/api/ramp/webhook` | 100 requests | 60 seconds |
| `/api/ramp/banks` | 10 requests | 60 seconds |
| `/api/ramp/verify-bank` | 10 requests | 60 seconds |

### Usage

```typescript
import { checkQuoteRateLimit } from '@/lib/ramp-security';

// In API route
const rateLimitCheck = checkQuoteRateLimit(request, walletAddress);
if (!rateLimitCheck.allowed) {
  return NextResponse.json(
    {
      error: 'Rate Limit Exceeded',
      message: rateLimitCheck.error,
      retryAfter: rateLimitCheck.retryAfter,
    },
    { 
      status: 429,
      headers: {
        'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
        'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
      },
    }
  );
}
```

### Response Headers

When rate limiting is active, the following headers are included in responses:

- `X-RateLimit-Remaining`: Number of requests remaining in the current window
- `Retry-After`: Seconds until the rate limit resets (only when limit exceeded)
- `X-Response-Time`: Request processing time in milliseconds

### Client Identification

Rate limits are applied per:
- **Wallet address** (when provided in request body)
- **IP address** (from `x-forwarded-for` or `x-real-ip` headers)

## Audit Logging

### Log Entry Structure

All audit logs follow a consistent structure:

```typescript
interface AuditLogEntry {
  timestamp: string;              // ISO 8601 timestamp
  eventType: string;              // Type of event (see below)
  userId?: string;                // User identifier
  walletAddress?: string;         // Wallet address
  transactionId?: string;         // Transaction ID
  amount?: string;                // Transaction amount
  currency?: string;              // Currency code
  status?: string;                // Transaction status
  endpoint: string;               // API endpoint
  method: string;                 // HTTP method
  ipAddress?: string;             // Client IP address
  userAgent?: string;             // Client user agent
  requestId: string;              // Unique request ID
  duration?: number;              // Request duration (ms)
  error?: string;                 // Error message
  metadata?: Record<string, any>; // Additional data
}
```

### Event Types

The following event types are logged:

- `quote_request` - User requests exchange rate quote
- `payout_initiated` - Off-ramp payout initiated
- `on_ramp_initiated` - On-ramp purchase initiated
- `webhook_received` - Webhook event received from MavaPay
- `bank_verification` - Bank account verification attempt
- `transaction_status_update` - Transaction status changed
- `rate_limit_exceeded` - Rate limit exceeded
- `validation_error` - Input validation failed
- `api_error` - API error occurred

### Usage

```typescript
import { logTransactionAttempt, logApiError } from '@/lib/ramp-security';

// Log transaction attempt
logTransactionAttempt(
  request,
  'quote',
  walletAddress,
  amount,
  currency,
  transactionId
);

// Log API error
try {
  // API call
} catch (error) {
  if (error instanceof Error) {
    logApiError(request, error, '/api/ramp/quote', walletAddress, transactionId);
  }
}
```

### Log Output

In development, logs are written to console with structured JSON format:

```json
{
  "timestamp": "2024-02-24T20:30:00.000Z",
  "eventType": "quote_request",
  "walletAddress": "0x1234...abcd",
  "amount": "1000000",
  "currency": "BTCSAT",
  "endpoint": "/api/ramp/quote",
  "method": "POST",
  "ipAddress": "192.168.1.1",
  "requestId": "req-123-456",
  "duration": 150
}
```

In production, logs should be sent to a logging service (e.g., CloudWatch, Datadog, Splunk).

## Log Sanitization

### Sensitive Data Patterns

The following sensitive data patterns are automatically sanitized from logs:

| Pattern | Example | Sanitized |
|---------|---------|-----------|
| API Keys | `api_key_1234567890abcdef` | `[REDACTED]` |
| Bearer Tokens | `Bearer abc123...` | `[REDACTED]` |
| Bank Account Numbers | `1234567890` | `******7890` |
| Lightning Invoices | `lnbc123...xyz` | `lnbc123...xyz` (first 10 + last 10) |
| Webhook Secrets | `webhook_secret_abc123` | `[REDACTED]` |
| Private Keys | `0xabcd...1234` | `[REDACTED]` |
| Email Addresses | `user@example.com` | `u***@example.com` |
| Phone Numbers | `+1-555-123-4567` | `[PHONE_REDACTED]` |

### Field Name Detection

Certain field names are automatically detected and sanitized:

- Fields containing `apikey`, `api_key`, `secret`, `token`, `password`
- Fields containing `account` and `number` together
- Fields containing `invoice` with Lightning invoice format

### Usage

```typescript
import { sanitizeLogEntry, sanitizeRequestBody } from '@/lib/ramp-security';

// Sanitize audit log entry
const entry = createAuditLog('payout_initiated', request, {
  walletAddress: 'test-wallet',
  metadata: {
    bankAccount: '1234567890',
    invoice: 'lnbc123...',
  },
});

const sanitized = sanitizeLogEntry(entry);
// sanitized.metadata.bankAccount = '******7890'
// sanitized.metadata.invoice = 'lnbc123...xyz'

// Sanitize request body before logging
const body = await request.json();
const sanitizedBody = sanitizeRequestBody(body);
console.log('Request:', sanitizedBody); // Safe to log
```

### Automatic Sanitization

All audit logs are automatically sanitized before being written:

```typescript
export function logAudit(entry: AuditLogEntry): void {
  // Sanitize sensitive data before logging
  const sanitizedEntry = sanitizeLogEntry(entry);
  
  // Log to console or logging service
  console.log('[AUDIT]', JSON.stringify(sanitizedEntry));
}
```

## Security Best Practices

### 1. Never Log Sensitive Data

❌ **Bad:**
```typescript
console.log('Bank account:', bankAccount.accountNumber);
console.log('API key:', process.env.MAVAPAY_API_KEY);
```

✅ **Good:**
```typescript
import { sanitizeString } from '@/lib/ramp-security';

console.log('Bank account:', sanitizeString(bankAccount.accountNumber, 'accountNumber'));
// Output: Bank account: ******7890
```

### 2. Always Use Audit Logging

❌ **Bad:**
```typescript
// No logging
const quote = await client.createQuote(params);
return quote;
```

✅ **Good:**
```typescript
import { logTransactionAttempt } from '@/lib/ramp-security';

const quote = await client.createQuote(params);
logTransactionAttempt(request, 'quote', walletAddress, amount, currency, quote.id);
return quote;
```

### 3. Check Rate Limits First

❌ **Bad:**
```typescript
// Process request without rate limiting
const body = await request.json();
const result = await processRequest(body);
```

✅ **Good:**
```typescript
import { checkQuoteRateLimit } from '@/lib/ramp-security';

// Check rate limit first
const rateLimitCheck = checkQuoteRateLimit(request, body.walletAddress);
if (!rateLimitCheck.allowed) {
  return NextResponse.json({ error: rateLimitCheck.error }, { status: 429 });
}

// Process request
const result = await processRequest(body);
```

### 4. Include Response Time Headers

✅ **Good:**
```typescript
const startTime = Date.now();

try {
  // Process request
  const result = await processRequest();
  
  const duration = Date.now() - startTime;
  return NextResponse.json(result, {
    headers: {
      'X-Response-Time': `${duration}ms`,
      'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
    },
  });
} catch (error) {
  const duration = Date.now() - startTime;
  return NextResponse.json({ error }, {
    status: 500,
    headers: {
      'X-Response-Time': `${duration}ms`,
    },
  });
}
```

## Testing

### Unit Tests

Run security tests:

```bash
npm test -- ramp-security.test.ts
```

### Test Coverage

The test suite covers:

- ✅ Rate limiting for all endpoints
- ✅ Rate limit enforcement (blocking over-limit requests)
- ✅ Bank account number sanitization
- ✅ Lightning invoice sanitization
- ✅ API key sanitization
- ✅ Email address sanitization
- ✅ Request body sanitization
- ✅ Error message sanitization
- ✅ Audit log creation
- ✅ Complete audit flow with sanitization

### Manual Testing

Test rate limiting:

```bash
# Make 21 requests to quote endpoint (limit is 20)
for i in {1..21}; do
  curl -X POST http://localhost:3000/api/ramp/quote \
    -H "Content-Type: application/json" \
    -d '{"direction":"btc-to-ngn","amount":"1000000","sourceCurrency":"BTCSAT","targetCurrency":"NGNKOBO"}'
done

# 21st request should return 429 Too Many Requests
```

Test log sanitization:

```bash
# Check logs for sanitized data
grep "AUDIT" logs.txt | grep "accountNumber"
# Should show: ******7890, not full account number
```

## Monitoring

### Metrics to Track

1. **Rate Limit Hits**
   - Track how often rate limits are exceeded
   - Identify potential abuse patterns
   - Adjust limits if needed

2. **API Response Times**
   - Monitor `X-Response-Time` header
   - Alert on slow responses (>2s)
   - Identify performance bottlenecks

3. **Error Rates**
   - Track validation errors
   - Track API errors
   - Alert on high error rates (>5%)

4. **Transaction Volume**
   - Track transaction attempts per hour
   - Monitor success/failure rates
   - Identify unusual patterns

### Alerts

Set up alerts for:

- Rate limit exceeded >10 times per minute
- API error rate >5%
- Response time >2 seconds
- Webhook processing failures >5%

## Production Deployment

### Environment Variables

Ensure these are set in production:

```bash
# MavaPay API
MAVAPAY_API_KEY=your_production_key
MAVAPAY_WEBHOOK_SECRET=your_webhook_secret

# Logging
LOG_LEVEL=info
LOG_SERVICE=cloudwatch  # or datadog, splunk, etc.
```

### Logging Service Integration

Replace console logging with your logging service:

```typescript
// lib/ramp-security.ts
export function logAudit(entry: AuditLogEntry): void {
  const sanitizedEntry = sanitizeLogEntry(entry);
  
  // Production: Send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Example: CloudWatch
    cloudwatch.putLogEvents({
      logGroupName: '/aws/lambda/mavapay-ramp',
      logStreamName: 'audit-logs',
      logEvents: [{
        timestamp: Date.now(),
        message: JSON.stringify(sanitizedEntry),
      }],
    });
  } else {
    // Development: Console
    console.log('[AUDIT]', JSON.stringify(sanitizedEntry));
  }
}
```

## Compliance

### Data Retention

- Audit logs should be retained for 90 days minimum
- Transaction logs should be retained per regulatory requirements
- Implement automatic log rotation and archival

### GDPR Compliance

- User data can be exported via audit logs
- Implement data deletion on user request
- Sanitize PII (email, phone) in logs

### Security Audits

- Review audit logs regularly
- Monitor for suspicious patterns
- Conduct security audits quarterly

## Troubleshooting

### Rate Limit Issues

**Problem:** Legitimate users hitting rate limits

**Solution:**
1. Check if limits are too restrictive
2. Implement user-specific limits (higher for verified users)
3. Add rate limit bypass for trusted IPs

### Log Volume Issues

**Problem:** Too many logs generated

**Solution:**
1. Adjust log levels (info vs debug)
2. Sample logs (log 1 in 10 requests)
3. Implement log aggregation

### Sanitization False Positives

**Problem:** Non-sensitive data being sanitized

**Solution:**
1. Review regex patterns
2. Add field name exceptions
3. Adjust sanitization rules

## Future Enhancements

1. **Distributed Rate Limiting**
   - Use Redis for multi-instance deployments
   - Share rate limit state across servers

2. **Advanced Threat Detection**
   - Implement anomaly detection
   - Block suspicious IP addresses
   - Add CAPTCHA for high-risk requests

3. **Enhanced Logging**
   - Add request/response correlation IDs
   - Implement distributed tracing
   - Add performance profiling

4. **Compliance Automation**
   - Automated compliance reports
   - Data retention automation
   - GDPR export automation
