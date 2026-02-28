'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet } from '@/lib/wallet-context'
import { useOrganizationData } from '@/hooks/useOrganizationData'
import { Plus, Users, TrendingUp, AlertCircle } from 'lucide-react'
import { TOKEN_METADATA } from '@/lib/constants'

/**
 * OrganizationList Component
 * 
 * Displays user's organizations with key metrics.
 * Shows collateral, debt, LTV, health factor, and member count.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

interface OrganizationListProps {
  onSelect: (orgAddress: string) => void
  onCreate: () => void
}

interface OrganizationSummary {
  address: string
  name: string
  totalCollateral: bigint
  totalDebt: bigint
  ltv: number
  healthFactor: number
  memberCount: number
}

export function OrganizationList({ onSelect, onCreate }: OrganizationListProps) {
  const { address, isConnected } = useWallet()
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // TODO: Fetch user's organizations from factory contract
  // For now, using mock data structure
  useEffect(() => {
    if (!isConnected || !address) {
      setOrganizations([])
      setIsLoading(false)
      return
    }

    const fetchOrganizations = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // TODO: Implement actual fetching from OrganizationFactory
        // This would query the factory contract for organizations where user is admin or member
        
        // Mock implementation - replace with actual contract calls
        await new Promise(resolve => setTimeout(resolve, 1000))
        setOrganizations([])
      } catch (err) {
        console.error('Error fetching organizations:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganizations()
  }, [isConnected, address])

  const formatBalance = (balance: bigint, decimals: number): string => {
    try {
      const divisor = BigInt(10 ** decimals)
      const integerPart = balance / divisor
      const fractionalPart = balance % divisor
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const displayDecimals = decimals === 8 ? 8 : 6
      const truncatedFractional = fractionalStr.slice(0, displayDecimals)
      return `${integerPart}.${truncatedFractional}`
    } catch (error) {
      return '0.00'
    }
  }

  const getHealthFactorColor = (healthFactor: number): string => {
    if (healthFactor >= 2) return 'text-green-500'
    if (healthFactor >= 1.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
          <CardDescription>
            Privacy-preserving organizations for pooled borrowing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet to view organizations
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>Loading your organizations...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={onCreate} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create Organization
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Privacy-preserving organizations for pooled borrowing
              </CardDescription>
            </div>
            <Button onClick={onCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Organization
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Organizations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first organization to start pooling collateral with others
              </p>
              <Button onClick={onCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <Card 
                  key={org.address}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => onSelect(org.address)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{org.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">
                          {org.address.slice(0, 10)}...{org.address.slice(-8)}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Users className="h-3 w-3" />
                        {org.memberCount} members
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Collateral</p>
                        <p className="font-semibold">
                          {formatBalance(org.totalCollateral, TOKEN_METADATA.wBTC.decimals)} wBTC
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Total Debt</p>
                        <p className="font-semibold">
                          {formatBalance(org.totalDebt, TOKEN_METADATA.USDC.decimals)} USDC
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">LTV</p>
                        <p className="font-semibold">{org.ltv.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Health Factor</p>
                        <p className={`font-semibold ${getHealthFactorColor(org.healthFactor)}`}>
                          {org.healthFactor.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/50 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            About Organizations
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Pool wBTC collateral with other members for larger borrowing capacity</p>
          <p>• Vote anonymously on borrow proposals using Semaphore Protocol</p>
          <p>• All members share the organization's debt and liquidation risk</p>
          <p>• Admins can add new members to the organization</p>
        </CardContent>
      </Card>
    </div>
  )
}
