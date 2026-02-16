'use client'

import { useCallback } from 'react'
import { useCache, invalidateCache } from './useCache'
import { useVesu } from './useVesu'
import { useNetwork } from './useNetwork'
import { useWallet } from '@/lib/wallet-context'
import { VesuPosition, VesuPoolParameters, VesuPoolState } from '@/types/vesu'

/**
 * useVesuCache Hook
 * 
 * Provides cached access to Vesu protocol data with automatic refresh.
 * Invalidates cache on transactions and network changes.
 * 
 * Requirements: NFR-5.1, NFR-5.4
 */

/**
 * Cache pool parameters (changes infrequently)
 * TTL: 5 minutes, refresh every 2 minutes
 */
export function useVesuPoolParametersCache() {
  const { network } = useNetwork()
  const { getPoolParameters } = useVesu()

  return useCache<VesuPoolParameters>({
    key: `vesu_pool_params_${network}`,
    ttl: 5 * 60 * 1000, // 5 minutes
    refreshInterval: 2 * 60 * 1000, // Refresh every 2 minutes
    fetchFn: getPoolParameters,
    invalidateOn: ['paymejor_network_changed'],
  })
}

/**
 * Cache pool state (changes frequently)
 * TTL: 30 seconds, refresh every 15 seconds
 */
export function useVesuPoolStateCache() {
  const { network } = useNetwork()
  const { getPoolState } = useVesu()

  return useCache<VesuPoolState>({
    key: `vesu_pool_state_${network}`,
    ttl: 30 * 1000, // 30 seconds
    refreshInterval: 15 * 1000, // Refresh every 15 seconds
    fetchFn: getPoolState,
    invalidateOn: ['paymejor_network_changed'],
  })
}

/**
 * Cache user position (changes on transactions)
 * TTL: 1 minute, refresh every 30 seconds
 * Invalidates on transaction events
 */
export function useVesuPositionCache() {
  const { network } = useNetwork()
  const { address } = useWallet()
  const { getUserPosition } = useVesu()

  const fetchPosition = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    return await getUserPosition(address)
  }, [address, getUserPosition])

  return useCache<VesuPosition>({
    key: `vesu_position_${network}_${address}`,
    ttl: 60 * 1000, // 1 minute
    refreshInterval: 30 * 1000, // Refresh every 30 seconds
    fetchFn: fetchPosition,
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_deposit_confirmed',
      'paymejor_borrow_confirmed',
      'paymejor_withdraw_confirmed',
      'paymejor_repay_confirmed',
    ],
  })
}

/**
 * Cache borrowing capacity (changes on transactions)
 * TTL: 1 minute, refresh every 30 seconds
 */
export function useVesuBorrowingCapacityCache(collateralAsset: string, borrowAsset: string) {
  const { network } = useNetwork()
  const { address } = useWallet()
  const { getBorrowingCapacity } = useVesu()

  const fetchCapacity = useCallback(async () => {
    if (!address) {
      throw new Error('Wallet not connected')
    }
    return await getBorrowingCapacity({
      user: address,
      collateralAsset,
      borrowAsset,
    })
  }, [address, collateralAsset, borrowAsset, getBorrowingCapacity])

  return useCache<string>({
    key: `vesu_capacity_${network}_${address}_${collateralAsset}_${borrowAsset}`,
    ttl: 60 * 1000, // 1 minute
    refreshInterval: 30 * 1000, // Refresh every 30 seconds
    fetchFn: fetchCapacity,
    invalidateOn: [
      'paymejor_network_changed',
      'paymejor_transaction_confirmed',
      'paymejor_deposit_confirmed',
      'paymejor_borrow_confirmed',
    ],
  })
}

/**
 * Utility to invalidate all Vesu caches for current user
 */
export function invalidateVesuCaches(network: string, address: string) {
  invalidateCache(`vesu_position_${network}_${address}`)
  invalidateCache(`vesu_capacity_${network}_${address}`)
  invalidateCache(`vesu_pool_state_${network}`)
  // Pool parameters rarely change, so we don't invalidate them
}
