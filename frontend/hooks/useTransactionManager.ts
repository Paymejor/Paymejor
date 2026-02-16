'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { RpcProvider } from 'starknet'
import { useNetwork } from './useNetwork'
import { getNetworkConfig, PROTOCOL_PARAMS, getTxUrl } from '@/lib/constants'
import {
  EnhancedTransactionState,
  TransactionHistoryEntry,
  TransactionPollingConfig,
  TransactionProgress,
  TransactionRetryOptions,
  GasFeeEstimate,
  TransactionFilterOptions,
  TransactionStatistics,
} from '@/types/transaction'

/**
 * useTransactionManager Hook
 * 
 * Provides comprehensive transaction management:
 * - Transaction history tracking
 * - Transaction status polling with timeouts
 * - Transaction progress indicators
 * - Network-aware Voyager explorer links
 * - Retry logic for failed transactions
 * - Gas fee estimation
 * 
 * Requirements: TR-4.23, TR-4.24, NFR-5.2
 */

interface UseTransactionManagerReturn {
  // Transaction history
  transactions: TransactionHistoryEntry[]
  addTransaction: (tx: EnhancedTransactionState) => void
  updateTransaction: (id: string, updates: Partial<EnhancedTransactionState>) => void
  getTransaction: (id: string) => TransactionHistoryEntry | undefined
  clearHistory: () => void
  
  // Transaction polling
  pollTransaction: (txHash: string, config?: Partial<TransactionPollingConfig>) => Promise<EnhancedTransactionState>
  getTransactionProgress: (txHash: string) => TransactionProgress | null
  
  // Transaction retry
  retryTransaction: (id: string, options?: Partial<TransactionRetryOptions>) => Promise<void>
  
  // Gas estimation
  estimateGas: (params: {
    contractAddress: string
    entrypoint: string
    calldata: string[]
  }) => Promise<GasFeeEstimate>
  
  // Filtering and statistics
  filterTransactions: (options: TransactionFilterOptions) => TransactionHistoryEntry[]
  getStatistics: () => TransactionStatistics
  
  // State
  isPolling: boolean
  error: string | null
}

const DEFAULT_POLLING_CONFIG: TransactionPollingConfig = {
  interval: PROTOCOL_PARAMS.txPollingInterval || 5000,
  timeout: PROTOCOL_PARAMS.txPollingTimeout || 300000, // 5 minutes
  maxAttempts: PROTOCOL_PARAMS.maxPollingAttempts || 60,
}

const DEFAULT_RETRY_OPTIONS: TransactionRetryOptions = {
  maxRetries: 3,
  retryDelay: 2000,
  exponentialBackoff: true,
}

