'use client'

import { ErrorDisplay } from '@/components/error-display'
import { MaintenanceMessage } from '@/components/maintenance-message'
import { parseError, ErrorType } from '@/lib/error-handling'

/**
 * RampErrorHandler Component
 * 
 * Specialized error handler for MavaPay ramp operations
 * Displays appropriate error messages and maintenance notices
 * 
 * Requirements: 8.1-8.5
 */

interface RampErrorHandlerProps {
  error: unknown
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function RampErrorHandler({
  error,
  onRetry,
  onDismiss,
  className,
}: RampErrorHandlerProps) {
  if (!error) return null

  const appError = parseError(error)

  // Show maintenance message for API unavailability (Requirement 8.4)
  if (appError.type === ErrorType.MAVAPAY_API_UNAVAILABLE) {
    return (
      <MaintenanceMessage
        service="MavaPay"
        statusPageUrl="https://status.mavapay.co"
        className={className}
      />
    )
  }

  // Show standard error display for all other errors
  return (
    <ErrorDisplay
      error={error}
      onRetry={onRetry}
      onDismiss={onDismiss}
      className={className}
    />
  )
}
