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
  try {
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

    // Return formatted response with caching
    return NextResponse.json<BankListResponse>(bankList, {
      status: 200,
      headers: {
        // Cache for 1 hour as bank list doesn't change frequently
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });

  } catch (error: unknown) {
    console.error('Banks API error:', error);

    // Handle MavaPay API errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as { statusCode: number; message: string; retryable?: boolean };
      
      return NextResponse.json(
        {
          error: 'MavaPay API Error',
          message: apiError.message,
          retryable: apiError.retryable || false,
        },
        { status: apiError.statusCode >= 500 ? 502 : apiError.statusCode }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
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
