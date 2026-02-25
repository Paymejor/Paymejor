/**
 * MavaPay Payout API Route
 * 
 * Handles off-ramp payout requests to Nigerian bank accounts
 * 
 * Requirements: 1.5, 1.6, 1.7, 3.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import { getBankAccountById } from '@/lib/bank-encryption';
import {
  PayoutRequest,
  PayoutInitiationResponse,
  ValidationError,
  StoredRampTransaction,
} from '@/types/mavapay';
import {
  checkPayoutRateLimit,
  logTransactionAttempt,
  logRateLimitExceeded,
  logValidationError,
  logApiError,
} from '@/lib/ramp-security';
import { trackAPI, trackError } from '@/lib/monitoring';

/**
 * Validate payout request parameters
 * Requirements: 3.4
 */
function validatePayoutRequest(body: any): PayoutRequest {
  // Validate quoteId
  if (!body.quoteId || typeof body.quoteId !== 'string') {
    throw new ValidationError(
      'quoteId',
      'Quote ID is required and must be a string',
      'Provide a valid quote ID from a previous quote request'
    );
  }

  // Validate bankAccountId
  if (!body.bankAccountId || typeof body.bankAccountId !== 'string') {
    throw new ValidationError(
      'bankAccountId',
      'Bank account ID is required and must be a string',
      'Provide a valid bank account ID from saved accounts'
    );
  }

  // Validate walletAddress
  if (!body.walletAddress || typeof body.walletAddress !== 'string') {
    throw new ValidationError(
      'walletAddress',
      'Wallet address is required and must be a string',
      'Provide the user wallet address'
    );
  }

  return {
    quoteId: body.quoteId,
    bankAccountId: body.bankAccountId,
    walletAddress: body.walletAddress,
  };
}

/**
 * Validate bank account details before submission
 * Requirements: 4.1
 */
function validateBankAccountDetails(account: {
  accountNumber: string;
  accountName: string;
  bankName: string;
}): void {
  // Validate account number format (10 digits for Nigerian banks)
  if (!/^\d{10}$/.test(account.accountNumber)) {
    throw new ValidationError(
      'accountNumber',
      'Invalid account number format',
      'Nigerian bank account numbers must be exactly 10 digits'
    );
  }

  // Validate account name
  if (!account.accountName || account.accountName.trim().length === 0) {
    throw new ValidationError(
      'accountName',
      'Account name is required',
      'Provide the account holder name'
    );
  }

  // Validate bank name
  if (!account.bankName || account.bankName.trim().length === 0) {
    throw new ValidationError(
      'bankName',
      'Bank name is required',
      'Provide the bank name'
    );
  }
}

/**
 * Create transaction record in localStorage
 * Requirements: 1.7
 */
function createTransactionRecord(
  walletAddress: string,
  quoteId: string,
  invoice: string,
  mavaPayOrderId: string,
  amount: number,
  bankAccountId: string,
  bankName: string,
  bankAccountNumber: string,
  expiresAt: string
): StoredRampTransaction {
  const transaction: StoredRampTransaction = {
    id: crypto.randomUUID(),
    walletAddress,
    type: 'off-ramp',
    status: 'pending',
    
    // Amounts (will be updated from quote)
    sourceAmount: amount.toString(),
    sourceCurrency: 'BTCSAT',
    targetAmount: '0', // Will be updated from quote
    targetCurrency: 'NGNKOBO',
    
    // Rates and fees (will be updated from quote)
    exchangeRate: 0,
    transactionFees: '0',
    networkFees: '0',
    totalFees: '0',
    
    // MavaPay details
    mavaPayQuoteId: quoteId,
    mavaPayOrderId,
    lightningInvoice: invoice,
    
    // Bank details
    bankAccountId,
    bankName,
    bankAccountNumber,
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    expiresAt,
    
    // Error handling
    retryCount: 0,
  };

  // Store in localStorage
  const key = `mavapay_transactions_${walletAddress}`;
  const existingTransactions = localStorage.getItem(key);
  const transactions = existingTransactions ? JSON.parse(existingTransactions) : [];
  transactions.push(transaction);
  localStorage.setItem(key, JSON.stringify(transactions));

  return transaction;
}

