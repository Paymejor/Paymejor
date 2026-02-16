/**
 * Autoswap DEX Aggregator Type Definitions
 * 
 * Types for Autoswap SDK integration on Starknet
 * Autoswap aggregates liquidity from multiple DEXs (Ekubo, JediSwap, etc.)
 * 
 * Requirements: AC-5.2, AC-5.4, TR-4.5
 */

import { SupportedNetwork } from '@/lib/constants'

/**
 * Autoswap client configuration
 */
export interface AutoswapConfig {
  network: SupportedNetwork
  rpcUrl: string
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
 * Swap quote response from Autoswap
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
}

/**
 * Slippage configuration
 */
export interface SlippageConfig {
  tolerance: number         // Percentage (e.g., 0.5 for 0.5%)
  minReceived: string       // Minimum amount to receive
}

/**
 * Autoswap error types
 */
export type AutoswapErrorType =
  | 'INSUFFICIENT_LIQUIDITY'
  | 'SLIPPAGE_EXCEEDED'
  | 'QUOTE_EXPIRED'
  | 'INVALID_TOKEN_PAIR'
  | 'INSUFFICIENT_BALANCE'
  | 'TRANSACTION_FAILED'
  | 'NETWORK_ERROR'

/**
 * Autoswap error
 */
export interface AutoswapError {
  type: AutoswapErrorType
  message: string
  details?: unknown
}

/**
 * Supported DEX list
 */
export type SupportedDEX = 'Ekubo' | 'JediSwap' | 'MySwap' | 'SithSwap' | '10KSwap'

/**
 * DEX liquidity info
 */
export interface DEXLiquidity {
  dex: SupportedDEX
  liquidity: string         // Total liquidity in USD
  volume24h: string         // 24h volume in USD
}
