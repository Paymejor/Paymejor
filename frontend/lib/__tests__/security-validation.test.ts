/**
 * Security Validation Tests
 * 
 * Tests for security validation utilities
 * Requirements: TR-4.29, TR-4.33, TR-4.35
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { SecurityValidation } from '../security-validation'

describe('SecurityValidation', () => {
  describe('validateAddress', () => {
    it('should validate correct Starknet address', () => {
      const result = SecurityValidation.validateAddress(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      )
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject address without 0x prefix', () => {
      const result = SecurityValidation.validateAddress(
        '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Address must start with 0x')
    })

    it('should reject address with wrong length', () => {
      const result = SecurityValidation.validateAddress('0x1234')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Address must be 66 characters long (including 0x)')
    })

    it('should reject address with invalid characters', () => {
      const result = SecurityValidation.validateAddress(
        '0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      )
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Address contains invalid characters')
    })

    it('should reject empty address', () => {
      const result = SecurityValidation.validateAddress('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Address is required')
    })
  })

  describe('validateAmount', () => {
    it('should validate correct amount', () => {
      const result = SecurityValidation.validateAmount({
        amount: '1.5',
        token: 'wBTC',
      })
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject negative amount', () => {
      const result = SecurityValidation.validateAmount({
        amount: '-1',
        token: 'wBTC',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be greater than zero')
    })

    it('should reject zero amount', () => {
      const result = SecurityValidation.validateAmount({
        amount: '0',
        token: 'wBTC',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be greater than zero')
    })

    it('should reject amount below minimum', () => {
      const result = SecurityValidation.validateAmount({
        amount: '0.5',
        token: 'wBTC',
        minAmount: '1',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be at least 1 wBTC')
    })

    it('should reject amount above maximum', () => {
      const result = SecurityValidation.validateAmount({
        amount: '10',
        token: 'wBTC',
        maxAmount: '5',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount cannot exceed 5 wBTC')
    })

    it('should reject amount exceeding balance', () => {
      const result = SecurityValidation.validateAmount({
        amount: '10',
        token: 'wBTC',
        balance: '5',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Insufficient balance. Available: 5 wBTC')
    })

    it('should reject amount with too many decimals', () => {
      const result = SecurityValidation.validateAmount({
        amount: '1.123456789',
        token: 'wBTC', // 8 decimals
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount cannot have more than 8 decimal places')
    })

    it('should reject invalid numeric input', () => {
      const result = SecurityValidation.validateAmount({
        amount: 'abc',
        token: 'wBTC',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount must be a valid number')
    })

    it('should reject empty amount', () => {
      const result = SecurityValidation.validateAmount({
        amount: '',
        token: 'wBTC',
      })
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Amount is required')
    })
  })

  describe('validateLeverage', () => {
    it('should validate correct leverage', () => {
      const result = SecurityValidation.validateLeverage(2)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject leverage below minimum', () => {
      const result = SecurityValidation.validateLeverage(0.5)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Leverage must be at least 1x')
    })

    it('should reject leverage above maximum', () => {
      const result = SecurityValidation.validateLeverage(4)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Leverage cannot exceed 3x')
    })

    it('should reject invalid leverage', () => {
      const result = SecurityValidation.validateLeverage(NaN)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Leverage must be a valid number')
    })
  })

  describe('validateSlippage', () => {
    it('should validate correct slippage', () => {
      const result = SecurityValidation.validateSlippage(0.5)
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should warn for high slippage', () => {
      const result = SecurityValidation.validateSlippage(10)
      expect(result.valid).toBe(true)
      expect(result.error).toBe('Warning: Slippage is unusually high (>5%)')
    })

    it('should reject negative slippage', () => {
      const result = SecurityValidation.validateSlippage(-1)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Slippage cannot be negative')
    })

    it('should reject slippage above maximum', () => {
      const result = SecurityValidation.validateSlippage(60)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Slippage cannot exceed 50%')
    })

    it('should reject invalid slippage', () => {
      const result = SecurityValidation.validateSlippage(NaN)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Slippage must be a valid number')
    })
  })

  describe('validateNetwork', () => {
    it('should validate sepolia network', () => {
      const result = SecurityValidation.validateNetwork('sepolia')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should validate mainnet network', () => {
      const result = SecurityValidation.validateNetwork('mainnet')
      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject unsupported network', () => {
      const result = SecurityValidation.validateNetwork('testnet')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Unsupported network: testnet')
    })

    it('should reject empty network', () => {
      const result = SecurityValidation.validateNetwork('')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Network is required')
    })
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const result = SecurityValidation.sanitizeInput('<script>alert("xss")</script>Hello')
      expect(result).toBe('Hello')
    })

    it('should remove script tags', () => {
      const result = SecurityValidation.sanitizeInput('Hello<script>alert("xss")</script>World')
      expect(result).toBe('HelloWorld')
    })

    it('should trim whitespace', () => {
      const result = SecurityValidation.sanitizeInput('  Hello World  ')
      expect(result).toBe('Hello World')
    })

    it('should handle empty string', () => {
      const result = SecurityValidation.sanitizeInput('')
      expect(result).toBe('')
    })

    it('should handle non-string input', () => {
      const result = SecurityValidation.sanitizeInput(123 as any)
      expect(result).toBe('')
    })
  })

  describe('sanitizeNumericInput', () => {
    it('should keep valid numeric input', () => {
      const result = SecurityValidation.sanitizeNumericInput('123.45')
      expect(result).toBe('123.45')
    })

    it('should remove non-numeric characters', () => {
      const result = SecurityValidation.sanitizeNumericInput('123abc45')
      expect(result).toBe('12345')
    })

    it('should keep single decimal point', () => {
      const result = SecurityValidation.sanitizeNumericInput('123.45.67')
      expect(result).toBe('123.4567')
    })

    it('should handle empty string', () => {
      const result = SecurityValidation.sanitizeNumericInput('')
      expect(result).toBe('')
    })

    it('should handle non-string input', () => {
      const result = SecurityValidation.sanitizeNumericInput(123 as any)
      expect(result).toBe('0')
    })
  })

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Note: In a real test, we'd need to reset rate limiters
      // For now, we'll test the basic functionality
    })

    it('should allow first transaction', () => {
      const result = SecurityValidation.checkTransactionRateLimit('0x123')
      expect(result.allowed).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow first API call', () => {
      const result = SecurityValidation.checkApiRateLimit('test-endpoint', '0x123')
      expect(result.allowed).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should allow first bridge operation', () => {
      const result = SecurityValidation.checkBridgeRateLimit('0x123')
      expect(result.allowed).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
})
