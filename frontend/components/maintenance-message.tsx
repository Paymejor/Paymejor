'use client'

import { AlertCircle, ExternalLink } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

/**
 * MaintenanceMessage Component
 * 
 * Displays maintenance messages for API unavailability
 * Requirements: 8.4 - Display maintenance messages for API unavailability
 */

interface MaintenanceMessageProps {
  service?: string
  estimatedRestoration?: string
  statusPageUrl?: string
  className?: string
}

export function MaintenanceMessage({
  service = 'MavaPay',
  estimatedRestoration,
  statusPageUrl = 'https://status.mavapay.co',
  className,
}: MaintenanceMessageProps) {
  return (
    <Alert className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Service Temporarily Unavailable</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {service} is currently undergoing scheduled maintenance or experiencing temporary issues.
        </p>
        
        {estimatedRestoration && (
          <p className="text-sm">
            <span className="font-medium">Estimated restoration:</span> {estimatedRestoration}
          </p>
        )}
        
        <div className="space-y-2">
          <p className="text-sm font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Try again in a few minutes</li>
            <li>Check the service status page for updates</li>
            <li>Your pending transactions are safe and will be processed</li>
          </ul>
        </div>

        {statusPageUrl && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(statusPageUrl, '_blank')}
            className="mt-2"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Check Service Status
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}
