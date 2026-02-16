'use client'

import { useState } from 'react'
import { ExternalLink, RefreshCw, Trash2, Filter } from 'lucide-react'
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
import { TransactionHistoryEntry } from '@/types/transaction'
import { TransactionState } from '@/types/starknet'

/**
 * TransactionHistory Component
 * 
 * Displays transaction history with filtering and retry options
 * Requirements: TR-4.23, TR-4.24
 */

interface TransactionHistoryProps {
  transactions: TransactionHistoryEntry[]
  onRetry?: (id: string) => void
  onClear?: () => void
  onViewExplorer?: (url: string) => void
}

export function TransactionHistory({
  transactions,
  onRetry,
  onClear,
  onViewExplorer,
}: TransactionHistoryProps) {
  const [filterType, setFilterType] = useState<TransactionState['type'] | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<TransactionState['status'] | 'all'>('all')

  const filteredTransactions = transactions.filter(entry => {
    if (filterType !== 'all' && entry.transaction.type !== filterType) {
      return false
    }
    if (filterStatus !== 'all' && entry.transaction.status !== filterStatus) {
      return false
    }
    return true
  })

  const getStatusBadge = (status: TransactionState['status']) => {
    const variants = {
      pending: 'default',
      confirmed: 'success',
      failed: 'destructive',
    } as const

    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      failed: 'Failed',
    }

    return (
      <Badge variant={variants[status] as any}>
        {labels[status]}
      </Badge>
    )
  }

  const getTypeBadge = (type: TransactionState['type']) => {
    const labels = {
      deposit: 'Deposit',
      borrow: 'Borrow',
      loop: 'Leverage Loop',
      approve: 'Approve',
      bridge: 'Bridge',
    }

    return (
      <Badge variant="outline">
        {labels[type]}
      </Badge>
    )
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          {onClear && transactions.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClear}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 pt-4">
          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="deposit">Deposit</SelectItem>
              <SelectItem value="borrow">Borrow</SelectItem>
              <SelectItem value="loop">Leverage Loop</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="bridge">Bridge</SelectItem>
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
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((entry) => (
                <div
                  key={entry.transaction.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(entry.transaction.type)}
                      {getStatusBadge(entry.transaction.status)}
                    </div>
                    
                    {entry.transaction.description && (
                      <p className="text-sm text-muted-foreground">
                        {entry.transaction.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {entry.transaction.hash.slice(0, 10)}...{entry.transaction.hash.slice(-8)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(entry.createdAt)}</span>
                    </div>

                    {entry.transaction.error && (
                      <p className="text-xs text-red-500">
                        {entry.transaction.error}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.transaction.status === 'failed' && onRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRetry(entry.transaction.id)}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {onViewExplorer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewExplorer(entry.transaction.explorerUrl)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
