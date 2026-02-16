'use client'

/**
 * TransactionManagerExample Component
 * 
 * Example integration showing how to use the transaction management system
 * This demonstrates:
 * - Transaction execution with confirmation
 * - Error handling with retry
 * - Gas estimation display
 * - Transaction progress tracking
 * - Transaction history
 * 
 * Requirements: TR-4.23, TR-4.24, TR-4.25, TR-4.31, TR-4.32, NFR-5.2, NFR-5.7, NFR-5.8
 * 
 * Usage in other components:
 * 
 * ```tsx
 * import { useTransaction } from '@/hooks/useTransaction'
 * import { useTransactionManager } from '@/hooks/useTransactionManager'
 * import { TransactionProgress } from '@/components/transaction-progress'
 * import { TransactionConfirmationDialog } from '@/components/transaction-confirmation-dialog'
 * import { ErrorDisplay } from '@/components/error-display'
 * 
 * function MyComponent() {
 *   const {
 *     executeWithConfirmation,
 *     currentTransaction,
 *     isExecuting,
 *     confirmationDialog,
 *     showConfirmation,
 *     error,
 *     clearError,
 *     retry,
 *   } = useTransaction()
 *   
 *   const { getTransactionProgress } = useTransactionManager()
 *   
 *   const handleDeposit = async () => {
 *     try {
 *       const txHash = await executeWithConfirmation(
 *         {
 *           contractAddress: '0x...',
 *           entrypoint: 'deposit',
 *           calldata: ['1000000'],
 *           type: 'deposit',
 *           description: 'Deposit 1 wBTC',
 *           amount: '1',
 *           token: 'wBTC',
 *         },
 *         {
 *           title: 'Confirm Deposit',
 *           description: 'You are about to deposit wBTC as collateral',
 *           amount: '1',
 *           token: 'wBTC',
 *         }
 *       )
 *       
 *       console.log('Transaction submitted:', txHash)
 *     } catch (err) {
 *       console.error('Transaction failed:', err)
 *     }
 *   }
 *   
 *   return (
 *     <div>
 *       <button onClick={handleDeposit} disabled={isExecuting}>
 *         Deposit
 *       </button>
 *       
 *       {error && (
 *         <ErrorDisplay
 *           error={error}
 *           onRetry={retry}
 *           onDismiss={clearError}
 *         />
 *       )}
 *       
 *       {currentTransaction && (
 *         <TransactionProgress
 *           progress={getTransactionProgress(currentTransaction.hash)}
 *           onViewExplorer={() => window.open(currentTransaction.explorerUrl, '_blank')}
 *         />
 *       )}
 *       
 *       {showConfirmation && confirmationDialog && (
 *         <TransactionConfirmationDialog
 *           open={showConfirmation}
 *           confirmation={confirmationDialog}
 *         />
 *       )}
 *     </div>
 *   )
 * }
 * ```
 * 
 * For transaction history:
 * 
 * ```tsx
 * import { useTransactionManager } from '@/hooks/useTransactionManager'
 * import { TransactionHistory } from '@/components/transaction-history'
 * 
 * function HistoryComponent() {
 *   const {
 *     transactions,
 *     retryTransaction,
 *     clearHistory,
 *   } = useTransactionManager()
 *   
 *   return (
 *     <TransactionHistory
 *       transactions={transactions}
 *       onRetry={retryTransaction}
 *       onClear={clearHistory}
 *       onViewExplorer={(url) => window.open(url, '_blank')}
 *     />
 *   )
 * }
 * ```
 * 
 * For error handling only:
 * 
 * ```tsx
 * import { useErrorHandler, createAmountValidator, createWalletValidator } from '@/hooks/useErrorHandler'
 * 
 * function MyComponent() {
 *   const { validateAndExecute, error, clearError } = useErrorHandler()
 *   const { isConnected } = useWallet()
 *   
 *   const handleAction = async () => {
 *     try {
 *       await validateAndExecute(
 *         [
 *           createWalletValidator(isConnected),
 *           createAmountValidator(amount, balance, 8),
 *         ],
 *         async () => {
 *           // Your transaction logic here
 *         }
 *       )
 *     } catch (err) {
 *       // Error is already set in the hook
 *     }
 *   }
 *   
 *   return (
 *     <div>
 *       {error && <ErrorDisplay error={error} onDismiss={clearError} />}
 *       <button onClick={handleAction}>Execute</button>
 *     </div>
 *   )
 * }
 * ```
 */

export function TransactionManagerExample() {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-2xl font-bold">Transaction Management System</h2>
      <p className="text-muted-foreground">
        See the code comments above for usage examples.
      </p>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Features:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Transaction history tracking with localStorage persistence</li>
          <li>Transaction status polling with configurable timeouts</li>
          <li>Transaction progress indicators with real-time updates</li>
          <li>Network-aware Voyager explorer links</li>
          <li>User-friendly error messages with recovery suggestions</li>
          <li>Automatic retry logic with exponential backoff</li>
          <li>Transaction confirmation dialogs with gas estimates</li>
          <li>Gas fee estimation before execution</li>
          <li>Input validation helpers</li>
          <li>Transaction filtering and statistics</li>
        </ul>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Components:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><code>useTransaction</code> - High-level transaction wrapper</li>
          <li><code>useTransactionManager</code> - Transaction state management</li>
          <li><code>useErrorHandler</code> - Error handling and validation</li>
          <li><code>TransactionProgress</code> - Progress indicator UI</li>
          <li><code>TransactionConfirmationDialog</code> - Confirmation dialog UI</li>
          <li><code>TransactionHistory</code> - Transaction history UI</li>
          <li><code>ErrorDisplay</code> - Error message UI</li>
          <li><code>GasEstimateDisplay</code> - Gas estimate UI</li>
        </ul>
      </div>
    </div>
  )
}
