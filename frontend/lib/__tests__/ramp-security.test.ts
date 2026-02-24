/**
 * Tests for MavaPay Ramp Security Utilities
 * 
 * Requirements: 10.5, 10.6, 10.7
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import {
  checkQuoteRateLimit,
  checkPayoutRateLimit,
  checkOnRampRateLimit,
  checkWebhookRateLimit,
  checkBankRateLimit,
  sanitizeLogEntry,
  sanitizeRequestBody,
  sanitizeError,
  createAuditLog,
  type AuditLogEntry,
} from '../ramp-security';

// Helper to create mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/test'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'x-forwarded-for': '192.168.1.1',
      'user-agent': 'test-agent',
    },
  });
}

describe('Rate Limiting', () => {
  describe('checkQuoteRateLimit', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest();
      const result = checkQuoteRateLimit(request, 'test-wallet-1');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('should block requests over the limit', () => {
      const request = createMockRequest();
      const walletAddress = 'test-wallet-limit';
      
      // Make requests up to the limit (20 for quote)
      for (let i = 0; i < 20; i++) {
        checkQuoteRateLimit(request, walletAddress);
      }
      
      // Next request should be blocked
      const result = checkQuoteRateLimit(request, walletAddress);
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('checkPayoutRateLimit', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest();
      const result = checkPayoutRateLimit(request, 'test-wallet-2');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('checkOnRampRateLimit', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest();
      const result = checkOnRampRateLimit(request, 'test-wallet-3');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('checkWebhookRateLimit', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest();
      const result = checkWebhookRateLimit(request);
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });

  describe('checkBankRateLimit', () => {
    it('should allow requests under the limit', () => {
      const request = createMockRequest();
      const result = checkBankRateLimit(request, 'test-wallet-4');
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThan(0);
    });
  });
});

describe('Log Sanitization', () => {
  describe('sanitizeLogEntry', () => {
    it('should sanitize bank account numbers', () => {
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'bank_verification',
        endpoint: '/api/ramp/verify-bank',
        method: 'POST',
        requestId: 'test-123',
        metadata: {
          accountNumber: '1234567890',
        },
      };

      const sanitized = sanitizeLogEntry(entry);
      expect(sanitized.metadata?.accountNumber).toBe('******7890');
      expect(sanitized.metadata?.accountNumber).not.toBe('1234567890');
    });

    it('should sanitize Lightning invoices', () => {
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'payout_initiated',
        endpoint: '/api/ramp/payout',
        method: 'POST',
        requestId: 'test-123',
        metadata: {
          invoice: 'lnbc1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz',
        },
      };

      const sanitized = sanitizeLogEntry(entry);
      expect(sanitized.metadata?.invoice).toContain('...');
      expect(sanitized.metadata?.invoice).not.toContain('abcdefghijklmnopqrstuvwxyz');
    });

    it('should sanitize API keys', () => {
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'api_error',
        endpoint: '/api/ramp/quote',
        method: 'POST',
        requestId: 'test-123',
        metadata: {
          apiKey: 'api_key_1234567890abcdefghij',
        },
      };

      const sanitized = sanitizeLogEntry(entry);
      expect(sanitized.metadata?.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize email addresses', () => {
      const entry: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        eventType: 'transaction_status_update',
        endpoint: '/api/ramp/webhook',
        method: 'POST',
        requestId: 'test-123',
        metadata: {
          email: 'user@example.com',
        },
      };

      const sanitized = sanitizeLogEntry(entry);
      expect(sanitized.metadata?.email).toBe('u***@example.com');
      expect(sanitized.metadata?.email).not.toBe('user@example.com');
    });
  });

  describe('sanitizeRequestBody', () => {
    it('should sanitize sensitive fields in request body', () => {
      const body = {
        walletAddress: '0x1234567890abcdef',
        amount: '1000000',
        bankAccount: {
          accountNumber: '1234567890',
          accountName: 'John Doe',
          bankName: 'Test Bank',
        },
      };

      const sanitized = sanitizeRequestBody(body);
      expect(sanitized.bankAccount.accountNumber).toBe('******7890');
      expect(sanitized.walletAddress).toBe('0x1234567890abcdef'); // Not sensitive
      expect(sanitized.amount).toBe('1000000'); // Not sensitive
    });
  });

  describe('sanitizeError', () => {
    it('should sanitize error messages containing sensitive data', () => {
      const error = new Error('Failed to process payment for account 1234567890');
      const sanitized = sanitizeError(error);
      
      expect(sanitized.message).toBe('Failed to process payment for account ******7890');
      expect(sanitized.name).toBe('Error');
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const error = new Error('Test error');
      const sanitized = sanitizeError(error);
      
      expect(sanitized.stack).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('should exclude stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Test error');
      const sanitized = sanitizeError(error);
      
      expect(sanitized.stack).toBeUndefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

describe('Audit Logging', () => {
  describe('createAuditLog', () => {
    it('should create audit log entry with required fields', () => {
      const request = createMockRequest();
      const entry = createAuditLog('quote_request', request, {
        walletAddress: 'test-wallet',
        amount: '1000000',
        currency: 'BTCSAT',
      });

      expect(entry.timestamp).toBeDefined();
      expect(entry.eventType).toBe('quote_request');
      expect(entry.endpoint).toBe('/api/test');
      expect(entry.method).toBe('POST');
      expect(entry.ipAddress).toBe('192.168.1.1');
      expect(entry.userAgent).toBe('test-agent');
      expect(entry.requestId).toBeDefined();
      expect(entry.walletAddress).toBe('test-wallet');
      expect(entry.amount).toBe('1000000');
      expect(entry.currency).toBe('BTCSAT');
    });

    it('should handle missing optional fields', () => {
      const request = createMockRequest();
      const entry = createAuditLog('api_error', request, {
        error: 'Test error',
      });

      expect(entry.timestamp).toBeDefined();
      expect(entry.eventType).toBe('api_error');
      expect(entry.error).toBe('Test error');
      expect(entry.walletAddress).toBeUndefined();
      expect(entry.amount).toBeUndefined();
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete audit flow with sanitization', () => {
    const request = createMockRequest();
    const entry = createAuditLog('payout_initiated', request, {
      walletAddress: 'test-wallet',
      amount: '1000000',
      currency: 'BTCSAT',
      transactionId: 'tx-123',
      metadata: {
        bankAccount: '1234567890',
        invoice: 'lnbc1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz',
      },
    });

    const sanitized = sanitizeLogEntry(entry);

    // Verify sensitive data is sanitized
    expect(sanitized.metadata?.bankAccount).toBe('******7890');
    expect(sanitized.metadata?.invoice).toContain('...');
    
    // Verify non-sensitive data is preserved
    expect(sanitized.walletAddress).toBe('test-wallet');
    expect(sanitized.amount).toBe('1000000');
    expect(sanitized.transactionId).toBe('tx-123');
  });
});
