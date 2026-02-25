'use client'

import { useState, useCallback, useMemo } from 'react'
import { useWallet } from '@/lib/wallet-context'
import { useNetwork } from './useNetwork'
import { useCache } from './useCache'
import { SecurityValidation } from '@/lib/security-validation'
import { trackTransaction, trackError } from '@/lib/monitoring'
import {
  QuoteRequest,
  QuoteResponse,
  PayoutRequest,
  PayoutInitiationResponse,
  OnRampRequest,
  OnRampResponse,
  RampTransaction,
  StoredRampTransaction,
  BankAccount,
  BankListResponse,
  BankVerificationRequest,
  BankVerificationResponse,
  ValidationError,
} from '@/types/mavapay'

/**
 * useMavaPay Hook
 * 
 * Provides MavaPay integration for BTC ↔ NGN on/off-ramp operations:
 * - Quote fetching with caching
 * - Off-ramp initiation (BTC → NGN)
 * - On-ramp initiation (NGN → BTC)
 * - Bank account management
 * - Transaction history
 * - Error handling and loading states
 * 
 * Requirements: 1.1-1.8, 2.1-2.7, 3.1-3.7, 4.1-4.6, 5.1-5.6
 */

interface UseMavaPayReturn {
  // Quote management
  fetchQuote: (params: QuoteRequest) => Promise<QuoteResponse>
  quote: QuoteResponse | null
  quoteLoading: boolean
  quoteError: Error | null
  
  // Off-ramp
  initiateOffRamp: (params: PayoutRequest) => Promise<PayoutInitiationResponse>
  offRampLoading: boolean
  offRampError: Error | null
  
  // On-ramp
  initiateOnRamp: (params: OnRampRequest) => Promise<OnRampResponse>
  onRampLoading: boolean
  onRampError: Error | null
  
  // Bank management
  banks: BankListResponse['banks']
  fetchBanks: () => Promise<void>
  verifyBank: (params: BankVerificationRequest) => Promise<BankVerificationResponse>
  
  // Transaction history
  transactions: RampTransaction[]
  fetchTransactions: () => Promise<void>
  getTransaction: (id: string) => RampTransaction | null
  
  // General state
  isLoading: boolean
  error: string | null
}

const TRANSACTIONS_STORAGE_KEY = 'mavapay_transactions'
const QUOTE_CACHE_TTL = 60000 // 1 minute (quotes expire after 5 minutes, but we refresh sooner)

