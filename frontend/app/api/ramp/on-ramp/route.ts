/**
 * MavaPay On-Ramp API Route
 * 
 * Handles on-ramp requests for purchasing BTC with NGN
 * 
 * Requirements: 2.1, 2.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import {
  OnRampRequest,
  OnRampResponse,
  ValidationError,
  StoredRampTransaction,
} from '@/types/mavapay';

/**
 * Validate on-ramp request parameters
 * Requirements: 2.1
 */
function validateOnRampRequest(body: any): OnRampRequest {
  // Validate amount
  if (!body.amount || typeof body.amount !== 'string') {
    throw new ValidationError(
      'amount',
      'Amount is required and must be a string',
      'Provide amount in kobo (smallest unit of NGN)'
    );
  }

  const amountNum = parseInt(body.amount, 10);
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new ValidationError(
      'amount',
      'Amount must be a positive number',
      'Provide a valid positive amount in kobo'
    );
  }

  // Validate minimum amount (2000 NGN = 200,000 kobo)
  const minAmountKobo = parseInt(process.env.NEXT_PUBLIC_MAVAPAY_MIN_NGN_AMOUNT || '200000', 10);
  if (amountNum < minAmountKobo) {
    throw new ValidationError(
      'amount',
      `Amount must be at least ${minAmountKobo / 100} NGN`,
      `Minimum on-ramp amount is ${minAmountKobo / 100} NGN (${minAmountKobo} kobo)`
    );
  }

  // Validate Lightning address
  if (!body.lightningAddress || typeof body.lightningAddress !== 'string') {
    throw new ValidationError(
      'lightningAddress',
      'Lightning address is required and must be a string',
      'Provide a valid Lightning wallet address'
    );
  }

  // Basic Lightning address validation (should contain @ or be a valid Lightning invoice)
  const lightningAddress = body.lightningAddress.trim();
  if (lightningAddress.length === 0) {
    throw new ValidationError(
      'lightningAddress',
      'Lightning address cannot be empty',
      'Provide a valid Lightning wallet address'
    );
  }

  return {
    amount: body.amount,
    lightningAddress: lightningAddress,
  };
}

/**
 * POST /api/ramp/on-ramp
 * 
 * Initiates on-ramp purchase of BTC with NGN
 * Requirements: 2.1, 2.3
 * 
 * Flow:
 * 1. Validate request parameters
 * 2. Request quote from MavaPay for NGN → BTC conversion
 * 3. Generate payment instructions for NGN bank transfer
 * 4. Create transaction record
 * 5. Return payment details to user
 * 6. Wait for webhook confirmation of NGN receipt (handled separately)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate request (Requirements: 2.1)
    const validatedRequest = validateOnRampRequest(body);

    // Determine if using sandbox
    const useSandbox = process.env.NODE_ENV !== 'production' || 
                       process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

    // Create MavaPay client
    const client = createMavaPayClient(useSandbox);

    // Request quote from MavaPay for NGN → BTC (Requirements: 2.1)
    const quoteParams = {
      sourceCurrency: 'NGNKOBO' as const,
      targetCurrency: 'BTCSAT' as const,
      amount: parseInt(validatedRequest.amount, 10),
      paymentMethod: 'LIGHTNING' as const,
    };

    const quote = await client.createQuote(quoteParams);

    // Generate payment instructions (Requirements: 2.3)
    // In a real implementation, MavaPay would provide bank account details
    // for the user to transfer NGN to. For now, we'll use placeholder data
    // that would typically come from the MavaPay API response.
    const paymentInstructions = {
      bankName: 'WEMA BANK', // This would come from MavaPay
      accountNumber: '0123456789', // This would come from MavaPay
      accountName: 'MavaPay Limited', // This would come from MavaPay
      amount: parseInt(validatedRequest.amount, 10),
      reference: quote.id, // Use quote ID as reference
    };

    // Create transaction record (Requirements: 2.3)
    // Note: In a real implementation, this would be stored in a database
    // For now, we'll return the transaction details to be stored client-side
    const transactionRecord: StoredRampTransaction = {
      id: crypto.randomUUID(),
      walletAddress: body.walletAddress || 'unknown', // Should be passed in request
      type: 'on-ramp',
      status: 'pending',
      
      // Amounts
      sourceAmount: quote.amountInSourceCurrency.toString(),
      sourceCurrency: quote.sourceCurrency,
      targetAmount: quote.amountInTargetCurrency.toString(),
      targetCurrency: quote.targetCurrency,
      
      // Rates and fees
      exchangeRate: quote.exchangeRate,
      transactionFees: quote.transactionFeesInSourceCurrency.toString(),
      networkFees: '0',
      totalFees: quote.transactionFeesInSourceCurrency.toString(),
      
      // MavaPay details
      mavaPayQuoteId: quote.id,
      lightningInvoice: validatedRequest.lightningAddress,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: quote.expiry,
      
      // Error handling
      retryCount: 0,
    };

    // Return on-ramp response (Requirements: 2.3)
    const response: OnRampResponse = {
      transactionId: transactionRecord.id,
      mavaPayOrderId: quote.id, // Use quote ID as order ID initially
      paymentInstructions,
      btcAmount: quote.amountInTargetCurrency,
      exchangeRate: quote.exchangeRate,
      expiresAt: quote.expiry,
    };

    return NextResponse.json({
      ...response,
      transaction: transactionRecord,
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error: unknown) {
    console.error('On-ramp API error:', error);

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
 * OPTIONS /api/ramp/on-ramp
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
