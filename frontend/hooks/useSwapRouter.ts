'use client'

import { useState, useCallback, useMemo } from 'react'
import { PaymasterRpc } from 'starknet'
import { getQuotes, executeSwap as avnuExecuteSwap, Quote } from '@avnu/avnu-sdk'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from './useNetwork'
import { getNetworkConfig } from '@/lib/constants'
import { SecurityValidation } from '@/lib/security-validation'
import {
  SwapConfig,
  SwapQuoteParams,
  SwapQuote,
  SwapExecuteParams,
  SwapTransactionResult,
  SwapRoute,
} from '@/types/autoswap'

/**
 * useSwapRouter Hook
 * 
 * Provides AVNU DEX aggregator integration for token swaps on Starknet:
 * - Real-time quotes from all DEXs, CLOBs, and market makers
 * - Gasless transactions via AVNU Paymaster
 * - Optimal routing with competing solver algorithms
 * - Slippage protection
 * - Security validations
 * 
 * Architecture: Direct User Swap
 * - User executes swap directly through their wallet
 * - Tokens sent directly to user's wallet
 * - No custody risk, no intermediary account
 * 
 * Requirements: AC-5.2, AC-5.4, TR-4.5
 * 
 * Provider: AVNU SDK v4 (@avnu/avnu-sdk)
 * Docs: https://docs.avnu.fi
 */

interface UseSwapRouterReturn {
  getQuote: (params: SwapQuoteParams) => Promise<SwapQuote>
  executeSwap: (params: SwapExecuteParams) => Promise<SwapTransactionResult>
  config: SwapConfig
  isLoading: boolean
  error: string | null
}