export function useMavaPay(): UseMavaPayReturn {
  const { address, isConnected } = useWallet()
  const { network } = useNetwork()
  
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [quoteError, setQuoteError] = useState<Error | null>(null)
  
  const [offRampLoading, setOffRampLoading] = useState(false)
  const [offRampError, setOffRampError] = useState<Error | null>(null)
  
  const [onRampLoading, setOnRampLoading] = useState(false)
  const [onRampError, setOnRampError] = useState<Error | null>(null)
  
  const [banks, setBanks] = useState<BankListResponse['banks']>([])
  const [transactions, setTransactions] = useState<RampTransaction[]>([])
  const [error, setError] = useState<string | null>(null)

  /**
   * General loading state (any operation in progress)
   */
  const isLoading = useMemo(() => {
    return quoteLoading || offRampLoading || onRampLoading
  }, [quoteLoading, offRampLoading, onRampLoading])

  /**
   * Load transactions from localStorage
   */
  const loadTransactions = useCallback(() => {
    if (!address) return []
    
    try {
      const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
      if (!stored) return []
      
      const allTransactions: StoredRampTransaction[] = JSON.parse(stored)
      
      // Filter transactions for current wallet address
      const userTransactions = allTransactions
        .filter(tx => tx.walletAddress === address)
        .map(tx => ({
          id: tx.id,
          type: tx.type,
          status: tx.status,
          sourceAmount: tx.sourceAmount,
          sourceCurrency: tx.sourceCurrency,
          targetAmount: tx.targetAmount,
          targetCurrency: tx.targetCurrency,
          exchangeRate: tx.exchangeRate,
          fees: tx.totalFees,
          mavaPayOrderId: tx.mavaPayOrderId,
          mavaPayHash: tx.mavaPayHash,
          bankReference: tx.bankReference,
          createdAt: new Date(tx.createdAt),
          updatedAt: new Date(tx.updatedAt),
          estimatedCompletion: tx.expiresAt ? new Date(tx.expiresAt) : undefined,
          errorMessage: tx.errorMessage,
        }))
      
      return userTransactions
    } catch (err) {
      console.error('Error loading transactions:', err)
      return []
    }
  }, [address])

  /**
   * Save transaction to localStorage
   */
  const saveTransaction = useCallback((transaction: StoredRampTransaction) => {
    try {
      const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY)
      const allTransactions: StoredRampTransaction[] = stored ? JSON.parse(stored) : []
      
      // Check if transaction already exists
      const existingIndex = allTransactions.findIndex(tx => tx.id === transaction.id)
      
      if (existingIndex >= 0) {
        // Update existing transaction
        allTransactions[existingIndex] = transaction
      } else {
        // Add new transaction
        allTransactions.push(transaction)
      }
      
      localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(allTransactions))
      
      // Update state
      setTransactions(loadTransactions())
    } catch (err) {
      console.error('Error saving transaction:', err)
    }
  }, [loadTransactions])

  /**
   * Fetch quote from MavaPay API
   * Requirements: 1.3, 1.4, 2.1, 2.2, 3.3
   */
  const fetchQuote = useCallback(async (
    params: QuoteRequest
  ): Promise<QuoteResponse> => {
    try {
      setQuoteLoading(true)
      setQuoteError(null)
      setError(null)

      // Security validation: Validate amount
      const amountValidation = SecurityValidation.validateAmount({
        amount: params.amount,
        token: params.sourceCurrency === 'BTCSAT' ? 'wBTC' : 'USDC',
      })
      if (!amountValidation.valid) {
        throw new ValidationError('amount', amountValidation.error || 'Invalid amount')
      }

      // Call API route
      const response = await fetch('/api/ramp/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch quote: ${response.statusText}`)
      }

      const quoteData: QuoteResponse = await response.json()
      
      // Store quote in state
      setQuote(quoteData)
      
      return quoteData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quote'
      const error = new Error(errorMessage)
      setQuoteError(error)
      setError(errorMessage)
      console.error('Error fetching quote:', err)
      throw error
    } finally {
      setQuoteLoading(false)
    }
  }, [])

  /**
   * Initiate off-ramp transaction (BTC → NGN)
   * Requirements: 1.5, 1.6, 1.7, 3.4
   */
  const initiateOffRamp = useCallback(async (
    params: PayoutRequest
  ): Promise<PayoutInitiationResponse> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    const startTime = Date.now();

    try {
      setOffRampLoading(true)
      setOffRampError(null)
      setError(null)

      // Security validation: Validate wallet address
      const addressValidation = SecurityValidation.validateAddress(address)
      if (!addressValidation.valid) {
        throw new ValidationError('address', addressValidation.error || 'Invalid wallet address')
      }

      // Call API route
      const response = await fetch('/api/ramp/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to initiate off-ramp: ${response.statusText}`)
      }

      const payoutData: PayoutInitiationResponse = await response.json()
      
      // Create transaction record
      const transaction: StoredRampTransaction = {
        id: payoutData.transactionId,
        walletAddress: address,
        type: 'off-ramp',
        status: 'pending',
        sourceAmount: payoutData.amount.toString(),
        sourceCurrency: 'BTC',
        targetAmount: '0', // Will be updated when payout completes
        targetCurrency: 'NGN',
        exchangeRate: 0, // Will be updated from quote
        transactionFees: '0',
        networkFees: '0',
        totalFees: '0',
        mavaPayOrderId: payoutData.mavaPayOrderId,
        lightningInvoice: payoutData.invoice,
        bankAccountId: params.bankAccountId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: payoutData.expiresAt,
        retryCount: 0,
      }
      
      saveTransaction(transaction)

      // Track successful transaction initiation (Task 25)
      trackTransaction({
        transactionId: payoutData.transactionId,
        type: 'off-ramp',
        status: 'success',
        duration: Date.now() - startTime,
        amount: payoutData.amount.toString(),
        currency: 'BTC',
      });
      
      return payoutData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate off-ramp'
      const error = new Error(errorMessage)
      setOffRampError(error)
      setError(errorMessage)
      console.error('Error initiating off-ramp:', err)

      // Track failed transaction (Task 25)
      trackTransaction({
        transactionId: 'unknown',
        type: 'off-ramp',
        status: 'failed',
        duration: Date.now() - startTime,
        errorType: err instanceof ValidationError ? 'validation' : 'api',
        errorMessage,
      });
      trackError({
        type: err instanceof ValidationError ? 'validation' : 'api',
        message: errorMessage,
        endpoint: '/api/ramp/payout',
      });

      throw error
    } finally {
      setOffRampLoading(false)
    }
  }, [isConnected, address, saveTransaction])

  /**
   * Initiate on-ramp transaction (NGN → BTC)
   * Requirements: 2.1, 2.3
   */
  const initiateOnRamp = useCallback(async (
    params: OnRampRequest
  ): Promise<OnRampResponse> => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    const startTime = Date.now();

    try {
      setOnRampLoading(true)
      setOnRampError(null)
      setError(null)

      // Security validation: Validate amount
      const amountValidation = SecurityValidation.validateAmount({
        amount: params.amount,
        token: 'USDC', // Using USDC as proxy for NGN validation
      })
      if (!amountValidation.valid) {
        throw new ValidationError('amount', amountValidation.error || 'Invalid amount')
      }

      // Call API route
      const response = await fetch('/api/ramp/on-ramp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to initiate on-ramp: ${response.statusText}`)
      }

      const onRampData: OnRampResponse = await response.json()
      
      // Create transaction record
      const transaction: StoredRampTransaction = {
        id: onRampData.transactionId,
        walletAddress: address,
        type: 'on-ramp',
        status: 'pending',
        sourceAmount: params.amount,
        sourceCurrency: 'NGN',
        targetAmount: onRampData.btcAmount.toString(),
        targetCurrency: 'BTC',
        exchangeRate: onRampData.exchangeRate,
        transactionFees: '0',
        networkFees: '0',
        totalFees: '0',
        mavaPayOrderId: onRampData.mavaPayOrderId,
        bankReference: onRampData.paymentInstructions.reference,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: onRampData.expiresAt,
        retryCount: 0,
      }
      
      saveTransaction(transaction)

      // Track successful transaction initiation (Task 25)
      trackTransaction({
        transactionId: onRampData.transactionId,
        type: 'on-ramp',
        status: 'success',
        duration: Date.now() - startTime,
        amount: params.amount,
        currency: 'NGN',
      });
      
      return onRampData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initiate on-ramp'
      const error = new Error(errorMessage)
      setOnRampError(error)
      setError(errorMessage)
      console.error('Error initiating on-ramp:', err)

      // Track failed transaction (Task 25)
      trackTransaction({
        transactionId: 'unknown',
        type: 'on-ramp',
        status: 'failed',
        duration: Date.now() - startTime,
        errorType: err instanceof ValidationError ? 'validation' : 'api',
        errorMessage,
      });
      trackError({
        type: err instanceof ValidationError ? 'validation' : 'api',
        message: errorMessage,
        endpoint: '/api/ramp/on-ramp',
      });

      throw error
    } finally {
      setOnRampLoading(false)
    }
  }, [isConnected, address, saveTransaction])

  /**
   * Fetch list of supported Nigerian banks
   * Requirements: 4.1
   */
  const fetchBanks = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch('/api/ramp/banks?country=NG')

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to fetch banks: ${response.statusText}`)
      }

      const bankData: BankListResponse = await response.json()
      setBanks(bankData.banks)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch banks'
      setError(errorMessage)
      console.error('Error fetching banks:', err)
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * Verify Nigerian bank account
   * Requirements: 4.2
   */
  const verifyBank = useCallback(async (
    params: BankVerificationRequest
  ): Promise<BankVerificationResponse> => {
    try {
      setError(null)

      // Security validation: Validate account number format (10 digits)
      if (!/^\d{10}$/.test(params.accountNumber)) {
        throw new ValidationError(
          'accountNumber',
          'Account number must be exactly 10 digits',
          'Please enter a valid 10-digit Nigerian bank account number'
        )
      }

      const response = await fetch('/api/ramp/verify-bank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Failed to verify bank account: ${response.statusText}`)
      }

      const verificationData: BankVerificationResponse = await response.json()
      return verificationData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to verify bank account'
      setError(errorMessage)
      console.error('Error verifying bank account:', err)
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * Fetch transaction history for current user
   * Requirements: 5.1-5.6
   */
  const fetchTransactions = useCallback(async () => {
    try {
      setError(null)
      const userTransactions = loadTransactions()
      setTransactions(userTransactions)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transactions'
      setError(errorMessage)
      console.error('Error fetching transactions:', err)
    }
  }, [loadTransactions])

  /**
   * Get a specific transaction by ID
   * Requirements: 5.1
   */
  const getTransaction = useCallback((id: string): RampTransaction | null => {
    return transactions.find(tx => tx.id === id) || null
  }, [transactions])

  return {
    // Quote management
    fetchQuote,
    quote,
    quoteLoading,
    quoteError,
    
    // Off-ramp
    initiateOffRamp,
    offRampLoading,
    offRampError,
    
    // On-ramp
    initiateOnRamp,
    onRampLoading,
    onRampError,
    
    // Bank management
    banks,
    fetchBanks,
    verifyBank,
    
    // Transaction history
    transactions,
    fetchTransactions,
    getTransaction,
    
    // General state
    isLoading,
    error,
  }
}
