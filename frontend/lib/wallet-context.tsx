'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AccountInterface, constants } from 'starknet'
import { connect as connectStarknet, disconnect as disconnectStarknet } from '@starknet-io/get-starknet'
import type { StarknetWindowObject } from '@starknet-io/get-starknet'
import { WalletState, TokenBalances } from '@/types/starknet'
import { SupportedNetwork } from './constants'

interface WalletContextType extends WalletState {
  balances: TokenBalances
  connect: () => Promise<void>
  disconnect: () => void
  setNetwork: (network: SupportedNetwork) => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountInterface | null>(null)
  const [network, setNetworkState] = useState<SupportedNetwork>('sepolia')
  const [balances, setBalances] = useState<TokenBalances>({
    wBTC: '0',
    USDC: '0',
    ETH: '0',
    network: 'sepolia',
  })

  // Handle wallet events and reconnection on mount
  useEffect(() => {
    const handleAccountsChanged = (accounts?: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnect()
      }
    }

    const handleNetworkChanged = (chainId?: string) => {
      if (chainId) {
        const detectedNetwork = chainId === constants.StarknetChainId.SN_SEPOLIA 
          ? 'sepolia' 
          : 'mainnet'
        
        if (detectedNetwork !== 'sepolia') {
          console.warn('Network changed to non-Sepolia network')
          disconnect()
        } else {
          setNetworkState(detectedNetwork)
        }
      }
    }

    // Try to reconnect to last wallet on mount
    const reconnectWallet = async () => {
      try {
        const starknet = await connectStarknet({ 
          modalMode: 'neverAsk',
        })
        
        if (starknet && starknet.isConnected) {
          const walletAccount = starknet.account
          const chainId = await starknet.provider.getChainId()
          const detectedNetwork = chainId === constants.StarknetChainId.SN_SEPOLIA 
            ? 'sepolia' 
            : 'mainnet'

          if (detectedNetwork === 'sepolia') {
            setIsConnected(true)
            setAddress(walletAccount.address)
            setAccount(walletAccount)
            setNetworkState(detectedNetwork)
            console.log('Wallet reconnected:', walletAccount.address)
          }
        }
      } catch (error) {
        // Silent fail on reconnection attempt
        console.debug('No wallet to reconnect')
      }
    }

    reconnectWallet()

    // Note: get-starknet v4 handles events internally
    // We rely on the wallet's own event system
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  const connect = async () => {
    try {
      // Connect using get-starknet (supports multiple wallets including Xverse)
      const starknet = await connectStarknet({
        modalMode: 'alwaysAsk',
        modalTheme: 'dark',
      })

      if (!starknet) {
        throw new Error('Failed to connect wallet')
      }

      // Enable the wallet connection if not already connected
      if (!starknet.isConnected) {
        await starknet.enable({ starknetVersion: 'v5' })
      }

      // Get the account
      const walletAccount = starknet.account
      
      if (!walletAccount) {
        throw new Error('No account found')
      }

      // Detect network from chain ID
      const chainId = await starknet.provider.getChainId()
      const detectedNetwork = chainId === constants.StarknetChainId.SN_SEPOLIA 
        ? 'sepolia' 
        : 'mainnet'

      // Verify we're on Sepolia testnet
      if (detectedNetwork !== 'sepolia') {
        throw new Error('Please switch to Starknet Sepolia testnet')
      }

      // Update state with real wallet data
      setIsConnected(true)
      setAddress(walletAccount.address)
      setAccount(walletAccount)
      setNetworkState(detectedNetwork)
      
      // Initial balances will be fetched by other hooks
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
        network: detectedNetwork,
      })

      console.log('Wallet connected:', walletAccount.address)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      // Reset state on error
      setIsConnected(false)
      setAddress(null)
      setAccount(null)
      throw error
    }
  }

  const disconnect = () => {
    try {
      // Disconnect using get-starknet
      disconnectStarknet({ clearLastWallet: true })
      
      // Clear all state
      setIsConnected(false)
      setAddress(null)
      setAccount(null)
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
    }
  }

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
