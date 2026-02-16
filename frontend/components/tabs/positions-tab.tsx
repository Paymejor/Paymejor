'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Lock, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SkeletonPosition } from '@/components/ui/skeleton-card'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from '@/hooks/useNetwork'
import { useVesuPositionCache, useVesuPoolParametersCache } from '@/hooks/useVesuCache'
import { useTongoDecryptedBalanceCache } from '@/hooks/useTongoCache'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'

interface Position {
  id: string
  collateral: string
  collateralAmount: number | null
  borrowed: string
  borrowedAmount: number | null
  ltv: number
  healthFactor: number
  isDecrypted: boolean
  liquidationThreshold: number
}

export function PositionsTab() {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  const config = getNetworkConfig(network)
  
  // Use cached position data
  const {
    data: vesuPosition,
    isLoading: loadingPosition,
    error: positionError,
    refresh: refreshPosition,
  } = useVesuPositionCache()
  
  // Use cached pool parameters
  const {
    data: poolParams,
    isLoading: loadingParams,
  } = useVesuPoolParametersCache()
  
  // Cached decrypted balances (only fetched when user clicks reveal)
  const {
    data: decryptedCollateral,
    isLoading: decryptingCollateral,
    refresh: refreshCollateral,
  } = useTongoDecryptedBalanceCache(config.contracts.wBTC)
  
  const {
    data: decryptedDebt,
    isLoading: decryptingDebt,
    refresh: refreshDebt,
  } = useTongoDecryptedBalanceCache(config.contracts.USDC)
  
  const [position, setPosition] = useState<Position | null>(null)
  const [isDecrypted, setIsDecrypted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Update position from cached Vesu data
   * Requirements: AC-6.1, AC-6.2, AC-6.6, AC-6.7
   */
  useEffect(() => {
    if (!vesuPosition || !poolParams) {
      setPosition(null)
      return
    }

    // Check if user has any position
    if (vesuPosition.collateral === BigInt(0) && vesuPosition.debt === BigInt(0)) {
      setPosition(null)
      return
    }

    // Create position object
    const newPosition: Position = {
      id: `${network}_${address}`,
      collateral: 'wBTC',
      collateralAmount: null, // Will be set when decrypted
      borrowed: 'USDC',
      borrowedAmount: null, // Will be set when decrypted
      ltv: vesuPosition.ltv,
      healthFactor: vesuPosition.healthFactor,
      isDecrypted: false,
      liquidationThreshold: poolParams.liquidationThreshold,
    }

    setPosition(newPosition)
  }, [vesuPosition, poolParams, network, address])

  /**
   * Update decrypted amounts when available
   */
  useEffect(() => {
    if (!position || !isDecrypted) return
    
    if (decryptedCollateral && decryptedDebt) {
      const collateralAmount = Number(decryptedCollateral.amount) / Math.pow(10, TOKEN_METADATA.wBTC.decimals)
      const debtAmount = Number(decryptedDebt.amount) / Math.pow(10, TOKEN_METADATA.USDC.decimals)
      
      setPosition(prev => prev ? {
        ...prev,
        collateralAmount,
        borrowedAmount: debtAmount,
        isDecrypted: true,
      } : null)
    }
  }, [decryptedCollateral, decryptedDebt, isDecrypted, position])

  /**
   * Handle position error
   */
  useEffect(() => {
    if (positionError) {
      setError(positionError.message)
    } else {
      setError(null)
    }
  }, [positionError])

  /**
   * Decrypt position using Tongo (triggers cache fetch)
   * Requirements: AC-6.3, AC-6.4, AC-6.5
   */
  const toggleDecrypt = async () => {
    if (!position || !address) return

    try {
      setError(null)

      if (isDecrypted) {
        // Hide position
        setIsDecrypted(false)
        setPosition({
          ...position,
          collateralAmount: null,
          borrowedAmount: null,
          isDecrypted: false,
        })
      } else {
        // Decrypt position (triggers cache fetch)
        setIsDecrypted(true)
        await Promise.all([
          refreshCollateral(),
          refreshDebt(),
        ])
      }
    } catch (err) {
      console.error('Error decrypting position:', err)
      setError(err instanceof Error ? err.message : 'Failed to decrypt position')
      setIsDecrypted(false)
    }
  }

  const decryptingPosition = decryptingCollateral || decryptingDebt

  /**
   * Get explorer URL for current network
   * Requirements: AC-6.9, TR-4.27
   */
  const getExplorerUrl = () => {
    return config.explorerUrl
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

  const getHealthLabel = (hf: number) => {
    if (hf >= 2) return 'Safe'
    if (hf >= 1.5) return 'Stable'
    if (hf >= 1.1) return 'At Risk'
    return 'Critical'
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Alert className="border-primary/30 bg-primary/5">
        <Lock className="h-4 w-4 text-primary" />
        <AlertDescription>
          All position data is encrypted. Click "Reveal" to decrypt your positions using Tongo ZK proofs.
          <span className="ml-2 text-xs">Network: {network === 'sepolia' ? 'Sepolia Testnet' : 'Mainnet'}</span>
        </AlertDescription>
      </Alert>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loadingPosition && (
        <SkeletonPosition />
      )}

      {/* No Wallet Connected */}
      {!isConnected && !loadingPosition && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Wallet Not Connected</h3>
            <p className="text-muted-foreground">
              Connect your wallet to view your positions.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No Positions State */}
      {isConnected && !loadingPosition && !position && (
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">No Active Positions</h3>
            <p className="text-muted-foreground">
              Start by depositing collateral and borrowing USDC to create your first position.
            </p>
            <Button 
              onClick={refreshPosition}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loadingPosition ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Position Display */}
      {position && !loadingPosition && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
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
                      {position.isDecrypted && position.collateralAmount !== null
                        ? `${position.collateralAmount.toFixed(8)} ${position.collateral}`
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
                      {position.isDecrypted && position.borrowedAmount !== null
                        ? `${position.borrowedAmount.toFixed(2)} ${position.borrowed}`
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
                    <p className="text-sm font-semibold">{position.ltv.toFixed(1)}%</p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="bg-accent h-full rounded-full"
                        style={{ width: `${Math.min(position.ltv, 100)}%` }}
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
                      {getHealthLabel(position.healthFactor)}
                    </Badge>
                  </div>
                </div>

                {/* Shielded Badge & Network */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="w-fit">
                    <Lock className="h-3 w-3 mr-1" />
                    Tongo Shielded
                  </Badge>
                  <Badge variant="secondary" className="w-fit">
                    {network === 'sepolia' ? 'Sepolia' : 'Mainnet'}
                  </Badge>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 md:w-auto md:min-w-48">
                <Button
                  onClick={toggleDecrypt}
                  disabled={decryptingPosition}
                  variant="outline"
                  className="w-full"
                >
                  {decryptingPosition ? (
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
                  onClick={refreshPosition}
                  disabled={loadingPosition}
                  variant="secondary"
                  className="w-full"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${loadingPosition ? 'animate-spin' : ''}`} />
                  Refresh Position
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(getExplorerUrl(), '_blank')}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </Card>

          {/* Position Details */}
          {position.isDecrypted && position.collateralAmount !== null && position.borrowedAmount !== null && (
            <Card className="border-2 border-primary/20">
              <CardHeader>
                <CardTitle>Position Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Collateral Value</p>
                    <p className="text-lg font-bold">{position.collateralAmount.toFixed(8)} wBTC</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ~${(position.collateralAmount * 43200).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Debt Value</p>
                    <p className="text-lg font-bold">{position.borrowedAmount.toFixed(2)} USDC</p>
                    <p className="text-xs text-muted-foreground mt-1">Accruing interest</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">LTV Ratio</p>
                    <p className="text-lg font-bold">{position.ltv.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Max: {position.liquidationThreshold}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Health Factor</p>
                    <p className={`text-lg font-bold ${getHealthColor(position.healthFactor)}`}>
                      {position.healthFactor.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {getHealthLabel(position.healthFactor)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
          <p>🌐 <strong>Network:</strong> Positions are network-specific. Switch networks to view other positions.</p>
        </CardContent>
      </Card>
    </div>
  )
}
