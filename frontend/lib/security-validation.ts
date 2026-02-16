/**
 * Security Validation Utilities
 * 
 * Provides comprehensive input validation, rate limiting, and security checks
 * for all user inputs and transactions.
 * 
 * Requirements: TR-4.29, TR-4.33, TR-4.35
 */

import { getNetworkConfig, SupportedNetwork, TOKEN_METADATA } from './constants'

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validate Starknet address format
 * Requirements: TR-4.29
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  if (!address) {
    return { valid: false, error: 'Address is required' }
  }

  if (typeof address !== 'string') {
    return { valid: false, error: 'Address must be a string' }
  }

  // Starknet addresses should start with 0x and be 66 characters (including 0x)
  if (!address.startsWith('0x')) {
    return { valid: false, error: 'Address must start with 0x' }
  }

  if (address.length !== 66) {
    return { valid: false, error: 'Address must be 66 characters long (including 0x)' }
  }

  // Check if it's a valid hex string
  const hexPattern = /^0x[0-9a-fA-F]{64}$/
  if (!hexPattern.test(address)) {
    return { valid: false, error: 'Address contains invalid characters' }
  }

  return { valid: true }
}

/**
 * Validate transaction amount
 * Requirements: TR-4.29, TR-4.33
 */
export interface AmountValidationParams {
  amount: string
  token: 'wBTC' | 'USDC'
  minAmount?: string
  maxAmount?: string
  balance?: string
}

export function validateAmount(params: AmountValidationParams): { valid: boolean; error?: string } {
  const { amount, token, minAmount, maxAmount, balance } = params

  // Check if amount is provided
  if (!amount || amount === '') {
    return { valid: false, error: 'Amount is required' }
  }

  // Check if amount is a valid number
  const amountNum = parseFloat(amount)
  if (isNaN(amountNum)) {
    return { valid: false, error: 'Amount must be a valid number' }
  }

  // Check if amount is positive
  if (amountNum <= 0) {
    return { valid: false, error: 'Amount must be greater than zero' }
  }

  // Check minimum amount
  if (minAmount) {
    const minAmountNum = parseFloat(minAmount)
    if (amountNum < minAmountNum) {
      return { valid: false, error: `Amount must be at least ${minAmount} ${token}` }
    }
  }

  // Check maximum amount
  if (maxAmount) {
    const maxAmountNum = parseFloat(maxAmount)
    if (amountNum > maxAmountNum) {
      return { valid: false, error: `Amount cannot exceed ${maxAmount} ${token}` }
    }
  }

  // Check against balance
  if (balance) {
    const balanceNum = parseFloat(balance)
    if (amountNum > balanceNum) {
      return { valid: false, error: `Insufficient balance. Available: ${balance} ${token}` }
    }
  }

  // Check decimal places
  const decimals = TOKEN_METADATA[token]?.decimals || 8
  const decimalParts = amount.split('.')
  if (decimalParts.length > 1 && decimalParts[1].length > decimals) {
    return { valid: false, error: `Amount cannot have more than ${decimals} decimal places` }
  }

  return { valid: true }
}

/**
 * Validate leverage multiplier
 * Requirements: TR-4.29
 */
export function validateLeverage(leverage: number): { valid: boolean; error?: string } {
  if (typeof leverage !== 'number' || isNaN(leverage)) {
    return { valid: false, error: 'Leverage must be a valid number' }
  }

  if (leverage < 1) {
    return { valid: false, error: 'Leverage must be at least 1x' }
  }

  if (leverage > 3) {
    return { valid: false, error: 'Leverage cannot exceed 3x' }
  }

  return { valid: true }
}

/**
 * Validate slippage tolerance
 * Requirements: TR-4.29
 */
