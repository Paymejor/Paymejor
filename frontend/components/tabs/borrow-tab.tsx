'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Zap, TrendingUp } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

export function BorrowTab() {
  const [borrowAmount, setBorrowAmount] = useState('500')
  const [leverage, setLeverage] = useState([1.5])
  const [autoLoop, setAutoLoop] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const leverageValue = leverage[0]
  const interestRate = 5 // 5% APY
  const borrowLimit = 1500
  const estimatedInterest = (parseFloat(borrowAmount) * interestRate) / 100
  const liquidationPrice = 25000 / leverageValue

  const handleBorrow = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Main Borrow Card */}
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle>Borrow & Loop Leverage</CardTitle>
          <CardDescription>
            Borrow USDC against your wBTC collateral with optional leverage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Borrow Amount */}
          <div className="space-y-2">
            <Label htmlFor="borrow" className="text-base font-medium">
              Amount to Borrow (USDC)
            </Label>
            <Input
              id="borrow"
              type="number"
              placeholder="0.0"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              className="text-base"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: 100 USDC</span>
              <span>Max Borrow Limit: {borrowLimit} USDC</span>
            </div>
          </div>

          {/* Leverage Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Leverage Multiplier</Label>
              <Badge className="bg-accent text-accent-foreground">
                {leverageValue.toFixed(1)}x
              </Badge>
            </div>
            <Slider
              value={leverage}
              onValueChange={setLeverage}
              min={1}
              max={3}
              step={0.1}
              className="w-full"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1x (No Leverage)</span>
              <span>3x (Max Leverage)</span>
            </div>
          </div>

          {/* Auto-Loop Checkbox */}
          <div className="flex items-center space-x-3 rounded-lg border border-border p-3">
            <Checkbox
              id="auto-loop"
              checked={autoLoop}
              onCheckedChange={setAutoLoop}
              disabled={isLoading}
            />
            <Label htmlFor="auto-loop" className="cursor-pointer flex-1">
              <span className="font-medium">Enable Auto-Loop Leverage</span>
              <p className="text-xs text-muted-foreground mt-1">
                Automatically deposit borrowed funds back as collateral (advanced strategy)
              </p>
            </Label>
          </div>

          {/* Warning Banner */}
          <Alert className="border-red-500/30 bg-red-500/10">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-red-700 dark:text-red-400">
              Leverage increases your risk of liquidation. Higher multipliers mean you can lose faster.
            </AlertDescription>
          </Alert>

          {/* Calculation Box */}
          <div className="rounded-lg bg-secondary/20 p-4 space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Estimated Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrow Amount:</span>
                <span className="font-medium">{borrowAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium">{interestRate}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Annual Interest:</span>
                <span className="font-medium text-accent">{estimatedInterest.toFixed(2)} USDC</span>
              </div>
              <div className="border-t border-border pt-2 mt-2 flex justify-between">
                <span className="text-muted-foreground">Liquidation Price:</span>
                <span className="font-medium text-red-500">${liquidationPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current BTC Price:</span>
                <span className="font-medium">~$43,200</span>
              </div>
            </div>
          </div>

          {/* Borrow Button */}
          <Button
            onClick={handleBorrow}
            disabled={isLoading}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-11 font-semibold"
            size="lg"
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing Borrow...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {autoLoop ? 'Borrow & Auto-Loop' : 'Borrow Privately'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Risk Information */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader>
          <CardTitle className="text-base">Risk Factors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• <strong>Liquidation Risk:</strong> If your Health Factor drops below 1.0, your position gets liquidated</p>
          <p>• <strong>Gas Costs:</strong> Each action incurs Starknet fees</p>
          <p>• <strong>Smart Contract Risk:</strong> This is beta software on Sepolia testnet</p>
          <p>• <strong>Oracle Risk:</strong> Liquidations trigger based on price feeds</p>
        </CardContent>
      </Card>

      {/* How Leverage Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How Leverage Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p><strong>1x:</strong> Borrow 1 USDC for every 1 wBTC of collateral (no leverage)</p>
          <p><strong>1.5x:</strong> Borrow 1.5 USDC for every 1 wBTC (moderate leverage)</p>
          <p><strong>3x:</strong> Borrow up to 3 USDC for every 1 wBTC (maximum leverage)</p>
          <p className="pt-2"><strong>Auto-Loop:</strong> Use borrowed USDC to buy more wBTC, deposit it, and borrow more (advanced)</p>
        </CardContent>
      </Card>
    </div>
  )
}