export function useSwapRouter(): UseSwapRouterReturn {
  const { account, address } = useWallet()
  const { network } = useNetwork()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Swap configuration based on current network
   */
  const config = useMemo<SwapConfig>(() => {
    const networkConfig = getNetworkConfig(network)
    return {
      network,
      rpcUrl: networkConfig.rpcUrl,
      avnu: {
        enabled: true,
        paymasterEnabled: !!process.env.NEXT_PUBLIC_PAYMASTER_API, // Gasless available if API key exists
      },
      autoswappr: {
        enabled: false,
        contractAddress: '',
      },
    }
  }, [network])

  /**
   * Initialize Paymaster for gasless transactions
   */
  const getPaymaster = useCallback(() => {
    const paymasterApiKey = process.env.NEXT_PUBLIC_PAYMASTER_API
    if (!paymasterApiKey) {
      return null
    }

    const paymasterUrl = network === 'mainnet'
      ? process.env.NEXT_PUBLIC_PAYMASTER_URL_MAINNET || 'https://starknet.paymaster.avnu.fi'
      : process.env.NEXT_PUBLIC_PAYMASTER_URL || 'https://sepolia.paymaster.avnu.fi'

    return new PaymasterRpc({
      nodeUrl: paymasterUrl,
      headers: {
        'x-paymaster-api-key': paymasterApiKey,
      },
    })
  }, [network])

  /**
   * Get swap quote from AVNU
   * 
   * Fetches real-time quotes from all liquidity sources on Starknet
   * Requirements: AC-5.2
   */
  const getQuote = useCallback(async (
    params: SwapQuoteParams
  ): Promise<SwapQuote> => {
    try {
      setIsLoading(true)
      setError(null)

      const { fromToken, toToken, amount } = params

      console.log('Fetching quote from AVNU...')
      
      const quotes = await getQuotes({
        sellTokenAddress: fromToken,
        buyTokenAddress: toToken,
        sellAmount: BigInt(amount),
        takerAddress: address || '0x0',
      })

      if (!quotes || quotes.length === 0) {
        throw new Error('No quotes available for this token pair')
      }

      const bestQuote = quotes[0] // AVNU returns sorted by best price
      
      // Convert AVNU quote to our format
      const quote: SwapQuote = {
        fromToken,
        toToken,
        fromAmount: amount,
        toAmount: bestQuote.buyAmount.toString(),
        priceImpact: bestQuote.priceImpact || 0,
        route: convertAvnuRoutes(bestQuote),
        estimatedGas: bestQuote.gasFeesInUsd?.toString() || '0',
        expiresAt: Date.now() + 60000, // 1 minute expiry
        provider: 'avnu',
        avnuQuote: bestQuote,
      }

      console.log('AVNU quote received:', {
        fromAmount: quote.fromAmount,
        toAmount: quote.toAmount,
        priceImpact: quote.priceImpact,
        routes: quote.route.length,
        gasFeesUsd: bestQuote.gasFeesInUsd,
      })

      return quote
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get swap quote'
      setError(errorMessage)
      console.error('Error getting swap quote:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [address])

  /**
   * Execute swap transaction with optional gas-free feature
   * 
   * Flow:
   * 1. Get quote
   * 2. Validate parameters
   * 3. Execute swap via AVNU (with or without Paymaster)
   * 4. Return transaction result
   * 
   * Requirements: AC-5.2, AC-5.4
   */
  const executeSwap = useCallback(async (
    params: SwapExecuteParams
  ): Promise<SwapTransactionResult> => {
    if (!account || !address) {
      throw new Error('Wallet not connected')
    }

    try {
      setIsLoading(true)
      setError(null)

      const { fromToken, toToken, amount, slippage, gasless = false } = params

      // Security validations
      const fromTokenValidation = SecurityValidation.validateAddress(fromToken)
      if (!fromTokenValidation.valid) {
        throw new Error(`Invalid fromToken address: ${fromTokenValidation.error}`)
      }

      const toTokenValidation = SecurityValidation.validateAddress(toToken)
      if (!toTokenValidation.valid) {
        throw new Error(`Invalid toToken address: ${toTokenValidation.error}`)
      }

      const networkConfig = getNetworkConfig(network)
      const token = fromToken === networkConfig.contracts.wBTC ? 'wBTC' : 'USDC'
      const amountValidation = SecurityValidation.validateAmount({ amount, token })
      if (!amountValidation.valid) {
        throw new Error(amountValidation.error)
      }

      const slippageValidation = SecurityValidation.validateSlippage(slippage)
      if (!slippageValidation.valid) {
        throw new Error(slippageValidation.error)
      }

      const rateLimitCheck = SecurityValidation.checkTransactionRateLimit(address)
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.error)
      }

      // Get quote first
      const quote = await getQuote({ fromToken, toToken, amount })

      if (!quote.avnuQuote) {
        throw new Error('No valid quote available')
      }

      console.log('Executing swap via AVNU...')
      console.log('- Gasless:', gasless)
      console.log('- Slippage:', slippage, '%')
      console.log('- Expected output:', quote.toAmount)

      // Execute swap with AVNU SDK
      const swapParams: any = {
        provider: account,
        quote: quote.avnuQuote,
        slippage: slippage / 100, // AVNU expects decimal (0.01 for 1%)
      }

      // Add Paymaster for gasless transactions if enabled
      let isGasless = false
      if (gasless && config.avnu.paymasterEnabled) {
        const paymaster = getPaymaster()
        if (paymaster) {
          console.log('Using AVNU Paymaster for gasless transaction')
          swapParams.paymaster = {
            active: true,
            provider: paymaster,
            params: {
              version: '0x1',
              feeMode: { mode: 'sponsored' }, // You sponsor, user pays nothing
            },
          }
          isGasless = true
        } else {
          console.warn('Paymaster API key not configured, executing with gas')
        }
      }

      const swapResult = await avnuExecuteSwap(swapParams)

      const result: SwapTransactionResult = {
        transactionHash: swapResult.transactionHash,
        status: 'pending',
        fromToken,
        toToken,
        fromAmount: amount,
        expectedToAmount: quote.toAmount,
        provider: 'avnu',
        gasless: isGasless,
      }

      console.log('AVNU swap executed:', result.transactionHash)
      console.log('Gasless transaction:', isGasless)
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap execution failed'
      setError(errorMessage)
      console.error('Error executing swap:', err)
      throw new Error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [account, address, network, getQuote, config, getPaymaster])

  return {
    getQuote,
    executeSwap,
    config,
    isLoading,
    error,
  }
}

/**
 * Helper: Convert AVNU routes to our format
 */
function convertAvnuRoutes(quote: Quote): SwapRoute[] {
  if (!quote.routes || quote.routes.length === 0) {
    return []
  }

  return quote.routes.map((route: any) => ({
    dex: route.name || 'Unknown DEX',
    percentage: Math.round((route.percent || 0) * 100),
    poolAddress: route.address || '0x0',
  }))
}
