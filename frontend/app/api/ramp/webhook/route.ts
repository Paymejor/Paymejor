/**
 * MavaPay Webhook API Route
 * 
 * Processes MavaPay webhook events for transaction status updates
 * 
 * Requirements: 2.4, 2.5, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMavaPayClient } from '@/lib/mavapay-client';
import { WebhookEvent, WebhookError } from '@/types/mavapay';
import {
  checkWebhookRateLimit,
  logTransactionStatusUpdate,
  logRateLimitExceeded,
  logApiError,
  createAuditLog,
  logAudit,
} from '@/lib/ramp-security';
import { trackAPI, trackError } from '@/lib/monitoring';

/**
 * Verify webhook signature
 * Requirements: 3.5, 9.1
 */
async function verifyWebhookSignature(
  request: NextRequest,
  rawBody: string
): Promise<boolean> {
  const signature = request.headers.get('x-mavapay-signature');
  
  if (!signature) {
    throw new WebhookError('unknown', 'unknown', 'Missing webhook signature');
  }

  // Determine if using sandbox
  const useSandbox = process.env.NODE_ENV !== 'production' || 
                     process.env.NEXT_PUBLIC_MAVAPAY_USE_SANDBOX === 'true';

  // Create MavaPay client
  const client = createMavaPayClient(useSandbox);

  // Verify signature
  try {
    const isValid = await client.verifyWebhookSignature(rawBody, signature);
    return isValid;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    throw new WebhookError('unknown', 'unknown', 'Failed to verify webhook signature');
  }
}

/**
 * Route webhook event to appropriate handler
 * Requirements: 9.2
 */
async function routeWebhookEvent(event: WebhookEvent, request: NextRequest): Promise<void> {
  switch (event.event) {
    case 'payment.received':
      await handlePaymentReceived(event, request);
      break;
    case 'payment.sent':
      await handlePaymentSent(event, request);
      break;
    case 'payout.completed':
      await handlePayoutCompleted(event, request);
      break;
    case 'payout.failed':
      await handlePayoutFailed(event, request);
      break;
    default:
      console.warn(`Unknown webhook event type: ${event.event}`);
  }
}

/**
 * Handle payment.received event (on-ramp NGN received)
 * Requirements: 9.2, 9.3
 */
async function handlePaymentReceived(event: WebhookEvent, request: NextRequest): Promise<void> {
  // Log webhook event (Requirements: 10.6)
  const auditEntry = createAuditLog('webhook_received', request, {
    transactionId: event.data.transactionMetadata.orderId,
    amount: event.data.amount.toString(),
    currency: event.data.currency,
    status: 'payment_received',
    metadata: {
      event: 'payment.received',
      hash: event.data.hash,
    },
  });
  logAudit(auditEntry);

  // Update transaction status to "NGN Received"
  // Note: In a real implementation, this would update a database
  // For now, we log the event for the frontend to poll
  
  // The frontend will need to poll for transaction status updates
  // or use a real-time mechanism like WebSockets
  
  // Store webhook event for retrieval
  await storeWebhookEvent(event);

  // Track successful webhook processing (server-side monitoring)
  // Note: This would typically be sent to a monitoring service
  console.log('[MONITORING] Webhook processed successfully', {
    event: 'payment.received',
    transactionId: event.data.transactionMetadata.orderId,
  });
}

/**
 * Handle payment.sent event (off-ramp BTC sent)
 * Requirements: 9.2, 9.3
 */
async function handlePaymentSent(event: WebhookEvent, request: NextRequest): Promise<void> {
  // Log webhook event (Requirements: 10.6)
  const auditEntry = createAuditLog('webhook_received', request, {
    transactionId: event.data.transactionMetadata.orderId,
    amount: event.data.amount.toString(),
    currency: event.data.currency,
    status: 'payment_sent',
    metadata: {
      event: 'payment.sent',
      hash: event.data.hash,
    },
  });
  logAudit(auditEntry);

  // Update transaction status to "BTC Sent"
  await storeWebhookEvent(event);
}

