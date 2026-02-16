/**
 * Enhanced transaction management types
 * 
 * Requirements: TR-4.23, TR-4.24, NFR-5.2
 */

import { TransactionState } from './starknet'

/**
 * Extended transaction state with additional metadata
 */
export interface EnhancedTransactionState extends TransactionState {
  id: string // Unique identifier for the transaction
  description?: string // Human-readable description
  amount?: string // Transaction amount (if applicable)
  token?: string // Token address (if applicable)
  error?: string // Error message if failed
  retryCount?: number // Number of retry attempts
  confirmations?: number // Number of confirmations
  estimatedGas?: string // Estimated gas fee
  actualGas?: string // Actual gas used
}

/**
 * Transaction history entry
 */
export interface TransactionHistoryEntry {
  transaction: EnhancedTransactionState
  createdAt: number
  updatedAt: number
  network: 'sepolia' | 'mainnet'
}

/**
 * Transaction polling configuration
 */
export interface TransactionPollingConfig {
  interval: number // Polling interval in ms
  timeout: number // Timeout in ms
  maxAttempts: number // Maximum polling attempts
}

/**
 * Transaction confirmation dialog data
 */
export interface TransactionConfirmation {
  title: string
  description: string
  amount?: string
  token?: string
  estimatedGas?: string
  recipient?: string
  onConfirm: () => Promise<void>
  onCancel: () => void
}

/**
 * Transaction progress indicator
 */
export interface TransactionProgress {
  transactionHash: string
  status: 'pending' | 'confirming' | 'confirmed' | 'failed'
  progress: number // 0-100
  message: string
  confirmations?: number
  requiredConfirmations?: number
}

/**
 * Transaction retry options
 */
export interface TransactionRetryOptions {
  maxRetries: number
  retryDelay: number // Delay between retries in ms
  exponentialBackoff: boolean
}

/**
 * Gas fee estimate
 */
export interface GasFeeEstimate {
  estimatedFee: string // In wei
  estimatedFeeUSD?: string // In USD
  maxFee: string // Maximum fee willing to pay
  suggestedMaxFee: string // Suggested max fee
}

/**
 * Transaction filter options
 */
export interface TransactionFilterOptions {
  type?: TransactionState['type'] | TransactionState['type'][]
  status?: TransactionState['status'] | TransactionState['status'][]
  network?: 'sepolia' | 'mainnet'
  startDate?: number
  endDate?: number
}

/**
 * Transaction statistics
 */
export interface TransactionStatistics {
  total: number
  pending: number
  confirmed: number
  failed: number
  totalGasSpent: string
  averageConfirmationTime: number // In seconds
}
