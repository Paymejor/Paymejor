import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a token amount from wei to human-readable format
 * @param value - Amount in wei (as string or bigint)
 * @param decimals - Token decimals (e.g., 8 for wBTC, 6 for USDC)
 * @returns Formatted string
 */
export function formatUnits(value: string | bigint, decimals: number): string {
  const bigIntValue = typeof value === 'string' ? BigInt(value) : value
  const divisor = BigInt(10 ** decimals)
  const quotient = bigIntValue / divisor
  const remainder = bigIntValue % divisor
  
  if (remainder === BigInt(0)) {
    return quotient.toString()
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0')
  const trimmedRemainder = remainderStr.replace(/0+$/, '')
  
  return `${quotient}.${trimmedRemainder}`
}

/**
 * Parse a human-readable token amount to wei
 * @param value - Human-readable amount (e.g., "1.5")
 * @param decimals - Token decimals (e.g., 8 for wBTC, 6 for USDC)
 * @returns Amount in wei as string
 */
export function parseUnits(value: string, decimals: number): string {
  const [whole, fraction = ''] = value.split('.')
  const paddedFraction = fraction.padEnd(decimals, '0').slice(0, decimals)
  const combined = whole + paddedFraction
  return BigInt(combined).toString()
}
