'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Spinner } from '@/components/ui/spinner'
import { AlertCircle, Zap, TrendingUp, ExternalLink, CheckCircle, Shield } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { useWallet } from '@/lib/wallet-context'
import { useVesu } from '@/hooks/useVesu'
import { useTongo } from '@/hooks/useTongo'
import { useStarknet } from '@/hooks/useStarknet'
import { useNetwork } from '@/hooks/useNetwork'
import { useAutoswap } from '@/hooks/useAutoswap'
import { getNetworkConfig, TOKEN_METADATA, getTxUrl } from '@/lib/constants'
import { toast } from 'sonner'
import { ProjectedPosition, LeverageLoopStep } from '@/types/vesu'

export function BorrowTab() {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  const { 
    borrow, 
    getUserPosition, 
    getBorrowingCapacity, 
    getPoolParameters,
    executeLeverageLoop,
    calculateProjectedPosition,
  } = useVesu()
  const { fund, tongoAccount, createAccount } = useTongo()
  const { waitForTransaction } = useStarknet()
  const { executeSwap, getQuote } = useAutoswap()
  
  const [borrowAmount, setBorrowAmount] = useState('500')
  const [leverage, setLeverage] = useState([1.5])
  const [autoLoop, setAutoLoop] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'confirmed' | 'failed'>('idle')
  
  // Real data from Vesu
  const [borrowingCapacity, setBorrowingCapacity] = useState<string>('0')
  const [currentLTV, setCurrentLTV] = useState<number>(0)
  const [poolInterestRate, setPoolInterestRate] = useState<number>(5)
  const [healthFactor, setHealthFactor] = useState<number>(0)
  const [collateralAmount, setCollateralAmount] = useState<bigint>(BigInt(0))
  
  // Leverage loop state
  const [projectedPosition, setProjectedPosition] = useState<ProjectedPosition | null>(null)
  const [leverageSteps, setLeverageSteps] = useState<LeverageLoopStep[]>([])
  const [isCalculatingProjection, setIsCalculatingProjection] = useState(false)

  const leverageValue = leverage[0]
  const estimatedInterest = (parseFloat(borrowAmount || '0') * poolInterestRate) / 100
  
  // Calculate liquidation price based on projected position or current position
  const btcPrice = 43200 // This should come from oracle in production
  const liquidationPrice = projectedPosition 
    ? projectedPosition.liquidationPrice 
    : collateralAmount > BigInt(0) ? btcPrice / leverageValue : 0

  /**
   * Calculate projected position when leverage or collateral changes
   */
  useEffect(() => {
    if (!isConnected || !address || collateralAmount === BigInt(0) || !autoLoop) {
      setProjectedPosition(null)
      return
    }

    const calculateProjection = async () => {
      try {
        setIsCalculatingProjection(true)
        
        const projection = await calculateProjectedPosition({
          initialCollateral: collateralAmount.toString(),
          leverageMultiplier: leverageValue,
          slippage: 0.5,
        })
        
        setProjectedPosition(projection)
      } catch (err) {
        console.error('Error calculating projection:', err)
        setProjectedPosition(null)
      } finally {
        setIsCalculatingProjection(false)
      }
    }

    calculateProjection()
  }, [isConnected, address, collateralAmount, leverageValue, autoLoop, calculateProjectedPosition])

  /**
   * Fetch real borrowing capacity and position data from Vesu
   * Requirements: AC-4.3, AC-4.4, AC-4.6, AC-4.7, TR-4.27
   */
  useEffect(() => {
    if (!isConnected || !address) return

    const fetchVesuData = async () => {
      try {
        const config = getNetworkConfig(network)
        
        // Get user position
        const position = await getUserPosition(address)
        setCollateralAmount(position.collateral)
        setCurrentLTV(position.ltv)
        setHealthFactor(position.healthFactor)
        
        // Get borrowing capacity
        const capacity = await getBorrowingCapacity({
          user: address,
          collateralAsset: config.contracts.wBTC,
          borrowAsset: config.contracts.USDC,
        })
        setBorrowingCapacity(capacity)
        
        // Get pool parameters
        const params = await getPoolParameters()
        setPoolInterestRate(params.interestRate)
      } catch (err) {
        console.error('Error fetching Vesu data:', err)
      }
    }

    fetchVesuData()
    
    // Refresh data when network changes
    const handleNetworkChange = () => {
      fetchVesuData()
    }
    
    window.addEventListener('paymejor_network_changed', handleNetworkChange)
    return () => window.removeEventListener('paymejor_network_changed', handleNetworkChange)
  }, [isConnected, address, network, getUserPosition, getBorrowingCapacity, getPoolParameters])

  /**
   * Validate borrow amount against pool limits
   */
  const validateBorrowAmount = (): boolean => {
    const amount = parseFloat(borrowAmount || '0')
    const capacity = parseFloat(borrowingCapacity) / Math.pow(10, TOKEN_METADATA.USDC.decimals)
    
    if (amount <= 0) {
      toast.error('Please enter a valid borrow amount')
      return false
    }
    
    if (amount > capacity) {
      toast.error(`Borrow amount exceeds capacity (${capacity.toFixed(2)} USDC)`)
      return false
    }
    
    return true
  }

  /**
   * Execute borrow transaction via Vesu SDK with Tongo privacy
   * If autoLoop is enabled, executes leverage loop: borrow → swap → re-supply
   * 
   * Requirements: AC-5.1, AC-5.2, AC-5.5, AC-5.6, AC-5.7, AC-5.8
   */
  const handleBorrow = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return
    }
    
    if (!validateBorrowAmount()) {
      return
    }

    try {
      setIsLoading(true)
      setTxStatus('pending')
      setLeverageSteps([])
      const config = getNetworkConfig(network)
      
      // Ensure Tongo account exists
      if (!tongoAccount) {
        toast.info('Creating Tongo account...', {
          description: 'This is needed for private transactions',
        })
        await createAccount()
      }
      
      // Convert USDC amount to smallest unit (6 decimals)
      const amountInUnits = (parseFloat(borrowAmount) * Math.pow(10, TOKEN_METADATA.USDC.decimals)).toString()
      
      // Check if leverage loop is enabled
      if (autoLoop && leverageValue > 1) {
        // Execute leverage loop
        toast.info('Starting leverage loop...', {
          description: `Executing ${leverageValue}x leverage strategy`,
        })
        
        const loopResult = await executeLeverageLoop({
          initialCollateral: collateralAmount.toString(),
          leverageMultiplier: leverageValue,
          slippage: 0.5,
        })
        
        setLeverageSteps(loopResult.steps)
        
        if (!loopResult.success) {
          throw new Error('Leverage loop failed')
        }
        
        // Display each step
        for (const step of loopResult.steps) {
          if (step.status === 'confirmed' && step.transactionHash) {
            toast.success(`Step ${step.step}: ${step.description}`, {
              description: 'Transaction confirmed',
              action: {
                label: 'View',
                onClick: () => window.open(getTxUrl(step.transactionHash!, network), '_blank'),
              },
            })
          }
        }
        
        // Now we need to execute the swap step manually since executeLeverageLoop
        // doesn't have access to useAutoswap
        // Find the borrow step
        const borrowStep = loopResult.steps.find(s => s.description.includes('Borrowing'))
        if (borrowStep && borrowStep.amount) {
          // Execute swap
          toast.info('Swapping USDC to wBTC...', {
            description: 'Using Autoswap aggregator',
          })
          
          const swapResult = await executeSwap({
            fromToken: config.contracts.USDC,
            toToken: config.contracts.wBTC,
            amount: borrowStep.amount,
            slippage: 0.5,
            recipient: address,
          })
          
          await waitForTransaction(swapResult.transactionHash)
          
          toast.success('Swap completed!', {
            description: 'wBTC received',
          })
        }
        
        setTxStatus('confirmed')
        toast.success('Leverage loop successful!', {
          description: `Position leveraged to ${leverageValue}x`,
        })
        
        // Update projected position to actual position
        setProjectedPosition(loopResult.finalPosition)
        
      } else {
        // Standard borrow without leverage loop
        toast.info('Step 1/2: Borrowing from Vesu...', {
          description: 'Executing borrow transaction',
        })
        
        const borrowResult = await borrow({
          asset: config.contracts.USDC,
          amount: amountInUnits,
          onBehalfOf: address,
        })
        
        setTxHash(borrowResult.transactionHash)
        
        // Wait for borrow confirmation
        await waitForTransaction(borrowResult.transactionHash)
        
        toast.success('Borrow confirmed!', {
          description: 'Now shielding borrowed USDC...',
        })
        
        // Step 2: Shield borrowed USDC via Tongo (privacy layer)
        toast.info('Step 2/2: Shielding via Tongo...', {
          description: 'Encrypting borrowed amount on-chain',
        })
        
        const shieldTxHash = await fund({
          token: config.contracts.USDC,
          amount: amountInUnits,
        })
        
        // Wait for shield confirmation
        await waitForTransaction(shieldTxHash)
        
        setTxStatus('confirmed')
        toast.success('Private borrow successful!', {
          description: `Borrowed ${borrowAmount} USDC (shielded)`,
          action: {
            label: 'View on Explorer',
            onClick: () => window.open(getTxUrl(borrowResult.transactionHash, network), '_blank'),
          },
        })
      }
      
      // Refresh position data
      const position = await getUserPosition(address)
      setCurrentLTV(position.ltv)
      setHealthFactor(position.healthFactor)
      setCollateralAmount(position.collateral)
      
    } catch (err) {
      setTxStatus('failed')
      const errorMessage = err instanceof Error ? err.message : 'Borrow failed'
      toast.error('Borrow failed', {
        description: errorMessage,
      })
      console.error('Error borrowing:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Connection Warning */}
      {!isConnected && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            Please connect your wallet to borrow USDC
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Status */}
      {txHash && txStatus === 'pending' && (
        <Alert className="border-blue-500/30 bg-blue-500/10">
          <Spinner className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Transaction pending...{' '}
            <a
              href={getTxUrl(txHash, network)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      )}

      {txHash && txStatus === 'confirmed' && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Borrow successful!{' '}
            <a
              href={getTxUrl(txHash, network)}
              target="_blank"
              rel="noopener noreferrer"
              className="underline inline-flex items-center gap-1"
            >
              View on Explorer <ExternalLink className="h-3 w-3" />
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Leverage Loop Progress */}
      {leverageSteps.length > 0 && (
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Leverage Loop Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leverageSteps.map((step) => (
              <div key={step.step} className="flex items-center gap-3 text-sm">
                {step.status === 'pending' && <Spinner className="h-4 w-4 text-blue-500" />}
                {step.status === 'confirmed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {step.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                <div className="flex-1">
                  <div className="font-medium">Step {step.step}: {step.description}</div>
                  {step.transactionHash && step.transactionHash !== 'swap_tx_hash_placeholder' && (
                    <a
                      href={getTxUrl(step.transactionHash, network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground underline inline-flex items-center gap-1"
                    >
                      View tx <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Borrow Card */}
      <Card className="border-2 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Borrow & Loop Leverage
            <Badge variant="outline" className="ml-auto">
              <Shield className="h-3 w-3 mr-1" />
              Private
            </Badge>
          </CardTitle>
          <CardDescription>
            Borrow USDC against your wBTC collateral with optional leverage. All borrows are shielded via Tongo for privacy.
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
              disabled={isLoading || !isConnected}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: 100 USDC</span>
              <span>
                Max Borrow Capacity:{' '}
                {(parseFloat(borrowingCapacity) / Math.pow(10, TOKEN_METADATA.USDC.decimals)).toFixed(2)} USDC
              </span>
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
              disabled={isLoading || !isConnected}
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
              onCheckedChange={(checked) => setAutoLoop(checked === true)}
              disabled={isLoading || !isConnected}
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
              {autoLoop && leverageValue > 1 ? 'Projected Details (After Leverage)' : 'Estimated Details'}
            </h4>
            {isCalculatingProjection && autoLoop && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="h-3 w-3" />
                Calculating projection...
              </div>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Borrow Amount:</span>
                <span className="font-medium">{borrowAmount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-medium">{poolInterestRate.toFixed(2)}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Annual Interest:</span>
                <span className="font-medium text-accent">{estimatedInterest.toFixed(2)} USDC</span>
              </div>
              {autoLoop && projectedPosition ? (
                <>
                  <div className="border-t border-border pt-2 mt-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Total Collateral:</span>
                    <span className="font-medium text-green-500">
                      {(Number(projectedPosition.totalCollateral) / Math.pow(10, TOKEN_METADATA.wBTC.decimals)).toFixed(6)} wBTC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Total Debt:</span>
                    <span className="font-medium text-yellow-500">
                      {(Number(projectedPosition.totalDebt) / Math.pow(10, TOKEN_METADATA.USDC.decimals)).toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected LTV:</span>
                    <span className={`font-medium ${projectedPosition.projectedLTV > 75 ? 'text-red-500' : projectedPosition.projectedLTV > 60 ? 'text-yellow-500' : 'text-green-500'}`}>
                      {projectedPosition.projectedLTV.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Health Factor:</span>
                    <span className={`font-medium ${projectedPosition.healthFactor > 1.5 ? 'text-green-500' : projectedPosition.healthFactor > 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {projectedPosition.healthFactor.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Projected Liquidation Price:</span>
                    <span className="font-medium text-red-500">
                      ${projectedPosition.liquidationPrice.toFixed(0)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current LTV:</span>
                    <span className="font-medium">{currentLTV.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Health Factor:</span>
                    <span className={`font-medium ${healthFactor > 1.5 ? 'text-green-500' : healthFactor > 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {healthFactor > 0 ? healthFactor.toFixed(2) : 'N/A'}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between">
                    <span className="text-muted-foreground">Liquidation Price:</span>
                    <span className="font-medium text-red-500">
                      ${liquidationPrice > 0 ? liquidationPrice.toFixed(0) : 'N/A'}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current BTC Price:</span>
                <span className="font-medium">~${btcPrice.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Borrow Button */}
          <Button
            onClick={handleBorrow}
            disabled={isLoading || !isConnected}
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