/**
 * Handle payout.completed event (off-ramp completed)
 * Requirements: 9.2, 9.4
 */
async function handlePayoutCompleted(event: WebhookEvent, request: NextRequest): Promise<void> {
  // Log webhook event (Requirements: 10.6)
  const auditEntry = createAuditLog('webhook_received', request, {
    transactionId: event.data.transactionMetadata.orderId,
    amount: event.data.amount.toString(),
    currency: event.data.currency,
    status: 'completed',
    metadata: {
      event: 'payout.completed',
      hash: event.data.hash,
      bankName: event.data.transactionMetadata.bankName,
      // Note: Bank account number is sanitized in log
    },
  });
  logAudit(auditEntry);

  // Update transaction status to "Completed"
  await storeWebhookEvent(event);
}

/**
 * Handle payout.failed event (off-ramp failed)
 * Requirements: 9.2, 9.4
 */
async function handlePayoutFailed(event: WebhookEvent, request: NextRequest): Promise<void> {
  // Log webhook event (Requirements: 10.6)
  const auditEntry = createAuditLog('webhook_received', request, {
    transactionId: event.data.transactionMetadata.orderId,
    amount: event.data.amount.toString(),
    currency: event.data.currency,
    status: 'failed',
    error: `Payout failed with status: ${event.data.status}`,
    metadata: {
      event: 'payout.failed',
      hash: event.data.hash,
    },
  });
  logAudit(auditEntry);

  // Update transaction status to "Failed"
  await storeWebhookEvent(event);
}

/**
 * Store webhook event for retrieval by frontend
 * Requirements: 9.3, 9.4
 * 
 * Note: In a real implementation, this would store in a database.
 * For now, we use a simple in-memory store that can be polled.
 */
const webhookEventStore = new Map<string, WebhookEvent>();

async function storeWebhookEvent(event: WebhookEvent): Promise<void> {
  const orderId = event.data.transactionMetadata.orderId;
  const hash = event.data.hash;
  
  // Store by both orderId and hash for flexible retrieval
  webhookEventStore.set(`order:${orderId}`, event);
  webhookEventStore.set(`hash:${hash}`, event);
  
  // Clean up old events after 1 hour
  setTimeout(() => {
    webhookEventStore.delete(`order:${orderId}`);
    webhookEventStore.delete(`hash:${hash}`);
  }, 60 * 60 * 1000);
}

/**
 * Retry webhook processing on failure
 * Requirements: 9.5
 */
async function processWebhookWithRetry(
  event: WebhookEvent,
  request: NextRequest,
  attempt: number = 1
): Promise<void> {
  const maxAttempts = 3;
  
  try {
    await routeWebhookEvent(event, request);
  } catch (error) {
    console.error(`Webhook processing failed (attempt ${attempt}/${maxAttempts}):`, error);
    
    if (attempt < maxAttempts) {
      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return processWebhookWithRetry(event, request, attempt + 1);
    }
    
    // After max retries, log error and continue
    // The system will fall back to API polling
    if (error instanceof Error) {
      logApiError(request, error, '/api/ramp/webhook', undefined, event.data.transactionMetadata.orderId);
    }
    
    throw new WebhookError(
      event.data.id,
      event.event,
      'Failed to process webhook after retries'
    );
  }
}

