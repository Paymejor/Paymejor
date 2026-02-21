/**
 * Swap Router Type Definitions
 * 
 * Types for multi-provider swap routing on Starknet
 * - Primary: AVNU (better quotes, Paymaster support)
 * - Fallback: AutoSwappr
 * 
 * Requirements: AC-5.2, AC-5.4, TR-4.5
 */

import { SupportedNetwork } from '@/lib/constants'
import { Quote } from '@avnu/avnu-sdk'

/**
 * Swap provider type
 */
export type SwapProvider = 'avnu' | 'autoswappr'

/**
 * Swap router configuration
 */
export interface SwapConfig {
  network: SupportedNetwork
  rpcUrl: string
  avnu: {
    enabled: boolean
    paymasterEnabled: boolean
  }
  autoswappr: {
    enabled: boolean
    contractAddress: string
  }
}

/**
 * Token pair for swap
 */
export interface SwapTokenPair {
  fromToken: string  // Token address
  toToken: string    // Token address
}

/**
 * Swap quote request parameters
 */
export interface SwapQuoteParams extends SwapTokenPair {
  amount: string     // Amount in smallest unit (e.g., satoshis for wBTC)
}

/**
 * Swap quote response
 */
export interface SwapQuote {
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  priceImpact: number        // Percentage (e.g., 0.5 for 0.5%)
  route: SwapRoute[]         // DEX route used
  estimatedGas: string       // Estimated gas cost
  expiresAt: number          // Unix timestamp
  provider: SwapProvider     // Which provider gave this quote
  avnuQuote?: Quote          // Original AVNU quote (if from AVNU)
}

/**
 * DEX route information
 */
export interface SwapRoute {
  dex: string               // DEX name (e.g., "Ekubo", "JediSwap")
  percentage: number        // Percentage of swap through this DEX
  poolAddress: string       // Pool contract address
}

/**
 * Swap execution parameters
 */
export interface SwapExecuteParams extends SwapTokenPair {
  amount: string            // Amount to swap
  slippage: number          // Slippage tolerance (e.g., 0.5 for 0.5%)
  recipient?: string        // Recipient address (defaults to sender)
  deadline?: number         // Unix timestamp deadline
  gasless?: boolean         // Use Paymaster for gasless transaction (AVNU only)
}

/**
 * Swap transaction result
 */
export interface SwapTransactionResult {
  transactionHash: string
  status: 'pending' | 'confirmed' | 'failed'
  fromToken: string
  toToken: string
  fromAmount: string
  expectedToAmount: string
  actualToAmount?: string   // Filled after confirmation
  provider: SwapProvider    // Which provider executed the swap
  gasless: boolean          // Whether Paymaster was used
}

/**
 * Slippage configuration
 */
export interface SlippageConfig {
  tolerance: number         // Percentage (e.g., 0.5 for 0.5%)
  minReceived: string       // Minimum amount to receive
}

/**
 * Swap error types
 */
export type SwapErrorType =
  | 'INSUFFICIENT_LIQUIDITY'
  | 'SLIPPAGE_EXCEEDED'
  | 'QUOTE_EXPIRED'
  | 'INVALID_TOKEN_PAIR'
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'
  | 'PROVIDER_UNAVAILABLE'
  | 'PAYMASTER_FAILED'

/**
 * Swap error
 */
export interface SwapError {
  type: SwapErrorType
  message: string
  provider?: SwapProvider
  details?: unknown
}

/**
 * Supported DEX list
 */
export type SupportedDEX = 'Ekubo' | 'JediSwap' | 'MySwap' | 'SithSwap' | '10KSwap' | 'AVNU'

/**
 * DEX liquidity info
 */
export interface DEXLiquidity {
  dex: SupportedDEX
  liquidity: string         // Total liquidity in USD
  volume24h: string         // 24h volume in USD
}

// Legacy exports for backward compatibility
export type AutoswapConfig = SwapConfig
export type AutoswapError = SwapError
export type AutoswapErrorType = SwapErrorType
