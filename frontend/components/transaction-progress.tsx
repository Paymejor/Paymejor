'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { TransactionProgress as TransactionProgressType } from '@/types/transaction'

/**
 * TransactionProgress Component
 * 
 * Displays real-time transaction progress with status indicators
 * Requirements: TR-4.23, TR-4.24, NFR-5.2
 */

interface TransactionProgressProps {
  progress: TransactionProgressType
  onViewExplorer?: () => void
  onDismiss?: () => void
}

export function TransactionProgress({
  progress,
  onViewExplorer,
  onDismiss,
}: TransactionProgressProps) {
  const [timeElapsed, setTimeElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'pending':
      case 'confirming':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case 'confirmed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
    }
  }

  const getStatusColor = () => {
    switch (progress.status) {
      case 'pending':
      case 'confirming':
        return 'bg-blue-500'
      case 'confirmed':
        return 'bg-green-500'
      case 'failed':
        return 'bg-red-500'
    }
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Transaction Status</CardTitle>
          </div>
          {onDismiss && progress.status !== 'pending' && progress.status !== 'confirming' && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
        <CardDescription className="font-mono text-xs">
          {progress.transactionHash.slice(0, 10)}...{progress.transactionHash.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{progress.message}</span>
            <span className="font-medium">{Math.round(progress.progress)}%</span>
          </div>
          <Progress value={progress.progress} className={getStatusColor()} />
        </div>

        {/* Confirmations */}
        {progress.confirmations !== undefined && progress.requiredConfirmations !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Confirmations</span>
            <span className="font-medium">
              {progress.confirmations} / {progress.requiredConfirmations}
            </span>
          </div>
        )}

        {/* Time elapsed */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Time elapsed</span>
          <span className="font-medium">{formatTime(timeElapsed)}</span>
        </div>

        {/* View on explorer */}
        {onViewExplorer && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onViewExplorer}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            View on Explorer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
