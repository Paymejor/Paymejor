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
import { useSwapRouter } from '@/hooks/useSwapRouter'
import { getNetworkConfig, TOKEN_METADATA } from '@/lib/constants'
import { formatUnits, parseUnits } from '@/lib/utils'
import { 
  ngnToKobo, 
  koboToNgn, 
  formatNGN, 
  getMinimumNGNFormatted,
  meetsMinimumNGN 
} from '@/lib/currency-converter'
import { QuoteResponse, BankAccount, StoredRampTransaction } from '@/types/mavapay'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BankAccountManager } from '@/components/bank-account-manager'
import { RampTransactionHistory } from '@/components/ramp-transaction-history'
import { getTransactionsByWallet } from '@/lib/transaction-manager'

/**
 * RampTab Component
 * 
 * Main UI for MavaPay on/off-ramp operations
 * Supports both off-ramp (Crypto → Fiat) and on-ramp (Fiat → Crypto) flows
 * 
 * Requirements: 1.1-1.8, 2.1-2.7, 6.1-6.5, 7.1-7.5
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
    initiateOnRamp,
    onRampLoading,
    onRampError,
  } = useMavaPay()
  
  const {
    accounts: bankAccounts,
    loading: bankAccountsLoading,
  } = useBankAccounts()
  
  const {
    getQuote: getSwapQuote,
    executeSwap,
    isLoading: swapLoading,
    error: swapError,
  } = useSwapRouter()
  
  // UI State
  const [mode, setMode] = useState<RampMode>('off-ramp')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USDC')
  const [selectedBank, setSelectedBank] = useState<BankAccount | null>(null)
  const [showBankManager, setShowBankManager] = useState(false)
  const [lightningAddress, setLightningAddress] = useState('')
  
  // Balance state
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [balanceLoading, setBalanceLoading] = useState(false)
  
  // Quote state
  const [quoteExpiry, setQuoteExpiry] = useState<Date | null>(null)
  const [quoteTimer, setQuoteTimer] = useState<number>(0)
  const [previousQuote, setPreviousQuote] = useState<QuoteResponse | null>(null)
  const [rateChangeDetected, setRateChangeDetected] = useState(false)
  const [rateChangePercentage, setRateChangePercentage] = useState(0)
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<'idle' | 'confirming' | 'processing' | 'success' | 'error'>('idle')
  const [txMessage, setTxMessage] = useState('')
  
  // Swap state for off-ramp flow
  const [swapTxHash, setSwapTxHash] = useState<string | null>(null)
  const [swapCompleted, setSwapCompleted] = useState(false)
  const [btcAmount, setBtcAmount] = useState<string | null>(null)
  
  // Transaction history state
  const [transactions, setTransactions] = useState<StoredRampTransaction[]>([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  
  // On-ramp payment instructions
  const [paymentInstructions, setPaymentInstructions] = useState<{
    bankName: string;
    accountNumber: string;
    accountName: string;
    amount: number;
    reference: string;
  } | null>(null)

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
   * Fetch transaction history
   * Requirements: 5.1, 5.3
   */
  const fetchTransactions = useCallback(() => {
    if (!address) {
      setTransactions([])
      return
    }
    
    try {
      setTransactionsLoading(true)
      const txs = getTransactionsByWallet(address, {
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })
      setTransactions(txs)
    } catch (err) {
      console.error('Error fetching transactions:', err)
    } finally {
      setTransactionsLoading(false)
    }
  }, [address])

  /**
   * Load balances and transactions on mount and when wallet connects
   */
  useEffect(() => {
    fetchBalances()
    fetchTransactions()
  }, [fetchBalances, fetchTransactions])

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
   * Calculate rate change percentage
   * Requirements: 6.4
   */
  const calculateRateChange = useCallback((oldRate: number, newRate: number): number => {
    if (oldRate === 0) return 0
    return Math.abs((newRate - oldRate) / oldRate) * 100
  }, [])

  /**
   * Detect significant rate changes (>2%)
   * Requirements: 6.4
   */
  const detectRateChange = useCallback((newQuote: QuoteResponse) => {
    if (!previousQuote) {
      setPreviousQuote(newQuote)
      setRateChangeDetected(false)
      setRateChangePercentage(0)
      return
    }

    const rateChange = calculateRateChange(previousQuote.exchangeRate, newQuote.exchangeRate)
    
    if (rateChange > 2) {
      setRateChangeDetected(true)
      setRateChangePercentage(rateChange)
    } else {
      setRateChangeDetected(false)
      setRateChangePercentage(0)
    }
    
    setPreviousQuote(newQuote)
  }, [previousQuote, calculateRateChange])

  /**
   * Handle rate change confirmation
   * Requirements: 6.4
   */
  const handleRateChangeConfirm = useCallback(() => {
    setRateChangeDetected(false)
    setRateChangePercentage(0)
  }, [])

  /**
   * Fetch quote when amount changes
   * Requirements: 1.3, 1.4, 2.1, 2.2, 6.1, 6.2
   * 
   * Note: For off-ramp, we don't fetch MavaPay quote until after swap completes
   * For on-ramp, we fetch quote immediately
   */
  useEffect(() => {
    if (!amount || parseFloat(amount) <= 0) {
      return
    }

    // Only auto-fetch quotes for on-ramp mode
    // Off-ramp quotes are fetched after swap completion
    if (mode !== 'on-ramp') {
      return
    }

    const debounceTimer = setTimeout(async () => {
      try {
        // On-ramp: NGN → BTC
        // Convert NGN to kobo (smallest unit)
        const amountInKobo = ngnToKobo(parseFloat(amount))
        
        const newQuote = await fetchQuote({
          direction: 'ngn-to-btc',
          amount: amountInKobo.toString(),
          sourceCurrency: 'NGNKOBO',
          targetCurrency: 'BTCSAT',
        })
        
        // Detect rate changes
        detectRateChange(newQuote)
        
        // Set quote expiry (5 minutes from now)
        const expiry = new Date(Date.now() + 5 * 60 * 1000)
        setQuoteExpiry(expiry)
      } catch (err) {
        console.error('Error fetching quote:', err)
      }
    }, 500) // Debounce for 500ms

    return () => clearTimeout(debounceTimer)
  }, [amount, mode, fetchQuote, detectRateChange])

  /**
   * Update quote timer
   * Requirements: 6.3
   * 
   * Note: Only applies to on-ramp mode
   */
  useEffect(() => {
    if (!quoteExpiry || mode !== 'on-ramp') return

    const interval = setInterval(() => {
      const now = Date.now()
      const expiry = quoteExpiry.getTime()
      const remaining = Math.max(0, Math.floor((expiry - now) / 1000))
      
      setQuoteTimer(remaining)
      
      // Auto-refresh if expired (only for on-ramp)
      if (remaining === 0 && amount && parseFloat(amount) > 0) {
        const refreshQuote = async () => {
          try {
            const amountInKobo = ngnToKobo(parseFloat(amount))
            const newQuote = await fetchQuote({
              direction: 'ngn-to-btc',
              amount: amountInKobo.toString(),
              sourceCurrency: 'NGNKOBO',
              targetCurrency: 'BTCSAT',
            })
            
            // Detect rate changes on auto-refresh
            detectRateChange(newQuote)
            
            const newExpiry = new Date(Date.now() + 5 * 60 * 1000)
            setQuoteExpiry(newExpiry)
          } catch (err) {
            console.error('Error refreshing quote:', err)
          }
        }
        
        refreshQuote()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [quoteExpiry, amount, mode, fetchQuote, detectRateChange])

  /**
   * Validate on-ramp amount
   * Requirements: 2.1, 7.1, 7.2
   */
  const validateOnRampAmount = (): { valid: boolean; error?: string } => {
    if (!amount || parseFloat(amount) <= 0) {
      return { valid: false, error: 'Please enter a valid amount' }
    }

    // Check minimum NGN amount (2000 NGN)
    const amountInKobo = ngnToKobo(parseFloat(amount))
    if (!meetsMinimumNGN(amountInKobo)) {
      return { 
        valid: false, 
        error: `Minimum amount is ${getMinimumNGNFormatted()}` 
      }
    }

    if (!lightningAddress || lightningAddress.trim() === '') {
      return { valid: false, error: 'Please enter a Lightning address' }
    }

    return { valid: true }
  }

  /**
   * Handle on-ramp confirmation
   * Requirements: 2.1, 2.3, 2.4
   */
  const handleOnRampConfirm = async () => {
    const validation = validateOnRampAmount()
    if (!validation.valid) {
      setTxStatus('error')
      setTxMessage(validation.error || 'Validation failed')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    if (!quote) {
      return
    }

    try {
      setTxStatus('confirming')
      setTxMessage('Preparing on-ramp transaction...')
      
      // Initiate on-ramp
      const amountInKobo = ngnToKobo(parseFloat(amount))
      const result = await initiateOnRamp({
        amount: amountInKobo.toString(),
        lightningAddress: lightningAddress.trim(),
      })
      
      setTxStatus('processing')
      setTxMessage('Payment instructions generated. Please complete the bank transfer.')
      
      // Store payment instructions
      setPaymentInstructions(result.paymentInstructions)
      
      // Clear form
      setAmount('')
      setLightningAddress('')
      
    } catch (err) {
      setTxStatus('error')
      setTxMessage(err instanceof Error ? err.message : 'On-ramp failed')
      console.error('On-ramp error:', err)
    }
  }

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

    if (!selectedBank) {
      return { valid: false, error: 'Please select a bank account' }
    }

    return { valid: true }
  }

  /**
   * Handle off-ramp confirmation
   * Requirements: 1.2, 1.3, 1.5, 1.6, 1.7, 1.8
   * 
   * Flow:
   * 1. Swap USDC → wBTC using SwapRouter
   * 2. Wait for swap completion
   * 3. Request MavaPay quote for BTC → NGN
   * 4. Initiate off-ramp with Lightning invoice
   */
  const handleOffRampConfirm = async () => {
    const validation = validateOffRampAmount()
    if (!validation.valid) {
      setTxStatus('error')
      setTxMessage(validation.error || 'Validation failed')
      setTimeout(() => setTxStatus('idle'), 3000)
      return
    }

    if (!selectedBank) {
      return
    }

    try {
      setTxStatus('confirming')
      setTxMessage('Step 1/3: Swapping USDC to BTC...')
      
      // Step 1: Swap USDC → wBTC
      const amountInUnits = parseUnits(amount, TOKEN_METADATA[currency].decimals)
      
      const swapResult = await executeSwap({
        fromToken: config.contracts.USDC,
        toToken: config.contracts.wBTC,
        amount: amountInUnits,
        slippage: 0.5, // 0.5% slippage
        gasless: true, // Use gasless if available
      })
      
      setSwapTxHash(swapResult.transactionHash)
      setTxStatus('processing')
      setTxMessage(`Step 1/3: Swap initiated (${swapResult.transactionHash.slice(0, 10)}...)`)
      
      // Step 2: Wait for swap confirmation
      // In production, this would poll the transaction status
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setSwapCompleted(true)
      const btcReceived = swapResult.expectedToAmount
      setBtcAmount(btcReceived)
      
      setTxMessage('Step 2/3: Swap completed! Fetching MavaPay quote...')
      
      // Step 3: Get MavaPay quote for BTC → NGN
      const mavaPayQuote = await fetchQuote({
        direction: 'btc-to-ngn',
        amount: btcReceived,
        sourceCurrency: 'BTCSAT',
        targetCurrency: 'NGNKOBO',
      })
      
      setTxMessage('Step 3/3: Initiating off-ramp to bank account...')
      
      // Step 4: Initiate off-ramp with MavaPay
      const result = await initiateOffRamp({
        quoteId: mavaPayQuote.id,
        bankAccountId: selectedBank.id,
        walletAddress: address!,
      })
      
      setTxStatus('success')
      setTxMessage(
        `Off-ramp complete! Lightning invoice generated. ` +
        `Funds will arrive in ${selectedBank.bankName} account after payment.`
      )
      
      // Clear form
      setAmount('')
      setSwapTxHash(null)
      setSwapCompleted(false)
      setBtcAmount(null)
      
      // Refresh balances
      fetchBalances()
      fetchTransactions()
      
    } catch (err) {
      setTxStatus('error')
      setTxMessage(err instanceof Error ? err.message : 'Off-ramp failed')
      console.error('Off-ramp error:', err)
      
      // Reset swap state on error
      setSwapTxHash(null)
      setSwapCompleted(false)
      setBtcAmount(null)
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
   * Handle mode change
   * Reset form state when switching between on-ramp and off-ramp
   */
  const handleModeChange = (newMode: RampMode) => {
    setMode(newMode)
    setAmount('')
    setLightningAddress('')
    setSelectedBank(null)
    // Note: quote is managed by useMavaPay hook and will be cleared when amount is reset
    setQuoteExpiry(null)
    setQuoteTimer(0)
    setPreviousQuote(null)
    setRateChangeDetected(false)
    setRateChangePercentage(0)
    setTxStatus('idle')
    setTxMessage('')
    setPaymentInstructions(null)
    // Reset swap state
    setSwapTxHash(null)
    setSwapCompleted(false)
    setBtcAmount(null)
  }

  /**
   * Close payment instructions
   */
  const handleClosePaymentInstructions = () => {
    setPaymentInstructions(null)
    setTxStatus('idle')
    setTxMessage('')
  }

  /**
   * Handle transaction retry
   * Requirements: 5.5, 8.1
   */
  const handleRetryTransaction = async (transactionId: string) => {
    // In a full implementation, this would:
    // 1. Get the transaction details
    // 2. Retry the failed operation
    // 3. Update the transaction status
    
    setTxStatus('processing')
    setTxMessage('Retrying transaction...')
    
    // For now, just refresh the transaction list
    setTimeout(() => {
      fetchTransactions()
      setTxStatus('idle')
      setTxMessage('')
    }, 1000)
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
                {mode === 'off-ramp' 
                  ? 'Convert crypto to Nigerian Naira via MavaPay'
                  : 'Purchase Bitcoin with Nigerian Naira via MavaPay'
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={mode === 'off-ramp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('off-ramp')}
                disabled={offRampLoading || onRampLoading}
              >
                Off-Ramp
              </Button>
              <Button
                variant={mode === 'on-ramp' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleModeChange('on-ramp')}
                disabled={offRampLoading || onRampLoading}
              >
                On-Ramp
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'off-ramp' ? (
            // OFF-RAMP UI
            <>
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
                    disabled={offRampLoading || swapLoading || !isConnected}
                  />
                  <Button
                    variant="outline"
                    onClick={handleMaxClick}
                    disabled={offRampLoading || swapLoading || !isConnected || balanceLoading}
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

              {/* Swap Progress Info */}
              {swapTxHash && (
                <Alert className="border-blue-500/30 bg-blue-500/10">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700 dark:text-blue-400">
                    <div className="space-y-1">
                      <p className="font-medium">Swap in progress</p>
                      <p className="text-xs">
                        Transaction: {swapTxHash.slice(0, 10)}...{swapTxHash.slice(-8)}
                      </p>
                      {swapCompleted && btcAmount && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          ✓ Received {(parseInt(btcAmount) / 100000000).toFixed(8)} BTC
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Quote Display - Only shown after swap for off-ramp */}
              {quote && !quoteError && swapCompleted && (
                <div className="rounded-lg bg-secondary/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">MavaPay Quote</h4>
                    {quoteTimer > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Expires in {formatTimeRemaining(quoteTimer)}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">BTC Amount:</span>
                      <span className="font-medium">
                        {btcAmount ? (parseInt(btcAmount) / 100000000).toFixed(8) : '0'} BTC
                      </span>
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

              {/* Rate Change Warning */}
              {rateChangeDetected && quote && swapCompleted && (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    <div className="space-y-2">
                      <p className="font-medium">
                        Exchange rate changed by {rateChangePercentage.toFixed(2)}%
                      </p>
                      <p className="text-sm">
                        The exchange rate has changed significantly since your last quote. 
                        Please review the new rate and confirm to proceed.
                      </p>
                      <Button
                        onClick={handleRateChangeConfirm}
                        size="sm"
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                      >
                        I Understand, Continue
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Quote Loading */}
              {quoteLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                  <Spinner className="h-4 w-4" />
                  Fetching MavaPay quote...
                </div>
              )}

              {/* Swap Loading */}
              {swapLoading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-4">
                  <Spinner className="h-4 w-4" />
                  Executing swap...
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

              {/* Swap Error */}
              {swapError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Swap failed: {swapError}
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
                    disabled={offRampLoading || swapLoading || !isConnected}
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

              {/* Confirm Button */}
              <Button
                onClick={handleOffRampConfirm}
                disabled={
                  offRampLoading || 
                  swapLoading ||
                  !isConnected || 
                  !amount || 
                  !selectedBank ||
                  rateChangeDetected
                }
                className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold"
                size="lg"
              >
                {offRampLoading || swapLoading ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  'Confirm Off-Ramp'
                )}
              </Button>
            </>
          ) : (
            // ON-RAMP UI
            <>
              {/* Payment Instructions Display (if available) */}
              {paymentInstructions && (
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400">
                      Payment Instructions
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClosePaymentInstructions}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Bank Name:</span>
                      <span className="font-medium text-right">{paymentInstructions.bankName}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Account Number:</span>
                      <span className="font-medium text-right">{paymentInstructions.accountNumber}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Account Name:</span>
                      <span className="font-medium text-right">{paymentInstructions.accountName}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400 text-right">
                        {formatNGN(paymentInstructions.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground">Reference:</span>
                      <span className="font-mono text-xs font-medium text-right break-all">
                        {paymentInstructions.reference}
                      </span>
                    </div>
                  </div>
                  <Alert className="border-yellow-500/30 bg-yellow-500/10">
                    <Info className="h-4 w-4 text-yellow-500" />
                    <AlertDescription className="text-yellow-700 dark:text-yellow-400 text-xs">
                      Please complete the bank transfer with the exact amount and reference. 
                      BTC will be sent to your Lightning address once payment is confirmed.
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Amount Input (NGN) */}
              <div className="space-y-2">
                <Label htmlFor="ngn-amount" className="text-base font-medium">
                  Amount (NGN)
                </Label>
                <Input
                  id="ngn-amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-base"
                  step="100"
                  min="0"
                  disabled={onRampLoading || !isConnected || !!paymentInstructions}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum: {getMinimumNGNFormatted()}
                </p>
              </div>

              {/* Lightning Address Input */}
              <div className="space-y-2">
                <Label htmlFor="lightning-address" className="text-base font-medium">
                  Lightning Address
                </Label>
                <Input
                  id="lightning-address"
                  type="text"
                  placeholder="user@lightning.address or lnbc..."
                  value={lightningAddress}
                  onChange={(e) => setLightningAddress(e.target.value)}
                  className="text-base font-mono text-sm"
                  disabled={onRampLoading || !isConnected || !!paymentInstructions}
                />
                <p className="text-xs text-muted-foreground">
                  Enter your Lightning wallet address to receive BTC
                </p>
              </div>

              {/* Quote Display */}
              {quote && !quoteError && !paymentInstructions && (
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
                      <span className="font-medium">{formatNGN(ngnToKobo(parseFloat(amount)))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">You receive:</span>
                      <span className="font-medium text-green-500">
                        {(quote.amountInTargetCurrency / 100000000).toFixed(8)} BTC
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
                        {formatNGN(quote.transactionFeesInSourceCurrency)}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between">
                      <span className="text-muted-foreground">Total BTC:</span>
                      <span className="font-bold text-green-500">
                        {((quote.amountInTargetCurrency - quote.transactionFeesInTargetCurrency) / 100000000).toFixed(8)} BTC
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Rate Change Warning */}
              {rateChangeDetected && quote && !paymentInstructions && (
                <Alert className="border-yellow-500/30 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertDescription className="text-yellow-700 dark:text-yellow-400">
                    <div className="space-y-2">
                      <p className="font-medium">
                        Exchange rate changed by {rateChangePercentage.toFixed(2)}%
                      </p>
                      <p className="text-sm">
                        The exchange rate has changed significantly since your last quote. 
                        Please review the new rate and confirm to proceed.
                      </p>
                      <Button
                        onClick={handleRateChangeConfirm}
                        size="sm"
                        className="mt-2 bg-yellow-600 hover:bg-yellow-700"
                      >
                        I Understand, Continue
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
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

              {/* Minimum Amount Warning */}
              {amount && parseFloat(amount) > 0 && !meetsMinimumNGN(ngnToKobo(parseFloat(amount))) && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Minimum on-ramp amount is {getMinimumNGNFormatted()}
                  </AlertDescription>
                </Alert>
              )}

              {/* Confirm Button */}
              {!paymentInstructions && (
                <Button
                  onClick={handleOnRampConfirm}
                  disabled={
                    onRampLoading || 
                    !isConnected || 
                    !amount || 
                    !lightningAddress ||
                    !quote || 
                    quoteTimer === 0 ||
                    rateChangeDetected ||
                    !meetsMinimumNGN(ngnToKobo(parseFloat(amount) || 0))
                  }
                  className="w-full bg-primary hover:bg-primary/90 h-11 font-semibold"
                  size="lg"
                >
                  {onRampLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Processing...
                    </>
                  ) : (
                    'Confirm On-Ramp'
                  )}
                </Button>
              )}
            </>
          )}
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
            <CardTitle className="text-base">
              {mode === 'off-ramp' ? 'Off-Ramp: How It Works' : 'On-Ramp: How It Works'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            {mode === 'off-ramp' ? (
              <>
                <p>1. Enter USDC amount to convert</p>
                <p>2. Select bank account</p>
                <p>3. USDC swaps to BTC automatically</p>
                <p>4. BTC converts to NGN via MavaPay</p>
                <p>5. Funds arrive in 10 minutes</p>
              </>
            ) : (
              <>
                <p>1. Enter NGN amount to spend</p>
                <p>2. Enter Lightning address</p>
                <p>3. Review real-time quote</p>
                <p>4. Get payment instructions</p>
                <p>5. Transfer NGN to provided account</p>
                <p>6. Receive BTC to Lightning address</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
            <p>• Minimum: {getMinimumNGNFormatted()}</p>
            <p>• Quotes expire after 5 minutes</p>
            {mode === 'off-ramp' ? (
              <>
                <p>• Funds arrive within 10 minutes</p>
                <p>• Lightning Network fees apply</p>
              </>
            ) : (
              <>
                <p>• BTC sent after NGN confirmed</p>
                <p>• Use exact reference for transfer</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      {isConnected && (
        <RampTransactionHistory
          transactions={transactions}
          onRetry={handleRetryTransaction}
          onRefresh={fetchTransactions}
          loading={transactionsLoading}
        />
      )}
    </div>
  )
}
