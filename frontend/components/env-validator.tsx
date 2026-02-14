'use client';

/**
 * Environment Validator Component
 * 
 * Validates environment configuration on app startup (client-side).
 * Displays warnings/errors in development mode.
 */

import { useEffect } from 'react';
import { validateEnvironment, logValidationResults } from '@/lib/env-validation';

export function EnvValidator() {
  useEffect(() => {
    // Only run validation in development mode
    if (process.env.NODE_ENV === 'development') {
      const result = validateEnvironment();
      logValidationResults(result);
    }
  }, []);

  // This component doesn't render anything
  return null;
}
