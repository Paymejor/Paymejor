/**
 * Error handling utilities
 * 
 * Provides user-friendly error messages and error recovery logic
 * Requirements: TR-4.25, TR-4.31, TR-4.32, NFR-5.7, NFR-5.8
 */

/**
 * Error types for different failure scenarios
 */
export enum ErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_COLLATERAL = 'INSUFFICIENT_COLLATERAL',
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  TRANSACTION_REJECTED = 'TRANSACTION_REJECTED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  CONTRACT_ERROR = 'CONTRACT_ERROR',
  BRIDGE_PENDING = 'BRIDGE_PENDING',
  BRIDGE_FAILED = 'BRIDGE_FAILED',
  APPROVAL_FAILED = 'APPROVAL_FAILED',
  SLIPPAGE_EXCEEDED = 'SLIPPAGE_EXCEEDED',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured error with type and context
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message)
    this.name = 'AppError'
  }
}

/**
 * Error message mappings for user-friendly display
 */
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.WALLET_NOT_CONNECTED]: 'Please connect your wallet to continue',
  [ErrorType.INSUFFICIENT_BALANCE]: 'Insufficient balance for this transaction',
  [ErrorType.INSUFFICIENT_COLLATERAL]: 'Insufficient collateral. Add more collateral to borrow',
  [ErrorType.TRANSACTION_FAILED]: 'Transaction failed. Please try again',
  [ErrorType.TRANSACTION_REJECTED]: 'Transaction was rejected. Please try again',
  [ErrorType.NETWORK_ERROR]: 'Network error. Please check your connection',
  [ErrorType.CONTRACT_ERROR]: 'Smart contract error. Please try again',
  [ErrorType.BRIDGE_PENDING]: 'Bridge transaction is still pending. Please wait',
  [ErrorType.BRIDGE_FAILED]: 'Bridge transaction failed. Please try again',
  [ErrorType.APPROVAL_FAILED]: 'Token approval failed. Please try again',
  [ErrorType.SLIPPAGE_EXCEEDED]: 'Price slippage exceeded tolerance. Please try again',
  [ErrorType.INVALID_AMOUNT]: 'Invalid amount. Please enter a valid number',
  [ErrorType.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment',
  [ErrorType.TIMEOUT]: 'Request timed out. Please try again',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again',
}

/**
 * Error recovery suggestions
 */
const ERROR_SUGGESTIONS: Partial<Record<ErrorType, string[]>> = {
  [ErrorType.WALLET_NOT_CONNECTED]: [
    'Click "Connect Wallet" in the navigation bar',
    'Make sure your wallet extension is installed and unlocked',
  ],
  [ErrorType.INSUFFICIENT_BALANCE]: [
    'Check your wallet balance',
    'Bridge more tokens to Starknet',
    'Try a smaller amount',
  ],
  [ErrorType.INSUFFICIENT_COLLATERAL]: [
    'Deposit more collateral in the Deposit tab',
    'Reduce your borrow amount',
    'Check your current LTV ratio',
  ],
  [ErrorType.TRANSACTION_FAILED]: [
    'Check your wallet for pending transactions',
    'Ensure you have enough ETH for gas fees',
    'Try increasing the gas limit',
  ],
  [ErrorType.NETWORK_ERROR]: [
    'Check your internet connection',
    'Try refreshing the page',
    'Switch to a different RPC endpoint',
  ],
  [ErrorType.SLIPPAGE_EXCEEDED]: [
    'Increase slippage tolerance',
    'Try a smaller trade amount',
    'Wait for better market conditions',
  ],
}

/**
 * Parse error from various sources and convert to AppError
 */
