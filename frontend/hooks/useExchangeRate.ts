'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * useExchangeRate Hook
 * 
 * Fetches live USDC/NGN exchange rate from CoinGecko API
 * 
 * Requirements: AC-7.2, AC-7.3
 */

interface ExchangeRateData {
  rate: number | null
  lastUpdated: number | null
  isLoading: boolean
  error: string | null
}

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'
const REFRESH_INTERVAL = 60000 // 1 minute

export function useExchangeRate() {
  const [data, setData] = useState<ExchangeRateData>({
    rate: null,
    lastUpdated: null,
    isLoading: false,
    error: null,
  })

  /**
   * Fetch USDC/NGN exchange rate from CoinGecko
   * CoinGecko provides USD/NGN rate, which we use for USDC (1:1 with USD)
   */
  const fetchExchangeRate = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      // Fetch USD to NGN rate (USDC is pegged 1:1 to USD)
      const response = await fetch(
        `${COINGECKO_API_URL}?ids=usd-coin&vs_currencies=ngn`,
        {
          headers: {
            'Accept': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()
      
      // Extract NGN rate from response
      const rate = result['usd-coin']?.ngn

      if (!rate) {
        throw new Error('Exchange rate not available')
      }

      setData({
        rate,
        lastUpdated: Date.now(),
        isLoading: false,
        error: null,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch exchange rate'
      console.error('Error fetching exchange rate:', err)
      
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
    }
  }, [])

  /**
   * Refresh exchange rate manually
   */
  const refresh = useCallback(() => {
    fetchExchangeRate()
  }, [fetchExchangeRate])

  /**
   * Calculate NGN amount from USDC amount
   */
  const calculateNGN = useCallback((usdcAmount: number): number => {
    if (!data.rate) return 0
    return usdcAmount * data.rate
  }, [data.rate])

  // Fetch on mount and set up auto-refresh
  useEffect(() => {
    fetchExchangeRate()

    const interval = setInterval(() => {
      fetchExchangeRate()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchExchangeRate])

  return {
    rate: data.rate,
    lastUpdated: data.lastUpdated,
    isLoading: data.isLoading,
    error: data.error,
    refresh,
    calculateNGN,
  }
}
