/**
 * MavaPay Ramp Security Utilities
 * 
 * Provides rate limiting, audit logging, and log sanitization
 * for MavaPay ramp API endpoints.
 * 
 * Requirements: 10.5, 10.6, 10.7
 */

import { NextRequest } from 'next/server';

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequestTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed under rate limit
   * Requirements: 10.5
   */
  checkLimit(key: string): { 
    allowed: boolean; 
    error?: string; 
    retryAfter?: number;
    remaining?: number;
  } {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous requests or window expired
    if (!entry || now > entry.resetTime) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequestTime: now,
      });
      return { 
        allowed: true,
        remaining: this.config.maxRequests - 1,
      };
    }

    // Within window, check count
    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return { 
        allowed: true,
        remaining: this.config.maxRequests - entry.count,
      };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      error: `Rate limit exceeded. Maximum ${this.config.maxRequests} requests per ${this.config.windowMs / 1000} seconds. Please try again in ${retryAfter} seconds.`,
      retryAfter,
      remaining: 0,
    };
  }

  /**
   * Reset rate limit for a key
   */
  reset(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
  } | null {
    const entry = this.limits.get(key);
    if (!entry) {
      return null;
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

// Rate limiters for different endpoints
// Requirements: 10.5
const quoteLimiter = new RateLimiter({ maxRequests: 20, windowMs: 60000 }); // 20 per minute
const payoutLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 }); // 5 per minute
const onRampLimiter = new RateLimiter({ maxRequests: 5, windowMs: 60000 }); // 5 per minute
const webhookLimiter = new RateLimiter({ maxRequests: 100, windowMs: 60000 }); // 100 per minute
const bankLimiter = new RateLimiter({ maxRequests: 10, windowMs: 60000 }); // 10 per minute

/**
 * Get client identifier from request
 * Uses IP address or wallet address as identifier
 */
function getClientIdentifier(request: NextRequest, walletAddress?: string): string {
  if (walletAddress) {
    return `wallet_${walletAddress}`;
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  
  return `ip_${ip}`;
}

/**
 * Check rate limit for quote endpoint
 * Requirements: 10.5
 */
export function checkQuoteRateLimit(request: NextRequest, walletAddress?: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const identifier = getClientIdentifier(request, walletAddress);
  return quoteLimiter.checkLimit(identifier);
}

/**
 * Check rate limit for payout endpoint
 * Requirements: 10.5
 */
export function checkPayoutRateLimit(request: NextRequest, walletAddress?: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const identifier = getClientIdentifier(request, walletAddress);
  return payoutLimiter.checkLimit(identifier);
}

/**
 * Check rate limit for on-ramp endpoint
 * Requirements: 10.5
 */
export function checkOnRampRateLimit(request: NextRequest, walletAddress?: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const identifier = getClientIdentifier(request, walletAddress);
  return onRampLimiter.checkLimit(identifier);
}

/**
 * Check rate limit for webhook endpoint
 * Requirements: 10.5
 */
export function checkWebhookRateLimit(request: NextRequest): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const identifier = getClientIdentifier(request);
  return webhookLimiter.checkLimit(identifier);
}

/**
 * Check rate limit for bank operations
 * Requirements: 10.5
 */
export function checkBankRateLimit(request: NextRequest, walletAddress?: string): {
  allowed: boolean;
  error?: string;
  retryAfter?: number;
  remaining?: number;
} {
  const identifier = getClientIdentifier(request, walletAddress);
  return bankLimiter.checkLimit(identifier);
}

// ============================================================================
// Audit Logging
// ============================================================================

export interface AuditLogEntry {
  timestamp: string;
  eventType: 'quote_request' | 'payout_initiated' | 'on_ramp_initiated' | 
             'webhook_received' | 'bank_verification' | 'transaction_status_update' |
             'rate_limit_exceeded' | 'validation_error' | 'api_error';
  userId?: string;
  walletAddress?: string;
  transactionId?: string;
  amount?: string;
  currency?: string;
  status?: string;
  endpoint: string;
  method: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Create audit log entry
 * Requirements: 10.6
 */
export function createAuditLog(
  eventType: AuditLogEntry['eventType'],
  request: NextRequest,
  data: Partial<AuditLogEntry>
): AuditLogEntry {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipAddress = forwarded?.split(',')[0] || realIp || 'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const requestId = crypto.randomUUID();

  const logEntry: AuditLogEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    ipAddress,
    userAgent,
    requestId,
    ...data,
  };

