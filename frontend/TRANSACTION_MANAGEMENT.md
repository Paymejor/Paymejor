# Transaction Management System

This document describes the comprehensive transaction management and error handling system implemented for the PayMejor application.

## Overview

The transaction management system provides:
- **Transaction History Tracking**: Persistent storage of all transactions with localStorage
- **Status Polling**: Automatic polling with configurable timeouts and retry logic
- **Progress Indicators**: Real-time transaction progress with visual feedback
- **Error Handling**: User-friendly error messages with recovery suggestions
- **Gas Estimation**: Pre-transaction gas fee estimates
- **Confirmation Dialogs**: Transaction confirmation with detailed information
- **Retry Logic**: Automatic retry with exponential backoff for failed transactions
- **Network Awareness**: Network-specific explorer links and configuration

## Architecture

### Core Hooks

#### `useTransactionManager`
Low-level transaction state management hook.

**Features:**
- Transaction history with localStorage persistence
- Transaction status polling with abort controllers
- Progress tracking with real-time updates
- Gas fee estimation
- Transaction filtering and statistics
- Network-aware explorer URLs

**Usage:**
```typescript
import { useTransactionManager } from '@/hooks/useTransactionManager'

function MyComponent() {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    pollTransaction,
    getTransactionProgress,
    estimateGas,
    filterTransactions,
    getStatistics,
  } = useTransactionManager()
  
  // Add a transaction
  addTransaction({
    id: 'tx_123',
    hash: '0x...',
    type: 'deposit',
    status: 'pending',
    timestamp: Date.now(),
    explorerUrl: 'https://...',
  })
  
  // Poll for confirmation
  await pollTransaction('0x...')
  
  // Get progress
  const progress = getTransactionProgress('0x...')
}
```

#### `useErrorHandler`
Comprehensive error handling with validation and retry logic.

**Features:**
- Error parsing and classification
- User-friendly error messages
- Recovery suggestions
- Automatic retry with exponential backoff
- Input validation helpers
- Error logging

**Usage:**
```typescript
import { useErrorHandler, createAmountValidator, createWalletValidator } from '@/hooks/useErrorHandler'

function MyComponent() {
  const {
    error,
    handleError,
    clearError,
    retryWithBackoff,
    validateAndExecute,
    errorMessage,
    errorSuggestions,
    canRetry,
  } = useErrorHandler()
  
  const handleAction = async () => {
    try {
      await validateAndExecute(
        [
          createWalletValidator(isConnected),
          createAmountValidator(amount, balance, 8),
        ],
        async () => {
          // Your transaction logic
        }
      )
    } catch (err) {
      // Error is automatically handled
    }
  }
}
```

#### `useTransaction`
High-level transaction wrapper combining all features.

**Features:**
- Transaction execution with full error handling
- Confirmation dialogs with gas estimates
- Automatic polling and progress tracking
- Retry logic
- Network validation

**Usage:**
```typescript
import { useTransaction } from '@/hooks/useTransaction'

function MyComponent() {
  const {
    executeWithConfirmation,
    currentTransaction,
    isExecuting,
    confirmationDialog,
    showConfirmation,
    error,
    clearError,
    retry,
  } = useTransaction()
  
  const handleDeposit = async () => {
    try {
      const txHash = await executeWithConfirmation(
        {
          contractAddress: '0x...',
          entrypoint: 'deposit',
          calldata: ['1000000'],
          type: 'deposit',
          description: 'Deposit 1 wBTC',
          amount: '1',
          token: 'wBTC',
        },
        {
          title: 'Confirm Deposit',
          description: 'You are about to deposit wBTC as collateral',
          amount: '1',
          token: 'wBTC',
        }
      )
      
      console.log('Transaction submitted:', txHash)
    } catch (err) {
      console.error('Transaction failed:', err)
    }
  }
}
```

### UI Components

#### `TransactionProgress`
Displays real-time transaction progress.

**Props:**
- `progress`: TransactionProgress object
- `onViewExplorer`: Callback to view on explorer
- `onDismiss`: Callback to dismiss

**Features:**
- Status icons (pending, confirming, confirmed, failed)
- Progress bar with percentage
- Confirmation counter
- Time elapsed
- Explorer link

