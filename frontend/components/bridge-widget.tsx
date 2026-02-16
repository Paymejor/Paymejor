'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Loader2 
} from 'lucide-react'
import { useAtomiq } from '@/hooks/useAtomiq'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from '@/hooks/useNetwork'
import { getTxUrl } from '@/lib/constants'
import type { AtomiqTransactionStatusResponse } from '@/types/atomiq'

/**
 * BridgeWidget Component
 * 
 * Provides UI for bridging BTC to wBTC on Starknet using Atomiq SDK.
 * Features:
 * - Amount input with validation
 * - Network-aware bridge initiation
 * - Transaction status display with confirmations
 * - Estimated completion time
 * - Links to Voyager explorer
 * 
 * Requirements: AC-2.2, AC-2.4, AC-2.7, TR-4.8
 */

interface BridgeWidgetProps {
  onBridgeComplete?: (txId: string) => void
  className?: string
}

export function BridgeWidget({ onBridgeComplete, className }: BridgeWidgetProps) {
  const { isConnected } = useWallet()
  const { network, config } = useNetwork()
  const { 
    initiateBridge, 
    getTransactionStatus,
    pollTransactionStatus,
    isLoading, 
    error: atomiqError 
  } = useAtomiq()

  // Form state
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Transaction state
  const [activeTxId, setActiveTxId] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<AtomiqTransactionStatusResponse | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  /**
   * Validate BTC amount input
   */
  const validateAmount = (value: string): boolean => {
    if (!value || value.trim() === '') {
      setError('Please enter an amount')
      return false
    }

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setError('Please enter a valid amount')
      return false
    }

    // Minimum bridge amount (0.0001 BTC)
    if (numValue < 0.0001) {
      setError('Minimum bridge amount is 0.0001 BTC')
      return false
    }

    setError(null)
    return true
  }

  /**
   * Handle bridge initiation
   * Requirements: AC-2.1, AC-2.2, AC-2.3
   */
  const handleBridge = async () => {
    if (!validateAmount(amount)) {
      return
    }

    try {
      setError(null)
      
      // Initiate bridge transaction
      const tx = await initiateBridge({
        fromAsset: 'BTC',
        toAsset: 'wBTC',
        amount: amount,
      })

      setActiveTxId(tx.id)
      
      // Start polling for status updates
      setIsPolling(true)
      await pollTransactionStatus(tx.id, (status) => {
        setTxStatus(status)
        
        // Stop polling when completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          setIsPolling(false)
          
          if (status.status === 'completed' && onBridgeComplete) {
            onBridgeComplete(tx.id)
          }
        }
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate bridge'
      setError(errorMessage)
      console.error('Bridge error:', err)
    }
  }

  /**
   * Get status badge color and text
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, text: 'Pending', icon: Clock }
      case 'btc_confirmed':
        return { variant: 'default' as const, text: 'BTC Confirmed', icon: CheckCircle2 }
      case 'processing':
        return { variant: 'default' as const, text: 'Processing', icon: Loader2 }
      case 'completed':
        return { variant: 'default' as const, text: 'Completed', icon: CheckCircle2 }
      case 'failed':
        return { variant: 'destructive' as const, text: 'Failed', icon: AlertCircle }
      default:
        return { variant: 'secondary' as const, text: 'Unknown', icon: Clock }
    }
  }

  /**
   * Calculate progress percentage based on confirmations
   */
  const getProgressPercentage = (): number => {
    if (!txStatus) return 0
    
    if (txStatus.status === 'completed') return 100
    if (txStatus.status === 'failed') return 0
    
    // Calculate based on confirmations
    const progress = (txStatus.confirmations / txStatus.requiredConfirmations) * 100
    return Math.min(progress, 95) // Cap at 95% until fully completed
  }

  /**
   * Format estimated completion time
   */
  const formatEstimatedTime = (timestamp?: number): string => {
    if (!timestamp) return 'Calculating...'
    
    const now = Date.now()
    const diff = timestamp - now
    
    if (diff <= 0) return 'Soon'
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `~${hours}h ${minutes % 60}m`
    }
    return `~${minutes}m`
  }

  /**
   * Reset form
   */
  const handleReset = () => {
    setAmount('')
    setActiveTxId(null)
    setTxStatus(null)
    setError(null)
    setIsPolling(false)
  }

  // Show transaction status if there's an active transaction
  if (activeTxId && txStatus) {
    const statusBadge = getStatusBadge(txStatus.status)
    const StatusIcon = statusBadge.icon
    const progress = getProgressPercentage()

    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Bridge Transaction</span>
            <Badge variant={statusBadge.variant} className="flex items-center gap-1">
              <StatusIcon className="h-3 w-3" />
              {statusBadge.text}
            </Badge>
          </CardTitle>
          <CardDescription>
            Bridging {amount} BTC to wBTC on {network === 'mainnet' ? 'Mainnet' : 'Sepolia'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Confirmations */}
          {txStatus.status !== 'completed' && txStatus.status !== 'failed' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Confirmations</span>
              <span className="font-medium">
                {txStatus.confirmations} / {txStatus.requiredConfirmations}
              </span>
            </div>
          )}

          {/* Estimated completion time */}
          {txStatus.estimatedCompletionTime && txStatus.status !== 'completed' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated completion</span>
              <span className="font-medium">
                {formatEstimatedTime(txStatus.estimatedCompletionTime)}
              </span>
            </div>
          )}

          {/* Success message */}
          {txStatus.status === 'completed' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Bridge completed successfully! Your wBTC should arrive shortly.
              </AlertDescription>
            </Alert>
          )}

          {/* Error message */}
          {txStatus.status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {txStatus.error || 'Bridge transaction failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Explorer link */}
          <Button
            variant="outline"
            className="w-full"
            asChild
          >
            <a
              href={getTxUrl(activeTxId, network)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2"
            >
              View on Voyager
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>

          {/* Reset button */}
          {(txStatus.status === 'completed' || txStatus.status === 'failed') && (
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleReset}
            >
              Start New Bridge
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Show bridge form
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Bridge BTC to Starknet</CardTitle>
        <CardDescription>
          Trustlessly bridge Bitcoin to wBTC on {network === 'mainnet' ? 'Mainnet' : 'Sepolia'} using Atomiq
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network indicator */}
        <Alert className="border-primary bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription>
            Bridging to <span className="font-semibold">{network === 'mainnet' ? 'Starknet Mainnet' : 'Starknet Sepolia'}</span>
          </AlertDescription>
        </Alert>

        {/* Amount input */}
        <div className="space-y-2">
          <Label htmlFor="bridge-amount">Amount (BTC)</Label>
          <div className="relative">
            <Input
              id="bridge-amount"
              type="number"
              step="0.0001"
              min="0.0001"
              placeholder="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!isConnected || isLoading}
              className="pr-16"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              BTC
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Minimum: 0.0001 BTC
          </p>
        </div>

        {/* Bridge direction indicator */}
        <div className="flex items-center justify-center gap-3 py-2">
          <Badge variant="outline" className="text-sm">BTC</Badge>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline" className="text-sm">wBTC</Badge>
        </div>

        {/* Error display */}
        {(error || atomiqError) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || atomiqError}
            </AlertDescription>
          </Alert>
        )}

        {/* Bridge button */}
        <Button
          className="w-full"
          onClick={handleBridge}
          disabled={!isConnected || isLoading || !amount}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initiating Bridge...
            </>
          ) : !isConnected ? (
            'Connect Wallet to Bridge'
          ) : (
            'Bridge BTC to wBTC'
          )}
        </Button>

        {/* Info text */}
        <p className="text-xs text-center text-muted-foreground">
          Bridge typically takes 30-60 minutes for Bitcoin confirmations
        </p>
      </CardContent>
    </Card>
  )
}
