# MavaPay Ramp Error Handling Guide

This document describes the error handling system for MavaPay on/off-ramp operations.

## Overview

The error handling system provides:
- User-friendly error messages (Requirement 8.1-8.5)
- Automatic retry logic for transient failures (Requirement 8.1)
- Support contact information for critical failures (Requirement 8.2)
- Bank account validation before submission (Requirement 8.3)
- Maintenance messages for API unavailability (Requirement 8.4)
- Webhook polling fallback (Requirement 8.5)

## Error Types

### MavaPay-Specific Errors

1. **LIGHTNING_PAYMENT_FAILED** (Requirement 8.1)
   - Lightning payment could not be completed
   - Retryable: Yes
   - Support contact: support@mavapay.co

2. **BANK_PAYOUT_FAILED** (Requirement 8.2)
   - Bank payout could not be processed
   - Retryable: No
   - Support contact: support@mavapay.co

3. **INVALID_BANK_ACCOUNT** (Requirement 8.3)
   - Bank account details are invalid
   - Retryable: No
   - Validation: 10-digit account number

4. **MAVAPAY_API_UNAVAILABLE** (Requirement 8.4)
   - MavaPay service is temporarily unavailable
   - Retryable: Yes
   - Status page: https://status.mavapay.co

5. **QUOTE_EXPIRED**
   - Quote has expired (5-minute validity)
   - Retryable: Yes (fetch new quote)

6. **MINIMUM_AMOUNT_NOT_MET** (Requirement 7.1)
   - Amount is below minimum (₦2,000)
   - Retryable: No

7. **MAXIMUM_AMOUNT_EXCEEDED** (Requirement 7.3)
   - Amount exceeds maximum limit
   - Retryable: No

8. **WEBHOOK_NOT_RECEIVED** (Requirement 8.5)
   - Transaction status update delayed
   - Retryable: Yes (poll API)

## Components

### ErrorDisplay

Displays user-friendly error messages with recovery suggestions.

```tsx
import { ErrorDisplay } from '@/components/error-display'

function MyComponent() {
  const [error, setError] = useState<Error | null>(null)

  return (
    <ErrorDisplay
      error={error}
      onRetry={() => {
        // Retry logic
        setError(null)
        retryOperation()
      }}
      onDismiss={() => setError(null)}
    />
  )
}
```

### MaintenanceMessage

Displays maintenance notices for API unavailability.

```tsx
import { MaintenanceMessage } from '@/components/maintenance-message'

function MyComponent() {
  return (
    <MaintenanceMessage
      service="MavaPay"
      estimatedRestoration="2 hours"
      statusPageUrl="https://status.mavapay.co"
    />
  )
}
```

### RampErrorHandler

Specialized error handler for ramp operations that automatically shows maintenance messages or error displays.

```tsx
import { RampErrorHandler } from '@/components/ramp-error-handler'

function RampComponent() {
  const { error, retry } = useMavaPay()

  return (
    <RampErrorHandler
      error={error}
      onRetry={retry}
      onDismiss={() => clearError()}
    />
  )
}
```

## Hooks

### useErrorHandler

Comprehensive error handling hook with validation and retry logic.

```tsx
import { useErrorHandler, createMinimumAmountValidator } from '@/hooks/useErrorHandler'

function MyComponent() {
  const {
    error,
    handleError,
    retryWithBackoff,
    validateAndExecute,
    clearError,
  } = useErrorHandler()

  const handleOffRamp = async () => {
    try {
      await validateAndExecute(
        [
          createMinimumAmountValidator(amountInKobo, 200000),
          createBankAccountValidator(accountNumber, bankName),
        ],
        async () => {
          // Execute off-ramp
          return await initiateOffRamp(params)
        }
      )
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div>
      {error && <ErrorDisplay error={error} onDismiss={clearError} />}
      <button onClick={handleOffRamp}>Off-Ramp</button>
    </div>
  )
}
```

## Validation Helpers

### Bank Account Validation (Requirement 8.3)

```tsx
import { createBankAccountValidator } from '@/hooks/useErrorHandler'

const validator = createBankAccountValidator(accountNumber, bankName)
const error = validator()

if (error) {
  // Handle validation error
  console.error(error.message)
}
```

### Minimum Amount Validation (Requirement 7.1)

```tsx
import { createMinimumAmountValidator } from '@/hooks/useErrorHandler'

const validator = createMinimumAmountValidator(
  amountInKobo,
  200000 // ₦2,000 minimum
)
const error = validator()

if (error) {
  // Handle validation error
  console.error(error.message)
}
```

### Quote Expiry Validation

```tsx
import { createQuoteExpiryValidator } from '@/hooks/useErrorHandler'

const validator = createQuoteExpiryValidator(quote.expiry)
const error = validator()

if (error) {
  // Quote expired, fetch new quote
  fetchNewQuote()
}
```

## Retry Logic

### Automatic Retry with Exponential Backoff (Requirement 8.1)

