'use client';

/**
 * Environment Validator Component
 * 
 * Validates environment configuration on app startup (client-side).
 * Displays warnings/errors in development mode.
 */

import { useEffect } from 'react';

export function EnvValidator() {
  useEffect(() => {
    // Only run validation in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        const { validateEnvironment, logValidationResults } = require('@/lib/env-validation');
        const result = validateEnvironment();
        logValidationResults(result);
      } catch (error) {
        console.error('Environment validation error:', error);
      }
    }
  }, []);

  // This component doesn't render anything
  return null;
}
