'use client'

import { useState, useCallback } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { TransactionState } from '@/types/starknet'
import { PROTOCOL_PARAMS, getTxUrl } from '@/lib/constants'
import { useNetwork } from './useNetwork'

/**
 * useStarknet Hook
 * 
 * Provides blockchain interaction utilities:
 * - getBalance(): Fetch real token balances
 * - sendTransaction(): Execute transactions with error handling
 * - waitForTransaction(): Poll transaction status
 * - Transaction state management
 * 
 * Requirements: TR-4.17, TR-4.20, TR-4.27
 */

interface UseStarknetReturn {
  getBalance: (tokenAddress: string, accountAddress: string) => Promise<string>
  sendTransaction: (params: SendTransactionParams) => Promise<string>
  waitForTransaction: (txHash: string) => Promise<TransactionState>
  transactions: TransactionState[]
  isLoading: boolean
  error: string | null
}

interface SendTransactionParams {
  contractAddress: string
  entrypoint: string
  calldata: string[]
  type: TransactionState['type']
}

export function useStarknet(): UseStarknetReturn {
  const { account } = useWallet()
  const { network } = useNetwork()
  const [transactions, setTransactions] = useState<TransactionState[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get token balance for an account
   * Calls the ERC20 balanceOf function via proxy to avoid CORS
   */
  const getBalance = useCallback(async (
    tokenAddress: string,
    accountAddress: string
  ): Promise<string> => {
    try {
      setError(null)
      
      // Use proxy API route to avoid CORS issues
      const response = await fetch(`/api/rpc?network=${network}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_call',
          params: {
            request: {
              contract_address: tokenAddress,
              entry_point_selector: '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e', // balanceOf selector
              calldata: [accountAddress],
            },
            block_id: 'latest',
          },
          id: 1,
        }),
      })
      
      if (!response.ok) {
        throw new Error(`RPC request failed: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error.message || 'RPC error')
      }
      
      // Result is an array of felts representing Uint256 (low, high)
      const result = data.result || []
      const low = result[0] || '0'
      const high = result[1] || '0'
      
      // Convert to BigInt and then string
      const balance = (BigInt(low) + (BigInt(high) << BigInt(128))).toString()
      
      return balance
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch balance'
      setError(errorMessage)
      console.error('Error fetching balance:', err)
      throw new Error(errorMessage)
    }
  }, [network])

  /**
   * Send a transaction with error handling
   * Returns transaction hash
   */
  const sendTransaction = useCallback(async (
    params: SendTransactionParams
  ): Promise<string> => {
    if (!account) {
      throw new Error('Wallet not connected')
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      const { contractAddress, entrypoint, calldata, type } = params
      
      // Execute transaction
      const result = await account.execute({
        contractAddress,
        entrypoint,
        calldata,
      })
      
      const txHash = result.transaction_hash
      
      // Create transaction state
      const txState: TransactionState = {
        hash: txHash,
        type,
        status: 'pending',
        timestamp: Date.now(),
        explorerUrl: getTxUrl(txHash, network),
      }
      
      // Add to transactions list
      setTransactions(prev => [txState, ...prev])
      
      return txHash
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Transaction failed'
      setError(errorMessage)
      console.error('Error sending transaction:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, network])

  /**
   * Wait for transaction confirmation
   * Polls transaction status until confirmed or failed via proxy
   */
  const waitForTransaction = useCallback(async (
    txHash: string
  ): Promise<TransactionState> => {
    try {
      setError(null)
      
      let attempts = 0
      const maxAttempts = PROTOCOL_PARAMS.maxPollingAttempts
      const interval = PROTOCOL_PARAMS.txPollingInterval
      
      while (attempts < maxAttempts) {
        try {
          // Get transaction receipt via proxy
          const response = await fetch(`/api/rpc?network=${network}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'starknet_getTransactionReceipt',
              params: {
                transaction_hash: txHash,
              },
              id: 1,
            }),
          })
          
          if (!response.ok) {
            throw new Error(`RPC request failed: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          if (data.error) {
            // Transaction not found yet, continue polling
            if (attempts === maxAttempts - 1) {
              throw new Error('Transaction confirmation timeout')
            }
          } else {
            const receipt = data.result
            
            // Check status - handle different receipt types
            const status = receipt.execution_status || receipt.status
            
            if (status === 'SUCCEEDED' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') {
              // Find transaction type from existing state
              const existingTx = transactions.find(tx => tx.hash === txHash)
              const txType = existingTx?.type || 'deposit'
              
              // Update transaction state
              setTransactions(prev =>
                prev.map(tx =>
                  tx.hash === txHash
                    ? { ...tx, status: 'confirmed' }
                    : tx
                )
              )
              
              // Emit cache invalidation events
              window.dispatchEvent(new CustomEvent('paymejor_transaction_confirmed', {
                detail: { txHash, type: txType }
              }))
              
              // Emit specific event based on transaction type
              window.dispatchEvent(new CustomEvent(`paymejor_${txType}_confirmed`, {
                detail: { txHash }
              }))
              
              return {
                hash: txHash,
                type: txType,
                status: 'confirmed',
                timestamp: Date.now(),
                explorerUrl: getTxUrl(txHash, network),
              }
            } else if (status === 'REVERTED' || status === 'REJECTED') {
              // Transaction failed
              setTransactions(prev =>
                prev.map(tx =>
                  tx.hash === txHash
                    ? { ...tx, status: 'failed' }
                    : tx
                )
              )
              
              throw new Error('Transaction reverted')
            }
          }
        } catch (err) {
          // Transaction not found yet, continue polling
          if (attempts === maxAttempts - 1) {
            throw new Error('Transaction confirmation timeout')
          }
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval))
        attempts++
      }
      
      throw new Error('Transaction confirmation timeout')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to confirm transaction'
      setError(errorMessage)
      console.error('Error waiting for transaction:', err)
      throw new Error(errorMessage)
    }
  }, [network, transactions])

  return {
    getBalance,
    sendTransaction,
    waitForTransaction,
    transactions,
    isLoading,
    error,
  }
}
