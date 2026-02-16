'use client'

import { useState, useCallback } from 'react'
import { useTransactionManager } from './useTransactionManager'
import { useErrorHandler } from './useErrorHandler'
import { useNetwork } from './useNetwork'
import { getTxUrl } from '@/lib/constants'
import {
  EnhancedTransactionState,
  TransactionConfirmation,
  GasFeeEstimate,
} from '@/types/transaction'
import { TransactionState } from '@/types/starknet'

/**
 * useTransaction Hook
 * 
 * High-level transaction wrapper that combines:
 * - Transaction management
 * - Error handling
 * - Gas estimation
 * - Confirmation dialogs
 * - Retry logic
 * 
 * Requirements: TR-4.23, TR-4.24, TR-4.25, TR-4.31, TR-4.32, NFR-5.2, NFR-5.7, NFR-5.8
 */

interface TransactionParams {
  contractAddress: string
  entrypoint: string
  calldata: string[]
  type: TransactionState['type']
  description?: string
  amount?: string
  token?: string
}

interface UseTransactionReturn {
  // Execute transaction with full error handling and confirmation
  executeTransaction: (params: TransactionParams) => Promise<string>
  
  // Execute with confirmation dialog
  executeWithConfirmation: (
    params: TransactionParams,
    confirmationData: Omit<TransactionConfirmation, 'onConfirm' | 'onCancel'>
  ) => Promise<string>
  
  // Get gas estimate
  estimateGas: (params: Omit<TransactionParams, 'type' | 'description' | 'amount' | 'token'>) => Promise<GasFeeEstimate>
  
  // Transaction state
  currentTransaction: EnhancedTransactionState | null
  isExecuting: boolean
  
  // Confirmation dialog state
  confirmationDialog: TransactionConfirmation | null
  showConfirmation: boolean
  
  // Error state
  error: string | null
  clearError: () => void
  
  // Retry
  retry: () => Promise<void>
}

export function useTransaction(): UseTransactionReturn {
  const { network } = useNetwork()
  const {
    addTransaction,
    updateTransaction,
    pollTransaction,
    estimateGas: estimateGasFee,
  } = useTransactionManager()
  const {
    error: errorHandler,
    handleError,
    clearError: clearErrorHandler,
    retryWithBackoff,
  } = useErrorHandler()
  
  const [currentTransaction, setCurrentTransaction] = useState<EnhancedTransactionState | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [confirmationDialog, setConfirmationDialog] = useState<TransactionConfirmation | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [lastParams, setLastParams] = useState<TransactionParams | null>(null)

  /**
   * Execute transaction with full error handling
   */
  const executeTransaction = useCallback(async (params: TransactionParams): Promise<string> => {
    setIsExecuting(true)
    setLastParams(params)
    
    try {
      // Generate transaction ID
      const txId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Create enhanced transaction state
      const tx: EnhancedTransactionState = {
        id: txId,
        hash: '', // Will be set after execution
        type: params.type,
        status: 'pending',
        timestamp: Date.now(),
        explorerUrl: '',
        description: params.description,
        amount: params.amount,
        token: params.token,
      }
      
      setCurrentTransaction(tx)
      
      // Execute with retry logic
      const txHash = await retryWithBackoff(async () => {
        // In a real implementation, this would call account.execute()
        // For now, we'll simulate the transaction
        
        // Simulate transaction execution
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Generate mock transaction hash
        const hash = `0x${Math.random().toString(16).substr(2, 64)}`
        return hash
      })
      
      // Update transaction with hash
      const updatedTx: EnhancedTransactionState = {
        ...tx,
        hash: txHash,
        explorerUrl: getTxUrl(txHash, network),
      }
      
      setCurrentTransaction(updatedTx)
      addTransaction(updatedTx)
      
      // Poll for confirmation
      try {
        await pollTransaction(txHash)
        
        // Update to confirmed
        updateTransaction(txId, {
          status: 'confirmed',
        })
        
        setCurrentTransaction(prev => prev ? { ...prev, status: 'confirmed' } : null)
      } catch (pollError) {
        // Polling failed, but transaction was submitted
        console.error('Transaction polling failed:', pollError)
        // Don't throw - transaction was submitted successfully
      }
      
      return txHash
    } catch (err) {
      handleError(err)
      
      // Update transaction to failed
      if (currentTransaction) {
        updateTransaction(currentTransaction.id, {
          status: 'failed',
          error: err instanceof Error ? err.message : 'Transaction failed',
        })
        
        setCurrentTransaction(prev => prev ? {
          ...prev,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Transaction failed',
        } : null)
      }
      
      throw err
    } finally {
      setIsExecuting(false)
    }
  }, [network, addTransaction, updateTransaction, pollTransaction, retryWithBackoff, handleError, currentTransaction])

  /**
   * Execute transaction with confirmation dialog
   */
  const executeWithConfirmation = useCallback(async (
    params: TransactionParams,
    confirmationData: Omit<TransactionConfirmation, 'onConfirm' | 'onCancel'>
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Estimate gas first
      estimateGasFee({
        contractAddress: params.contractAddress,
        entrypoint: params.entrypoint,
        calldata: params.calldata,
      }).then(gasEstimate => {
        // Show confirmation dialog
        setConfirmationDialog({
          ...confirmationData,
          estimatedGas: gasEstimate.estimatedFee,
          onConfirm: async () => {
            setShowConfirmation(false)
            try {
              const txHash = await executeTransaction(params)
              resolve(txHash)
            } catch (err) {
              reject(err)
            }
          },
          onCancel: () => {
            setShowConfirmation(false)
            reject(new Error('Transaction cancelled by user'))
          },
        })
        setShowConfirmation(true)
      }).catch(err => {
        // If gas estimation fails, show dialog without gas estimate
        setConfirmationDialog({
          ...confirmationData,
          onConfirm: async () => {
            setShowConfirmation(false)
            try {
              const txHash = await executeTransaction(params)
              resolve(txHash)
            } catch (err) {
              reject(err)
            }
          },
          onCancel: () => {
            setShowConfirmation(false)
            reject(new Error('Transaction cancelled by user'))
          },
        })
        setShowConfirmation(true)
      })
    })
  }, [executeTransaction, estimateGasFee])

  /**
   * Estimate gas for transaction
   */
  const estimateGas = useCallback(async (
    params: Omit<TransactionParams, 'type' | 'description' | 'amount' | 'token'>
  ): Promise<GasFeeEstimate> => {
    try {
      return await estimateGasFee(params)
    } catch (err) {
      handleError(err)
      throw err
    }
  }, [estimateGasFee, handleError])

  /**
   * Retry last transaction
   */
  const retry = useCallback(async () => {
    if (!lastParams) {
      throw new Error('No transaction to retry')
    }
    
    clearErrorHandler()
    await executeTransaction(lastParams)
  }, [lastParams, executeTransaction, clearErrorHandler])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    clearErrorHandler()
  }, [clearErrorHandler])

  return {
    executeTransaction,
    executeWithConfirmation,
    estimateGas,
    currentTransaction,
    isExecuting,
    confirmationDialog,
    showConfirmation,
    error: errorHandler?.message || null,
    clearError,
    retry,
  }
}
