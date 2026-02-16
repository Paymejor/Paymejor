'use client'

import { Fuel, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { GasFeeEstimate } from '@/types/transaction'

/**
 * GasEstimateDisplay Component
 * 
 * Displays gas fee estimates before transaction execution
 * Requirements: TR-4.32, NFR-5.7
 */

interface GasEstimateDisplayProps {
  estimate: GasFeeEstimate | null
  isLoading?: boolean
  error?: string | null
  className?: string
}

export function GasEstimateDisplay({
  estimate,
  isLoading,
  error,
  className,
}: GasEstimateDisplayProps) {
  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to estimate gas fees. Transaction may still proceed.
        </AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!estimate) {
    return null
  }

  const formatEth = (wei: string): string => {
    const eth = Number(wei) / 1e18
    return eth.toFixed(6)
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <span>Gas Fee Estimate</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Fee</span>
              <span className="font-medium">
                {formatEth(estimate.estimatedFee)} ETH
              </span>
            </div>

            {estimate.estimatedFeeUSD && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">USD Value</span>
                <span className="font-medium">
                  ${Number(estimate.estimatedFeeUSD).toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Max Fee</span>
              <span className="font-medium">
                {formatEth(estimate.maxFee)} ETH
              </span>
            </div>

            {estimate.suggestedMaxFee && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-muted-foreground">
                  Suggested max: {formatEth(estimate.suggestedMaxFee)} ETH
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            Gas fees are paid in ETH and may vary based on network congestion.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
