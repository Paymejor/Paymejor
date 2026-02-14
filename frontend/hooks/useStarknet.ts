'use client'

import { useState, useCallback } from 'react'
import { RpcProvider } from 'starknet'
import { useWallet } from '@/lib/wallet-context'
import { TransactionState } from '@/types/starknet'
import { NETWORK_CONFIG, PROTOCOL_PARAMS, getTxUrl } from '@/lib/constants'

/**
 * useStarknet Hook
 * 
 * Provides blockchain interaction utilities:
 * - getBalance(): Fetch real token balances
 * - sendTransaction(): Execute transactions with error handling
 * - waitForTransaction(): Poll transaction status
 * - Transaction state management
 * 
 * Requirements: TR-4.17, TR-4.20
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
  const { account, network } = useWallet()
  const [transactions, setTransactions] = useState<TransactionState[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get token balance for an account
   * Calls the ERC20 balanceOf function
   */
  const getBalance = useCallback(async (
    tokenAddress: string,
    accountAddress: string
  ): Promise<string> => {
    try {
      setError(null)
      
      // Create RPC provider
      const provider = new RpcProvider({ nodeUrl: NETWORK_CONFIG.rpcUrl })
      
      // Call balanceOf using provider.callContract
      const result = await provider.callContract({
        contractAddress: tokenAddress,
        entrypoint: 'balanceOf',
        calldata: [accountAddress],
      })
      
      // Result is an array of felts representing Uint256 (low, high)
      const low = result[0]
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
  }, [])

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
   * Polls transaction status until confirmed or failed
   */
  const waitForTransaction = useCallback(async (
    txHash: string
  ): Promise<TransactionState> => {
    try {
      setError(null)
      
      // Create RPC provider
      const provider = new RpcProvider({ nodeUrl: NETWORK_CONFIG.rpcUrl })
      
      let attempts = 0
      const maxAttempts = PROTOCOL_PARAMS.maxPollingAttempts
      const interval = PROTOCOL_PARAMS.txPollingInterval
      
      while (attempts < maxAttempts) {
        try {
          // Get transaction receipt
          const receipt = await provider.getTransactionReceipt(txHash)
          
          // Check status - handle different receipt types
          const status = (receipt as any).execution_status || (receipt as any).status
          
          if (status === 'SUCCEEDED' || status === 'ACCEPTED_ON_L2' || status === 'ACCEPTED_ON_L1') {
            // Update transaction state
            setTransactions(prev =>
              prev.map(tx =>
                tx.hash === txHash
                  ? { ...tx, status: 'confirmed' }
                  : tx
              )
            )
            
            return {
              hash: txHash,
              type: 'deposit', // Will be updated from existing state
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
  }, [network])

  return {
    getBalance,
    sendTransaction,
    waitForTransaction,
    transactions,
    isLoading,
    error,
  }
}
