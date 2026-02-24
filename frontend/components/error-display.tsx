'use client'

import { AlertTriangle, RefreshCw, X, Mail, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { 
  getErrorMessage, 
  getErrorSuggestions, 
  isRetryableError,
  getSupportContact,
  requiresSupportContact,
} from '@/lib/error-handling'

/**
 * ErrorDisplay Component
 * 
 * Displays user-friendly error messages with recovery suggestions
 * Requirements: TR-4.25, TR-4.31, NFR-5.7, NFR-5.8, 8.1-8.5
 */

interface ErrorDisplayProps {
  error: unknown
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
}: ErrorDisplayProps) {
  if (!error) return null

  const message = getErrorMessage(error)
  const suggestions = getErrorSuggestions(error)
  const canRetry = isRetryableError(error)
  const supportContact = getSupportContact(error)
  const needsSupport = requiresSupportContact(error)

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between">
        <span>Error</span>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        
        {suggestions.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-sm font-medium">Suggestions:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Support Contact Information (Requirement 8.2) */}
        {supportContact && (
          <div className="mt-3 p-3 bg-muted/50 rounded-md space-y-2">
            <p className="text-sm font-medium">Need Help?</p>
            <p className="text-sm">{supportContact.message}</p>
            <div className="flex flex-wrap gap-2">
              {supportContact.email && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`mailto:${supportContact.email}`, '_blank')}
                  className="text-xs"
                >
                  <Mail className="mr-1 h-3 w-3" />
                  {supportContact.email}
                </Button>
              )}
              {supportContact.statusPage && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(supportContact.statusPage, '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  Service Status
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Retry Button (Requirement 8.1) */}
        {canRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
