/**
 * MavaPay Banks API Route
 * 
 * Handles fetching list of supported Nigerian banks
 * 
 * Requirements: 4.1, 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import { BankListResponse } from '@/types/mavapay';
import {
  checkBankRateLimit,
  logRateLimitExceeded,
  logApiError,
} from '@/lib/ramp-security';

/**
 * GET /api/ramp/banks
 * 
 * Fetches list of supported Nigerian banks from MavaPay
 * Requirements: 4.1, 4.2
 * 
 * Query Parameters:
 * - country: Country code (default: 'NG')
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check rate limit (Requirements: 10.5)
    const rateLimitCheck = checkBankRateLimit(request);
    if (!rateLimitCheck.allowed) {
      logRateLimitExceeded(request, '/api/ramp/banks', 'banks', rateLimitCheck.retryAfter || 0);
      
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: rateLimitCheck.error,
          retryAfter: rateLimitCheck.retryAfter,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
            'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
          },
        }
      );
    }

    // Get country from query params (default to Nigeria)
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'NG';

    // Validate country code
    if (country !== 'NG') {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: 'Only Nigerian banks (NG) are currently supported',
        },
        { status: 400 }
      );
    }

    // Determine if using sandbox
    const useSandbox = process.env.NODE_ENV !== 'production' || 
                       process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

    // Create MavaPay client
    const client = createMavaPayClient(useSandbox);

    // Call MavaPay API
    const bankList = await client.getBanks(country);

    // Calculate response time
    const duration = Date.now() - startTime;

    // Return formatted response with caching
    return NextResponse.json<BankListResponse>(bankList, {
      status: 200,
      headers: {
        // Cache for 1 hour as bank list doesn't change frequently
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    // Log error (Requirements: 10.6, 10.7)
    if (error instanceof Error) {
      logApiError(request, error, '/api/ramp/banks');
    }

    // Handle MavaPay API errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as { statusCode: number; message: string; retryable?: boolean };
      
      return NextResponse.json(
        {
          error: 'MavaPay API Error',
          message: apiError.message,
          retryable: apiError.retryable || false,
        },
        { 
          status: apiError.statusCode >= 500 ? 502 : apiError.statusCode,
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
}

/**
 * OPTIONS /api/ramp/banks
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
