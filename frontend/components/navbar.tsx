'use client'

import { Shield, Sun, Moon, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'
import { useWallet } from '@/lib/wallet-context'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { isConnected, address, connect, disconnect } = useWallet()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

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

        {/* Right: Theme toggle + Wallet */}
        <div className="flex items-center gap-2 md:gap-3">
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

          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {formatAddress(address)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="text-xs hidden sm:inline-flex"
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={connect}
              className="bg-primary hover:bg-primary/90 text-xs md:text-sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
