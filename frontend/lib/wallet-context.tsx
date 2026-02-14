'use client'

import React, { createContext, useContext, useState } from 'react'

interface WalletContextType {
  isConnected: boolean
  address: string | null
  balance: number
  network: string
  connect: () => void
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState(0)

  const connect = () => {
    const mockAddress = '0x' + Math.random().toString(16).slice(2, 10).toUpperCase()
    setIsConnected(true)
    setAddress(mockAddress)
    setBalance(2.5)
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
    setBalance(0)
  }

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        network: 'Starknet Sepolia',
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
