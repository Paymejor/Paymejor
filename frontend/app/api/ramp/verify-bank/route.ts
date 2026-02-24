/**
 * MavaPay Bank Verification API Route
 * 
 * Handles verification of Nigerian bank account details
 * 
 * Requirements: 4.1, 4.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import { BankVerificationParams, BankVerificationResponse, ValidationError } from '@/types/mavapay';
import {
  checkBankRateLimit,
  logRateLimitExceeded,
  logValidationError,
  logApiError,
  createAuditLog,
  logAudit,
} from '@/lib/ramp-security';

/**
 * Validate bank account number format
 * Requirements: 4.1
 * 
 * Nigerian bank accounts are exactly 10 digits
 */
function validateBankAccountNumber(accountNumber: string): void {
  // Check if account number is provided
  if (!accountNumber || typeof accountNumber !== 'string') {
    throw new ValidationError(
      'accountNumber',
      'Account number is required',
      'Provide a valid 10-digit Nigerian bank account number'
    );
  }

  // Remove any whitespace
  const cleanedAccountNumber = accountNumber.trim();

  // Check if it's exactly 10 digits
  if (!/^\d{10}$/.test(cleanedAccountNumber)) {
    throw new ValidationError(
      'accountNumber',
      'Account number must be exactly 10 digits',
      'Nigerian bank accounts are 10 digits long (e.g., 0123456789)'
    );
  }
}

/**
 * Validate bank verification request
 * Requirements: 4.1, 4.2
 */
function validateVerificationRequest(body: any): BankVerificationParams {
  // Validate account number
  validateBankAccountNumber(body.accountNumber);

  // Validate bank code
  if (!body.bankCode || typeof body.bankCode !== 'string') {
    throw new ValidationError(
      'bankCode',
      'Bank code is required',
      'Provide a valid Nigerian bank code (e.g., "044" for Access Bank)'
    );
  }

  const cleanedBankCode = body.bankCode.trim();
  if (cleanedBankCode.length === 0) {
    throw new ValidationError(
      'bankCode',
      'Bank code cannot be empty',
      'Provide a valid Nigerian bank code'
    );
  }

  return {
    accountNumber: body.accountNumber.trim(),
    bankCode: cleanedBankCode,
  };
}

/**
 * POST /api/ramp/verify-bank
 * 
 * Verifies a Nigerian bank account via MavaPay API
 * Requirements: 4.1, 4.2
 * 
 * Request Body:
 * {
 *   "accountNumber": "0123456789",
 *   "bankCode": "044"
 * }
 * 
 * Response:
 * {
 *   "isValid": true,
 *   "accountName": "John Doe"
 * }
 * or
 * {
 *   "isValid": false,
 *   "errorMessage": "Account not found"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Parse request body
    const body = await request.json();

    // Check rate limit (Requirements: 10.5)
    const rateLimitCheck = checkBankRateLimit(request, body.walletAddress);
    if (!rateLimitCheck.allowed) {
      logRateLimitExceeded(request, '/api/ramp/verify-bank', body.walletAddress || 'unknown', rateLimitCheck.retryAfter || 0);
      
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
    const validatedRequest = validateVerificationRequest(body);

    // Determine if using sandbox
    const useSandbox = process.env.NODE_ENV !== 'production' || 
                       process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

    // Create MavaPay client
    const client = createMavaPayClient(useSandbox);

    // Call MavaPay API to verify bank account
    const verificationResult = await client.verifyBankAccount(validatedRequest);

    // Log bank verification (Requirements: 10.6)
    // Note: Account number is sanitized in logs
    const duration = Date.now() - startTime;
    const auditEntry = createAuditLog('bank_verification', request, {
      walletAddress: body.walletAddress,
      status: verificationResult.isValid ? 'verified' : 'failed',
      metadata: {
        bankCode: validatedRequest.bankCode,
        // Account number will be sanitized automatically
      },
    });
    logAudit(auditEntry);

    // Return formatted response
    return NextResponse.json<BankVerificationResponse>(verificationResult, {
      status: 200,
      headers: {
        // Don't cache verification results as they may change
        'Cache-Control': 'no-store, max-age=0',
        'X-RateLimit-Remaining': rateLimitCheck.remaining?.toString() || '0',
        'X-Response-Time': `${duration}ms`,
      },
    });

  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    // Log error (Requirements: 10.6, 10.7)
    if (error instanceof Error) {
      logApiError(request, error, '/api/ramp/verify-bank');
    }

    // Handle validation errors
    if (error instanceof ValidationError) {
      logValidationError(request, error.field, error.message);
      
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
 * OPTIONS /api/ramp/verify-bank
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
