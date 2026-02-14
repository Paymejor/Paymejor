'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Lock, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function DashboardTab() {
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Total Collateral */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collateral (Private)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">**** wBTC</div>
              <p className="text-xs text-muted-foreground">
                Use "Reveal My Private Position" to decrypt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Borrowed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Borrowed (Private)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">**** USDC</div>
              <p className="text-xs text-muted-foreground">
                Interest rate: 5% APY (estimated)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Health Factor */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">1.8</div>
                <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                  Safe
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Liquidation at 1.0
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