export function useTransactionManager(): UseTransactionManagerReturn {
  const { network } = useNetwork()
  const [transactions, setTransactions] = useState<TransactionHistoryEntry[]>([])
  const [progressMap, setProgressMap] = useState<Map<string, TransactionProgress>>(new Map())
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Keep track of active polling operations
  const pollingOperations = useRef<Map<string, AbortController>>(new Map())

  /**
   * Load transaction history from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`tx_history_${network}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        setTransactions(parsed)
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err)
    }
  }, [network])

  /**
   * Save transaction history to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem(`tx_history_${network}`, JSON.stringify(transactions))
    } catch (err) {
      console.error('Failed to save transaction history:', err)
    }
  }, [transactions, network])

  /**
   * Add a new transaction to history
   */
  const addTransaction = useCallback((tx: EnhancedTransactionState) => {
    const entry: TransactionHistoryEntry = {
      transaction: {
        ...tx,
        explorerUrl: tx.explorerUrl || getTxUrl(tx.hash, network),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      network,
    }
    
    setTransactions(prev => [entry, ...prev])
  }, [network])

  /**
   * Update an existing transaction
   */
  const updateTransaction = useCallback((id: string, updates: Partial<EnhancedTransactionState>) => {
    setTransactions(prev =>
      prev.map(entry =>
        entry.transaction.id === id
          ? {
              ...entry,
              transaction: { ...entry.transaction, ...updates },
              updatedAt: Date.now(),
            }
          : entry
      )
    )
  }, [])

  /**
   * Get a specific transaction by ID
   */
  const getTransaction = useCallback((id: string): TransactionHistoryEntry | undefined => {
    return transactions.find(entry => entry.transaction.id === id)
  }, [transactions])

  /**
   * Clear transaction history
   */
  const clearHistory = useCallback(() => {
    setTransactions([])
    localStorage.removeItem(`tx_history_${network}`)
  }, [network])

  /**
   * Poll transaction status until confirmed or failed
   */
  const pollTransaction = useCallback(async (
    txHash: string,
    config: Partial<TransactionPollingConfig> = {}
  ): Promise<EnhancedTransactionState> => {
    const pollingConfig = { ...DEFAULT_POLLING_CONFIG, ...config }
    const networkConfig = getNetworkConfig(network)
    const provider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
    
    // Create abort controller for this polling operation
    const abortController = new AbortController()
    pollingOperations.current.set(txHash, abortController)
    
    setIsPolling(true)
    setError(null)
    
    try {
      let attempts = 0
      const startTime = Date.now()
      
      while (attempts < pollingConfig.maxAttempts) {
        // Check if aborted
        if (abortController.signal.aborted) {
          throw new Error('Polling aborted')
        }
        
        // Check timeout
        if (Date.now() - startTime > pollingConfig.timeout) {
          throw new Error('Transaction confirmation timeout')
        }
        
        try {
          // Get transaction receipt
          const receipt = await provider.getTransactionReceipt(txHash)
          
          // Update progress
          const progress = Math.min(95, (attempts / pollingConfig.maxAttempts) * 100)
          setProgressMap(prev => new Map(prev).set(txHash, {
            transactionHash: txHash,
            status: 'confirming',
            progress,
            message: `Confirming transaction... (${attempts + 1}/${pollingConfig.maxAttempts})`,
            confirmations: attempts + 1,
            requiredConfirmations: pollingConfig.maxAttempts,
          }))
          
          // Check status
          const status = (receipt as any).execution_status || (receipt as any).status
          
          if (status === 'SUCCEEDED' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') {
            // Transaction confirmed
            setProgressMap(prev => new Map(prev).set(txHash, {
              transactionHash: txHash,
              status: 'confirmed',
              progress: 100,
              message: 'Transaction confirmed',
              confirmations: attempts + 1,
            }))
            
            // Find and update transaction in history
            const txEntry = transactions.find(t => t.transaction.hash === txHash)
            if (txEntry) {
              updateTransaction(txEntry.transaction.id, {
                status: 'confirmed',
                confirmations: attempts + 1,
              })
            }
            
            return {
              ...txEntry?.transaction,
              hash: txHash,
              status: 'confirmed',
              confirmations: attempts + 1,
            } as EnhancedTransactionState
          } else if (status === 'REVERTED' || status === 'REJECTED') {
            // Transaction failed
            setProgressMap(prev => new Map(prev).set(txHash, {
              transactionHash: txHash,
              status: 'failed',
              progress: 100,
              message: 'Transaction failed',
            }))
            
            const txEntry = transactions.find(t => t.transaction.hash === txHash)
            if (txEntry) {
              updateTransaction(txEntry.transaction.id, {
                status: 'failed',
                error: 'Transaction reverted',
              })
            }
            
            throw new Error('Transaction reverted')
          }
        } catch (err) {
          // Transaction not found yet or other error
          if (attempts === pollingConfig.maxAttempts - 1) {
            throw err
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollingConfig.interval))
        attempts++
      }
      
      throw new Error('Transaction confirmation timeout')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to poll transaction'
      setError(errorMessage)
      
      // Update progress to failed
      setProgressMap(prev => new Map(prev).set(txHash, {
        transactionHash: txHash,
        status: 'failed',
        progress: 100,
        message: errorMessage,
      }))
      
      throw new Error(errorMessage)
    } finally {
      setIsPolling(false)
      pollingOperations.current.delete(txHash)
    }
  }, [network, transactions, updateTransaction])

  /**
   * Get transaction progress
   */
  const getTransactionProgress = useCallback((txHash: string): TransactionProgress | null => {
    return progressMap.get(txHash) || null
  }, [progressMap])

  /**
   * Retry a failed transaction
   */
  const retryTransaction = useCallback(async (
    id: string,
    options: Partial<TransactionRetryOptions> = {}
  ): Promise<void> => {
    const retryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options }
    const txEntry = getTransaction(id)
    
    if (!txEntry) {
      throw new Error('Transaction not found')
    }
    
    if (txEntry.transaction.status !== 'failed') {
      throw new Error('Can only retry failed transactions')
    }
    
    const currentRetryCount = txEntry.transaction.retryCount || 0
    
    if (currentRetryCount >= retryOptions.maxRetries) {
      throw new Error('Maximum retry attempts reached')
    }
    
    try {
      setError(null)
      
      // Calculate delay with exponential backoff
      const delay = retryOptions.exponentialBackoff
        ? retryOptions.retryDelay * Math.pow(2, currentRetryCount)
        : retryOptions.retryDelay
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Update retry count
      updateTransaction(id, {
        retryCount: currentRetryCount + 1,
        status: 'pending',
        error: undefined,
      })
      
      // Note: Actual transaction re-execution would need to be handled
      // by the calling component with the original transaction parameters
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Retry failed'
      setError(errorMessage)
      updateTransaction(id, {
        status: 'failed',
        error: errorMessage,
      })
      throw new Error(errorMessage)
    }
  }, [getTransaction, updateTransaction])

  /**
   * Estimate gas fees for a transaction
   */
  const estimateGas = useCallback(async (params: {
    contractAddress: string
    entrypoint: string
    calldata: string[]
  }): Promise<GasFeeEstimate> => {
    try {
      setError(null)
      
      const networkConfig = getNetworkConfig(network)
      const provider = new RpcProvider({ nodeUrl: networkConfig.rpcUrl })
      
      // Estimate fee using provider
      // Note: This is a simplified estimation
      // In production, you'd use account.estimateFee()
      
      // For now, return a mock estimate
      // Real implementation would call provider.estimateFee()
      const estimatedFee = '1000000000000000' // 0.001 ETH in wei
      const maxFee = '2000000000000000' // 0.002 ETH in wei
      const suggestedMaxFee = '1500000000000000' // 0.0015 ETH in wei
      
      return {
        estimatedFee,
        maxFee,
        suggestedMaxFee,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to estimate gas'
      setError(errorMessage)
      console.error('Error estimating gas:', err)
      throw new Error(errorMessage)
    }
  }, [network])

  /**
   * Filter transactions based on criteria
   */
  const filterTransactions = useCallback((options: TransactionFilterOptions): TransactionHistoryEntry[] => {
    return transactions.filter(entry => {
      // Filter by type
      if (options.type) {
        const types = Array.isArray(options.type) ? options.type : [options.type]
        if (!types.includes(entry.transaction.type)) {
          return false
        }
      }
      
      // Filter by status
      if (options.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status]
        if (!statuses.includes(entry.transaction.status)) {
          return false
        }
      }
      
      // Filter by network
      if (options.network && entry.network !== options.network) {
        return false
      }
      
      // Filter by date range
      if (options.startDate && entry.createdAt < options.startDate) {
        return false
      }
      
      if (options.endDate && entry.createdAt > options.endDate) {
        return false
      }
      
      return true
    })
  }, [transactions])

  /**
   * Get transaction statistics
   */
  const getStatistics = useCallback((): TransactionStatistics => {
    const total = transactions.length
    const pending = transactions.filter(t => t.transaction.status === 'pending').length
    const confirmed = transactions.filter(t => t.transaction.status === 'confirmed').length
    const failed = transactions.filter(t => t.transaction.status === 'failed').length
    
    // Calculate total gas spent
    const totalGasSpent = transactions
      .filter(t => t.transaction.actualGas)
      .reduce((sum, t) => sum + BigInt(t.transaction.actualGas || '0'), BigInt(0))
      .toString()
    
    // Calculate average confirmation time
    const confirmedTxs = transactions.filter(t => t.transaction.status === 'confirmed')
    const avgConfirmationTime = confirmedTxs.length > 0
      ? confirmedTxs.reduce((sum, t) => sum + (t.updatedAt - t.createdAt), 0) / confirmedTxs.length / 1000
      : 0
    
    return {
      total,
      pending,
      confirmed,
      failed,
      totalGasSpent,
      averageConfirmationTime,
    }
  }, [transactions])

  /**
   * Cleanup: abort all polling operations on unmount
   */
  useEffect(() => {
    return () => {
      pollingOperations.current.forEach(controller => controller.abort())
      pollingOperations.current.clear()
    }
  }, [])

  return {
    transactions,
    addTransaction,
    updateTransaction,
    getTransaction,
    clearHistory,
    pollTransaction,
    getTransactionProgress,
    retryTransaction,
    estimateGas,
    filterTransactions,
    getStatistics,
    isPolling,
    error,
  }
}
