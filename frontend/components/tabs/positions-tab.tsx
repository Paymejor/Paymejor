'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Lock, Eye, EyeOff, ExternalLink, RefreshCw } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from '@/hooks/useNetwork'
import { useVesu } from '@/hooks/useVesu'
import { useTongo } from '@/hooks/useTongo'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import { VesuPosition } from '@/types/vesu'

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
  const { getUserPosition, getPoolParameters } = useVesu()
  const { getBalance, decrypt } = useTongo()
  
  const [position, setPosition] = useState<Position | null>(null)
  const [loadingPosition, setLoadingPosition] = useState(false)
  const [decryptingPosition, setDecryptingPosition] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch user position from Vesu protocol
   * Requirements: AC-6.1, AC-6.2, AC-6.6, AC-6.7
   */
  const fetchPosition = async () => {
    if (!address || !isConnected) {
      setPosition(null)
      return
    }

    try {
      setLoadingPosition(true)
      setError(null)

      // Query Vesu pool for user's position
      const vesuPosition: VesuPosition = await getUserPosition(address)
      
      // Get pool parameters for liquidation threshold
      const poolParams = await getPoolParameters()

      // Check if user has any position
      if (vesuPosition.collateral === BigInt(0) && vesuPosition.debt === BigInt(0)) {
        setPosition(null)
        return
      }

      // Create position object with encrypted amounts
      const newPosition: Position = {
        id: `${network}_${address}`,
        collateral: 'wBTC',
        collateralAmount: null, // Encrypted by default
        borrowed: 'USDC',
        borrowedAmount: null, // Encrypted by default
        ltv: vesuPosition.ltv,
        healthFactor: vesuPosition.healthFactor,
        isDecrypted: false,
        liquidationThreshold: poolParams.liquidationThreshold,
      }

      setPosition(newPosition)
    } catch (err) {
      console.error('Error fetching position:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch position')
    } finally {
      setLoadingPosition(false)
    }
  }

  /**
   * Decrypt position using Tongo
   * Requirements: AC-6.3, AC-6.4, AC-6.5
   */
  const toggleDecrypt = async () => {
    if (!position || !address) return

    try {
      setDecryptingPosition(true)
      setError(null)

      if (position.isDecrypted) {
        // Hide position - just toggle the flag
        setPosition({
          ...position,
          collateralAmount: null,
          borrowedAmount: null,
          isDecrypted: false,
        })
      } else {
        // Decrypt position using Tongo
        const config = getNetworkConfig(network)
        
        // Get encrypted balances from Tongo
        const collateralBalance = await getBalance(config.contracts.wBTC)
        const debtBalance = await getBalance(config.contracts.USDC)
        
        // Decrypt balances
        const decryptedCollateral = await decrypt(collateralBalance)
        const decryptedDebt = await decrypt(debtBalance)
        
        // Convert to human-readable amounts
        const collateralAmount = Number(decryptedCollateral.amount) / Math.pow(10, TOKEN_METADATA.wBTC.decimals)
        const debtAmount = Number(decryptedDebt.amount) / Math.pow(10, TOKEN_METADATA.USDC.decimals)
        
        setPosition({
          ...position,
          collateralAmount,
          borrowedAmount: debtAmount,
          isDecrypted: true,
        })
      }
    } catch (err) {
      console.error('Error decrypting position:', err)
      setError(err instanceof Error ? err.message : 'Failed to decrypt position')
    } finally {
      setDecryptingPosition(false)
    }
  }

  /**
   * Fetch position on mount and when network/address changes
   * Requirements: AC-6.8, AC-6.9
   */
  useEffect(() => {
    fetchPosition()
  }, [address, network, isConnected])

  /**
   * Get explorer URL for current network
   * Requirements: AC-6.9, TR-4.27
   */
  const getExplorerUrl = () => {
    const config = getNetworkConfig(network)
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
        <Card className="text-center py-12">
          <CardContent className="space-y-4">
            <Spinner className="h-12 w-12 mx-auto" />
            <h3 className="text-lg font-semibold">Loading Position...</h3>
            <p className="text-muted-foreground">
              Fetching your position from Vesu protocol on {network}
            </p>
          </CardContent>
        </Card>
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
              onClick={fetchPosition}
              variant="outline"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
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
                  onClick={fetchPosition}
                  disabled={loadingPosition}
                  variant="secondary"
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
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
