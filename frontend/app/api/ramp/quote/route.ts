/**
 * MavaPay Quote API Route
 * 
 * Handles quote requests for BTC ↔ NGN conversions
 * 
 * Requirements: 1.3, 1.4, 2.1, 2.2, 3.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import { QuoteRequest, QuoteResponse, ValidationError } from '@/types/mavapay';
import { 
  checkQuoteRateLimit, 
  logTransactionAttempt, 
  logRateLimitExceeded,
  logValidationError,
  logApiError,
} from '@/lib/ramp-security';
import { trackAPI, trackError } from '@/lib/monitoring';

/**
 * Validate quote request parameters
 * Requirements: 3.3
 */
function validateQuoteRequest(body: any): QuoteRequest {
  // Validate direction
  if (!body.direction || !['btc-to-ngn', 'ngn-to-btc'].includes(body.direction)) {
    throw new ValidationError(
      'direction',
      'Invalid direction. Must be "btc-to-ngn" or "ngn-to-btc"',
      'Use "btc-to-ngn" for off-ramp or "ngn-to-btc" for on-ramp'
    );
  }

  // Validate amount
  if (!body.amount || typeof body.amount !== 'string') {
    throw new ValidationError(
      'amount',
      'Amount is required and must be a string',
      'Provide amount in smallest unit (satoshis or kobo)'
    );
  }

  const amountNum = parseInt(body.amount, 10);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new ValidationError(
      'amount',
      'Amount must be a positive number',
      'Provide a valid positive amount'
    );
  }

  // Validate source and target currencies
  if (!body.sourceCurrency || !['BTCSAT', 'NGNKOBO'].includes(body.sourceCurrency)) {
    throw new ValidationError(
      'sourceCurrency',
      'Invalid source currency. Must be "BTCSAT" or "NGNKOBO"',
      'Use "BTCSAT" for Bitcoin or "NGNKOBO" for Nigerian Naira'
    );
  }

  if (!body.targetCurrency || !['BTCSAT', 'NGNKOBO'].includes(body.targetCurrency)) {
    throw new ValidationError(
      'targetCurrency',
      'Invalid target currency. Must be "BTCSAT" or "NGNKOBO"',
      'Use "BTCSAT" for Bitcoin or "NGNKOBO" for Nigerian Naira'
    );
  }

  // Validate currency pair matches direction
  if (body.direction === 'btc-to-ngn') {
    if (body.sourceCurrency !== 'BTCSAT' || body.targetCurrency !== 'NGNKOBO') {
      throw new ValidationError(
        'direction',
        'Currency pair does not match direction',
        'For btc-to-ngn, use sourceCurrency: "BTCSAT" and targetCurrency: "NGNKOBO"'
      );
    }
  } else {
    if (body.sourceCurrency !== 'NGNKOBO' || body.targetCurrency !== 'BTCSAT') {
      throw new ValidationError(
        'direction',
        'Currency pair does not match direction',
        'For ngn-to-btc, use sourceCurrency: "NGNKOBO" and targetCurrency: "BTCSAT"'
      );
    }
  }

  return {
    direction: body.direction,
    amount: body.amount,
    sourceCurrency: body.sourceCurrency,
    targetCurrency: body.targetCurrency,
  };
}

/**
 * POST /api/ramp/quote
 * 
 * Fetches a real-time exchange rate quote from MavaPay
 * Requirements: 1.3, 1.4, 2.1, 2.2, 3.3
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();

    // Check rate limit (Requirements: 10.5)
    const rateLimitCheck = checkQuoteRateLimit(request, body.walletAddress);
    if (!rateLimitCheck.allowed) {
      logRateLimitExceeded(request, '/api/ramp/quote', body.walletAddress || 'unknown', rateLimitCheck.retryAfter || 0);
      
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

    // Validate request
    const validatedRequest = validateQuoteRequest(body);

    // Determine if using sandbox
    const useSandbox = process.env.NODE_ENV !== 'production' || 
                       process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

    // Create MavaPay client
    const client = createMavaPayClient(useSandbox);

    // Prepare quote parameters
    const quoteParams = {
      sourceCurrency: validatedRequest.sourceCurrency,
      targetCurrency: validatedRequest.targetCurrency,
      amount: parseInt(validatedRequest.amount, 10),
      paymentMethod: 'LIGHTNING' as const,
    };

    // Call MavaPay API
    const quote = await client.createQuote(quoteParams);

    // Log successful quote request (Requirements: 10.6)
    const duration = Date.now() - startTime;
    logTransactionAttempt(
      request,
      'quote',
      body.walletAddress || 'unknown',
      validatedRequest.amount,
      validatedRequest.sourceCurrency,
      quote.id
    );

    // Track API metrics (Task 25)
    trackAPI({
      endpoint: '/api/ramp/quote',
      method: 'POST',
      statusCode: 200,
      responseTime: duration,
      success: true,
    });

    // Return formatted response
    return NextResponse.json<QuoteResponse>(quote, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
        'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    // Log error (Requirements: 10.6, 10.7)
    if (error instanceof Error) {
      logApiError(request, error, '/api/ramp/quote');
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      logValidationError(request, error.field, error.message);
      
      // Track validation error (Task 25)
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 400,
        responseTime: duration,
        success: false,
        errorType: 'validation',
        errorMessage: error.message,
      });
      trackError({
        type: 'validation',
        message: error.message,
        endpoint: '/api/ramp/quote',
      });
      
      return NextResponse.json(
        {
          error: 'Validation Error',
          field: error.field,
          message: error.message,
          suggestion: error.suggestion,
        },
        { 
          status: 400,
          headers: {
            'X-Response-Time': `${duration}ms`,
          },
        }
      );
    }

    // Handle MavaPay API errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const apiError = error as { statusCode: number; message: string; retryable?: boolean };
      
      // Track API error (Task 25)
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: apiError.statusCode,
        responseTime: duration,
        success: false,
        errorType: 'api',
        errorMessage: apiError.message,
      });
      trackError({
        type: 'api',
        message: apiError.message,
        endpoint: '/api/ramp/quote',
        statusCode: apiError.statusCode,
      });
      
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
    // Track generic error (Task 25)
    trackAPI({
      endpoint: '/api/ramp/quote',
      method: 'POST',
      statusCode: 500,
      responseTime: duration,
      success: false,
      errorType: 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    trackError({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      endpoint: '/api/ramp/quote',
    });
    
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
 * OPTIONS /api/ramp/quote
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
