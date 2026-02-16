'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { ArrowRight, AlertCircle, Lock, RefreshCw, ExternalLink } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useStarknet } from '@/hooks/useStarknet'
import { useNetwork } from '@/hooks/useNetwork'
import { useExchangeRate } from '@/hooks/useExchangeRate'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'

/**
 * ExitTab Component
 * 
 * Displays NGN off-ramp information with:
 * - Real USDC balance from wallet
 * - Live USDC/NGN exchange rate from CoinGecko
 * - Estimated NGN amount calculation
 * - Links to P2P platforms
 * 
 * Requirements: AC-7.1, AC-7.2, AC-7.3, AC-7.4, AC-7.5
 */

export function ExitTab() {
  const [amount, setAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [usdcBalance, setUsdcBalance] = useState<string>('0')
  const [isLoadingBalance, setIsLoadingBalance] = useState(false)
  
  const { address, isConnected } = useWallet()
  const { getBalance } = useStarknet()
  const { network } = useNetwork()
  const { rate, lastUpdated, isLoading: isLoadingRate, error: rateError, refresh, calculateNGN } = useExchangeRate()

  /**
   * Fetch real USDC balance from blockchain
   * Requirement: AC-7.1, TR-4.27
   */
  useEffect(() => {
    async function fetchBalance() {
      if (!isConnected || !address) {
        setUsdcBalance('0')
        return
      }

      try {
        setIsLoadingBalance(true)
        const config = getNetworkConfig(network)
        const balance = await getBalance(config.contracts.USDC, address)
        
        // Convert from smallest unit to USDC (6 decimals)
        const balanceInUSDC = (Number(balance) / Math.pow(10, TOKEN_METADATA.USDC.decimals)).toFixed(2)
        setUsdcBalance(balanceInUSDC)
      } catch (err) {
        console.error('Error fetching USDC balance:', err)
        setUsdcBalance('0')
      } finally {
        setIsLoadingBalance(false)
      }
    }

    fetchBalance()
    
    // Refresh balance when network changes
    const handleNetworkChange = () => {
      fetchBalance()
    }
    
    window.addEventListener('paymejor_network_changed', handleNetworkChange)
    return () => window.removeEventListener('paymejor_network_changed', handleNetworkChange)
  }, [isConnected, address, network, getBalance])

  const handleWithdraw = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsLoading(false)
    setAmount('')
  }

  // Calculate estimated NGN amount
  // Requirement: AC-7.3
  const estimatedNGN = calculateNGN(parseFloat(amount) || 0)
  
  // Format exchange rate display
  const exchangeRateDisplay = rate ? rate.toFixed(2) : '---'
  
  // Format last updated time
  const lastUpdatedDisplay = lastUpdated 
    ? new Date(lastUpdated).toLocaleTimeString() 
    : 'Never'

  // P2P platform links
  // Requirement: AC-7.4
  const p2pPlatforms = [
    {
      name: 'Binance P2P',
      url: 'https://p2p.binance.com/en/trade/all-payments/USDC?fiat=NGN',
      description: 'Most liquid P2P marketplace',
    },
    {
      name: 'Paxful',
      url: 'https://paxful.com/sell-usdc',
      description: 'Global P2P trading platform',
    },
    {
      name: 'LocalBitcoins',
      url: 'https://localbitcoins.com/',
      description: 'Peer-to-peer marketplace',
    },
  ]

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
          {/* Info Banner - Requirement: AC-7.5 */}
          <Alert className="border-primary/30 bg-primary/5">
            <Lock className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Disclaimer:</strong> Off-ramp to NGN is handled by external P2P platforms. 
              PayMejor does not facilitate fiat conversions. Your on-chain lending activity remains private via Tongo.
            </AlertDescription>
          </Alert>

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription>
                Please connect your wallet to view your USDC balance
              </AlertDescription>
            </Alert>
          )}

          {/* Exchange Rate Error */}
          {rateError && (
            <Alert className="border-red-500/30 bg-red-500/5">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription>
                Failed to fetch exchange rate: {rateError}. Using cached rate if available.
              </AlertDescription>
            </Alert>
          )}

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
                    <span className="font-semibold">
                      {isLoadingBalance ? (
                        <Spinner className="h-4 w-4 inline" />
                      ) : (
                        `${usdcBalance} USDC`
                      )}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full" disabled={!isConnected}>
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
                    disabled={isLoading || !isConnected}
                    min="0"
                    step="1"
                  />
                  <p className="text-xs text-muted-foreground">
                    Max available: {usdcBalance} USDC
                  </p>
                </div>

                {/* Exchange Info - Requirements: AC-7.2, AC-7.3 */}
                <div className="rounded-lg bg-secondary/30 p-3 mb-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Exchange Rate (Live):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {isLoadingRate ? (
                          <Spinner className="h-4 w-4 inline" />
                        ) : (
                          `1 USDC = ₦${exchangeRateDisplay}`
                        )}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refresh}
                        disabled={isLoadingRate}
                        className="h-6 w-6 p-0"
                      >
                        <RefreshCw className={`h-3 w-3 ${isLoadingRate ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last updated:</span>
                    <span>{lastUpdatedDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                    <span className="text-muted-foreground">You Receive:</span>
                    <span className="font-bold text-accent text-lg">
                      ₦{estimatedNGN.toLocaleString('en-NG', { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Recommended Ramps - Requirement: AC-7.4 */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    RECOMMENDED P2P RAMPS
                  </p>
                  <div className="space-y-2">
                    {p2pPlatforms.map((platform) => (
                      <Button
                        key={platform.name}
                        variant="outline"
                        className="w-full justify-between"
                        disabled={isLoading}
                        onClick={() => window.open(platform.url, '_blank')}
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{platform.name}</span>
                          <span className="text-xs text-muted-foreground">{platform.description}</span>
                        </div>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleWithdraw}
                    disabled={isLoading || !amount || !isConnected || !rate}
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