/**
 * POST /api/ramp/payout
 * 
 * Initiates off-ramp payout to Nigerian bank account
 * Requirements: 1.5, 1.6, 1.7, 3.4
 * 
 * Flow:
 * 1. Validate request parameters
 * 2. Retrieve and decrypt bank account details
 * 3. Validate bank account format
 * 4. Fetch quote from MavaPay to verify it's still valid
 * 5. Create payout request with bank details
 * 6. Generate Lightning invoice
 * 7. Create transaction record
 * 8. Return transaction details to frontend
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();

    // Check rate limit (Requirements: 10.5)
    const rateLimitCheck = checkPayoutRateLimit(request, body.walletAddress);
    if (!rateLimitCheck.allowed) {
      logRateLimitExceeded(request, '/api/ramp/payout', body.walletAddress || 'unknown', rateLimitCheck.retryAfter || 0);
      
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
    const validatedRequest = validatePayoutRequest(body);

    // Determine if using sandbox
    const useSandbox = process.env.NODE_ENV !== 'production' || 
                       process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

    // Create MavaPay client
    const client = createMavaPayClient(useSandbox);

    // Retrieve bank account details (Requirements: 4.3)
    // Note: This is a server-side operation, but getBankAccountById uses localStorage
    // which is client-side only. In a real implementation, bank accounts would be
    // stored in a database. For now, we'll expect the bank account details to be
    // passed in the request body.
    
    // For server-side implementation, we need bank details passed directly
    if (!body.bankAccount) {
      throw new ValidationError(
        'bankAccount',
        'Bank account details are required',
        'Include bank account details in the request'
      );
    }

    const bankAccount = body.bankAccount;

    // Validate bank account details before submission (Requirements: 4.1)
    validateBankAccountDetails({
      accountNumber: bankAccount.accountNumber,
      accountName: bankAccount.accountName,
      bankName: bankAccount.bankName,
    });

    // Fetch quote to verify it's still valid (Requirements: 1.5)
    let quote;
    try {
      quote = await client.getQuote(validatedRequest.quoteId);
    } catch (error) {
      throw new ValidationError(
        'quoteId',
        'Quote not found or expired',
        'Request a new quote and try again'
      );
    }

    // Check if quote is still valid
    if (!quote.isValid || new Date(quote.expiry) < new Date()) {
      throw new ValidationError(
        'quoteId',
        'Quote has expired',
        'Request a new quote and try again'
      );
    }

    // Create payout with bank account details (Requirements: 1.6, 3.4)
    const payoutParams = {
      quoteId: validatedRequest.quoteId,
      beneficiary: {
        accountName: bankAccount.accountName,
        accountNumber: bankAccount.accountNumber,
        bankName: bankAccount.bankName,
      },
    };

    const payoutResponse = await client.createPayout(payoutParams);

    // Generate Lightning invoice (Requirements: 1.5)
    // The invoice is included in the quote response when autopayout is enabled
    const invoice = quote.invoice;
    
    if (!invoice) {
      throw new Error('Lightning invoice not found in quote response');
    }

    // Create transaction record (Requirements: 1.7)
    // Note: In a real implementation, this would be stored in a database
    // For now, we'll return the transaction details to be stored client-side
    const transactionRecord = {
      id: crypto.randomUUID(),
      walletAddress: validatedRequest.walletAddress,
      type: 'off-ramp' as const,
      status: 'pending_payment' as const,
      
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
      mavaPayQuoteId: validatedRequest.quoteId,
      mavaPayOrderId: payoutResponse.transactionMetadata.orderId,
      mavaPayHash: payoutResponse.hash,
      lightningInvoice: invoice,
      
      // Bank details
      bankAccountId: validatedRequest.bankAccountId,
      bankName: bankAccount.bankName,
      bankAccountNumber: bankAccount.accountNumber,
      bankReference: payoutResponse.ref,
      
      // Timestamps
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      expiresAt: quote.expiry,
      
      // Error handling
      retryCount: 0,
    };

    // Return payout response (Requirements: 1.7)
    const response: PayoutInitiationResponse = {
      transactionId: transactionRecord.id,
      mavaPayOrderId: payoutResponse.transactionMetadata.orderId,
      invoice: invoice,
      amount: quote.amountInSourceCurrency,
      status: 'pending_payment',
      expiresAt: quote.expiry,
    };

    // Log successful payout initiation (Requirements: 10.6)
    const duration = Date.now() - startTime;
    logTransactionAttempt(
      request,
      'payout',
      validatedRequest.walletAddress,
      quote.amountInSourceCurrency.toString(),
      quote.sourceCurrency,
      transactionRecord.id
    );

    // Track API metrics (Task 25)
    trackAPI({
      endpoint: '/api/ramp/payout',
      method: 'POST',
      statusCode: 200,
      responseTime: duration,
      success: true,
    });

    return NextResponse.json({
      ...response,
      transaction: transactionRecord,
    }, {
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
      logApiError(request, error, '/api/ramp/payout');
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      logValidationError(request, error.field, error.message);
      
      // Track validation error (Task 25)
      trackAPI({
        endpoint: '/api/ramp/payout',
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
        endpoint: '/api/ramp/payout',
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
        endpoint: '/api/ramp/payout',
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
        endpoint: '/api/ramp/payout',
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
      endpoint: '/api/ramp/payout',
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
      endpoint: '/api/ramp/payout',
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
 * OPTIONS /api/ramp/payout
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
