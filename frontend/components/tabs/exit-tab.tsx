'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight, AlertCircle, Lock } from 'lucide-react'

export function ExitTab() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setAmount('')
  }

  const exchangeRate = 1800 // 1 USDC ≈ 1800 NGN (mock)
  const estimatedNGN = (parseFloat(amount) || 0) * exchangeRate

  return (
    <div className="space-y-6">
      {/* Main Withdrawal Card */}
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle>Withdraw to NGN</CardTitle>
          <CardDescription>
            Convert your private USDC to NGN through local P2P ramps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <Alert className="border-primary/30 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription>
              This demo shows the final step of your exit strategy. In production, integrate with Binance P2P, LocalBitcoins, or other NGN ramps.
            </AlertDescription>
          </Alert>

          {/* Step 1: Repay Loans */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-primary text-primary-foreground">1</Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 1: Repay Your Loans</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Pay back all borrowed USDC to unlock your collateral
                </p>
                <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                  Repay All Loans (1,900 USDC)
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: Withdraw USDC */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-accent text-accent-foreground">2</Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 2: Withdraw to USDC</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Withdraw your collateral and any earned rewards
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Available to Withdraw:</span>
                    <span className="font-semibold">1,200 USDC</span>
                  </div>
                  <Button variant="outline" className="w-full">
                    Withdraw USDC to Wallet
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Convert to NGN */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-4">
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-primary text-primary-foreground">3</Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 3: Convert USDC → NGN</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Use P2P ramps to privately convert your USDC to Nigerian Naira
                </p>

                {/* Amount Input */}
                <div className="space-y-2 mb-4">
                  <Label htmlFor="withdraw-amount" className="font-medium">
                    Amount to Convert (USDC)
                  </Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="text-base"
                    disabled={isLoading}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max available: 1,200 USDC
                  </p>
                </div>

                {/* Exchange Info */}
                <div className="rounded-lg bg-secondary/30 p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate:</span>
                    <span className="font-semibold">1 USDC = ₦{exchangeRate}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">You Receive:</span>
                    <span className="font-bold text-accent text-lg">
                      ₦{estimatedNGN.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Recommended Ramps */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    RECOMMENDED P2P RAMPS
                  </p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      <span>Binance P2P</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      <span>LocalBitcoins</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      <span>Paxful</span>
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleWithdraw}
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
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Proceed to P2P Conversion
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    This will open P2P ramp in a new tab
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full Exit Process</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">1</Badge>
            <div>
              <p className="font-medium">Repay All Loans</p>
              <p className="text-muted-foreground">Settle your USDC debt to regain collateral access</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">2</Badge>
            <div>
              <p className="font-medium">Withdraw Collateral</p>
              <p className="text-muted-foreground">Remove your wBTC and any accrued rewards</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">3</Badge>
            <div>
              <p className="font-medium">Bridge to USDC</p>
              <p className="text-muted-foreground">Convert wBTC to USDC on your preferred network</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">4</Badge>
            <div>
              <p className="font-medium">Convert to NGN</p>
              <p className="text-muted-foreground">Use P2P ramps to get NGN cash in your bank</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold mb-1">How long does conversion take?</p>
            <p className="text-muted-foreground">
              P2P transfers typically complete in 30 minutes to 1 hour depending on counterparty availability.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">What fees apply?</p>
            <p className="text-muted-foreground">
              P2P ramps charge 0.5-2% fee. Bank transfers may incur additional charges.
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">Is my conversion private?</p>
            <p className="text-muted-foreground">
              P2P ramps are peer-to-peer, offering better privacy than centralized exchanges. Your initial lending was shielded on-chain.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
