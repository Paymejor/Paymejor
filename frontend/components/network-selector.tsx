'use client'

import { Check, ChevronDown, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useNetwork } from '@/hooks/useNetwork'
import { SupportedNetwork } from '@/lib/constants'

/**
 * NetworkSelector Component
 * 
 * Dropdown component for switching between Sepolia and Mainnet.
 * Displays current network and allows user to switch.
 * 
 * Requirements: TR-4.1, TR-4.27, AC-1.4
 */

interface NetworkOption {
  value: SupportedNetwork
  label: string
  description: string
  badge?: string
}

const NETWORK_OPTIONS: NetworkOption[] = [
  {
    value: 'sepolia',
    label: 'Starknet Sepolia',
    description: 'Testnet for development',
    badge: 'Testnet',
  },
  {
    value: 'mainnet',
    label: 'Starknet Mainnet',
    description: 'Production network',
    badge: 'Mainnet',
  },
]

export function NetworkSelector() {
  const { network, switchNetwork } = useNetwork()

  const currentNetwork = NETWORK_OPTIONS.find(opt => opt.value === network)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 hover:border-border"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentNetwork?.label}</span>
          <span className="sm:hidden">{currentNetwork?.badge}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {NETWORK_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => switchNetwork(option.value)}
            className="flex items-start gap-3 cursor-pointer"
          >
            <div className="flex h-5 items-center">
              {network === option.value && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{option.label}</span>
                <Badge
                  variant={option.value === 'mainnet' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {option.badge}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {option.description}
              </p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
