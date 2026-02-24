'use client'

import { useState, useCallback } from 'react'
import {
  parseError,
  getErrorMessage,
  getErrorSuggestions,
  isRetryableError,
  getRetryDelay,
  AppError,
  ErrorType,
  validateAmount,
  validateNetwork,
} from '@/lib/error-handling'

/**
 * useErrorHandler Hook
 * 
 * Provides comprehensive error handling with:
 * - User-friendly error messages
 * - Automatic retry logic
 * - Error recovery suggestions
 * - Error logging
 * 
 * Requirements: TR-4.25, TR-4.31, NFR-5.7, NFR-5.8
 */

interface UseErrorHandlerReturn {
  error: AppError | null
  setError: (error: unknown) => void
  clearError: () => void
  handleError: (error: unknown) => void
  retryWithBackoff: <T>(
    fn: () => Promise<T>,
    maxRetries?: number
  ) => Promise<T>
  validateAndExecute: <T>(
    validations: (() => AppError | null)[],
    fn: () => Promise<T>
  ) => Promise<T>
  errorMessage: string | null
  errorSuggestions: string[]
  canRetry: boolean
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [error, setErrorState] = useState<AppError | null>(null)

  /**
   * Set error with parsing
   */
  const setError = useCallback((err: unknown) => {
    const appError = parseError(err)
    setErrorState(appError)
    
    // Log error for debugging
    console.error('[ErrorHandler]', {
      type: appError.type,
      message: appError.message,
      context: appError.context,
      originalError: appError.originalError,
    })
  }, [])

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  /**
   * Handle error with automatic parsing and logging
   */
  const handleError = useCallback((err: unknown) => {
    setError(err)
  }, [setError])

  /**
   * Retry a function with exponential backoff
   */
  const retryWithBackoff = useCallback(async <T,>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> => {
    let lastError: unknown
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        clearError()
        return await fn()
      } catch (err) {
        lastError = err
        
        // Check if error is retryable
        if (!isRetryableError(err)) {
          throw err
        }
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw err
        }
        
        // Calculate delay and wait
        const delay = getRetryDelay(err, attempt)
        console.log(`[ErrorHandler] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
    
    throw lastError
  }, [clearError])

  /**
   * Validate inputs before executing a function
   */
  const validateAndExecute = useCallback(async <T,>(
    validations: (() => AppError | null)[],
    fn: () => Promise<T>
  ): Promise<T> => {
    // Run all validations
    for (const validation of validations) {
      const validationError = validation()
      if (validationError) {
        setError(validationError)
        throw validationError
      }
    }
    
    // Clear any previous errors
    clearError()
    
    // Execute function
    try {
      return await fn()
    } catch (err) {
      setError(err)
      throw err
    }
  }, [setError, clearError])

  // Computed properties
  const errorMessage = error ? getErrorMessage(error) : null
  const errorSuggestions = error ? getErrorSuggestions(error) : []
  const canRetry = error ? isRetryableError(error) : false

  return {
    error,
    setError,
    clearError,
    handleError,
    retryWithBackoff,
    validateAndExecute,
    errorMessage,
    errorSuggestions,
    canRetry,
  }
}

/**
 * Validation helper functions
 */

export function createAmountValidator(
  amount: string,
  balance: string,
  decimals: number = 18
) {
  return () => validateAmount(amount, balance, decimals)
}

export function createNetworkValidator(
  expectedNetwork: 'sepolia' | 'mainnet',
  actualNetwork: 'sepolia' | 'mainnet'
) {
  return () => validateNetwork(expectedNetwork, actualNetwork)
}

export function createWalletValidator(isConnected: boolean) {
  return () => {
    if (!isConnected) {
      return new AppError(
        ErrorType.WALLET_NOT_CONNECTED,
        'Please connect your wallet to continue'
      )
    }
    return null
  }
}

export function createBalanceValidator(
  balance: string,
  minBalance: string = '0'
) {
  return () => {
    if (BigInt(balance) < BigInt(minBalance)) {
      return new AppError(
        ErrorType.INSUFFICIENT_BALANCE,
        'Insufficient balance for this transaction'
      )
    }
    return null
  }
}

/**
 * MavaPay-specific validators (Requirements 7.1, 7.2, 7.3, 4.1)
 */

export function createMinimumAmountValidator(
  amountInKobo: number,
  minimumKobo: number = 200000 // 2000 NGN
) {
  return () => {
    if (amountInKobo < minimumKobo) {
      return new AppError(
        ErrorType.MINIMUM_AMOUNT_NOT_MET,
        ERROR_MESSAGES[ErrorType.MINIMUM_AMOUNT_NOT_MET],
        undefined,
        { amountInKobo, minimumKobo }
      )
    }
    return null
  }
}

export function createMaximumAmountValidator(
  amountInKobo: number,
  maximumKobo: number
) {
  return () => {
    if (amountInKobo > maximumKobo) {
      return new AppError(
        ErrorType.MAXIMUM_AMOUNT_EXCEEDED,
        ERROR_MESSAGES[ErrorType.MAXIMUM_AMOUNT_EXCEEDED],
        undefined,
        { amountInKobo, maximumKobo }
      )
    }
    return null
  }
}

export function createBankAccountValidator(
  accountNumber: string,
  bankName: string
) {
  return () => {
    // Validate account number is 10 digits (Requirement 4.1)
    if (!/^\d{10}$/.test(accountNumber)) {
      return new AppError(
        ErrorType.INVALID_BANK_ACCOUNT,
        'Bank account number must be exactly 10 digits',
        undefined,
        { accountNumber, bankName }
      )
    }
    return null
  }
}

export function createQuoteExpiryValidator(
  quoteExpiry: string
) {
  return () => {
    const expiryTime = new Date(quoteExpiry).getTime()
    const now = Date.now()
    
    if (now >= expiryTime) {
      return new AppError(
        ErrorType.QUOTE_EXPIRED,
        ERROR_MESSAGES[ErrorType.QUOTE_EXPIRED],
        undefined,
        { quoteExpiry, now: new Date(now).toISOString() }
      )
    }
    return null
  }
}
