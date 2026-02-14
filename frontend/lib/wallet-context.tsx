'use client'

import React, { createContext, useContext, useState } from 'react'
import { AccountInterface } from 'starknet'
import { WalletState, TokenBalances } from '@/types/starknet'

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

  const connect = async () => {
    // TODO: Replace with real Xverse wallet integration
    const mockAddress = '0x' + Math.random().toString(16).slice(2, 10).toUpperCase()
    setIsConnected(true)
    setAddress(mockAddress)
    setNetwork('sepolia')
    setBalances({
      wBTC: '0',
      USDC: '0',
      ETH: '0',
    })
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    setAccount(null)
    setBalances({
      wBTC: '0',
      USDC: '0',
      ETH: '0',
    })
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