#### `TransactionConfirmationDialog`
Shows transaction details before execution.

**Props:**
- `open`: Dialog open state
- `confirmation`: TransactionConfirmation object

**Features:**
- Transaction details display
- Gas fee estimate
- Amount and recipient
- Confirm/Cancel actions
- Error display

#### `TransactionHistory`
Displays transaction history with filtering.

**Props:**
- `transactions`: Array of TransactionHistoryEntry
- `onRetry`: Callback to retry failed transaction
- `onClear`: Callback to clear history
- `onViewExplorer`: Callback to view on explorer

**Features:**
- Transaction list with status badges
- Type and status filtering
- Retry button for failed transactions
- Explorer links
- Relative timestamps

#### `ErrorDisplay`
Shows user-friendly error messages.

**Props:**
- `error`: Error object
- `onRetry`: Callback to retry
- `onDismiss`: Callback to dismiss

**Features:**
- Error message display
- Recovery suggestions
- Retry button (if retryable)
- Dismiss button

#### `GasEstimateDisplay`
Shows gas fee estimates.

**Props:**
- `estimate`: GasFeeEstimate object
- `isLoading`: Loading state
- `error`: Error message

**Features:**
- Estimated fee display
- USD value (if available)
- Max fee display
- Suggested max fee
- Loading skeleton

## Error Handling

### Error Types

The system recognizes these error types:
- `WALLET_NOT_CONNECTED`: Wallet not connected
- `INSUFFICIENT_BALANCE`: Insufficient token balance
- `INSUFFICIENT_COLLATERAL`: Insufficient collateral for borrow
- `TRANSACTION_FAILED`: Transaction execution failed
- `TRANSACTION_REJECTED`: User rejected transaction
- `NETWORK_ERROR`: Network/RPC error
- `CONTRACT_ERROR`: Smart contract error
- `BRIDGE_PENDING`: Bridge transaction pending
- `BRIDGE_FAILED`: Bridge transaction failed
- `APPROVAL_FAILED`: Token approval failed
- `SLIPPAGE_EXCEEDED`: Price slippage exceeded
- `INVALID_AMOUNT`: Invalid amount input
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `TIMEOUT`: Request timeout
- `UNKNOWN`: Unknown error

### Error Messages

Each error type has:
- **User-friendly message**: Clear, actionable message
- **Recovery suggestions**: Step-by-step suggestions
- **Retry capability**: Automatic retry for retryable errors

### Validation Helpers

```typescript
import {
  createAmountValidator,
  createNetworkValidator,
  createWalletValidator,
  createBalanceValidator,
} from '@/hooks/useErrorHandler'

// Validate amount
const amountValidator = createAmountValidator(amount, balance, decimals)

// Validate network
const networkValidator = createNetworkValidator('sepolia', currentNetwork)

// Validate wallet connection
const walletValidator = createWalletValidator(isConnected)

// Validate minimum balance
const balanceValidator = createBalanceValidator(balance, minBalance)
```

## Transaction Polling

### Configuration

```typescript
interface TransactionPollingConfig {
  interval: number // Polling interval in ms (default: 10000)
  timeout: number // Timeout in ms (default: 300000)
  maxAttempts: number // Max attempts (default: 60)
}
```

### Usage

```typescript
const { pollTransaction } = useTransactionManager()

// Poll with default config
await pollTransaction('0x...')

// Poll with custom config
await pollTransaction('0x...', {
  interval: 5000,
  timeout: 120000,
  maxAttempts: 24,
})
```

### Abort Polling

Polling operations are automatically aborted when:
- Component unmounts
- New polling operation starts for same transaction
- Timeout is reached
- Transaction is confirmed or failed

## Gas Estimation

### Usage

```typescript
const { estimateGas } = useTransactionManager()

const estimate = await estimateGas({
  contractAddress: '0x...',
  entrypoint: 'deposit',
  calldata: ['1000000'],
})

console.log('Estimated fee:', estimate.estimatedFee)
console.log('Max fee:', estimate.maxFee)
console.log('Suggested max fee:', estimate.suggestedMaxFee)
```

