'use client'

import { Shield, Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useWallet } from '@/lib/wallet-context'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { isConnected, address, network, connect, disconnect } = useWallet()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
      toast({
        title: 'Wallet Connected',
        description: 'Successfully connected to Starknet Sepolia',
        duration: 3000,
      })
    } catch (error) {
      console.error('Connection error:', error)
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to connect wallet'
      let errorDescription = 'Please try again'
      
      if (error instanceof Error) {
        if (error.message.includes('Sepolia')) {
          errorMessage = 'Wrong Network'
          errorDescription = 'Please switch to Starknet Sepolia testnet in your wallet'
        } else if (error.message.includes('rejected') || error.message.includes('denied')) {
          errorMessage = 'Connection Rejected'
          errorDescription = 'You rejected the connection request'
        } else if (error.message.includes('No account')) {
          errorMessage = 'No Account Found'
          errorDescription = 'Please unlock your wallet and try again'
        } else if (error.message.includes('Failed to connect')) {
          errorMessage = 'Connection Failed'
          errorDescription = 'Please install a Starknet wallet (e.g., Argent, Braavos, Xverse)'
        }
      }
      
      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
        duration: 5000,
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = () => {
    try {
      disconnect()
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
        duration: 3000,
      })
    } catch (error) {
      console.error('Disconnect error:', error)
      toast({
        title: 'Disconnect Failed',
        description: 'There was an error disconnecting your wallet',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  const getNetworkDisplay = () => {
    if (network === 'sepolia') {
      return 'Starknet Sepolia'
    }
    return 'Starknet Mainnet'
  }

  const isCorrectNetwork = network === 'sepolia'

  if (!mounted) return null

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-50">
      <div className="mx-auto flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
        {/* Left: Logo */}
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary p-2">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg md:text-xl font-bold text-foreground">PayMeJor</span>
        </div>

        {/* Right: Network indicator + Theme toggle + Wallet */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Network Indicator - Only show when connected */}
          {isConnected && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant={isCorrectNetwork ? 'default' : 'destructive'} 
                    className="text-xs hidden sm:flex items-center gap-1"
                  >
                    {isCorrectNetwork ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <AlertCircle className="h-3 w-3" />
                    )}
                    {getNetworkDisplay()}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isCorrectNetwork 
                      ? 'Connected to the correct network' 
                      : 'Please switch to Starknet Sepolia'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleThemeToggle}
            className="px-2"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Wallet Connection */}
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {formatAddress(address)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono text-xs">{address}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                className="text-xs hidden sm:inline-flex"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary/90 text-xs md:text-sm"
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
