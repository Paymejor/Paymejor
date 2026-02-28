'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { useOrganization } from '@/hooks/useOrganization'
import { Loader2, AlertTriangle, Users, TrendingUp, TrendingDown } from 'lucide-react'
import { TOKEN_METADATA } from '@/lib/constants'

/**
 * OrganizationOverview Component
 * 
 * Displays organization metrics and provides forms for:
 * - Depositing collateral
 * - Withdrawing collateral (with safety warnings)
 * - Repaying debt
 * 
 * Requirements: 3.1, 7.1, 8.1, 9.1, 9.2, 9.3, 9.4, 9.5
 */

interface Organization {
  address: string
  name: string
  admin: string
  totalCollateral: bigint
  totalDebt: bigint
  ltv: number
  healthFactor: number
  memberCount: number
}

interface OrganizationOverviewProps {
  organization: Organization
  orgAddress: string
  onRefresh: () => void
}

export function OrganizationOverview({ organization, orgAddress, onRefresh }: OrganizationOverviewProps) {
  const { toast } = useToast()
  const { depositCollateral, withdrawCollateral, repayDebt } = useOrganization()

  // Form states
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [repayAmount, setRepayAmount] = useState('')

  // Loading states
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isRepaying, setIsRepaying] = useState(false)

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

  const getLTVColor = (ltv: number): string => {
    if (ltv < 50) return 'text-green-500'
    if (ltv < 70) return 'text-yellow-500'
    return 'text-red-500'
  }

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid deposit amount',
        variant: 'destructive',
      })
      return
    }

    setIsDepositing(true)
    try {
      await depositCollateral(orgAddress, depositAmount)
      
      toast({
        title: 'Collateral Deposited',
        description: `Successfully deposited ${depositAmount} wBTC`,
      })
      
      setDepositAmount('')
      onRefresh()
    } catch (err) {
      console.error('Deposit failed:', err)
      toast({
        title: 'Deposit Failed',
        description: err instanceof Error ? err.message : 'Failed to deposit collateral',
        variant: 'destructive',
      })
    } finally {
      setIsDepositing(false)
    }
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid withdrawal amount',
        variant: 'destructive',
      })
      return
    }

    setIsWithdrawing(true)
    try {
      await withdrawCollateral(orgAddress, withdrawAmount)
      
      toast({
        title: 'Collateral Withdrawn',
        description: `Successfully withdrew ${withdrawAmount} wBTC`,
      })
      
      setWithdrawAmount('')
      onRefresh()
    } catch (err) {
      console.error('Withdrawal failed:', err)
      toast({
        title: 'Withdrawal Failed',
        description: err instanceof Error ? err.message : 'Failed to withdraw collateral',
        variant: 'destructive',
      })
    } finally {
      setIsWithdrawing(false)
    }
  }

  const handleRepay = async () => {
    if (!repayAmount || parseFloat(repayAmount) <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid repayment amount',
        variant: 'destructive',
      })
      return
    }

    setIsRepaying(true)
    try {
      await repayDebt(orgAddress, repayAmount)
      
      toast({
        title: 'Debt Repaid',
        description: `Successfully repaid ${repayAmount} USDC`,
      })
      
      setRepayAmount('')
      onRefresh()
    } catch (err) {
      console.error('Repayment failed:', err)
      toast({
        title: 'Repayment Failed',
        description: err instanceof Error ? err.message : 'Failed to repay debt',
        variant: 'destructive',
      })
    } finally {
      setIsRepaying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collateral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBalance(organization.totalCollateral, TOKEN_METADATA.wBTC.decimals)} wBTC
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pooled from all members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBalance(organization.totalDebt, TOKEN_METADATA.USDC.decimals)} USDC
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Borrowed from Vesu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              LTV Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getLTVColor(organization.ltv)}`}>
              {organization.ltv.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Loan-to-value ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthFactorColor(organization.healthFactor)}`}>
              {organization.healthFactor.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {organization.healthFactor >= 2 ? 'Healthy' : organization.healthFactor >= 1.5 ? 'Moderate' : 'At Risk'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6" />
              {organization.memberCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Admin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-mono">
              {organization.admin.slice(0, 10)}...{organization.admin.slice(-8)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organization admin
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Safety Warning */}
      {organization.healthFactor < 1.5 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Warning: Health factor is low. The organization is at risk of liquidation. 
            Consider repaying debt or depositing more collateral.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Deposit Collateral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Deposit Collateral
            </CardTitle>
            <CardDescription>
              Add wBTC to the organization pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount (wBTC)</Label>
              <Input
                id="deposit-amount"
                type="number"
                step="0.00000001"
                min="0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00000000"
                disabled={isDepositing}
              />
            </div>
            <Button 
              onClick={handleDeposit}
              disabled={isDepositing || !depositAmount}
              className="w-full gap-2"
            >
              {isDepositing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDepositing ? 'Depositing...' : 'Deposit'}
            </Button>
          </CardContent>
        </Card>

        {/* Withdraw Collateral */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-500" />
              Withdraw Collateral
            </CardTitle>
            <CardDescription>
              Remove wBTC from the pool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount (wBTC)</Label>
              <Input
                id="withdraw-amount"
                type="number"
                step="0.00000001"
                min="0"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="0.00000000"
                disabled={isWithdrawing}
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Withdrawal may be rejected if it violates LTV requirements
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount}
              variant="outline"
              className="w-full gap-2"
            >
              {isWithdrawing && <Loader2 className="h-4 w-4 animate-spin" />}
              {isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </CardContent>
        </Card>

        {/* Repay Debt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Repay Debt
            </CardTitle>
            <CardDescription>
              Repay borrowed USDC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repay-amount">Amount (USDC)</Label>
              <Input
                id="repay-amount"
                type="number"
                step="0.000001"
                min="0"
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="0.000000"
                disabled={isRepaying}
              />
            </div>
            <Button 
              onClick={handleRepay}
              disabled={isRepaying || !repayAmount}
              variant="secondary"
              className="w-full gap-2"
            >
              {isRepaying && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRepaying ? 'Repaying...' : 'Repay'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
