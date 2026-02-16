'use client'

import { useState, useCallback, useEffect } from 'react'
import { SupportedNetwork, getNetworkConfig, getDefaultNetwork } from '@/lib/constants'

/**
 * useNetwork Hook
 * 
 * Manages network selection and switching between Sepolia and Mainnet.
 * Persists network selection to localStorage.
 * 
 * Requirements: TR-4.1, TR-4.9, TR-4.27, AC-1.4
 */

interface UseNetworkReturn {
  network: SupportedNetwork
  switchNetwork: (newNetwork: SupportedNetwork) => void
  config: ReturnType<typeof getNetworkConfig>
  isNetworkSupported: (network: string) => network is SupportedNetwork
}

const NETWORK_STORAGE_KEY = 'paymejor_selected_network'

export function useNetwork(): UseNetworkReturn {
  // Initialize from localStorage or default
  const [network, setNetwork] = useState<SupportedNetwork>(() => {
    if (typeof window === 'undefined') {
      return getDefaultNetwork()
    }
    
    try {
      const stored = localStorage.getItem(NETWORK_STORAGE_KEY)
      if (stored && (stored === 'sepolia' || stored === 'mainnet')) {
        return stored as SupportedNetwork
      }
    } catch (error) {
      console.error('Failed to read network from localStorage:', error)
    }
    
    return getDefaultNetwork()
  })

  // Get current network configuration
  const config = getNetworkConfig(network)

  /**
   * Switch to a different network
   */
  const switchNetwork = useCallback((newNetwork: SupportedNetwork) => {
    if (newNetwork !== 'sepolia' && newNetwork !== 'mainnet') {
      console.error('Invalid network:', newNetwork)
      return
    }

    setNetwork(newNetwork)
    
    // Persist to localStorage
    try {
      localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork)
    } catch (error) {
      console.error('Failed to save network to localStorage:', error)
    }

    console.log('Network switched to:', newNetwork)
  }, [])

  /**
   * Type guard to check if a string is a supported network
   */
  const isNetworkSupported = useCallback((
    network: string
  ): network is SupportedNetwork => {
    return network === 'sepolia' || network === 'mainnet'
  }, [])

  // Sync with localStorage changes (for multi-tab support)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === NETWORK_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'sepolia' || e.newValue === 'mainnet') {
          setNetwork(e.newValue as SupportedNetwork)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return {
    network,
    switchNetwork,
    config,
    isNetworkSupported,
  }
}
