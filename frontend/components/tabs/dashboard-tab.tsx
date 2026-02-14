'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Lock, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useWallet } from '@/lib/wallet-context'
import { useStarknet } from '@/hooks/useStarknet'
import { CONTRACT_ADDRESSES, TOKEN_METADATA } from '@/lib/constants'

/**
 * DashboardTab Component
 * 
 * Displays user's wallet balances and position overview with real blockchain data.
 * Implements:
 * - Real wBTC balance fetching (AC-1.6, TR-4.17)
 * - Real USDC balance fetching (AC-1.6, TR-4.17)
 * - Loading states during data fetch
 * - Error handling for failed fetches
 */

export function DashboardTab() {
  const { isConnected, address } = useWallet()
  const { getBalance } = useStarknet()
  
  // Balance state
  const [wBTCBalance, setWBTCBalance] = useState<string>('0')
  const [usdcBalance, setUSDCBalance] = useState<string>('0')
  
  // Loading and error states
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  
  // Fetch balances when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      // Reset balances when disconnected
      setWBTCBalance('0')
      setUSDCBalance('0')
      setBalanceError(null)
      return
    }
    
    const fetchBalances = async () => {
      setIsLoadingBalances(true)
      setBalanceError(null)
      
      try {
        // Fetch wBTC balance
        const wbtcBal = await getBalance(CONTRACT_ADDRESSES.wBTC, address)
        setWBTCBalance(wbtcBal)
        
        // Fetch USDC balance
        const usdcBal = await getBalance(CONTRACT_ADDRESSES.USDC, address)
        setUSDCBalance(usdcBal)
      } catch (error) {
        console.error('Error fetching balances:', error)
        setBalanceError(error instanceof Error ? error.message : 'Failed to fetch balances')
      } finally {
        setIsLoadingBalances(false)
      }
    }
    
    fetchBalances()
  }, [isConnected, address, getBalance])
  
  // Format balance for display
  const formatBalance = (balance: string, decimals: number): string => {
    try {
      const balanceBigInt = BigInt(balance)
      const divisor = BigInt(10 ** decimals)
      const integerPart = balanceBigInt / divisor
      const fractionalPart = balanceBigInt % divisor
      
      // Format with appropriate decimal places
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
      const displayDecimals = decimals === 8 ? 8 : 6 // wBTC: 8, USDC: 6
      const truncatedFractional = fractionalStr.slice(0, displayDecimals)
      
      return `${integerPart}.${truncatedFractional}`
    } catch (error) {
      console.error('Error formatting balance:', error)
      return '0.00'
    }
  }
  
  const formattedWBTC = formatBalance(wBTCBalance, TOKEN_METADATA.wBTC.decimals)
  const formattedUSDC = formatBalance(usdcBalance, TOKEN_METADATA.USDC.decimals)
  
  // Render balance with loading state
  const renderBalance = (balance: string, symbol: string, isLoading: boolean) => {
    if (!isConnected) {
      return <div className="text-2xl font-bold text-muted-foreground">--</div>
    }
    
    if (isLoading) {
      return <Skeleton className="h-8 w-32" />
    }
    
    return <div className="text-2xl font-bold">{balance} {symbol}</div>
  }
  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <Card className="border-2 border-primary bg-gradient-to-r from-primary/10 to-accent/10">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Privately unlock NGN liquidity from your BTC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Shielded collateral on Starknet – no exposure. Borrow USDC against your wrapped BTC with complete privacy.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Tongo Shielded
            </Badge>
            <Badge variant="outline">Zero Knowledge Proof</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Note */}
      <Alert className="border-primary bg-primary/5">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription>
          All amounts hidden via Tongo privacy protocol. Only you can decrypt your real position data.
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {balanceError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {balanceError}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Wallet wBTC Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallet wBTC Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {renderBalance(formattedWBTC, 'wBTC', isLoadingBalances)}
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Available to deposit' : 'Connect wallet to view'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Wallet USDC Balance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Wallet USDC Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {renderBalance(formattedUSDC, 'USDC', isLoadingBalances)}
              <p className="text-xs text-muted-foreground">
                {isConnected ? 'Available for operations' : 'Connect wallet to view'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Shielded Position */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Shielded Position (Private)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">**** wBTC</div>
              <p className="text-xs text-muted-foreground">
                Use "Reveal Position" to decrypt
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button className="bg-primary hover:bg-primary/90">
            Bridge BTC via Atomiq
          </Button>
          <Button variant="outline">Deposit Collateral</Button>
          <Button variant="outline">Borrow USDC</Button>
          <Button variant="secondary">Reveal My Private Position</Button>
        </CardContent>
      </Card>

      {/* Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              How It Works
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>1. Bridge BTC and wrap it as wBTC</p>
            <p>2. Shield your collateral using Tongo ZK proofs</p>
            <p>3. Borrow USDC privately with leverage up to 3x</p>
            <p>4. All transactions remain hidden on-chain</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Risk Warning
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Higher leverage = higher liquidation risk</p>
            <p>• Monitor your health factor closely</p>
            <p>• Gas fees apply to all transactions</p>
            <p>• This is a beta product on Starknet Sepolia</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