## Transaction History

### Storage

Transactions are stored in localStorage per network:
- Key: `tx_history_${network}`
- Format: JSON array of TransactionHistoryEntry

### Filtering

```typescript
const { filterTransactions } = useTransactionManager()

// Filter by type
const deposits = filterTransactions({ type: 'deposit' })

// Filter by status
const pending = filterTransactions({ status: 'pending' })

// Filter by date range
const recent = filterTransactions({
  startDate: Date.now() - 86400000, // Last 24 hours
})

// Multiple filters
const failedDeposits = filterTransactions({
  type: 'deposit',
  status: 'failed',
  network: 'sepolia',
})
```

### Statistics

```typescript
const { getStatistics } = useTransactionManager()

const stats = getStatistics()
console.log('Total transactions:', stats.total)
console.log('Pending:', stats.pending)
console.log('Confirmed:', stats.confirmed)
console.log('Failed:', stats.failed)
console.log('Total gas spent:', stats.totalGasSpent)
console.log('Avg confirmation time:', stats.averageConfirmationTime)
```

## Retry Logic

### Automatic Retry

```typescript
const { retryWithBackoff } = useErrorHandler()

// Retry with default config (3 attempts, exponential backoff)
await retryWithBackoff(async () => {
  // Your transaction logic
})

// Retry with custom config
await retryWithBackoff(
  async () => {
    // Your transaction logic
  },
  5 // Max retries
)
```

### Manual Retry

```typescript
const { retryTransaction } = useTransactionManager()

// Retry a failed transaction
await retryTransaction('tx_123', {
  maxRetries: 3,
  retryDelay: 2000,
  exponentialBackoff: true,
})
```

## Network Awareness

All components and hooks are network-aware:
- Explorer URLs automatically use correct network
- Transaction history stored per network
- Contract addresses loaded per network
- Network validation before transactions

## Best Practices

1. **Always use confirmation dialogs for user-initiated transactions**
   ```typescript
   await executeWithConfirmation(params, confirmationData)
   ```

2. **Validate inputs before execution**
   ```typescript
   await validateAndExecute([validators], async () => {
     // Transaction logic
   })
   ```

3. **Display errors with recovery suggestions**
   ```typescript
   {error && <ErrorDisplay error={error} onRetry={retry} onDismiss={clearError} />}
   ```

4. **Show transaction progress**
   ```typescript
   {currentTransaction && (
     <TransactionProgress
       progress={getTransactionProgress(currentTransaction.hash)}
       onViewExplorer={() => window.open(currentTransaction.explorerUrl)}
     />
   )}
   ```

5. **Provide transaction history**
   ```typescript
   <TransactionHistory
     transactions={transactions}
     onRetry={retryTransaction}
     onClear={clearHistory}
     onViewExplorer={(url) => window.open(url, '_blank')}
   />
   ```

## Requirements Satisfied

- **TR-4.23**: Transaction history tracking ✓
- **TR-4.24**: Transaction status polling with timeouts ✓
- **TR-4.25**: User-friendly error messages ✓
- **TR-4.31**: Transaction retry logic ✓
- **TR-4.32**: Transaction confirmation dialogs ✓
- **NFR-5.2**: Transaction status updates within 10 seconds ✓
- **NFR-5.7**: Real transaction costs displayed ✓
- **NFR-5.8**: Error messages are user-friendly and actionable ✓

## Testing

To test the transaction management system:

1. **Transaction Execution**
   - Execute a transaction and verify it appears in history
   - Check that polling starts automatically
   - Verify progress updates in real-time

2. **Error Handling**
   - Trigger various error types
   - Verify user-friendly messages appear
   - Check recovery suggestions are relevant
   - Test retry functionality

3. **Gas Estimation**
   - Request gas estimate before transaction
   - Verify estimate appears in confirmation dialog
   - Check estimate is reasonable

4. **Transaction History**
   - Execute multiple transactions
   - Verify all appear in history
   - Test filtering by type and status
   - Check statistics are accurate

5. **Network Switching**
   - Switch networks
   - Verify transaction history is network-specific
   - Check explorer links use correct network
