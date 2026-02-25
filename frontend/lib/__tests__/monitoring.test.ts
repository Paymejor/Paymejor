/**
 * Monitoring System Tests
 * 
 * Tests for monitoring and analytics functionality
 * 
 * Task 25: Add monitoring and analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MonitoringService,
  getMonitoringService,
  trackTransaction,
  trackAPI,
  trackError,
} from '../monitoring';

describe('Monitoring System', () => {
  let service: MonitoringService;

  beforeEach(() => {
    // Get fresh instance and reset
    service = getMonitoringService();
    service.reset();
  });

  describe('Transaction Tracking', () => {
    it('should track successful transactions', () => {
      trackTransaction({
        transactionId: 'tx-1',
        type: 'on-ramp',
        status: 'success',
        duration: 1500,
        amount: '100000',
        currency: 'NGN',
      });

      const summary = service.getSummary();
      expect(summary.transactionSuccessRate).toBe(1.0);
      expect(summary.onRampMetrics.total).toBe(1);
      expect(summary.onRampMetrics.success).toBe(1);
    });

    it('should track failed transactions', () => {
      trackTransaction({
        transactionId: 'tx-1',
        type: 'off-ramp',
        status: 'failed',
        duration: 500,
        errorType: 'api',
        errorMessage: 'API error',
      });

      const summary = service.getSummary();
      expect(summary.transactionSuccessRate).toBe(0);
      expect(summary.offRampMetrics.total).toBe(1);
      expect(summary.offRampMetrics.failed).toBe(1);
    });

    it('should calculate success rate correctly', () => {
      trackTransaction({
        transactionId: 'tx-1',
        type: 'on-ramp',
        status: 'success',
      });
      trackTransaction({
        transactionId: 'tx-2',
        type: 'on-ramp',
        status: 'success',
      });
      trackTransaction({
        transactionId: 'tx-3',
        type: 'on-ramp',
        status: 'failed',
      });

      const summary = service.getSummary();
      expect(summary.transactionSuccessRate).toBeCloseTo(0.667, 2);
    });
  });

  describe('API Tracking', () => {
    it('should track successful API calls', () => {
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 250,
        success: true,
      });

      const summary = service.getSummary();
      expect(summary.apiErrorRate).toBe(0);
      expect(summary.averageResponseTime).toBe(250);
    });

    it('should track failed API calls', () => {
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 500,
        responseTime: 1000,
        success: false,
        errorType: 'api',
        errorMessage: 'Internal server error',
      });

      const summary = service.getSummary();
      expect(summary.apiErrorRate).toBe(1.0);
    });

    it('should calculate average response time', () => {
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 100,
        success: true,
      });
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 300,
        success: true,
      });

      const summary = service.getSummary();
      expect(summary.averageResponseTime).toBe(200);
    });

    it('should track webhook failures separately', () => {
      trackAPI({
        endpoint: '/api/ramp/webhook',
        method: 'POST',
        statusCode: 500,
        responseTime: 100,
        success: false,
      });

      const summary = service.getSummary();
      expect(summary.webhookFailureRate).toBe(1.0);
    });
  });

  describe('Error Tracking', () => {
    it('should track errors by type', () => {
      trackError({
        type: 'validation',
        message: 'Invalid amount',
        endpoint: '/api/ramp/quote',
      });
      trackError({
        type: 'api',
        message: 'API timeout',
        endpoint: '/api/ramp/payout',
      });
      trackError({
        type: 'validation',
        message: 'Invalid bank account',
        endpoint: '/api/ramp/payout',
      });

      const summary = service.getSummary();
      expect(summary.errorBreakdown.validation).toBe(2);
      expect(summary.errorBreakdown.api).toBe(1);
    });
  });

  describe('Alert Generation', () => {
    it('should generate alert when transaction failure rate exceeds threshold', () => {
      // Create 10 failed transactions to exceed 10% threshold
      for (let i = 0; i < 10; i++) {
        trackTransaction({
          transactionId: `tx-${i}`,
          type: 'on-ramp',
          status: 'failed',
        });
      }

      const alerts = service.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('transaction_failure_rate');
    });

    it('should generate alert when API error rate exceeds threshold', () => {
      // Create 10 failed API calls to exceed 5% threshold
      for (let i = 0; i < 10; i++) {
        trackAPI({
          endpoint: '/api/ramp/quote',
          method: 'POST',
          statusCode: 500,
          responseTime: 100,
          success: false,
        });
      }

      const alerts = service.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('api_error_rate');
    });

    it('should generate alert when response time exceeds threshold', () => {
      // Create API call with response time > 2000ms
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 3000,
        success: true,
      });

      const alerts = service.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].metric).toBe('api_response_time');
    });

    it('should clear alerts', () => {
      // Generate alert
      for (let i = 0; i < 10; i++) {
        trackTransaction({
          transactionId: `tx-${i}`,
          type: 'on-ramp',
          status: 'failed',
        });
      }

      let alerts = service.getAlerts();
      expect(alerts.length).toBeGreaterThan(0);

      // Clear all alerts
      service.clearAllAlerts();
      alerts = service.getAlerts();
      expect(alerts.length).toBe(0);
    });
  });

  describe('Metrics Export', () => {
    it('should export all metrics', () => {
      trackTransaction({
        transactionId: 'tx-1',
        type: 'on-ramp',
        status: 'success',
      });
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 100,
        success: true,
      });
      trackError({
        type: 'validation',
        message: 'Test error',
      });

      const exported = service.exportMetrics();
      expect(exported.transactions.length).toBe(1);
      expect(exported.api.length).toBe(1);
      expect(exported.errors.length).toBe(1);
    });
  });

  describe('Endpoint-Specific Metrics', () => {
    it('should get metrics for specific endpoint', () => {
      trackAPI({
        endpoint: '/api/ramp/quote',
        method: 'POST',
        statusCode: 200,
        responseTime: 100,
        success: true,
      });
      trackAPI({
        endpoint: '/api/ramp/payout',
        method: 'POST',
        statusCode: 200,
        responseTime: 200,
        success: true,
      });

      const quoteMetrics = service.getAPIMetricsByEndpoint('/api/ramp/quote');
      expect(quoteMetrics.total).toBe(1);
      expect(quoteMetrics.averageResponseTime).toBe(100);

      const payoutMetrics = service.getAPIMetricsByEndpoint('/api/ramp/payout');
      expect(payoutMetrics.total).toBe(1);
      expect(payoutMetrics.averageResponseTime).toBe(200);
    });
  });
});