export function parseError(error: unknown): AppError {
  // Already an AppError
  if (error instanceof AppError) {
    return error
  }
  
  // Standard Error
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    // Wallet errors
    if (message.includes('wallet not connected') || message.includes('no account')) {
      return new AppError(ErrorType.WALLET_NOT_CONNECTED, ERROR_MESSAGES[ErrorType.WALLET_NOT_CONNECTED], error)
    }
    
    // Balance errors
    if (message.includes('insufficient balance') || message.includes('insufficient funds')) {
      return new AppError(ErrorType.INSUFFICIENT_BALANCE, ERROR_MESSAGES[ErrorType.INSUFFICIENT_BALANCE], error)
    }
    
    // Collateral errors
    if (message.includes('insufficient collateral') || message.includes('ltv too high')) {
      return new AppError(ErrorType.INSUFFICIENT_COLLATERAL, ERROR_MESSAGES[ErrorType.INSUFFICIENT_COLLATERAL], error)
    }
    
    // Transaction errors
    if (message.includes('transaction failed') || message.includes('execution reverted')) {
      return new AppError(ErrorType.TRANSACTION_FAILED, ERROR_MESSAGES[ErrorType.TRANSACTION_FAILED], error)
    }
    
    if (message.includes('user rejected') || message.includes('user denied')) {
      return new AppError(ErrorType.TRANSACTION_REJECTED, ERROR_MESSAGES[ErrorType.TRANSACTION_REJECTED], error)
    }
    
    // Network errors
    if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
      return new AppError(ErrorType.NETWORK_ERROR, ERROR_MESSAGES[ErrorType.NETWORK_ERROR], error)
    }
    
    // Bridge errors
    if (message.includes('bridge pending')) {
      return new AppError(ErrorType.BRIDGE_PENDING, ERROR_MESSAGES[ErrorType.BRIDGE_PENDING], error)
    }
    
    if (message.includes('bridge failed')) {
      return new AppError(ErrorType.BRIDGE_FAILED, ERROR_MESSAGES[ErrorType.BRIDGE_FAILED], error)
    }
    
    // Approval errors
    if (message.includes('approval failed') || message.includes('approve')) {
      return new AppError(ErrorType.APPROVAL_FAILED, ERROR_MESSAGES[ErrorType.APPROVAL_FAILED], error)
    }
    
    // Slippage errors
    if (message.includes('slippage') || message.includes('price impact')) {
      return new AppError(ErrorType.SLIPPAGE_EXCEEDED, ERROR_MESSAGES[ErrorType.SLIPPAGE_EXCEEDED], error)
    }
    
    // Timeout errors
    if (message.includes('timeout') || message.includes('timed out')) {
      return new AppError(ErrorType.TIMEOUT, ERROR_MESSAGES[ErrorType.TIMEOUT], error)
    }
    
    // Rate limit errors
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return new AppError(ErrorType.RATE_LIMIT_EXCEEDED, ERROR_MESSAGES[ErrorType.RATE_LIMIT_EXCEEDED], error)
    }
    
    // Default to unknown
    return new AppError(ErrorType.UNKNOWN, error.message || ERROR_MESSAGES[ErrorType.UNKNOWN], error)
  }
  
  // String error
  if (typeof error === 'string') {
    return parseError(new Error(error))
  }
  
  // Unknown error type
  return new AppError(ErrorType.UNKNOWN, ERROR_MESSAGES[ErrorType.UNKNOWN])
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  const appError = parseError(error)
  return appError.message
}

/**
 * Get error recovery suggestions
 */
export function getErrorSuggestions(error: unknown): string[] {
  const appError = parseError(error)
  return ERROR_SUGGESTIONS[appError.type] || []
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const appError = parseError(error)
  
  const retryableTypes = [
    ErrorType.NETWORK_ERROR,
    ErrorType.TIMEOUT,
    ErrorType.RATE_LIMIT_EXCEEDED,
    ErrorType.TRANSACTION_FAILED,
  ]
  
  return retryableTypes.includes(appError.type)
}

/**
 * Get retry delay for error (in ms)
 */
export function getRetryDelay(error: unknown, attemptNumber: number): number {
  const appError = parseError(error)
  
  // Base delays by error type
  const baseDelays: Partial<Record<ErrorType, number>> = {
    [ErrorType.RATE_LIMIT_EXCEEDED]: 5000,
    [ErrorType.NETWORK_ERROR]: 2000,
    [ErrorType.TIMEOUT]: 3000,
    [ErrorType.TRANSACTION_FAILED]: 2000,
  }
  
  const baseDelay = baseDelays[appError.type] || 2000
  
  // Exponential backoff
  return baseDelay * Math.pow(2, attemptNumber - 1)
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: unknown): string {
  const appError = parseError(error)
  
  const parts = [
    `[${appError.type}]`,
    appError.message,
  ]
  
  if (appError.context) {
    parts.push(`Context: ${JSON.stringify(appError.context)}`)
  }
  
  if (appError.originalError) {
    parts.push(`Original: ${appError.originalError.message}`)
    if (appError.originalError.stack) {
      parts.push(`Stack: ${appError.originalError.stack}`)
    }
  }
  
  return parts.join(' | ')
}

/**
 * Validate transaction amount
 */
export function validateAmount(amount: string, balance: string, decimals: number = 18): AppError | null {
  // Check if amount is a valid number
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return new AppError(
      ErrorType.INVALID_AMOUNT,
      'Please enter a valid amount greater than 0',
      undefined,
      { amount }
    )
  }
  
  // Check if amount exceeds balance
  const amountBigInt = BigInt(Math.floor(Number(amount) * Math.pow(10, decimals)))
  const balanceBigInt = BigInt(balance)
  
  if (amountBigInt > balanceBigInt) {
    return new AppError(
      ErrorType.INSUFFICIENT_BALANCE,
      ERROR_MESSAGES[ErrorType.INSUFFICIENT_BALANCE],
      undefined,
      { amount, balance, decimals }
    )
  }
  
  return null
}

/**
 * Validate network match
 */
export function validateNetwork(
  expectedNetwork: 'sepolia' | 'mainnet',
  actualNetwork: 'sepolia' | 'mainnet'
): AppError | null {
  if (expectedNetwork !== actualNetwork) {
    return new AppError(
      ErrorType.NETWORK_ERROR,
      `Please switch to ${expectedNetwork} network`,
      undefined,
      { expectedNetwork, actualNetwork }
    )
  }
  
  return null
}
