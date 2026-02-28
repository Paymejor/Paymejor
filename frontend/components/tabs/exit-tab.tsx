'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight, AlertCircle, CheckCircle2, ExternalLink, TrendingDown } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useStarknet } from '@/hooks/useStarknet'
import { useNetwork } from '@/hooks/useNetwork'
import { useVesu } from '@/hooks/useVesu'
import { useVesuPositionCache } from '@/hooks/useVesuCache'
import { getNetworkConfig, TOKEN_METADATA, getTxUrl } from '@/lib/constants'
import { useRouter } from 'next/navigation'

/**
 * ExitTab Component
 * 
 * Manages the complete exit flow from Vesu lending positions:
 * 1. Repay all outstanding loans
 * 2. Withdraw collateral (wBTC)
 * 3. Direct user to Ramp tab for fiat conversion
 * 
 * Requirements: Position management, loan repayment, collateral withdrawal
 */

export function ExitTab() {
  const [isRepaying, setIsRepaying] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [repayTxHash, setRepayTxHash] = useState<string | null>(null)
  const [withdrawTxHash, setWithdrawTxHash] = useState<string | null>(null)
  const [step, setStep] = useState<'repay' | 'withdraw' | 'complete'>('repay')
  
  const { address, isConnected } = useWallet()
  const { waitForTransaction } = useStarknet()
  const { network } = useNetwork()
  const { repay, withdraw } = useVesu()
  const router = useRouter()
  
  const {
    data: position,
    refresh: refreshPosition,
  } = useVesuPositionCache()
  
  const config = getNetworkConfig(network)
  
  // Extract position data
  const totalDebt = position?.debt || BigInt(0)
  const totalCollateral = position?.collateral || BigInt(0)
  const hasDebt = totalDebt > BigInt(0)
  const hasCollateral = totalCollateral > BigInt(0)
  
  // Format amounts for display
  const debtAmount = (Number(totalDebt) / Math.pow(10, TOKEN_METADATA.USDC.decimals)).toFixed(2)
  const collateralAmount = (Number(totalCollateral) / Math.pow(10, TOKEN_METADATA.wBTC.decimals)).toFixed(6)

  /**
   * Handle loan repayment
   */
  const handleRepay = async () => {
    if (!isConnected || !address || !hasDebt) return

    try {
      setIsRepaying(true)
      
      const result = await repay({
        asset: config.contracts.USDC,
        amount: totalDebt.toString(),
        onBehalfOf: address,
      })
      
      setRepayTxHash(result.transactionHash)
      
      await waitForTransaction(result.transactionHash)
      
      setStep('withdraw')
      await refreshPosition()
      
    } catch (err) {
      console.error('Error repaying loan:', err)
    } finally {
      setIsRepaying(false)
    }
  }

  /**
   * Handle collateral withdrawal
   */
  const handleWithdraw = async () => {
    if (!isConnected || !address || !hasCollateral) return

    try {
      setIsWithdrawing(true)
      
      const result = await withdraw({
        asset: config.contracts.wBTC,
        amount: totalCollateral.toString(),
        to: address,
      })
      
      setWithdrawTxHash(result.transactionHash)
      
      await waitForTransaction(result.transactionHash)
      
      setStep('complete')
      await refreshPosition()
      
    } catch (err) {
      console.error('Error withdrawing collateral:', err)
    } finally {
      setIsWithdrawing(false)
    }
  }

  /**
   * Navigate to Ramp tab for fiat conversion
   */
  const handleGoToRamp = () => {
    // Assuming the app uses tabs, we'll need to emit an event or use router
    // For now, we'll just show a message
    router.push('/app?tab=ramp')
  }

  return (
    <div className="space-y-6">
      {/* Connection Warning */}
      {!isConnected && (
        <Alert className="border-yellow-500/30 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            Please connect your wallet to exit your position
          </AlertDescription>
        </Alert>
      )}

      {/* Main Exit Card */}
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Exit Your Position
          </CardTitle>
          <CardDescription>
            Close your Vesu lending position and convert to fiat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Position Summary */}
          <div className="rounded-lg bg-secondary/20 p-4 space-y-3">
            <h4 className="font-medium">Current Position</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Debt:</span>
                <span className="font-medium">{debtAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Collateral:</span>
                <span className="font-medium">{collateralAmount} wBTC</span>
              </div>
            </div>
          </div>

          {/* Step 1: Repay Loans */}
          <div className={`rounded-lg border p-4 space-y-3 ${
            step === 'repay' ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="flex items-start gap-3">
              <Badge className={`mt-1 ${
                step === 'repay' 
                  ? 'bg-primary text-primary-foreground' 
                  : repayTxHash 
                  ? 'bg-green-500 text-white' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {repayTxHash ? <CheckCircle2 className="h-3 w-3" /> : '1'}
              </Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 1: Repay Your Loans</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Pay back all borrowed USDC to unlock your collateral
                </p>
                {hasDebt ? (
                  <>
                    <div className="mb-3 text-sm">
                      <span className="text-muted-foreground">Amount to repay: </span>
                      <span className="font-semibold">{debtAmount} USDC</span>
                    </div>
                    <Button 
                      onClick={handleRepay}
                      disabled={isRepaying || !isConnected || !!repayTxHash}
                      className="w-full"
                    >
                      {isRepaying ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Repaying...
                        </>
                      ) : repayTxHash ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Repaid
                        </>
                      ) : (
                        `Repay ${debtAmount} USDC`
                      )}
                    </Button>
                    {repayTxHash && (
                      <a
                        href={getTxUrl(repayTxHash, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground underline inline-flex items-center gap-1 mt-2"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <Alert className="border-green-500/30 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                      No outstanding debt
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Withdraw Collateral */}
          <div className={`rounded-lg border p-4 space-y-3 ${
            step === 'withdraw' ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="flex items-start gap-3">
              <Badge className={`mt-1 ${
                step === 'withdraw' 
                  ? 'bg-primary text-primary-foreground' 
                  : withdrawTxHash 
                  ? 'bg-green-500 text-white' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                {withdrawTxHash ? <CheckCircle2 className="h-3 w-3" /> : '2'}
              </Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 2: Withdraw Collateral</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Remove your wBTC from Vesu
                </p>
                {hasCollateral ? (
                  <>
                    <div className="mb-3 text-sm">
                      <span className="text-muted-foreground">Available to withdraw: </span>
                      <span className="font-semibold">{collateralAmount} wBTC</span>
                    </div>
                    <Button 
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !isConnected || hasDebt || !!withdrawTxHash}
                      className="w-full"
                    >
                      {isWithdrawing ? (
                        <>
                          <Spinner className="mr-2 h-4 w-4" />
                          Withdrawing...
                        </>
                      ) : withdrawTxHash ? (
                        <>
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Withdrawn
                        </>
                      ) : (
                        `Withdraw ${collateralAmount} wBTC`
                      )}
                    </Button>
                    {withdrawTxHash && (
                      <a
                        href={getTxUrl(withdrawTxHash, network)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-muted-foreground underline inline-flex items-center gap-1 mt-2"
                      >
                        View transaction <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No collateral to withdraw
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Convert to Fiat */}
          <div className={`rounded-lg border p-4 space-y-3 ${
            step === 'complete' ? 'border-primary bg-primary/5' : 'border-border'
          }`}>
            <div className="flex items-start gap-3">
              <Badge className={`mt-1 ${
                step === 'complete' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground'
              }`}>
                3
              </Badge>
              <div className="flex-1">
                <h4 className="font-semibold mb-1">Step 3: Convert to NGN</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Use MavaPay ramp to convert your crypto to Nigerian Naira
                </p>
                <Button 
                  onClick={handleGoToRamp}
                  disabled={!withdrawTxHash}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Ramp
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exit Process Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">1</Badge>
            <div>
              <p className="font-medium">Repay All Loans</p>
              <p className="text-muted-foreground">Settle your USDC debt to unlock collateral</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">2</Badge>
            <div>
              <p className="font-medium">Withdraw Collateral</p>
              <p className="text-muted-foreground">Remove your wBTC from Vesu protocol</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Badge variant="outline" className="shrink-0">3</Badge>
            <div>
              <p className="font-medium">Convert to Fiat</p>
              <p className="text-muted-foreground">Use MavaPay ramp for instant NGN conversion</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• You must repay all debt before withdrawing collateral</p>
          <p>• Withdrawal returns wBTC to your wallet</p>
          <p>• Use the Ramp tab to convert wBTC → USDC → NGN via MavaPay</p>
          <p>• All transactions are on-chain and require gas fees</p>
        </CardContent>
      </Card>
    </div>
  )
}