  return logEntry;
}

/**
 * Log audit entry to console (in production, this would go to a logging service)
 * Requirements: 10.6, 10.7
 */
export function logAudit(entry: AuditLogEntry): void {
  // Sanitize sensitive data before logging
  const sanitizedEntry = sanitizeLogEntry(entry);
  
  // In production, send to logging service (e.g., CloudWatch, Datadog, etc.)
  // For now, log to console with structured format
  console.log('[AUDIT]', JSON.stringify(sanitizedEntry));
}

/**
 * Log transaction attempt
 * Requirements: 10.6
 */
export function logTransactionAttempt(
  request: NextRequest,
  type: 'quote' | 'payout' | 'on-ramp',
  walletAddress: string,
  amount: string,
  currency: string,
  transactionId?: string
): void {
  const eventType = type === 'quote' ? 'quote_request' :
                   type === 'payout' ? 'payout_initiated' :
                   'on_ramp_initiated';

  const entry = createAuditLog(eventType, request, {
    walletAddress,
    transactionId,
    amount,
    currency,
    status: 'initiated',
  });

  logAudit(entry);
}

/**
 * Log transaction status update
 * Requirements: 10.6
 */
export function logTransactionStatusUpdate(
  request: NextRequest,
  transactionId: string,
  oldStatus: string,
  newStatus: string,
  walletAddress?: string
): void {
  const entry = createAuditLog('transaction_status_update', request, {
    transactionId,
    walletAddress,
    status: newStatus,
    metadata: {
      oldStatus,
      newStatus,
    },
  });

  logAudit(entry);
}

/**
 * Log rate limit exceeded
 * Requirements: 10.6
 */
export function logRateLimitExceeded(
  request: NextRequest,
  endpoint: string,
  identifier: string,
  retryAfter: number
): void {
  const entry = createAuditLog('rate_limit_exceeded', request, {
    endpoint,
    metadata: {
      identifier,
      retryAfter,
    },
  });

  logAudit(entry);
}

/**
 * Log validation error
 * Requirements: 10.6
 */
export function logValidationError(
  request: NextRequest,
  field: string,
  error: string,
  walletAddress?: string
): void {
  const entry = createAuditLog('validation_error', request, {
    walletAddress,
    error,
    metadata: {
      field,
    },
  });

  logAudit(entry);
}

/**
 * Log API error
 * Requirements: 10.6
 */
