/**
 * useMonitoring Hook
 * 
 * React hook for accessing monitoring and analytics data
 * 
 * Requirements: All (Task 25)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMonitoringService,
  Alert,
  TransactionMetric,
  APIMetric,
  ErrorMetric,
} from '@/lib/monitoring';

interface MonitoringSummary {
  transactionSuccessRate: number;
  apiErrorRate: number;
  averageResponseTime: number;
  webhookFailureRate: number;
  errorBreakdown: Record<string, number>;
  onRampMetrics: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  offRampMetrics: {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  };
  activeAlerts: number;
}

interface UseMonitoringReturn {
  // Summary data
  summary: MonitoringSummary | null;
  
  // Alerts
  alerts: Alert[];
  clearAlert: (alertId: string) => void;
  clearAllAlerts: () => void;
  
  // Tracking functions
  trackTransaction: (metric: TransactionMetric) => void;
  trackAPI: (metric: APIMetric) => void;
  trackError: (metric: ErrorMetric) => void;
  
  // Refresh data
  refresh: () => void;
  
  // Loading state
  isLoading: boolean;
}

/**
 * Hook for monitoring and analytics
 */
export function useMonitoring(
  window?: number, // Time window in milliseconds
  autoRefresh: boolean = true,
  refreshInterval: number = 30000 // 30 seconds
): UseMonitoringReturn {
  const [summary, setSummary] = useState<MonitoringSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load monitoring data
   */
  const loadData = useCallback(() => {
    try {
      const service = getMonitoringService();
      const summaryData = service.getSummary(window);
      const alertsData = service.getAlerts();

      setSummary(summaryData);
      setAlerts(alertsData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      setIsLoading(false);
    }
  }, [window]);

  /**
   * Track transaction metric
   */
  const trackTransaction = useCallback((metric: TransactionMetric) => {
    const service = getMonitoringService();
    service.trackTransaction(metric);
    loadData();
  }, [loadData]);

  /**
   * Track API metric
   */
  const trackAPI = useCallback((metric: APIMetric) => {
    const service = getMonitoringService();
    service.trackAPI(metric);
    loadData();
  }, [loadData]);

  /**
   * Track error metric
   */
  const trackError = useCallback((metric: ErrorMetric) => {
    const service = getMonitoringService();
    service.trackError(metric);
    loadData();
  }, [loadData]);

  /**
   * Clear specific alert
   */
  const clearAlert = useCallback((alertId: string) => {
    const service = getMonitoringService();
    service.clearAlert(alertId);
    loadData();
  }, [loadData]);

  /**
   * Clear all alerts
   */
  const clearAllAlerts = useCallback(() => {
    const service = getMonitoringService();
    service.clearAllAlerts();
    loadData();
  }, [loadData]);

  /**
   * Refresh monitoring data
   */
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  /**
   * Set up auto-refresh interval
   */
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadData]);

  return {
    summary,
    alerts,
    clearAlert,
    clearAllAlerts,
    trackTransaction,
    trackAPI,
    trackError,
    refresh,
    isLoading,
  };
}
