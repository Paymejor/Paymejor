/**
 * Example Usage of useAutoswap Hook
 * 
 * This file demonstrates how to use the useAutoswap hook
 * for DEX aggregation and token swaps in the leverage loop.
 * 
 * Uses AutoSwappr SDK (autoswap-sdk package)
 * Contract: 0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b
 * 
 * Requirements: AC-5.2, AC-5.4, TR-4.5
 */

import { useAutoswap } from './useAutoswap'
import { getNetworkConfig } from '@/lib/constants'
import { useNetwork } from './useNetwork'

/**
 * Example 1: Get swap quote for USDC -> wBTC
 */
export async function exampleGetQuote() {
  const { getQuote } = useAutoswap()
  const { network } = useNetwork()
  const config = getNetworkConfig(network)
  
  try {
    // Get quote for swapping 1000 USDC to wBTC
    const quote = await getQuote({
      fromToken: config.contracts.USDC,
      toToken: config.contracts.wBTC,
      amount: '1000000000', // 1000 USDC (6 decimals)
    })
    
    console.log('AutoSwappr Quote:')
    console.log('- From:', quote.fromAmount, 'USDC')
    console.log('- To:', quote.toAmount, 'wBTC')
    console.log('- Price Impact:', quote.priceImpact, '%')
    console.log('- Route:', quote.route.map(r => `${r.dex} (${r.percentage}%)`).join(', '))
    console.log('- Estimated Gas:', quote.estimatedGas, 'ETH')
    
    return quote
  } catch (error) {
    console.error('Failed to get quote:', error)
    throw error
  }
}

/**
 * Example 2: Execute swap with slippage protection using AutoSwappr
 */
export async function exampleExecuteSwap() {
  const { executeSwap } = useAutoswap()
  const { network } = useNetwork()
  const config = getNetworkConfig(network)
  
  try {
    // Execute swap with 0.5% slippage tolerance
    // AutoSwappr will find the best route across multiple DEXs
    const result = await executeSwap({
      fromToken: config.contracts.USDC,
      toToken: config.contracts.wBTC,
      amount: '1000000000', // 1000 USDC
      slippage: 0.5, // 0.5% slippage tolerance
    })
    
    console.log('AutoSwappr Swap Transaction:')
    console.log('- TX Hash:', result.transactionHash)
    console.log('- Status:', result.status)
    console.log('- Expected Output:', result.expectedToAmount, 'wBTC')
    console.log('- Contract:', '0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b')
    
    return result
  } catch (error) {
    console.error('Failed to execute swap:', error)
    throw error
  }
}

/**
 * Example 3: Leverage loop integration with AutoSwappr
 * This shows how AutoSwappr is used in the leverage loop flow
 */
export async function exampleLeverageLoop() {
  const { getQuote, executeSwap } = useAutoswap()
  const { network } = useNetwork()
  const config = getNetworkConfig(network)
  
  try {
    // Step 1: Borrow USDC from Vesu (handled by useVesu)
    const borrowedUSDC = '1000000000' // 1000 USDC
    
    // Step 2: Get swap quote from AutoSwappr
    const quote = await getQuote({
      fromToken: config.contracts.USDC,
      toToken: config.contracts.wBTC,
      amount: borrowedUSDC,
    })
    
    console.log('Leverage Loop - AutoSwappr Quote:')
    console.log('- Swapping:', borrowedUSDC, 'USDC')
    console.log('- Expected:', quote.toAmount, 'wBTC')
    console.log('- Via:', quote.route.map(r => r.dex).join(' + '))
    
    // Step 3: Execute swap through AutoSwappr
    const swapResult = await executeSwap({
      fromToken: config.contracts.USDC,
      toToken: config.contracts.wBTC,
      amount: borrowedUSDC,
      slippage: 0.5,
    })
    
    console.log('Swap executed via AutoSwappr:', swapResult.transactionHash)
    
    // Step 4: Re-supply swapped wBTC to Vesu (handled by useVesu)
    // This increases collateral and borrowing capacity
    
    return {
      quote,
      swapResult,
    }
  } catch (error) {
    console.error('Leverage loop failed:', error)
    throw error
  }
}

/**
 * Example 4: Check slippage and price impact
 */
export async function exampleCheckSlippage() {
  const { getQuote } = useAutoswap()
  const { network } = useNetwork()
  const config = getNetworkConfig(network)
  
  const amount = '5000000000' // 5000 USDC (large trade)
  
  try {
    const quote = await getQuote({
      fromToken: config.contracts.USDC,
      toToken: config.contracts.wBTC,
      amount,
    })
    
    // Check if price impact is acceptable
    if (quote.priceImpact > 1.0) {
      console.warn('High price impact:', quote.priceImpact, '%')
      console.warn('Consider splitting into smaller trades')
    }
    
    // Calculate minimum received with slippage
    const slippage = 0.5 // 0.5%
    const expectedAmount = BigInt(quote.toAmount)
    const minAmount = (expectedAmount * BigInt(9950)) / BigInt(10000) // 0.5% slippage
    
    console.log('Slippage Protection:')
    console.log('- Expected:', quote.toAmount, 'wBTC')
    console.log('- Minimum:', minAmount.toString(), 'wBTC')
    console.log('- Slippage:', slippage, '%')
    
    return {
      quote,
      minAmount: minAmount.toString(),
    }
  } catch (error) {
    console.error('Failed to check slippage:', error)
    throw error
  }
}

/**
 * Example 5: Using AutoSwappr SDK directly (server-side only)
 * 
 * Note: This example shows how to use the AutoSwappr SDK directly
 * with a private key. This should ONLY be done server-side, never
 * in the browser.
 */
export async function exampleDirectSDKUsage() {
  // This is for reference only - DO NOT use in browser!
  // The SDK requires a private key which should never be exposed client-side
  
  /*
  import { AutoSwappr, TOKEN_ADDRESSES } from 'autoswap-sdk';
  
  const autoswappr = new AutoSwappr({
    contractAddress: '0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b',
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    accountAddress: 'YOUR_ACCOUNT_ADDRESS',
    privateKey: 'YOUR_PRIVATE_KEY', // NEVER expose this in browser!
  });
  
  // Execute swap
  const result = await autoswappr.executeSwap(
    TOKEN_ADDRESSES.USDC,
    TOKEN_ADDRESSES.WBTC,
    { amount: '1000' } // 1000 USDC
  );
  
  console.log('Swap result:', result);
  */
  
  console.warn('Direct SDK usage requires private key - use server-side only!')
  console.warn('In browser, use the useAutoswap hook which uses the connected wallet')
}
