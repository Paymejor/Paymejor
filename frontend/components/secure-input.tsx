/**
 * Secure Input Components
 * 
 * Provides input components with built-in validation and sanitization
 * Requirements: TR-4.29
 */

'use client'

import React, { useState, useCallback, ChangeEvent } from 'react'
import { Input } from '@/components/ui/input'
import { SecurityValidation } from '@/lib/security-validation'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

// ============================================================================
// Secure Amount Input
// ============================================================================

interface SecureAmountInputProps {
  value: string
  onChange: (value: string) => void
  token: 'wBTC' | 'USDC'
  balance?: string
  minAmount?: string
  maxAmount?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  showValidation?: boolean
}

export function SecureAmountInput({
  value,
  onChange,
  token,
  balance,
  minAmount,
  maxAmount,
  placeholder,
  disabled,
  className,
  showValidation = true,
}: SecureAmountInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Sanitize numeric input
    const sanitized = SecurityValidation.sanitizeNumericInput(rawValue)
    
    // Update value
    onChange(sanitized)
    
    // Validate if showing validation
    if (showValidation && sanitized) {
      const validation = SecurityValidation.validateAmount({
        amount: sanitized,
        token,
        balance,
        minAmount,
        maxAmount,
      })
      
      setValidationError(validation.valid ? null : validation.error || null)
    } else {
      setValidationError(null)
    }
  }, [onChange, token, balance, minAmount, maxAmount, showValidation])

  const handleBlur = useCallback(() => {
    // Validate on blur
    if (value && showValidation) {
      const validation = SecurityValidation.validateAmount({
        amount: value,
        token,
        balance,
        minAmount,
        maxAmount,
      })
      
      setValidationError(validation.valid ? null : validation.error || null)
    }
  }, [value, token, balance, minAmount, maxAmount, showValidation])

  return (
    <div className="space-y-2">
      <Input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || `0.00 ${token}`}
        disabled={disabled}
        className={className}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? 'amount-error' : undefined}
      />
      {validationError && showValidation && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id="amount-error" className="text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// ============================================================================
// Secure Address Input
// ============================================================================

interface SecureAddressInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showValidation?: boolean
}

export function SecureAddressInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  showValidation = true,
}: SecureAddressInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Sanitize input (remove any HTML/scripts)
    const sanitized = SecurityValidation.sanitizeInput(rawValue)
    
    // Update value
    onChange(sanitized)
    
    // Clear validation error while typing
    setValidationError(null)
  }, [onChange])

  const handleBlur = useCallback(() => {
    // Validate on blur
    if (value && showValidation) {
      const validation = SecurityValidation.validateAddress(value)
      setValidationError(validation.valid ? null : validation.error || null)
    }
  }, [value, showValidation])

  return (
    <div className="space-y-2">
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || '0x...'}
        disabled={disabled}
        className={className}
        aria-invalid={!!validationError}
        aria-describedby={validationError ? 'address-error' : undefined}
      />
      {validationError && showValidation && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id="address-error" className="text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// ============================================================================
// Secure Slippage Input
// ============================================================================

interface SecureSlippageInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  showValidation?: boolean
}

export function SecureSlippageInput({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  showValidation = true,
}: SecureSlippageInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState(value.toString())

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    
    // Sanitize numeric input
    const sanitized = SecurityValidation.sanitizeNumericInput(rawValue)
    setInputValue(sanitized)
    
    // Convert to number and update
    const numValue = parseFloat(sanitized)
    if (!isNaN(numValue)) {
      onChange(numValue)
      
      // Validate if showing validation
      if (showValidation) {
        const validation = SecurityValidation.validateSlippage(numValue)
        setValidationError(validation.valid ? null : validation.error || null)
      }
    }
  }, [onChange, showValidation])

  const handleBlur = useCallback(() => {
    // Validate on blur
    if (showValidation) {
      const validation = SecurityValidation.validateSlippage(value)
      setValidationError(validation.valid ? null : validation.error || null)
    }
  }, [value, showValidation])

  return (
    <div className="space-y-2">
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder || '0.5'}
          disabled={disabled}
          className={className}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'slippage-error' : undefined}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          %
        </span>
      </div>
      {validationError && showValidation && (
        <Alert variant={validationError.startsWith('Warning') ? 'default' : 'destructive'} className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id="slippage-error" className="text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}

// ============================================================================
// Secure Leverage Input
// ============================================================================

interface SecureLeverageInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  showValidation?: boolean
}

export function SecureLeverageInput({
  value,
  onChange,
  min = 1,
  max = 3,
  step = 0.1,
  disabled,
  className,
  showValidation = true,
}: SecureLeverageInputProps) {
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const numValue = parseFloat(e.target.value)
    
    if (!isNaN(numValue)) {
      onChange(numValue)
      
      // Validate if showing validation
      if (showValidation) {
        const validation = SecurityValidation.validateLeverage(numValue)
        setValidationError(validation.valid ? null : validation.error || null)
      }
    }
  }, [onChange, showValidation])

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={className}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'leverage-error' : undefined}
        />
        <span className="text-sm font-medium min-w-[3rem]">{value.toFixed(1)}x</span>
      </div>
      {validationError && showValidation && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription id="leverage-error" className="text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
