'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AccountInterface, constants } from 'starknet'
import { connect as connectStarknet, disconnect as disconnectStarknet } from '@starknet-io/get-starknet'
import type { StarknetWindowObject } from '@starknet-io/get-starknet'
import { WalletState, TokenBalances } from '@/types/starknet'
import { SupportedNetwork } from './constants'

// Extended type to handle wallet properties that may not be in the base type
interface ExtendedStarknetWindowObject extends StarknetWindowObject {
  account?: AccountInterface
  selectedAddress?: string
}

interface WalletContextType extends WalletState {
  balances: TokenBalances
  connect: () => Promise<void>
  disconnect: () => void
  setNetwork: (network: SupportedNetwork) => void
  walletName: string | null
  isReconnecting: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountInterface | null>(null)
  const [network, setNetworkState] = useState<SupportedNetwork>('sepolia')
  const [walletName, setWalletName] = useState<string | null>(null)
  const [isReconnecting, setIsReconnecting] = useState(true)
  const [balances, setBalances] = useState<TokenBalances>({
    wBTC: '0',
    USDC: '0',
    ETH: '0',
    network: 'sepolia',
  })

  /**
   * Detect and validate wallet network
   * Returns the detected network or throws error if invalid
   */
  const detectNetwork = useCallback(async (starknet: ExtendedStarknetWindowObject): Promise<SupportedNetwork> => {
    try {
      // In get-starknet v4, we need to get the provider from the account
      const account = starknet.account
      if (!account) {
        throw new Error('No account available')
      }
      
      const chainId = await account.getChainId()
      
      // Map chain ID to network
      if (chainId === constants.StarknetChainId.SN_SEPOLIA) {
        return 'sepolia'
      } else if (chainId === constants.StarknetChainId.SN_MAIN) {
        return 'mainnet'
      }
      
      // Unknown network
      throw new Error(`Unsupported network. Chain ID: ${chainId}`)
    } catch (error) {
      console.error('Failed to detect network:', error)
      throw new Error('Failed to detect wallet network')
    }
  }, [])