```tsx
import { useErrorHandler } from '@/hooks/useErrorHandler'

function MyComponent() {
  const { retryWithBackoff } = useErrorHandler()

  const handleOperation = async () => {
    try {
      const result = await retryWithBackoff(
        async () => {
          // Operation that might fail
          return await fetchQuote(params)
        },
        3 // Max 3 retries
      )
      
      console.log('Success:', result)
    } catch (err) {
      console.error('Failed after retries:', err)
    }
  }

  return <button onClick={handleOperation}>Execute</button>
}
```

### Manual Retry

```tsx
function MyComponent() {
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 3

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      console.error('Max retries exceeded')
      return
    }

    setRetryCount(prev => prev + 1)
    
    try {
      await executeOperation()
      setRetryCount(0) // Reset on success
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <ErrorDisplay
      error={error}
      onRetry={retryCount < maxRetries ? handleRetry : undefined}
    />
  )
}
```

## Support Contact Information (Requirement 8.2)

The error handling system automatically displays support contact information for critical failures:

```tsx
import { getSupportContact } from '@/lib/error-handling'

const supportInfo = getSupportContact(error)

if (supportInfo) {
  console.log('Email:', supportInfo.email)
  console.log('Status Page:', supportInfo.statusPage)
  console.log('Message:', supportInfo.message)
}
```

Support is automatically shown for:
- Bank payout failures
- Lightning payment failures
- Webhook delays
- API unavailability

## Error Logging

All errors are automatically logged with context:

```tsx
import { formatErrorForLogging } from '@/lib/error-handling'

try {
  await operation()
} catch (err) {
  const logMessage = formatErrorForLogging(err)
  console.error(logMessage)
  
  // Send to monitoring service
  sendToMonitoring(logMessage)
}
```

## Best Practices

1. **Always validate before submission** (Requirement 8.3)
   ```tsx
   await validateAndExecute(
     [validator1, validator2],
     async () => await operation()
   )
   ```

2. **Use retry logic for transient failures** (Requirement 8.1)
   ```tsx
   await retryWithBackoff(operation, 3)
   ```

3. **Show maintenance messages for API unavailability** (Requirement 8.4)
   ```tsx
   <RampErrorHandler error={error} />
   ```

4. **Provide support contact for critical failures** (Requirement 8.2)
   ```tsx
   // Automatically handled by ErrorDisplay component
   <ErrorDisplay error={error} />
   ```

5. **Poll API when webhooks are delayed** (Requirement 8.5)
   ```tsx
   if (error.type === ErrorType.WEBHOOK_NOT_RECEIVED) {
     // Start polling
     pollTransactionStatus(transactionId)
   }
   ```

## Testing

Test error handling with different error types:

```tsx
import { AppError, ErrorType } from '@/lib/error-handling'

// Test Lightning payment failure
const error1 = new AppError(
  ErrorType.LIGHTNING_PAYMENT_FAILED,
  'Lightning payment failed'
)

// Test bank payout failure
const error2 = new AppError(
  ErrorType.BANK_PAYOUT_FAILED,
  'Bank payout failed'
)

// Test API unavailability
const error3 = new AppError(
  ErrorType.MAVAPAY_API_UNAVAILABLE,
  'MavaPay API unavailable'
)
```

## Integration Example

Complete example integrating all error handling features:

```tsx
import { useState } from 'react'
import { RampErrorHandler } from '@/components/ramp-error-handler'
import { 
  useErrorHandler,
  createMinimumAmountValidator,
  createBankAccountValidator,
  createQuoteExpiryValidator,
} from '@/hooks/useErrorHandler'
import { useMavaPay } from '@/hooks/useMavaPay'

function RampComponent() {
  const { initiateOffRamp, quote } = useMavaPay()
  const {
    error,
    handleError,
    validateAndExecute,
    retryWithBackoff,
    clearError,
  } = useErrorHandler()

  const [amount, setAmount] = useState('')
  const [bankAccount, setBankAccount] = useState('')

  const handleSubmit = async () => {
    try {
      // Validate and execute with retry
      await retryWithBackoff(async () => {
        return await validateAndExecute(
          [
            createMinimumAmountValidator(Number(amount), 200000),
            createBankAccountValidator(bankAccount, 'Access Bank'),
            createQuoteExpiryValidator(quote?.expiry || ''),
          ],
          async () => {
            return await initiateOffRamp({
              quoteId: quote!.id,
              bankAccountId: bankAccount,
              walletAddress: address!,
            })
          }
        )
      }, 3)
      
      // Success
      console.log('Off-ramp initiated successfully')
    } catch (err) {
      handleError(err)
    }
  }

  return (
    <div>
      <RampErrorHandler
        error={error}
        onRetry={handleSubmit}
        onDismiss={clearError}
      />
      
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount in NGN"
      />
      
      <button onClick={handleSubmit}>
        Submit Off-Ramp
      </button>
    </div>
  )
}
```