export function logApiError(
  request: NextRequest,
  error: Error,
  endpoint: string,
  walletAddress?: string,
  transactionId?: string
): void {
  const entry = createAuditLog('api_error', request, {
    walletAddress,
    transactionId,
    endpoint,
    error: error.message,
    metadata: {
      errorName: error.name,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
  });

  logAudit(entry);
}

// ============================================================================
// Log Sanitization
// ============================================================================

/**
 * Patterns for sensitive data that should be excluded from logs
 * Requirements: 10.7
 */
const SENSITIVE_PATTERNS = {
  // API keys
  apiKey: /api[_-]?key[_-]?[a-zA-Z0-9]{20,}/gi,
  bearerToken: /bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,
  
  // Bank account numbers (10 digits)
  bankAccount: /\b\d{10}\b/g,
  
  // Lightning invoices (start with lnbc or lntb)
  lightningInvoice: /ln(bc|tb)[a-zA-Z0-9]{100,}/gi,
  
  // Webhook secrets
  webhookSecret: /webhook[_-]?secret[_-]?[a-zA-Z0-9]{20,}/gi,
  
  // Private keys (hex strings that look like keys)
  privateKey: /0x[a-fA-F0-9]{64}/g,
  
  // Email addresses (PII)
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  
  // Phone numbers (various formats) - must have separators or parentheses
  phone: /(\+\d{1,3}[-.\s]\d{3}[-.\s]\d{3}[-.\s]\d{4}|\(\d{3}\)\s?\d{3}[-.\s]\d{4})/g,
};

/**
 * Sanitize sensitive data from log entry
 * Requirements: 10.7
 */
export function sanitizeLogEntry(entry: AuditLogEntry): AuditLogEntry {
  // Create a deep copy to avoid mutating original
  const sanitized = JSON.parse(JSON.stringify(entry));

  // Sanitize all string fields recursively
  sanitizeObject(sanitized);

  return sanitized;
}

/**
 * Recursively sanitize object properties
 * Requirements: 10.7
 */
function sanitizeObject(obj: any): void {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }

  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeString(obj[key], key);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Sanitize sensitive data from string
 * Requirements: 10.7
 */
function sanitizeString(value: string, fieldName?: string): string {
  let sanitized = value;

  // Check field name for known sensitive fields
  if (fieldName) {
    const lowerFieldName = fieldName.toLowerCase();
    
    if (lowerFieldName.includes('apikey') || 
        lowerFieldName.includes('api_key') ||
        lowerFieldName.includes('secret') ||
        lowerFieldName.includes('token') ||
        lowerFieldName.includes('password')) {
      return '[REDACTED]';
    }

    if (lowerFieldName.includes('account') && lowerFieldName.includes('number')) {
      return maskBankAccount(value);
    }

    if (lowerFieldName.includes('invoice') && value.startsWith('ln')) {
      return maskLightningInvoice(value);
    }
  }

  // Apply pattern-based sanitization
  for (const [patternName, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
    if (pattern.test(sanitized)) {
      switch (patternName) {
        case 'bankAccount':
          sanitized = sanitized.replace(pattern, (match) => maskBankAccount(match));
          break;
        case 'lightningInvoice':
          sanitized = sanitized.replace(pattern, (match) => maskLightningInvoice(match));
          break;
        case 'email':
          sanitized = sanitized.replace(pattern, (match) => maskEmail(match));
          break;
        case 'phone':
          sanitized = sanitized.replace(pattern, '[PHONE_REDACTED]');
          break;
        default:
          sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }
  }

  return sanitized;
}

/**
 * Mask bank account number (show last 4 digits)
 * Requirements: 10.7
 */
function maskBankAccount(accountNumber: string): string {
  if (accountNumber.length < 4) {
    return '****';
  }
  const lastFour = accountNumber.slice(-4);
  return `******${lastFour}`;
}

/**
 * Mask Lightning invoice (show first 10 and last 10 characters)
 * Requirements: 10.7
 */
function maskLightningInvoice(invoice: string): string {
  if (invoice.length < 20) {
    return '[INVOICE_REDACTED]';
  }
  const prefix = invoice.slice(0, 10);
  const suffix = invoice.slice(-10);
  return `${prefix}...${suffix}`;
}

/**
 * Mask email address (show first character and domain)
 * Requirements: 10.7
 */
function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) {
    return '[EMAIL_REDACTED]';
  }
  const [local, domain] = parts;
  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

/**
 * Sanitize request body for logging
 * Requirements: 10.7
 */
export function sanitizeRequestBody(body: any): any {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized = JSON.parse(JSON.stringify(body));
  sanitizeObject(sanitized);
  return sanitized;
}

/**
 * Sanitize error for logging
 * Requirements: 10.7
 */
export function sanitizeError(error: Error): {
  name: string;
  message: string;
  stack?: string;
} {
  return {
    name: error.name,
    message: sanitizeString(error.message),
    stack: process.env.NODE_ENV === 'development' 
      ? sanitizeString(error.stack || '') 
      : undefined,
  };
}

// ============================================================================
// Export utilities
// ============================================================================

export const RampSecurity = {
  // Rate limiting
  checkQuoteRateLimit,
  checkPayoutRateLimit,
  checkOnRampRateLimit,
  checkWebhookRateLimit,
  checkBankRateLimit,
  
  // Audit logging
  createAuditLog,
  logAudit,
  logTransactionAttempt,
  logTransactionStatusUpdate,
  logRateLimitExceeded,
  logValidationError,
  logApiError,
  
  // Log sanitization
  sanitizeLogEntry,
  sanitizeRequestBody,
  sanitizeError,
  sanitizeString,
};
