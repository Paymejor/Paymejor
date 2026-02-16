'use client'

import { useCallback } from 'react'
import { useCache, invalidateCache } from './useCache'
import { useTongo } from './useTongo'
import { useNetwork } from './useNetwork'
import { useWallet } from '@/lib/wallet-context'
import { TongoDecryptedBalance, TongoShieldedBalance } from '@/types/tongo'

/**
 * useTongoCache Hook
 * 
 * Provides cached access to Tongo decrypted balances.
 * Invalidates cache on transactions to ensure fresh data.
 * 
 * Requirements: NFR-5.1, NFR-5.4
 */

/**
 * Cache decrypted balance for a specific token
 * TTL: 2 minutes (decryption is expensive)
 * Invalidates on transaction events
 */
export function useTongoDecryptedBalanceCache(token: string) {
  const { network } = useNetwork()
  const { address } = useWallet()
  const { getBalance, decrypt } = useTongo()

  const fetchDecryptedBalance = useCallback(async (): Promise<TongoDecryptedBalance> => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    // Get encrypted balance
    const shieldedBalance: TongoShieldedBalance = await getBalance(token)
    
    // Decrypt it
    const decrypted = await decrypt(shieldedBalance)
    
    return decrypted
  }, [address, token, getBalance, decrypt])

  return useCache<TongoDecryptedBalance>({
    key: `tongo_decrypted_${network}_${address}_${token}`,
    ttl: 2 * 60 * 1000, // 2 minutes (decryption is expensive, cache longer)
    refreshInterval: 0, // Don't auto-refresh (user must manually decrypt)
    fetchFn: fetchDecryptedBalance,
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_deposit_confirmed',
      'paymejor_borrow_confirmed',
      'paymejor_withdraw_confirmed',
      'paymejor_repay_confirmed',
      'paymejor_fund_confirmed',
    ],
  })
}

/**
 * Cache shielded (encrypted) balance for a specific token
 * TTL: 30 seconds
 * Refresh every 15 seconds
 */
export function useTongoShieldedBalanceCache(token: string) {
  const { network } = useNetwork()
  const { address } = useWallet()
  const { getBalance } = useTongo()

  const fetchShieldedBalance = useCallback(async (): Promise<TongoShieldedBalance> => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    return await getBalance(token)
  }, [address, token, getBalance])

  return useCache<TongoShieldedBalance>({
    key: `tongo_shielded_${network}_${address}_${token}`,
    ttl: 30 * 1000, // 30 seconds
    refreshInterval: 15 * 1000, // Refresh every 15 seconds
    fetchFn: fetchShieldedBalance,
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_deposit_confirmed',
      'paymejor_borrow_confirmed',
      'paymejor_fund_confirmed',
    ],
  })
}

/**
 * Utility to invalidate all Tongo caches for current user
 */
export function invalidateTongoCaches(network: string, address: string, token?: string) {
  if (token) {
    invalidateCache(`tongo_decrypted_${network}_${address}_${token}`)
    invalidateCache(`tongo_shielded_${network}_${address}_${token}`)
  } else {
    // Invalidate all tokens (we don't know which ones exist, so we rely on event listeners)
    // The cache hook will automatically invalidate when it receives the event
  }
}
