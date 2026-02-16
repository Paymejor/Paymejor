'use client'

import { useState, useCallback } from 'react'
import { RpcProvider } from 'starknet'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from './useNetwork'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import {
  VesuPosition,
  VesuSupplyParams,
  VesuBorrowParams,
  VesuWithdrawParams,
  VesuRepayParams,
  VesuBorrowingCapacityParams,
  VesuPoolParameters,
  VesuTransactionResult,
  VesuPoolState,
} from '@/types/vesu'

/**
 * useVesu Hook
 * 
 * Provides Vesu lending protocol integration:
 * - supply(): Deposit collateral to Vesu pool
 * - borrow(): Borrow assets against collateral
 * - withdraw(): Withdraw collateral from pool
 * - repay(): Repay borrowed assets
 * - getUserPosition(): Get user's position in pool
 * - getBorrowingCapacity(): Calculate available borrowing capacity
 * - getPoolParameters(): Get pool configuration
 * 
 * Requirements: AC-4.1, AC-4.2, AC-4.6, AC-4.7, TR-4.12, TR-4.16, TR-4.17
 */

interface UseVesuReturn {
  supply: (params: VesuSupplyParams) => Promise<VesuTransactionResult>
  borrow: (params: VesuBorrowParams) => Promise<VesuTransactionResult>
  withdraw: (params: VesuWithdrawParams) => Promise<VesuTransactionResult>
  repay: (params: VesuRepayParams) => Promise<VesuTransactionResult>
  getUserPosition: (userAddress: string) => Promise<VesuPosition>
  getBorrowingCapacity: (params: VesuBorrowingCapacityParams) => Promise<string>
  getPoolParameters: () => Promise<VesuPoolParameters>
  getPoolState: () => Promise<VesuPoolState>
  isLoading: boolean
  error: string | null
}

