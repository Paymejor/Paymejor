'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { AccountInterface, constants } from 'starknet'
import { connect as connectStarknet, disconnect as disconnectStarknet } from '@starknet-io/get-starknet'
import type { StarknetWindowObject } from '@starknet-io/get-starknet'
import { WalletState, TokenBalances } from '@/types/starknet'
import { NETWORK_CONFIG } from './constants'

interface WalletContextType extends WalletState {
  balances: TokenBalances
  connect: () => Promise<void>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountInterface | null>(null)
  const [network, setNetwork] = useState<'sepolia' | 'mainnet'>('sepolia')
  const [balances, setBalances] = useState<TokenBalances>({
    wBTC: '0',
    USDC: '0',
    ETH: '0',
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
          setNetwork(detectedNetwork)
        }
      }
    }

    // Try to reconnect to last wallet on mount
    const reconnectWallet = async () => {
      try {
        const starknet = await connectStarknet({ 
          modalMode: 'neverAsk',
        })
        
        if (starknet) {
          // Check if wallet is already connected
          const isWalletConnected = starknet.isConnected
          
          if (isWalletConnected) {
            const walletAccount = starknet.account
            const chainId = await starknet.provider.getChainId()
            const detectedNetwork = chainId === constants.StarknetChainId.SN_SEPOLIA 
              ? 'sepolia' 
              : 'mainnet'

            if (detectedNetwork === 'sepolia') {
              setIsConnected(true)
              setAddress(walletAccount.address)
              setAccount(walletAccount)
              setNetwork(detectedNetwork)
              console.log('Wallet reconnected:', walletAccount.address)
            }
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
      setNetwork(detectedNetwork)
      
      // Initial balances will be fetched by other hooks
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
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
      setNetwork('sepolia')
      setBalances({
        wBTC: '0',
        USDC: '0',
        ETH: '0',
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
