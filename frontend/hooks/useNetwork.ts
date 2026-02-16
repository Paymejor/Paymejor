'use client'

import { useState, useCallback, useEffect } from 'react'
import { SupportedNetwork, getNetworkConfig, getDefaultNetwork } from '@/lib/constants'

/**
 * useNetwork Hook
 * 
 * Manages network selection and switching between Sepolia and Mainnet.
 * Persists network selection to localStorage.
 * Triggers refresh callbacks when network changes.
 * 
 * Requirements: TR-4.1, TR-4.9, TR-4.27, TR-4.34, AC-1.4
 */

interface UseNetworkReturn {
  network: SupportedNetwork
  switchNetwork: (newNetwork: SupportedNetwork) => Promise<void>
  config: ReturnType<typeof getNetworkConfig>
  isNetworkSupported: (network: string) => network is SupportedNetwork
  isSwitching: boolean
}

const NETWORK_STORAGE_KEY = 'paymejor_selected_network'
const NETWORK_CHANGE_EVENT = 'paymejor_network_changed'

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

  const [isSwitching, setIsSwitching] = useState(false)

  // Get current network configuration
  const config = getNetworkConfig(network)

  /**
   * Switch to a different network
   * Triggers a custom event that other components can listen to
   * 
   * Requirements: TR-4.1, TR-4.27, TR-4.34
   */
  const switchNetwork = useCallback(async (newNetwork: SupportedNetwork) => {
    if (newNetwork !== 'sepolia' && newNetwork !== 'mainnet') {
      console.error('Invalid network:', newNetwork)
      return
    }

    if (newNetwork === network) {
      console.log('Already on network:', newNetwork)
      return
    }

    try {
      setIsSwitching(true)
      
      // Update state
      setNetwork(newNetwork)
      
      // Persist to localStorage
      try {
        localStorage.setItem(NETWORK_STORAGE_KEY, newNetwork)
      } catch (error) {
        console.error('Failed to save network to localStorage:', error)
      }

      console.log('Network switched to:', newNetwork)

      // Dispatch custom event for other components to listen
      // This allows components to refresh their data when network changes
      window.dispatchEvent(new CustomEvent(NETWORK_CHANGE_EVENT, {
        detail: { 
          previousNetwork: network,
          newNetwork,
          config: getNetworkConfig(newNetwork)
        }
      }))

      // Small delay to allow components to update
      await new Promise(resolve => setTimeout(resolve, 100))
    } finally {
      setIsSwitching(false)
    }
  }, [network])

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
          
          // Dispatch event for multi-tab sync
          window.dispatchEvent(new CustomEvent(NETWORK_CHANGE_EVENT, {
            detail: { 
              previousNetwork: network,
              newNetwork: e.newValue,
              config: getNetworkConfig(e.newValue as SupportedNetwork)
            }
          }))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [network])

  return {
    network,
    switchNetwork,
    config,
    isNetworkSupported,
    isSwitching,
  }
}

/**
 * Hook to listen for network changes
 * Components can use this to refresh their data when network switches
 */
export function useNetworkChangeListener(
  callback: (detail: { previousNetwork: SupportedNetwork; newNetwork: SupportedNetwork; config: ReturnType<typeof getNetworkConfig> }) => void
) {
  useEffect(() => {
    const handleNetworkChange = (e: Event) => {
      const customEvent = e as CustomEvent
      callback(customEvent.detail)
    }

    window.addEventListener(NETWORK_CHANGE_EVENT, handleNetworkChange)
    return () => window.removeEventListener(NETWORK_CHANGE_EVENT, handleNetworkChange)
  }, [callback])
}