export function validateSlippage(slippage: number): { valid: boolean; error?: string } {
  if (typeof slippage !== 'number' || isNaN(slippage)) {
    return { valid: false, error: 'Slippage must be a valid number' }
  }

  if (slippage < 0) {
    return { valid: false, error: 'Slippage cannot be negative' }
  }

  if (slippage > 50) {
    return { valid: false, error: 'Slippage cannot exceed 50%' }
  }

  // Warn if slippage is unusually high
  if (slippage > 5) {
    return { valid: true, error: 'Warning: Slippage is unusually high (>5%)' }
  }

  return { valid: true }
}

/**
 * Validate network selection
 * Requirements: TR-4.29
 */
export function validateNetwork(network: string): { valid: boolean; error?: string } {
  const supportedNetworks = ['sepolia', 'mainnet']
  
  if (!network) {
    return { valid: false, error: 'Network is required' }
  }

  if (!supportedNetworks.includes(network)) {
    return { valid: false, error: `Unsupported network: ${network}` }
  }

  return { valid: true }
}

// ============================================================================
// Contract Address Verification
// ============================================================================

/**
 * Verify contract address before transaction
 * Requirements: TR-4.35
 */
export function verifyContractAddress(
  address: string,
  expectedType: 'vesuPool' | 'tongoProtocol' | 'wBTC' | 'USDC',
  network: SupportedNetwork
): { valid: boolean; error?: string } {
  // First validate address format
  const addressValidation = validateAddress(address)
  if (!addressValidation.valid) {
    return addressValidation
  }

  // Get expected address from configuration
  const config = getNetworkConfig(network)
  const expectedAddress = config.contracts[expectedType]

  if (!expectedAddress) {
    return { valid: false, error: `${expectedType} contract not configured for ${network}` }
  }

  // Verify address matches expected
  if (address.toLowerCase() !== expectedAddress.toLowerCase()) {
    return { 
      valid: false, 
      error: `Contract address mismatch. Expected ${expectedType} address for ${network}` 
    }
  }

  return { valid: true }
}

/**
 * Verify all contract addresses are configured for a network
 * Requirements: TR-4.35
 */
export function verifyNetworkConfiguration(network: SupportedNetwork): { valid: boolean; error?: string } {
  const config = getNetworkConfig(network)

  const requiredContracts = ['vesuPool', 'tongoProtocol', 'wBTC', 'USDC'] as const

  for (const contract of requiredContracts) {
    const address = config.contracts[contract]
    if (!address || address === '') {
      return { 
        valid: false, 
        error: `${contract} contract address not configured for ${network}` 
      }
    }

    // Validate address format
    const validation = validateAddress(address)
    if (!validation.valid) {
      return { 
        valid: false, 
        error: `Invalid ${contract} address for ${network}: ${validation.error}` 
      }
    }
  }

  return { valid: true }
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Check if request is allowed
   * Requirements: TR-4.33
   */
  checkLimit(key: string): { allowed: boolean; error?: string; retryAfter?: number } {
    const now = Date.now()
    const entry = this.limits.get(key)

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      })
      return { allowed: true }
    }

    // Within window, check count
    if (entry.count < this.maxRequests) {
      entry.count++
      return { allowed: true }
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      allowed: false,
      error: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key)
  }

  /**
   * Clear all rate limits
   */
  clearAll(): void {
    this.limits.clear()
  }
}

// Global rate limiters for different operations
const transactionRateLimiter = new RateLimiter(5, 60000) // 5 transactions per minute
const apiRateLimiter = new RateLimiter(30, 60000) // 30 API calls per minute
const bridgeRateLimiter = new RateLimiter(2, 300000) // 2 bridge operations per 5 minutes

/**
 * Check transaction rate limit
 * Requirements: TR-4.33
 */
export function checkTransactionRateLimit(userAddress: string): { allowed: boolean; error?: string; retryAfter?: number } {
  return transactionRateLimiter.checkLimit(`tx_${userAddress}`)
}

/**
 * Check API call rate limit
 * Requirements: TR-4.33
 */