/**
 * POST /api/ramp/webhook
 * 
 * Processes MavaPay webhook events
 * Requirements: 2.4, 2.5, 3.5, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 * 
 * Flow:
 * 1. Verify webhook signature (Requirements: 3.5, 9.1)
 * 2. Parse webhook event
 * 3. Route event to appropriate handler (Requirements: 9.2)
 * 4. Update transaction status (Requirements: 9.3, 9.4)
 * 5. Retry on failure (Requirements: 9.5)
 * 6. Respond within 5 seconds (Requirements: 9.6)
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Check rate limit (Requirements: 10.5)
    const rateLimitCheck = checkWebhookRateLimit(request);
    if (!rateLimitCheck.allowed) {
      logRateLimitExceeded(request, '/api/ramp/webhook', 'webhook', rateLimitCheck.retryAfter || 0);
      
      return NextResponse.json(
        {
          error: 'Rate Limit Exceeded',
          message: rateLimitCheck.error,
        },
        { 
          status: 429,
          headers: {
            'Retry-After': rateLimitCheck.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // Read raw body for signature verification
    const rawBody = await request.text();
    
    // Verify webhook signature (Requirements: 3.5, 9.1)
    const isValidSignature = await verifyWebhookSignature(request, rawBody);
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event: WebhookEvent;
    try {
      event = JSON.parse(rawBody) as WebhookEvent;
    } catch (error) {
      console.error('Failed to parse webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Validate event structure
    if (!event.event || !event.data) {
      console.error('Invalid webhook event structure:', event);
      return NextResponse.json(
        { error: 'Invalid event structure' },
        { status: 400 }
      );
    }

    // Process webhook with retry logic (Requirements: 9.2, 9.3, 9.4, 9.5)
    // Use Promise.race to ensure we respond within 5 seconds (Requirements: 9.6)
    const processingPromise = processWebhookWithRetry(event, request);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Processing timeout')), 4500); // 4.5s to leave buffer
    });

    try {
      await Promise.race([processingPromise, timeoutPromise]);
    } catch (error) {
      // If processing times out, log and continue
      // Processing will continue in background
      console.warn('Webhook processing timed out, continuing in background:', {
        event: event.event,
        orderId: event.data.transactionMetadata.orderId,
      });
      
      // Continue processing in background
      processingPromise.catch(err => {
        console.error('Background webhook processing failed:', err);
      });
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;

    // Track API metrics (Task 25)
    trackAPI({
      endpoint: '/api/ramp/webhook',
      method: 'POST',
      statusCode: 200,
      responseTime,
      success: true,
    });

    // Respond with 200 OK within 5 seconds (Requirements: 9.6)
    return NextResponse.json(
      { status: 'ok' },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );

  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;

    // Log error (Requirements: 10.6, 10.7)
    if (error instanceof Error) {
      logApiError(request, error, '/api/ramp/webhook');
    }

    // Handle webhook errors
    if (error instanceof WebhookError) {
      // Track webhook error (Task 25)
      trackAPI({
        endpoint: '/api/ramp/webhook',
        method: 'POST',
        statusCode: 500,
        responseTime,
        success: false,
        errorType: 'webhook',
        errorMessage: error.message,
      });
      trackError({
        type: 'webhook',
        message: error.message,
        endpoint: '/api/ramp/webhook',
      });
      
      return NextResponse.json(
        {
          error: 'Webhook Processing Error',
          message: error.message,
        },
        { 
          status: 500,
          headers: {
            'X-Response-Time': `${responseTime}ms`,
          },
        }
      );
    }

    // Handle generic errors
    // Track generic error (Task 25)
    trackAPI({
      endpoint: '/api/ramp/webhook',
      method: 'POST',
      statusCode: 500,
      responseTime,
      success: false,
      errorType: 'unknown',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });
    trackError({
      type: 'unknown',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      endpoint: '/api/ramp/webhook',
    });
    
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { 
        status: 500,
        headers: {
          'X-Response-Time': `${responseTime}ms`,
        },
      }
    );
  }
}

/**
 * GET /api/ramp/webhook
 * 
 * Retrieve webhook events by order ID or hash
 * This allows the frontend to poll for transaction updates
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get('orderId');
  const hash = searchParams.get('hash');

  if (!orderId && !hash) {
    return NextResponse.json(
      { error: 'Either orderId or hash parameter is required' },
      { status: 400 }
    );
  }

  const key = orderId ? `order:${orderId}` : `hash:${hash}`;
  const event = webhookEventStore.get(key);

  if (!event) {
    return NextResponse.json(
      { error: 'Webhook event not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(event, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

/**
 * OPTIONS /api/ramp/webhook
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-mavapay-signature',
    },
  });
}

