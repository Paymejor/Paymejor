'use client'

import { Check, ChevronDown, Globe, Loader2 } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

/**
 * NetworkSelector Component
 * 
 * Dropdown component for switching between Sepolia and Mainnet.
 * Displays current network and allows user to switch.
 * Shows loading state during network switch.
 * 
 * Requirements: TR-4.1, TR-4.27, TR-4.34, AC-1.4
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
  const { network, switchNetwork, isSwitching } = useNetwork()
  const { toast } = useToast()

  const currentNetwork = NETWORK_OPTIONS.find(opt => opt.value === network)

  const handleNetworkSwitch = async (newNetwork: SupportedNetwork) => {
    if (newNetwork === network) return

    try {
      await switchNetwork(newNetwork)
      
      toast({
        title: 'Network Switched',
        description: `Switched to ${NETWORK_OPTIONS.find(opt => opt.value === newNetwork)?.label}`,
        duration: 3000,
      })
    } catch (error) {
      console.error('Failed to switch network:', error)
      
      toast({
        title: 'Network Switch Failed',
        description: 'Failed to switch network. Please try again.',
        variant: 'destructive',
        duration: 5000,
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-border/50 hover:border-border"
          disabled={isSwitching}
        >
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">
            {isSwitching ? 'Switching...' : currentNetwork?.label}
          </span>
          <span className="sm:hidden">
            {isSwitching ? '...' : currentNetwork?.badge}
          </span>
          {!isSwitching && <ChevronDown className="h-3 w-3 opacity-50" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {NETWORK_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleNetworkSwitch(option.value)}
            className="flex items-start gap-3 cursor-pointer"
            disabled={isSwitching || network === option.value}
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
