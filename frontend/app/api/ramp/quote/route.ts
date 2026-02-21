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
  try {
    // Parse request body
    const body = await request.json();

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

    // Return formatted response
    return NextResponse.json<QuoteResponse>(quote, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: unknown) {
    console.error('Quote API error:', error);

    // Handle validation errors
    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          field: error.field,
          message: error.message,
          suggestion: error.suggestion,
        },
        { status: 400 }
      );
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
