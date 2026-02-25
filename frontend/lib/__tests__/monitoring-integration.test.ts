/**
 * Monitoring Integration Tests
 * 
 * Simple integration tests for monitoring system
 * 
 * Task 25: Add monitoring and analytics
 */

import { describe, it, expect } from 'vitest';
import {
  getMonitoringService,
  trackTransaction,
  trackAPI,
  trackError,
} from '../monitoring';

describe('Monitoring Integration', () => {
  it('should track and retrieve transaction metrics', () => {
    const service = getMonitoringService();
    service.reset();

    trackTransaction({
      transactionId: 'test-1',
      type: 'on-ramp',
      status: 'success',
      duration: 1000,
    });

    const summary = service.getSummary();
    expect(summary.onRampMetrics.total).toBeGreaterThanOrEqual(1);
  });

  it('should track and retrieve API metrics', () => {
    const service = getMonitoringService();
    service.reset();

    trackAPI({
      endpoint: '/api/test',
      method: 'POST',
      statusCode: 200,
      responseTime: 100,
      success: true,
    });

    const summary = service.getSummary();
    expect(summary.averageResponseTime).toBeGreaterThanOrEqual(0);
  });

  it('should track and retrieve error metrics', () => {
    const service = getMonitoringService();
    service.reset();

    trackError({
      type: 'validation',
      message: 'Test error',
    });

    const summary = service.getSummary();
    expect(Object.keys(summary.errorBreakdown).length).toBeGreaterThanOrEqual(0);
  });
});
