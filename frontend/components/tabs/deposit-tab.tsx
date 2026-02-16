'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, AlertCircle, Lock, ExternalLink } from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useStarknet } from '@/hooks/useStarknet'
import { useTongo } from '@/hooks/useTongo'
import { useNetwork } from '@/hooks/useNetwork'
import { getNetworkConfig, TOKEN_METADATA, getTxUrl } from '@/lib/constants'
import { formatUnits, parseUnits } from '@/lib/utils'

export function DepositTab() {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  const { getBalance, sendTransaction, waitForTransaction } = useStarknet()
  const { tongoAccount, fund, createAccount } = useTongo()
  
  const [amount, setAmount] = useState('')
  const [wbtcBalance, setWbtcBalance] = useState('0')
  const [isLoading, setIsLoading] = useState(false)
  const [txStatus, setTxStatus] = useState<'idle' | 'approving' | 'funding' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  /**
   * Fetch real wBTC balance from wallet
   * Requirements: AC-3.2
   */
  useEffect(() => {
    const fetchBalance = async () => {
      if (!isConnected || !address) return
      
      try {
        const config = getNetworkConfig(network)
        const balance = await getBalance(config.contracts.wBTC, address)
        setWbtcBalance(balance)
      } catch (err) {
        console.error('Error fetching wBTC balance:', err)
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

  /**
   * Ensure Tongo account is created
   */
  useEffect(() => {
    if (isConnected && !tongoAccount) {
      createAccount().catch(console.error)
    }
  }, [isConnected, tongoAccount, createAccount])

  const handleMaxClick = () => {
    if (wbtcBalance && wbtcBalance !== '0') {
      const formatted = formatUnits(wbtcBalance, TOKEN_METADATA.wBTC.decimals)
      setAmount(formatted)
    }
  }

  /**
   * Two-step deposit process:
   * 1. Approve wBTC for Tongo protocol
   * 2. Fund (shield) the deposit via Tongo
   * 
   * Requirements: AC-3.3, AC-3.4, AC-3.5, AC-3.7
   */
  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setTxStatus('error')
      setErrorMessage('Please enter a valid amount')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    if (!isConnected || !address) {
      setTxStatus('error')
      setErrorMessage('Please connect your wallet')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    if (!tongoAccount) {
      setTxStatus('error')
      setErrorMessage('Tongo account not initialized')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage('')
      const config = getNetworkConfig(network)
      
      // Parse amount to wei (with proper decimals)
      const amountWei = parseUnits(amount, TOKEN_METADATA.wBTC.decimals)

      // Step 1: Approve wBTC for Tongo protocol
      setTxStatus('approving')
      const approveTxHash = await sendTransaction({
        contractAddress: config.contracts.wBTC,
        entrypoint: 'approve',
        calldata: [
          config.contracts.tongoProtocol,
          amountWei,
          '0', // amount high (for Uint256)
        ],
        type: 'approve',
      })

      // Wait for approval confirmation
      await waitForTransaction(approveTxHash)

      // Step 2: Fund (shield) via Tongo
      setTxStatus('funding')
      const fundTxHash = await fund({
        token: config.contracts.wBTC,
        amount: amountWei,
      })

      setTxHash(fundTxHash)

      // Wait for fund confirmation
      await waitForTransaction(fundTxHash)

      // Success!
      setTxStatus('success')
      setAmount('')
      
      // Refresh balance
      const newBalance = await getBalance(config.contracts.wBTC, address)
      setWbtcBalance(newBalance)

      // Reset after 5 seconds
      setTimeout(() => {
        setTxStatus('idle')
        setTxHash(null)
      }, 5000)
    } catch (err) {
      console.error('Error depositing:', err)
      setTxStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Transaction failed')
      setTimeout(() => setTxStatus('idle'), 5000)
    } finally {
      setIsLoading(false)
    }
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
              Available: {formatUnits(wbtcBalance, TOKEN_METADATA.wBTC.decimals)} wBTC
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
            <div className={`rounded-lg p-4 space-y-2 ${
              txStatus === 'approving' || txStatus === 'funding' ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400' :
              txStatus === 'success' ? 'bg-green-500/10 text-green-700 dark:text-green-400' :
              'bg-red-500/10 text-red-700 dark:text-red-400'
            }`}>
              <div className="flex items-center gap-3">
                {(txStatus === 'approving' || txStatus === 'funding') && <Spinner className="h-4 w-4" />}
                {txStatus === 'success' && <CheckCircle2 className="h-4 w-4" />}
                {txStatus === 'error' && <AlertCircle className="h-4 w-4" />}
                <span className="text-sm font-medium">
                  {txStatus === 'approving' && 'Step 1/2: Approving wBTC...'}
                  {txStatus === 'funding' && 'Step 2/2: Shielding your collateral...'}
                  {txStatus === 'success' && 'Deposit successful! Your collateral is now shielded.'}
                  {txStatus === 'error' && `Error: ${errorMessage}`}
                </span>
              </div>
              
              {/* Transaction hash link */}
              {txHash && txStatus === 'success' && (
                <a
                  href={getTxUrl(txHash, network)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs hover:underline"
                >
                  View on Voyager
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleDeposit}
            disabled={isLoading || !amount || !isConnected}
            className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold"
            size="lg"
          >
            {!isConnected ? (
              'Connect Wallet'
            ) : isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {txStatus === 'approving' ? 'Approving...' : 'Processing...'}
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
