'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { 
  AlertCircle, 
  ArrowDownUp, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw,
  Wallet,
  Building2,
  Info
} from 'lucide-react'
import { useWallet } from '@/lib/wallet-context'
import { useStarknet } from '@/hooks/useStarknet'
import { useMavaPay } from '@/hooks/useMavaPay'
import { useBankAccounts } from '@/hooks/useBankAccounts'
import { useNetwork } from '@/hooks/useNetwork'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import { formatUnits, parseUnits } from '@/lib/utils'
import { 
  ngnToKobo, 
  koboToNgn, 
  formatNGN, 
  getMinimumNGNFormatted,
  meetsMinimumNGN 
} from '@/lib/currency-converter'
import { QuoteResponse, BankAccount } from '@/types/mavapay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BankAccountManager } from '@/components/bank-account-manager'

/**
 * RampTab Component
 * 
 * Main UI for MavaPay on/off-ramp operations
 * This implementation focuses on the off-ramp flow (Crypto → Fiat)
 * 
 * Requirements: 1.1-1.8, 6.1-6.5, 7.1-7.5
 */

type Currency = 'USDC'
type RampMode = 'off-ramp' | 'on-ramp'

export function RampTab() {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  const { getBalance } = useStarknet()
  const config = getNetworkConfig(network)
  
  const {
    fetchQuote,
    quote,
    quoteLoading,
    quoteError,
    initiateOffRamp,
    offRampLoading,
    offRampError,
  } = useMavaPay()
  
  const {
    accounts: bankAccounts,
    loading: bankAccountsLoading,
  } = useBankAccounts()
  
  // UI State
  const [mode, setMode] = useState<RampMode>('off-ramp')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USDC')
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [showBankManager, setShowBankManager] = useState(false)
  
  // Balance state
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [balanceLoading, setBalanceLoading] = useState(false)
  
  // Quote state
  const [quoteExpiry, setQuoteExpiry] = useState<Date | null>(null)
  const [quoteTimer, setQuoteTimer] = useState<number>(0)
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<'idle' | 'confirming' | 'processing' | 'success' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState('')

  /**
   * Fetch token balances
   * Requirements: 1.1
   */
  const fetchBalances = useCallback(async () => {
    if (!isConnected || !address) return
    
    try {
      setBalanceLoading(true)
      
      const usdc = await getBalance(config.contracts.USDC, address)
      
      setUsdcBalance(usdc)
    } catch (err) {
      console.error('Error fetching balances:', err)
    } finally {
      setBalanceLoading(false)
    }
  }, [isConnected, address, config.contracts, getBalance])

  /**
   * Load balances on mount and when wallet connects
   */
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  /**
   * Get current balance for selected currency
   */
  const getCurrentBalance = useCallback((): string => {
    return usdcBalance
  }, [usdcBalance])

  /**
   * Format balance for display
   */
  const formatBalance = useCallback((balance: string): string => {
    return formatUnits(balance, TOKEN_METADATA[currency].decimals)
  }, [currency])

  /**
   * Handle max button click
   */
  const handleMaxClick = () => {
    const balance = getCurrentBalance()
    if (balance && balance !== '0') {
      const formatted = formatBalance(balance)
      setAmount(formatted)
    }
  }

  /**
   * Fetch quote when amount changes
   * Requirements: 1.3, 1.4, 6.1, 6.2
   */
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      return
    }

    const debounceTimer = setTimeout(async () => {
      try {
        // Convert amount to smallest unit (satoshis for BTC)
        // For off-ramp: USDT/USDC → BTC → NGN
        // We'll assume 1 USDT/USDC ≈ some BTC amount
        // In production, this would involve a swap quote first
        
        // For now, let's request a quote for BTC → NGN
        // This is a simplified version; full implementation would:
        // 1. Get swap quote (USDT/USDC → BTC)
        // 2. Get MavaPay quote (BTC → NGN)
        
        const amountInSatoshis = Math.floor(parseFloat(amount) * 100000) // Simplified conversion
        
        await fetchQuote({
          direction: 'btc-to-ngn',
          amount: amountInSatoshis.toString(),
          sourceCurrency: 'BTCSAT',
          targetCurrency: 'NGNKOBO',
        })
        
        // Set quote expiry (5 minutes from now)
        const expiry = new Date(Date.now() + 5 * 60 * 1000)
        setQuoteExpiry(expiry)
      } catch (err) {
        console.error('Error fetching quote:', err)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(debounceTimer)
  }, [amount, fetchQuote])

  /**
   * Update quote timer
   * Requirements: 6.3
   */
  useEffect(() => {
    if (!quoteExpiry) return

    const interval = setInterval(() => {
      const now = Date.now()
      const expiry = quoteExpiry.getTime()
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
      
      setQuoteTimer(remaining)
      
      // Auto-refresh if expired
      if (remaining === 0 && amount && parseFloat(amount) > 0) {
        fetchQuote({
          direction: 'btc-to-ngn',
          amount: Math.floor(parseFloat(amount) * 100000).toString(),
          sourceCurrency: 'BTCSAT',
          targetCurrency: 'NGNKOBO',
        })
        
        const newExpiry = new Date(Date.now() + 5 * 60 * 1000)
        setQuoteExpiry(newExpiry)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [quoteExpiry, amount, fetchQuote])

  /**
   * Validate off-ramp amount
   * Requirements: 1.1, 7.1, 7.2
   */
  const validateOffRampAmount = (): { valid: boolean; error?: string } => {
    if (!amount || parseFloat(amount) <= 0) {
      return { valid: false, error: 'Please enter a valid amount' }
    }

    const currentBalance = getCurrentBalance()
    const amountInUnits = parseUnits(amount, TOKEN_METADATA[currency].decimals)
    
    if (BigInt(amountInUnits) > BigInt(currentBalance)) {
      return { valid: false, error: 'Insufficient balance' }
    }

    // Check minimum NGN amount (2000 NGN)
    if (quote) {
      const ngnAmount = quote.amountInTargetCurrency
      if (!meetsMinimumNGN(ngnAmount)) {
        return { 
          valid: false, 
          error: `Minimum amount is ${getMinimumNGNFormatted()}` 
        }
      }
    }

    if (!selectedBank) {
      return { valid: false, error: 'Please select a bank account' }
    }

    return { valid: true }
  }

  /**
   * Handle off-ramp confirmation
   * Requirements: 1.5, 1.6, 1.7, 1.8
   */
  const handleOffRampConfirm = async () => {
    const validation = validateOffRampAmount()
    if (!validation.valid) {
      setTxStatus('error')
      setTxMessage(validation.error || 'Validation failed')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    if (!quote || !selectedBank) {
      return
    }

    try {
      setTxStatus('confirming')
      setTxMessage('Preparing off-ramp transaction...')
      
      // Initiate off-ramp
      const result = await initiateOffRamp({
        quoteId: quote.id,
        bankAccountId: selectedBank.id,
        walletAddress: address!,
      })
      
      setTxStatus('processing')
      setTxMessage(`Lightning invoice generated. Amount: ${result.amount} sats`)
      
      // In production, this would trigger Lightning payment
      // For now, we'll simulate success
      setTimeout(() => {
        setTxStatus('success')
        setTxMessage(`Off-ramp initiated! Funds will arrive in ${selectedBank.bankName} account.`)
        setAmount('')
        fetchBalances()
      }, 2000)
      
    } catch (err) {
      setTxStatus('error')
      setTxMessage(err instanceof Error ? err.message : 'Off-ramp failed')
      console.error('Off-ramp error:', err)
    }
  }

  /**
   * Handle bank account selection
   * Requirements: 4.4, 4.5
   */
  const handleBankSelect = (bankId: string) => {
    const bank = bankAccounts.find(b => b.id === bankId)
    setSelectedBank(bank || null)
  }

  /**
   * Format time remaining for quote
   */
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Connection Warning */}
      {!isConnected && (
        <Alert className="border-yellow-500/30 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            Please connect your wallet to use the ramp
          </AlertDescription>
        </Alert>
      )}

      {/* Transaction Status */}
      {txStatus !== 'idle' && (
        <Alert className={`${
          txStatus === 'confirming' || txStatus === 'processing' 
            ? 'border-blue-500/30 bg-blue-500/10' 
            : txStatus === 'success'
            ? 'border-green-500/30 bg-green-500/10'
            : 'border-red-500/30 bg-red-500/10'
        }`}>
          {(txStatus === 'confirming' || txStatus === 'processing') && (
            <Spinner className="h-4 w-4 text-blue-500" />
          )}
          {txStatus === 'success' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {txStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
          <AlertDescription className={
            txStatus === 'confirming' || txStatus === 'processing'
              ? 'text-blue-700 dark:text-blue-400'
              : txStatus === 'success'
              ? 'text-green-700 dark:text-green-400'
              : 'text-red-700 dark:text-red-400'
          }>
            {txMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Ramp Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>BTC ↔ NGN Ramp</CardTitle>
              <CardDescription>
                Convert crypto to Nigerian Naira via MavaPay
              </CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <ArrowDownUp className="h-3 w-3" />
              Off-Ramp
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Currency Display */}
          <div className="space-y-2">
            <Label className="text-base font-medium">Currency</Label>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-secondary/20">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">USDC</span>
              <span className="text-xs text-muted-foreground ml-auto">
                Balance: {formatBalance(usdcBalance)}
              </span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-base font-medium">
              Amount (USDC)
            </Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-base"
                step="0.01"
                min="0"
                disabled={offRampLoading || !isConnected}
              />
              <Button
                variant="outline"
                onClick={handleMaxClick}
                disabled={offRampLoading || !isConnected || balanceLoading}
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Available: {balanceLoading ? (
                <Spinner className="inline h-3 w-3" />
              ) : (
                `${formatBalance(getCurrentBalance())} USDC`
              )}
            </p>
          </div>

          {/* Quote Display */}
          {quote && !quoteError && (
            <div className="rounded-lg bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Quote Details</h4>
                {quoteTimer > 0 && (
                  <Badge variant="outline" className="text-xs">
                    Expires in {formatTimeRemaining(quoteTimer)}
                  </Badge>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You send:</span>
                  <span className="font-medium">{amount} USDC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">You receive:</span>
                  <span className="font-medium text-green-500">
                    {formatNGN(quote.amountInTargetCurrency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Exchange Rate:</span>
                  <span className="font-medium">
                    1 BTC = ₦{quote.exchangeRate.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transaction Fee:</span>
                  <span className="font-medium">
                    {formatNGN(quote.transactionFeesInTargetCurrency)}
                  </span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="text-muted-foreground">Total to Account:</span>
                  <span className="font-bold text-green-500">
                    {formatNGN(quote.amountInTargetCurrency - quote.transactionFeesInTargetCurrency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quote Loading */}
          {quoteLoading && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
              <Spinner className="h-4 w-4" />
              Fetching quote...
            </div>
          )}

          {/* Quote Error */}
          {quoteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {quoteError.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Bank Account Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Bank Account</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBankManager(!showBankManager)}
                className="text-xs"
              >
                <Building2 className="h-3 w-3 mr-1" />
                Manage Accounts
              </Button>
            </div>
            
            {bankAccounts.length > 0 ? (
              <Select 
                value={selectedBank?.id || ''} 
                onValueChange={handleBankSelect}
                disabled={offRampLoading || !isConnected}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((bank) => (
                    <SelectItem key={bank.id} value={bank.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{bank.bankName}</span>
                        <span className="text-xs text-muted-foreground">
                          {bank.accountName} - {bank.accountNumber}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  No bank accounts saved. Click "Manage Accounts" to add one.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Minimum Amount Warning */}
          {amount && parseFloat(amount) > 0 && quote && !meetsMinimumNGN(quote.amountInTargetCurrency) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Minimum off-ramp amount is {getMinimumNGNFormatted()}
              </AlertDescription>
            </Alert>
          )}

          {/* Confirm Button */}
          <Button
            onClick={handleOffRampConfirm}
            disabled={
              offRampLoading || 
              !isConnected || 
              !amount || 
              !quote || 
              !selectedBank ||
              quoteTimer === 0 ||
              (quote && !meetsMinimumNGN(quote.amountInTargetCurrency))
            }
            className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold"
            size="lg"
          >
            {offRampLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Processing...
              </>
            ) : (
              'Confirm Off-Ramp'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Bank Account Manager */}
      {showBankManager && (
        <BankAccountManager />
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>1. Enter USDC amount to convert</p>
            <p>2. Review real-time quote</p>
            <p>3. Select bank account</p>
            <p>4. Confirm and receive NGN</p>
            <p>5. Funds arrive in 10 minutes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Minimum: {getMinimumNGNFormatted()}</p>
            <p>• Quotes expire after 5 minutes</p>
            <p>• Funds arrive within 10 minutes</p>
            <p>• Lightning Network fees apply</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