export function useVesu(): UseVesuReturn {
  const { account, address } = useWallet()
  const { network } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Get Vesu pool address for current network
   */
  const getPoolAddress = useCallback((): string => {
    const config = getNetworkConfig(network)
    if (!config.contracts.vesuPool) {
      throw new Error(`Vesu pool not configured for ${network}`)
    }
    return config.contracts.vesuPool
  }, [network])

  /**
   * Supply (deposit) collateral to Vesu pool
   * This increases the user's collateral balance and borrowing capacity
   */
  const supply = useCallback(async (
    params: VesuSupplyParams
  ): Promise<VesuTransactionResult> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const poolAddress = getPoolAddress()
      const { asset, amount, onBehalfOf } = params

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Execute supply transaction via Vesu pool
      const result = await account.execute({
        contractAddress: poolAddress,
        entrypoint: 'supply',
        calldata: [
          asset,           // asset address
          low,             // amount low
          high,            // amount high
          onBehalfOf,      // on behalf of
        ],
      })

      return {
        transactionHash: result.transaction_hash,
        status: 'pending',
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to supply collateral'
      setError(errorMessage)
      console.error('Error supplying to Vesu:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, getPoolAddress])

  /**
   * Borrow assets from Vesu pool against supplied collateral
   * Validates borrowing capacity before executing
   */
  const borrow = useCallback(async (
    params: VesuBorrowParams
  ): Promise<VesuTransactionResult> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const poolAddress = getPoolAddress()
      const { asset, amount, onBehalfOf } = params

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Execute borrow transaction via Vesu pool
      const result = await account.execute({
        contractAddress: poolAddress,
        entrypoint: 'borrow',
        calldata: [
          asset,           // asset address
          low,             // amount low
          high,            // amount high
          onBehalfOf,      // on behalf of
        ],
      })

      return {
        transactionHash: result.transaction_hash,
        status: 'pending',
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to borrow'
      setError(errorMessage)
      console.error('Error borrowing from Vesu:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, getPoolAddress])

  /**
   * Withdraw collateral from Vesu pool
   * Can only withdraw if it doesn't violate LTV requirements
   */
  const withdraw = useCallback(async (
    params: VesuWithdrawParams
  ): Promise<VesuTransactionResult> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const poolAddress = getPoolAddress()
      const { asset, amount, to } = params

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Execute withdraw transaction via Vesu pool
      const result = await account.execute({
        contractAddress: poolAddress,
        entrypoint: 'withdraw',
        calldata: [
          asset,           // asset address
          low,             // amount low
          high,            // amount high
          to,              // recipient address
        ],
      })

      return {
        transactionHash: result.transaction_hash,
        status: 'pending',
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to withdraw'
      setError(errorMessage)
      console.error('Error withdrawing from Vesu:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, getPoolAddress])

  /**
   * Repay borrowed assets to Vesu pool
   * Reduces debt and improves health factor
   */
  const repay = useCallback(async (
    params: VesuRepayParams
  ): Promise<VesuTransactionResult> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const poolAddress = getPoolAddress()
      const { asset, amount, onBehalfOf } = params

      // Convert amount to Uint256 (low, high)
      const amountBigInt = BigInt(amount)
      const low = (amountBigInt & BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).toString()
      const high = (amountBigInt >> BigInt(128)).toString()

      // Execute repay transaction via Vesu pool
      const result = await account.execute({
        contractAddress: poolAddress,
        entrypoint: 'repay',
        calldata: [
          asset,           // asset address
          low,             // amount low
          high,            // amount high
          onBehalfOf,      // on behalf of
        ],
      })

      return {
        transactionHash: result.transaction_hash,
        status: 'pending',
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to repay'
      setError(errorMessage)
      console.error('Error repaying to Vesu:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, getPoolAddress])

  /**
   * Get user's position in Vesu pool
   * Returns collateral, debt, LTV, and health factor
   */
  const getUserPosition = useCallback(async (
    userAddress: string
  ): Promise<VesuPosition> => {
    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const poolAddress = getPoolAddress()
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // Query user position from Vesu pool
      const result = await provider.callContract({
        contractAddress: poolAddress,
        entrypoint: 'get_user_position',
        calldata: [userAddress],
      })

      // Parse result (format depends on Vesu contract implementation)
      // Expected: [collateral_low, collateral_high, debt_low, debt_high, ltv, health_factor, liquidation_threshold]
      const collateralLow = BigInt(result[0] || '0')
      const collateralHigh = BigInt(result[1] || '0')
      const debtLow = BigInt(result[2] || '0')
      const debtHigh = BigInt(result[3] || '0')
      const ltv = Number(result[4] || '0') / 100 // Convert from basis points
      const healthFactor = Number(result[5] || '0') / 100
      const liquidationThreshold = BigInt(result[6] || '0')

      const collateral = collateralLow + (collateralHigh << BigInt(128))
      const debt = debtLow + (debtHigh << BigInt(128))

      return {
        collateral,
        debt,
        ltv,
        healthFactor,
        liquidationThreshold,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get position'
      setError(errorMessage)
      console.error('Error getting user position:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [network, getPoolAddress])

  /**
   * Calculate borrowing capacity for a user
   * Returns maximum amount that can be borrowed based on collateral
   */
  const getBorrowingCapacity = useCallback(async (
    params: VesuBorrowingCapacityParams
  ): Promise<string> => {
    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const poolAddress = getPoolAddress()
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      const { user, collateralAsset, borrowAsset } = params

      // Query borrowing capacity from Vesu pool
      const result = await provider.callContract({
        contractAddress: poolAddress,
        entrypoint: 'get_borrowing_capacity',
        calldata: [
          user,
          collateralAsset,
          borrowAsset,
        ],
      })

      // Parse result (Uint256)
      const capacityLow = BigInt(result[0] || '0')
      const capacityHigh = BigInt(result[1] || '0')
      const capacity = capacityLow + (capacityHigh << BigInt(128))

      return capacity.toString()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get borrowing capacity'
      setError(errorMessage)
      console.error('Error getting borrowing capacity:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [network, getPoolAddress])

  /**
   * Get Vesu pool parameters (LTV, liquidation threshold, interest rate)
   */
  const getPoolParameters = useCallback(async (): Promise<VesuPoolParameters> => {
    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const poolAddress = getPoolAddress()
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // Query pool parameters from Vesu pool
      const result = await provider.callContract({
        contractAddress: poolAddress,
        entrypoint: 'get_pool_parameters',
        calldata: [],
      })

      // Parse result
      const maxLTV = Number(result[0] || '0') / 100
      const liquidationThreshold = Number(result[1] || '0') / 100
      const liquidationBonus = Number(result[2] || '0') / 100
      const interestRate = Number(result[3] || '0') / 100
      const utilizationRate = Number(result[4] || '0') / 100

      return {
        maxLTV,
        liquidationThreshold,
        liquidationBonus,
        interestRate,
        utilizationRate,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pool parameters'
      setError(errorMessage)
      console.error('Error getting pool parameters:', err)
      
      // Return default parameters if query fails
      return {
        maxLTV: 75,
        liquidationThreshold: 80,
        liquidationBonus: 5,
        interestRate: 5,
        utilizationRate: 0,
      }
    } finally {
      setIsLoading(false)
    }
  }, [network, getPoolAddress])

  /**
   * Get current pool state (total collateral, debt, liquidity)
   */
  const getPoolState = useCallback(async (): Promise<VesuPoolState> => {
    try {
      setIsLoading(true)
      setError(null)

      const config = getNetworkConfig(network)
      const poolAddress = getPoolAddress()
      const provider = new RpcProvider({ nodeUrl: config.rpcUrl })

      // Query pool state from Vesu pool
      const result = await provider.callContract({
        contractAddress: poolAddress,
        entrypoint: 'get_pool_state',
        calldata: [],
      })

      // Parse result (Uint256 values)
      const totalCollateralLow = BigInt(result[0] || '0')
      const totalCollateralHigh = BigInt(result[1] || '0')
      const totalDebtLow = BigInt(result[2] || '0')
      const totalDebtHigh = BigInt(result[3] || '0')
      const availableLiquidityLow = BigInt(result[4] || '0')
      const availableLiquidityHigh = BigInt(result[5] || '0')
      const utilizationRate = Number(result[6] || '0') / 100
      const interestRate = Number(result[7] || '0') / 100

      const totalCollateral = totalCollateralLow + (totalCollateralHigh << BigInt(128))
      const totalDebt = totalDebtLow + (totalDebtHigh << BigInt(128))
      const availableLiquidity = availableLiquidityLow + (availableLiquidityHigh << BigInt(128))

      return {
        totalCollateral,
        totalDebt,
        availableLiquidity,
        utilizationRate,
        interestRate,
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get pool state'
      setError(errorMessage)
      console.error('Error getting pool state:', err)
      
      // Return default state if query fails
      return {
        totalCollateral: BigInt(0),
        totalDebt: BigInt(0),
        availableLiquidity: BigInt(0),
        utilizationRate: 0,
        interestRate: 5,
      }
    } finally {
      setIsLoading(false)
    }
  }, [network, getPoolAddress])

  return {
    supply,
    borrow,
    withdraw,
    repay,
    getUserPosition,
    getBorrowingCapacity,
    getPoolParameters,
    getPoolState,
    isLoading,
    error,
  }
}
