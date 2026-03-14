'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from './wallet-context'
import { useNetwork } from '@/hooks/useNetwork'
import { getNetworkConfig } from './constants'

interface BalanceState {
  wBTC: string
  USDC: string
  ETH: string
  isLoading: boolean
  error: string | null
  lastFetched: number | null
}

interface BalanceContextType extends BalanceState {
  refreshBalances: () => Promise<void>
  refreshBalance: (token: 'wBTC' | 'USDC') => Promise<string>
}

const BalanceContext = createContext<BalanceContextType | undefined>(undefined)

// Minimum time between fetches (5 seconds)
const FETCH_DEBOUNCE_MS = 5000

// Request deduplication map
const pendingRequests = new Map<string, Promise<string>>()

export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  
  const [balances, setBalances] = useState<BalanceState>({
    wBTC: '0',
    USDC: '0',
    ETH: '0',
    isLoading: false,
    error: null,
    lastFetched: null,
  })
  
  const lastFetchRef = useRef<number>(0)
  const isFetchingRef = useRef<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Fetch a single token balance with request deduplication
   */
  const fetchSingleBalance = useCallback(async (
    tokenAddress: string,
    accountAddress: string,
    signal?: AbortSignal
  ): Promise<string> => {
    const cacheKey = `${tokenAddress}_${accountAddress}_${network}`
    
    // Check if there's already a pending request for this exact query
    const pending = pendingRequests.get(cacheKey)
    if (pending) {
      return pending
    }
    
    const fetchPromise = (async () => {
      try {
        const response = await fetch(`/api/rpc?network=${network}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'starknet_call',
            params: {
              request: {
                contract_address: tokenAddress,
                entry_point_selector: '0x2e4263afad30923c891518314c3c95dbe830a16874e8abc5777a9a20b54c76e',
                calldata: [accountAddress],
              },
              block_id: 'latest',
            },
            id: 1,
          }),
          signal,
        })
        
        if (!response.ok) {
          throw new Error(`RPC request failed: ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error.message || 'RPC error')
        }
        
        const result = data.result || []
        const low = result[0] || '0'
        const high = result[1] || '0'
        
        return (BigInt(low) + (BigInt(high) << BigInt(128))).toString()
      } finally {
        // Clean up pending request after completion
        pendingRequests.delete(cacheKey)
      }
    })()
    
    pendingRequests.set(cacheKey, fetchPromise)
    return fetchPromise
  }, [network])

  /**
   * Fetch all balances with debouncing and deduplication
   */
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address) {
      setBalances(prev => ({
        ...prev,
        wBTC: '0',
        USDC: '0',
        ETH: '0',
        isLoading: false,
        error: null,
      }))
      return
    }
    
    // Debounce: don't fetch if we fetched recently
    const now = Date.now()
    if (now - lastFetchRef.current < FETCH_DEBOUNCE_MS && !balances.error) {
      return
    }
    
    // Prevent concurrent fetches
    if (isFetchingRef.current) {
      return
    }
    
    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    
    isFetchingRef.current = true
    lastFetchRef.current = now
    
    setBalances(prev => ({ ...prev, isLoading: true, error: null }))
    
    try {
      const config = getNetworkConfig(network)
      
      // Fetch all balances in parallel (but deduplicated)
      const [wbtcBalance, usdcBalance] = await Promise.all([
        fetchSingleBalance(config.contracts.wBTC, address, abortControllerRef.current.signal),
        fetchSingleBalance(config.contracts.USDC, address, abortControllerRef.current.signal),
      ])
      
      setBalances({
        wBTC: wbtcBalance,
        USDC: usdcBalance,
        ETH: '0', // ETH balance fetched separately if needed
        isLoading: false,
        error: null,
        lastFetched: Date.now(),
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return
      }
      
      console.error('Error fetching balances:', err)
      setBalances(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch balances',
      }))
    } finally {
      isFetchingRef.current = false
    }
  }, [isConnected, address, network, fetchSingleBalance, balances.error])

  /**
   * Refresh a single balance
   */
  const refreshBalance = useCallback(async (token: 'wBTC' | 'USDC'): Promise<string> => {
    if (!isConnected || !address) {
      return '0'
    }
    
    const config = getNetworkConfig(network)
    const tokenAddress = config.contracts[token]
    
    if (!tokenAddress) {
      return '0'
    }
    
    try {
      const balance = await fetchSingleBalance(tokenAddress, address)
      
      setBalances(prev => ({
        ...prev,
        [token]: balance,
      }))
      
      return balance
    } catch (err) {
      console.error(`Error fetching ${token} balance:`, err)
      return balances[token]
    }
  }, [isConnected, address, network, fetchSingleBalance, balances])

  /**
   * Fetch balances when wallet connects or network changes
   * Uses a small delay to batch with other connection effects
   */
  useEffect(() => {
    if (!isConnected || !address) {
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
        isLoading: false,
        error: null,
        lastFetched: null,
      })
      return
    }
    
    // Small delay to allow wallet connection to stabilize
    // and batch with other components that might need the same data
    const timeoutId = setTimeout(() => {
      refreshBalances()
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [isConnected, address, network]) // Intentionally not including refreshBalances to prevent loops

  /**
   * Listen for network change events
   */
  useEffect(() => {
    const handleNetworkChange = () => {
      // Reset last fetch time to allow immediate refresh
      lastFetchRef.current = 0
      refreshBalances()
    }
    
    window.addEventListener('paymejor_network_changed', handleNetworkChange)
    return () => window.removeEventListener('paymejor_network_changed', handleNetworkChange)
  }, [refreshBalances])

  /**
   * Listen for transaction events to refresh balances
   */
  useEffect(() => {
    const handleTransaction = () => {
      // Reset debounce to allow immediate refresh after transaction
      lastFetchRef.current = 0
      refreshBalances()
    }
    
    window.addEventListener('paymejor_transaction_confirmed', handleTransaction)
    window.addEventListener('paymejor_deposit_confirmed', handleTransaction)
    window.addEventListener('paymejor_withdraw_confirmed', handleTransaction)
    
    return () => {
      window.removeEventListener('paymejor_transaction_confirmed', handleTransaction)
      window.removeEventListener('paymejor_deposit_confirmed', handleTransaction)
      window.removeEventListener('paymejor_withdraw_confirmed', handleTransaction)
    }
  }, [refreshBalances])

  return (
    <BalanceContext.Provider
      value={{
        ...balances,
        refreshBalances,
        refreshBalance,
      }}
    >
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalances(): BalanceContextType {
  const context = useContext(BalanceContext)
  if (context === undefined) {
    throw new Error('useBalances must be used within a BalanceProvider')
  }
  return context
}
