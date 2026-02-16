import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/**
 * SkeletonCard Component
 * 
 * Reusable skeleton loader for card-based content.
 * Provides visual feedback while data is loading.
 * 
 * Requirements: NFR-5.3
 */

interface SkeletonCardProps {
  rows?: number
  showHeader?: boolean
  className?: string
}

export function SkeletonCard({ 
  rows = 3, 
  showHeader = true,
  className = '' 
}: SkeletonCardProps) {
  return (
    <Card className={className}>
      {showHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
      )}
      <CardContent className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/**
 * SkeletonPosition Component
 * 
 * Specialized skeleton for position display
 */
export function SkeletonPosition() {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-16 mb-2" />
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
        <div className="flex flex-col gap-2 md:w-auto md:min-w-48">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </Card>
  )
}

/**
 * SkeletonStats Component
 * 
 * Skeleton for statistics/metrics display
 */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-full mb-1" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
