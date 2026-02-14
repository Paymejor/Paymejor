'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Lock, Unlock, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Position {
  id: string
  collateral: string
  collateralAmount: number
  borrowed: string
  borrowedAmount: number
  ltv: number
  healthFactor: number
  isDecrypted: boolean
}

export function PositionsTab() {
  const [positions, setPositions] = useState<Position[]>([
    {
      id: '1',
      collateral: 'wBTC',
      collateralAmount: 0.05,
      borrowed: 'USDC',
      borrowedAmount: 1500,
      ltv: 75,
      healthFactor: 1.8,
      isDecrypted: false,
    },
    {
      id: '2',
      collateral: 'wBTC',
      collateralAmount: 0.02,
      borrowed: 'USDC',
      borrowedAmount: 400,
      ltv: 66,
      healthFactor: 2.5,
      isDecrypted: false,
    },
  ])

  const [loadingId, setLoadingId] = useState<string | null>(null)

  const toggleDecrypt = async (positionId: string) => {
    setLoadingId(positionId)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setPositions(positions.map(pos =>
      pos.id === positionId ? { ...pos, isDecrypted: !pos.isDecrypted } : pos
    ))
    setLoadingId(null)
  }

  const getHealthColor = (hf: number) => {
    if (hf >= 2) return 'text-green-600 dark:text-green-400'
    if (hf >= 1.5) return 'text-blue-600 dark:text-blue-400'
    if (hf >= 1.1) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getHealthBg = (hf: number) => {
    if (hf >= 2) return 'bg-green-500/10'
    if (hf >= 1.5) return 'bg-blue-500/10'
    if (hf >= 1.1) return 'bg-yellow-500/10'
    return 'bg-red-500/10'
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert className="border-primary/30 bg-primary/5">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription>
          All position data is encrypted. Click "Reveal" to decrypt your positions using Tongo ZK proofs.
        </AlertDescription>
      </Alert>

      {/* No Positions State */}
      {positions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Active Positions</h3>
            <p className="text-muted-foreground">
              Start by depositing collateral and borrowing USDC to create your first position.
            </p>
            <Button className="bg-primary hover:bg-primary/90">
              Create First Position
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Positions Grid */
        <div className="space-y-4">
          {positions.map((position) => (
            <Card key={position.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-6 gap-4">
                {/* Position Info */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Collateral */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Collateral
                      </p>
                      <p className="text-sm font-semibold">
                        {position.isDecrypted
                          ? `${position.collateralAmount} ${position.collateral}`
                          : '****'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {position.collateral}
                      </p>
                    </div>

                    {/* Borrowed */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Borrowed
                      </p>
                      <p className="text-sm font-semibold">
                        {position.isDecrypted
                          ? `${position.borrowedAmount} ${position.borrowed}`
                          : '****'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {position.borrowed}
                      </p>
                    </div>

                    {/* LTV */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        LTV Ratio
                      </p>
                      <p className="text-sm font-semibold">{position.ltv}%</p>
                      <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                        <div
                          className="bg-accent h-full rounded-full"
                          style={{ width: `${position.ltv}%` }}
                        />
                      </div>
                    </div>

                    {/* Health Factor */}
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">
                        Health Factor
                      </p>
                      <div className={`text-sm font-semibold ${getHealthColor(position.healthFactor)}`}>
                        {position.healthFactor.toFixed(2)}
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs mt-2 ${getHealthBg(position.healthFactor)}`}
                      >
                        {position.healthFactor >= 2
                          ? 'Safe'
                          : position.healthFactor >= 1.5
                          ? 'Stable'
                          : position.healthFactor >= 1.1
                          ? 'At Risk'
                          : 'Critical'}
                      </Badge>
                    </div>
                  </div>

                  {/* Shielded Badge */}
                  <Badge variant="outline" className="w-fit">
                    <Lock className="h-3 w-3 mr-1" />
                    Tongo Shielded
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 md:w-auto md:min-w-48">
                  <Button
                    onClick={() => toggleDecrypt(position.id)}
                    disabled={loadingId === position.id}
                    variant="outline"
                    className="w-full"
                  >
                    {loadingId === position.id ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Decrypting...
                      </>
                    ) : position.isDecrypted ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Position
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Reveal Position
                      </>
                    )}
                  </Button>

                  <Button
                    variant="secondary"
                    disabled={loadingId === position.id}
                    className="w-full"
                  >
                    Repay Borrow
                  </Button>

                  <Button
                    variant="outline"
                    disabled
                    className="w-full cursor-not-allowed opacity-50"
                  >
                    Withdraw (Disabled)
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle>Portfolio Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Collateral</p>
              <p className="text-lg font-bold">0.07 wBTC</p>
              <p className="text-xs text-muted-foreground mt-1">~$3,024</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Borrowed</p>
              <p className="text-lg font-bold">1,900 USDC</p>
              <p className="text-xs text-muted-foreground mt-1">Accruing interest</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg. LTV</p>
              <p className="text-lg font-bold">72%</p>
              <p className="text-xs text-muted-foreground mt-1">Room to borrow</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avg. Health Factor</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">2.1</p>
              <p className="text-xs text-muted-foreground mt-1">Safe</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Management Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Position Management</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>📊 <strong>Monitor Health Factor:</strong> Keep it above 1.2 to maintain safety margin</p>
          <p>💰 <strong>Repay Borrow:</strong> Reduce your debt to lower liquidation risk</p>
          <p>🔐 <strong>Privacy:</strong> Your position details remain encrypted unless you reveal them</p>
          <p>⚠️ <strong>Liquidation:</strong> If Health Factor drops below 1.0, liquidators can close your position</p>
        </CardContent>
      </Card>
    </div>
  )
}
