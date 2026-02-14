'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, AlertCircle, Lock } from 'lucide-react'

export function DepositTab() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  const handleMaxClick = () => {
    setAmount('0.5')
  }

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus('error')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    setIsLoading(true)
    setTxStatus('pending')

    // Simulate transaction
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setIsLoading(false)
    setTxStatus('success')
    setAmount('')
    setTimeout(() => setTxStatus('idle'), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Main Deposit Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Shield & Deposit Collateral</CardTitle>
          <CardDescription>
            Deposit wrapped BTC to use as collateral for borrowing USDC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              Amount (wBTC)
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-base"
                step="0.001"
                min="0"
                disabled={isLoading}
              />
              <Button
                variant="outline"
                onClick={handleMaxClick}
                disabled={isLoading}
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: 0.5 wBTC
            </p>
          </div>

          {/* Info Box */}
          <Alert className="border-primary/30 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription>
              Your deposit will be privately shielded using Tongo. Only you can view the real amount on-chain.
            </AlertDescription>
          </Alert>

          {/* Estimated Fees */}
          <div className="rounded-lg bg-secondary/20 p-4 space-y-2">
            <h4 className="font-medium">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{amount || '0'} wBTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Gas Fee:</span>
                <span className="font-medium">~0.001 ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Privacy Shield:</span>
                <Badge variant="secondary" className="text-xs">Tongo ZK</Badge>
              </div>
            </div>
          </div>

          {/* Transaction Status */}
          {txStatus !== 'idle' && (
            <div className={`rounded-lg p-4 flex items-center gap-3 ${
              txStatus === 'pending' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
              txStatus === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
              'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              {txStatus === 'pending' && <Spinner className="h-4 w-4" />}
              {txStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
              {txStatus === 'error' && <AlertCircle className="h-4 w-4" />}
              <span className="text-sm">
                {txStatus === 'pending' && 'Shielding your collateral...'}
                {txStatus === 'success' && 'Deposit successful! Your collateral is now shielded.'}
                {txStatus === 'error' && 'Please enter a valid amount.'}
              </span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleDeposit}
            disabled={isLoading || !amount}
            className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Shield & Deposit'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Benefits</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>✓ Earn collateral rewards</p>
            <p>✓ Maintain full privacy</p>
            <p>✓ No minimum deposit</p>
            <p>✓ Withdraw anytime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Next Steps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>1. Deposit your wBTC</p>
            <p>2. Go to Borrow & Loop</p>
            <p>3. Set your leverage</p>
            <p>4. Borrow USDC privately</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
