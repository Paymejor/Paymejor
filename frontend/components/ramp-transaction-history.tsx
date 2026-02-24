'use client'

/**
 * Ramp Transaction History Component
 * 
 * Displays history of MavaPay on/off-ramp transactions
 * Requirements: 5.1-5.6
 */

import { useState, useMemo } from 'react'
import { ExternalLink, RefreshCw, Filter, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { StoredRampTransaction, RampTransactionType, RampTransactionStatus } from '@/types/mavapay'
import { formatNGN, formatBTC } from '@/lib/currency-converter'

interface RampTransactionHistoryProps {
  transactions: StoredRampTransaction[]
  onRetry?: (transactionId: string) => void
  onRefresh?: () => void
  loading?: boolean
}

export function RampTransactionHistory({
  transactions,
  onRetry,
  onRefresh,
  loading = false,
}: RampTransactionHistoryProps) {
  const [filterType, setFilterType] = useState<RampTransactionType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<RampTransactionStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('createdAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType)
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus)
    }

    // Sort transactions
    filtered.sort((a, b) => {
      const aTime = new Date(a[sortBy]).getTime()
      const bTime = new Date(b[sortBy]).getTime()
      return sortOrder === 'desc' ? bTime - aTime : aTime - bTime
    })

    return filtered
  }, [transactions, filterType, filterStatus, sortBy, sortOrder])

  // Get status badge
  const getStatusBadge = (status: RampTransactionStatus) => {
    const config = {
      pending: {
        variant: 'secondary' as const,
        icon: Clock,
        label: 'Pending',
      },
      processing: {
        variant: 'default' as const,
        icon: Loader2,
        label: 'Processing',
      },
      completed: {
        variant: 'default' as const,
        icon: CheckCircle2,
        label: 'Completed',
        className: 'bg-green-500 hover:bg-green-600',
      },
      failed: {
        variant: 'destructive' as const,
        icon: XCircle,
        label: 'Failed',
      },
    }

    const { variant, icon: Icon, label, className } = config[status]

    return (
      <Badge variant={variant} className={className}>
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Get type badge
  const getTypeBadge = (type: RampTransactionType) => {
    const config = {
      'on-ramp': {
        icon: ArrowDownLeft,
        label: 'On-Ramp',
        className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
      },
      'off-ramp': {
        icon: ArrowUpRight,
        label: 'Off-Ramp',
        className: 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20',
      },
    }

    const { icon: Icon, label, className } = config[type]

    return (
      <Badge variant="outline" className={className}>
        <Icon className="mr-1 h-3 w-3" />
        {label}
      </Badge>
    )
  }

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  }

  // Format amount with currency
  const formatAmount = (amount: string, currency: string): string => {
    const numAmount = parseFloat(amount)
    
    if (currency === 'NGNKOBO') {
      return formatNGN(numAmount)
    } else if (currency === 'BTCSAT') {
      return formatBTC(numAmount)
    } else if (currency === 'NGN') {
      return formatNGN(numAmount * 100) // Convert NGN to kobo
    } else if (currency === 'BTC') {
      return formatBTC(numAmount * 100000000) // Convert BTC to satoshis
    }
    
    return `${amount} ${currency}`
  }

  // Get estimated completion time
  const getEstimatedCompletion = (tx: StoredRampTransaction): string | null => {
    if (tx.status !== 'pending' && tx.status !== 'processing') {
      return null
    }

    if (tx.expiresAt) {
      const expiresDate = new Date(tx.expiresAt)
      const now = new Date()
      const diffMs = expiresDate.getTime() - now.getTime()
      const diffMins = Math.floor(diffMs / 60000)

      if (diffMins <= 0) return 'Expired'
      if (diffMins < 60) return `~${diffMins}m remaining`
      
      const diffHours = Math.floor(diffMins / 60)
      return `~${diffHours}h remaining`
    }

    // Default estimates
    return tx.type === 'on-ramp' ? '~30 minutes' : '~15 minutes'
  }

  // Toggle sort order
  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Ramp Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {onRefresh && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-4">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="on-ramp">On-Ramp</SelectItem>
              <SelectItem value="off-ramp">Off-Ramp</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Created</SelectItem>
              <SelectItem value="updatedAt">Updated</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortOrder}
            className="px-3"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                {transactions.length === 0 
                  ? 'No ramp transactions yet' 
                  : 'No transactions match your filters'}
              </p>
              {transactions.length > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setFilterType('all')
                    setFilterStatus('all')
                  }}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((tx) => {
                const estimatedTime = getEstimatedCompletion(tx)
                
                return (
                  <div
                    key={tx.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeBadge(tx.type)}
                        {getStatusBadge(tx.status)}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>

                    {/* Amount Row */}
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatAmount(tx.sourceAmount, tx.sourceCurrency)}
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <span className="text-sm font-medium">
                            {formatAmount(tx.targetAmount, tx.targetCurrency)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Rate: {tx.exchangeRate.toLocaleString()} • Fees: {formatAmount(tx.totalFees, tx.sourceCurrency)}
                        </div>
                      </div>
                    </div>

                    {/* Bank Details (for off-ramp) */}
                    {tx.type === 'off-ramp' && tx.bankName && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Bank:</span> {tx.bankName}
                        {tx.bankAccountNumber && (
                          <span className="ml-2">
                            ({tx.bankAccountNumber.slice(0, 4)}****{tx.bankAccountNumber.slice(-4)})
                          </span>
                        )}
                      </div>
                    )}

                    {/* MavaPay Details */}
                    {tx.mavaPayOrderId && (
                      <div className="text-xs text-muted-foreground font-mono">
                        Order: {tx.mavaPayOrderId.slice(0, 16)}...
                        {tx.mavaPayHash && (
                          <span className="ml-2">
                            Hash: {tx.mavaPayHash.slice(0, 12)}...
                          </span>
                        )}
                      </div>
                    )}

                    {/* Estimated Completion (for pending/processing) */}
                    {estimatedTime && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{estimatedTime}</span>
                      </div>
                    )}

                    {/* Error Message (for failed) */}
                    {tx.status === 'failed' && tx.errorMessage && (
                      <div className="rounded-md bg-red-500/10 p-2 text-xs text-red-500">
                        {tx.errorMessage}
                      </div>
                    )}

                    {/* Completion Details (for completed) */}
                    {tx.status === 'completed' && tx.completedAt && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        Completed {formatDate(tx.completedAt)}
                        {tx.bankReference && (
                          <span className="ml-2">• Ref: {tx.bankReference}</span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      {tx.status === 'failed' && onRetry && tx.retryCount < 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRetry(tx.id)}
                        >
                          <RefreshCw className="mr-2 h-3 w-3" />
                          Retry ({tx.retryCount}/3)
                        </Button>
                      )}
                      
                      {tx.mavaPayHash && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Open MavaPay transaction explorer (if available)
                            window.open(`https://mavapay.co/tx/${tx.mavaPayHash}`, '_blank')
                          }}
                        >
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