export function checkApiRateLimit(endpoint: string, userAddress?: string): { allowed: boolean; error?: string; retryAfter?: number } {
  const key = userAddress ? `api_${endpoint}_${userAddress}` : `api_${endpoint}`
  return apiRateLimiter.checkLimit(key)
}

/**
 * Check bridge operation rate limit
 * Requirements: TR-4.33
 */
export function checkBridgeRateLimit(userAddress: string): { allowed: boolean; error?: string; retryAfter?: number } {
  return bridgeRateLimiter.checkLimit(`bridge_${userAddress}`)
}

// ============================================================================
// Transaction Validation
// ============================================================================

/**
 * Validate transaction parameters before execution
 * Requirements: TR-4.29, TR-4.33, TR-4.35
 */
export interface TransactionValidationParams {
  type: 'supply' | 'borrow' | 'withdraw' | 'repay' | 'swap' | 'bridge'
  userAddress: string
  amount: string
  token: 'wBTC' | 'USDC'
  network: SupportedNetwork
  contractAddress?: string
  balance?: string
  borrowingCapacity?: string
}

export function validateTransaction(params: TransactionValidationParams): { valid: boolean; error?: string } {
  const { type, userAddress, amount, token, network, contractAddress, balance, borrowingCapacity } = params

  // Validate user address
  const addressValidation = validateAddress(userAddress)
  if (!addressValidation.valid) {
    return { valid: false, error: `Invalid user address: ${addressValidation.error}` }
  }

  // Validate network
  const networkValidation = validateNetwork(network)
  if (!networkValidation.valid) {
    return networkValidation
  }

  // Verify network configuration
  const configValidation = verifyNetworkConfiguration(network)
  if (!configValidation.valid) {
    return configValidation
  }

  // Validate amount
  const amountValidation = validateAmount({
    amount,
    token,
    balance: type === 'supply' || type === 'withdraw' || type === 'swap' ? balance : undefined,
    maxAmount: type === 'borrow' ? borrowingCapacity : undefined,
  })
  if (!amountValidation.valid) {
    return amountValidation
  }

  // Verify contract address if provided
  if (contractAddress) {
    const contractType = type === 'supply' || type === 'borrow' || type === 'withdraw' || type === 'repay' 
      ? 'vesuPool' 
      : token === 'wBTC' ? 'wBTC' : 'USDC'
    
    const contractValidation = verifyContractAddress(contractAddress, contractType, network)
    if (!contractValidation.valid) {
      return contractValidation
    }
  }

  // Check rate limit
  const rateLimitCheck = type === 'bridge' 
    ? checkBridgeRateLimit(userAddress)
    : checkTransactionRateLimit(userAddress)
  
  if (!rateLimitCheck.allowed) {
    return { valid: false, error: rateLimitCheck.error }
  }

  return { valid: true }
}

// ============================================================================
// Sanitization
// ============================================================================

/**
 * Sanitize user input to prevent injection attacks
 * Requirements: TR-4.29
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '')

  // Remove any script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Trim whitespace
  sanitized = sanitized.trim()

  return sanitized
}

/**
 * Sanitize numeric input
 * Requirements: TR-4.29
 */
export function sanitizeNumericInput(input: string): string {
  if (typeof input !== 'string') {
    return '0'
  }

  // Remove any non-numeric characters except decimal point
  let sanitized = input.replace(/[^0-9.]/g, '')

  // Ensure only one decimal point
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('')
  }

  return sanitized
}

// ============================================================================
// Export utilities
// ============================================================================

export const SecurityValidation = {
  validateAddress,
  validateAmount,
  validateLeverage,
  validateSlippage,
  validateNetwork,
  verifyContractAddress,
  verifyNetworkConfiguration,
  checkTransactionRateLimit,
  checkApiRateLimit,
  checkBridgeRateLimit,
  validateTransaction,
  sanitizeInput,
  sanitizeNumericInput,
}