  /**
   * Handle wallet connection with comprehensive error handling
   */
  const handleWalletConnection = useCallback(async (
    starknet: ExtendedStarknetWindowObject,
    isReconnect: boolean = false
  ): Promise<void> => {
    try {
      // Get account - in v4, if account exists, wallet is connected
      const walletAccount = starknet.account
      if (!walletAccount) {
        throw new Error('No account found in wallet')
      }

      // Detect network
      const detectedNetwork = await detectNetwork(starknet)

      // Get wallet name/ID
      const walletId = starknet.id || starknet.name || 'Unknown Wallet'

      // Update state
      setIsConnected(true)
      setAddress(walletAccount.address)
      setAccount(walletAccount)
      setNetworkState(detectedNetwork)
      setWalletName(walletId)
      
      // Initialize balances
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
        network: detectedNetwork,
      })

      if (!isReconnect) {
        console.log(`Wallet connected: ${walletId} on ${detectedNetwork}`)
      } else {
        console.log(`Wallet reconnected: ${walletId}`)
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      throw error
    }
  }, [detectNetwork])

  /**
   * Handle wallet events (account/network changes)
   */
  const setupWalletListeners = useCallback((starknet: ExtendedStarknetWindowObject) => {
    // Handle account changes
    const handleAccountsChanged = (accounts?: string[]) => {
      if (!accounts || accounts.length === 0) {
        console.log('Account disconnected')
        disconnect()
      } else {
        console.log('Account changed:', accounts[0])
        // Refresh connection with new account
        handleWalletConnection(starknet, true).catch(err => {
          console.error('Failed to handle account change:', err)
          disconnect()
        })
      }
    }

    // Handle network changes
    const handleNetworkChanged = async (chainId?: string) => {
      if (!chainId) return
      
      try {
        const detectedNetwork = await detectNetwork(starknet)
        console.log('Network changed to:', detectedNetwork)
        setNetworkState(detectedNetwork)
        
        // Update balances network reference
        setBalances(prev => ({
          ...prev,
          network: detectedNetwork,
        }))
      } catch (error) {
        console.error('Network change error:', error)
        // Disconnect if network is unsupported
        disconnect()
      }
    }

    // Note: get-starknet v4 handles events internally through the wallet
    // We set up listeners if the wallet exposes them
    if (starknet.on) {
      starknet.on('accountsChanged', handleAccountsChanged)
      starknet.on('networkChanged', handleNetworkChanged)
    }

    return () => {
      if (starknet.off) {
        starknet.off('accountsChanged', handleAccountsChanged)
        starknet.off('networkChanged', handleNetworkChanged)
      }
    }
  }, [detectNetwork, handleWalletConnection])

  /**
   * Attempt to reconnect to last connected wallet on mount
   */
  useEffect(() => {
    const reconnectWallet = async () => {
      try {
        setIsReconnecting(true)
        
        // Try to connect to last wallet without showing modal
        const starknet = await connectStarknet({ 
          modalMode: 'neverAsk',
        })
        
        // Check if wallet has an account (indicates it's connected)
        if (starknet && (starknet as ExtendedStarknetWindowObject).account) {
          await handleWalletConnection(starknet as ExtendedStarknetWindowObject, true)
          
          // Set up event listeners
          setupWalletListeners(starknet as ExtendedStarknetWindowObject)
        }
      } catch (error) {
        // Silent fail on reconnection - user can manually connect
        console.debug('No wallet to reconnect:', error)
      } finally {
        setIsReconnecting(false)
      }
    }

    reconnectWallet()
  }, [handleWalletConnection, setupWalletListeners])

  /**
   * Connect wallet with modal
   * Supports multiple wallets: Argent, Braavos, Xverse, etc.
   */
  const connect = async () => {
    try {
      // Show wallet selection modal
      const starknet = await connectStarknet({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
      })

      if (!starknet) {
        throw new Error('No wallet selected. Please install a Starknet wallet (Argent, Braavos, or Xverse)')
      }

      // Handle connection
      await handleWalletConnection(starknet as ExtendedStarknetWindowObject, false)
      
      // Set up event listeners
      setupWalletListeners(starknet as ExtendedStarknetWindowObject)

    } catch (error) {
      console.error('Failed to connect wallet:', error)
      
      // Clean up state on error
      setIsConnected(false)
      setAddress(null)
      setAccount(null)
      setWalletName(null)
      
      // Re-throw with user-friendly message
      if (error instanceof Error) {
        if (error.message.includes('No account')) {
          throw new Error('No account found. Please unlock your wallet and try again')
        } else if (error.message.includes('Unsupported network')) {
          throw new Error('Unsupported network. Please switch to Starknet Sepolia or Mainnet')
        } else if (error.message.includes('rejected') || error.message.includes('denied')) {
          throw new Error('Connection rejected. Please approve the connection in your wallet')
        } else if (error.message.includes('No wallet selected')) {
          throw error
        }
      }
      
      throw new Error('Failed to connect wallet. Please try again')
    }
  }

  /**
   * Disconnect wallet and clear state
   */
  const disconnect = () => {
    try {
      // Disconnect using get-starknet
      disconnectStarknet({ clearLastWallet: true })
      
      // Clear all state
      setIsConnected(false)
      setAddress(null)
      setAccount(null)
      setWalletName(null)
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
        network: network,
      })

      console.log('Wallet disconnected')
    } catch (error) {
      console.error('Error disconnecting wallet:', error)
      
      // Force clear state even on error
      setIsConnected(false)
      setAddress(null)
      setAccount(null)
      setWalletName(null)
    }
  }

  /**
   * Update network selection
   */
  const setNetwork = (newNetwork: SupportedNetwork) => {
    setNetworkState(newNetwork)
    
    // Update balances network reference
    setBalances(prev => ({
      ...prev,
      network: newNetwork,
    }))
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        account,
        network,
        balances,
        walletName,
        isReconnecting,
        connect,
        disconnect,
        setNetwork,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
