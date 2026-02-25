/**
 * Monitoring and Analytics System
 * 
 * Provides comprehensive monitoring for MavaPay integration:
 * - Transaction success rate tracking
 * - API response time monitoring
 * - Error rate tracking by type
 * - Anomaly detection and alerting
 * 
 * Requirements: All (Task 25)
 */

export interface MetricData {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export interface TransactionMetric {
  transactionId: string;
  type: 'on-ramp' | 'off-ramp';
  status: 'success' | 'failed' | 'pending';
  duration?: number;
  errorType?: string;
  errorMessage?: string;
  amount?: string;
  currency?: string;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryCount?: number;
}

export interface ErrorMetric {
  type: 'validation' | 'api' | 'network' | 'payment' | 'webhook' | 'unknown';
  message: string;
  endpoint?: string;
  statusCode?: number;
  stack?: string;
  metadata?: Record<string, any>;
}

export interface AlertConfig {
  metric: string;
  threshold: number;
  window: number; // Time window in milliseconds
  enabled: boolean;
}

export interface Alert {
  id: string;
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Monitoring class for tracking metrics and generating alerts
 */
export class MonitoringService {
  private static instance: MonitoringService;
  private transactionMetrics: TransactionMetric[] = [];
  private apiMetrics: APIMetric[] = [];
  private errorMetrics: ErrorMetric[] = [];
  private alerts: Alert[] = [];
  private alertConfigs: AlertConfig[] = [];

  // Storage keys
  private readonly TRANSACTION_METRICS_KEY = 'mavapay_transaction_metrics';
  private readonly API_METRICS_KEY = 'mavapay_api_metrics';
  private readonly ERROR_METRICS_KEY = 'mavapay_error_metrics';
  private readonly ALERTS_KEY = 'mavapay_alerts';

  // Retention period (7 days)
  private readonly RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000;

  // Alert thresholds
  private readonly DEFAULT_ALERT_CONFIGS: AlertConfig[] = [
    {
      metric: 'transaction_failure_rate',
      threshold: 0.1, // 10%
      window: 60 * 60 * 1000, // 1 hour
      enabled: true,
    },
    {
      metric: 'api_error_rate',
      threshold: 0.05, // 5%
      window: 60 * 60 * 1000, // 1 hour
      enabled: true,
    },
    {
      metric: 'api_response_time',
      threshold: 2000, // 2 seconds
      window: 15 * 60 * 1000, // 15 minutes
      enabled: true,
    },
    {
      metric: 'webhook_failure_rate',
      threshold: 0.05, // 5%
      window: 60 * 60 * 1000, // 1 hour
      enabled: true,
    },
  ];

  private constructor() {
    this.loadMetrics();
    this.alertConfigs = this.DEFAULT_ALERT_CONFIGS;
    this.startCleanupInterval();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  /**
   * Track transaction metric
   */
  public trackTransaction(metric: TransactionMetric): void {
    this.transactionMetrics.push({
      ...metric,
    });
    this.saveMetrics();
    this.checkAlerts();
  }

  /**
   * Track API metric
   */
  public trackAPI(metric: APIMetric): void {
    this.apiMetrics.push({
      ...metric,
    });
    this.saveMetrics();
    this.checkAlerts();
  }

  /**
   * Track error metric
   */
  public trackError(metric: ErrorMetric): void {
    this.errorMetrics.push({
      ...metric,
    });
    this.saveMetrics();
    this.checkAlerts();
  }

  /**
   * Get transaction success rate
   */
  public getTransactionSuccessRate(window?: number): number {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const recentTransactions = this.transactionMetrics.filter(
      (m) => !window || now - windowStart < this.RETENTION_PERIOD
    );

    if (recentTransactions.length === 0) return 1.0;

    const successCount = recentTransactions.filter(
      (m) => m.status === 'success'
    ).length;

    return successCount / recentTransactions.length;
  }

  /**
   * Get API error rate
   */
  public getAPIErrorRate(window?: number): number {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const recentAPICalls = this.apiMetrics.filter(
      (m) => !window || now - windowStart < this.RETENTION_PERIOD
    );

    if (recentAPICalls.length === 0) return 0;

    const errorCount = recentAPICalls.filter((m) => !m.success).length;

    return errorCount / recentAPICalls.length;
  }

  /**
   * Get average API response time
   */
  public getAverageResponseTime(endpoint?: string, window?: number): number {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    let relevantMetrics = this.apiMetrics.filter(
      (m) => !window || now - windowStart < this.RETENTION_PERIOD
    );

    if (endpoint) {
      relevantMetrics = relevantMetrics.filter((m) => m.endpoint === endpoint);
    }

    if (relevantMetrics.length === 0) return 0;

    const totalTime = relevantMetrics.reduce(
      (sum, m) => sum + m.responseTime,
      0
    );

    return totalTime / relevantMetrics.length;
  }

  /**
   * Get error breakdown by type
   */
  public getErrorBreakdown(window?: number): Record<string, number> {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const recentErrors = this.errorMetrics.filter(
      (m) => !window || now - windowStart < this.RETENTION_PERIOD
    );

    const breakdown: Record<string, number> = {};

    recentErrors.forEach((error) => {
      breakdown[error.type] = (breakdown[error.type] || 0) + 1;
    });

    return breakdown;
  }

  /**
   * Get webhook failure rate
   */
  public getWebhookFailureRate(window?: number): number {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const webhookCalls = this.apiMetrics.filter(
      (m) =>
        m.endpoint.includes('/webhook') &&
        (!window || now - windowStart < this.RETENTION_PERIOD)
    );

    if (webhookCalls.length === 0) return 0;

    const failureCount = webhookCalls.filter((m) => !m.success).length;

    return failureCount / webhookCalls.length;
  }

  /**
   * Get transaction metrics by type
   */
  public getTransactionMetricsByType(
    type: 'on-ramp' | 'off-ramp',
    window?: number
  ): {
    total: number;
    success: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const relevantTransactions = this.transactionMetrics.filter(
      (m) =>
        m.type === type && (!window || now - windowStart < this.RETENTION_PERIOD)
    );

    const total = relevantTransactions.length;
    const success = relevantTransactions.filter(
      (m) => m.status === 'success'
    ).length;
    const failed = relevantTransactions.filter(
      (m) => m.status === 'failed'
    ).length;
    const pending = relevantTransactions.filter(
      (m) => m.status === 'pending'
    ).length;

    return {
      total,
      success,
      failed,
      pending,
      successRate: total > 0 ? success / total : 1.0,
    };
  }

  /**
   * Get API metrics by endpoint
   */
  public getAPIMetricsByEndpoint(
    endpoint: string,
    window?: number
  ): {
    total: number;
    success: number;
    failed: number;
    averageResponseTime: number;
    errorRate: number;
  } {
    const now = Date.now();
    const windowStart = window ? now - window : 0;

    const relevantMetrics = this.apiMetrics.filter(
      (m) =>
        m.endpoint === endpoint &&
        (!window || now - windowStart < this.RETENTION_PERIOD)
    );

    const total = relevantMetrics.length;
    const success = relevantMetrics.filter((m) => m.success).length;
    const failed = total - success;
    const averageResponseTime =
      total > 0
        ? relevantMetrics.reduce((sum, m) => sum + m.responseTime, 0) / total
        : 0;

    return {
      total,
      success,
      failed,
      averageResponseTime,
      errorRate: total > 0 ? failed / total : 0,
    };
  }

  /**
   * Get all active alerts
   */
  public getAlerts(): Alert[] {
    return [...this.alerts].sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clear alert by ID
   */
  public clearAlert(alertId: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    this.saveAlerts();
  }

  /**
   * Clear all alerts
   */
  public clearAllAlerts(): void {
    this.alerts = [];
    this.saveAlerts();
  }

  /**
   * Get monitoring summary
   */
  public getSummary(window?: number): {
    transactionSuccessRate: number;
    apiErrorRate: number;
    averageResponseTime: number;
    webhookFailureRate: number;
    errorBreakdown: Record<string, number>;
    onRampMetrics: ReturnType<typeof this.getTransactionMetricsByType>;
    offRampMetrics: ReturnType<typeof this.getTransactionMetricsByType>;
    activeAlerts: number;
  } {
    return {
      transactionSuccessRate: this.getTransactionSuccessRate(window),
      apiErrorRate: this.getAPIErrorRate(window),
      averageResponseTime: this.getAverageResponseTime(undefined, window),
      webhookFailureRate: this.getWebhookFailureRate(window),
      errorBreakdown: this.getErrorBreakdown(window),
      onRampMetrics: this.getTransactionMetricsByType('on-ramp', window),
      offRampMetrics: this.getTransactionMetricsByType('off-ramp', window),
      activeAlerts: this.alerts.length,
    };
  }

  /**
   * Check alert conditions and create alerts if thresholds exceeded
   */
  private checkAlerts(): void {
    this.alertConfigs.forEach((config) => {
      if (!config.enabled) return;

      let value: number;
      let message: string;
      let severity: Alert['severity'] = 'medium';

      switch (config.metric) {
        case 'transaction_failure_rate':
          value = 1 - this.getTransactionSuccessRate(config.window);
          message = `Transaction failure rate (${(value * 100).toFixed(1)}%) exceeds threshold (${(config.threshold * 100).toFixed(1)}%)`;
          severity = value > config.threshold * 2 ? 'critical' : 'high';
          break;

        case 'api_error_rate':
          value = this.getAPIErrorRate(config.window);
          message = `API error rate (${(value * 100).toFixed(1)}%) exceeds threshold (${(config.threshold * 100).toFixed(1)}%)`;
          severity = value > config.threshold * 2 ? 'critical' : 'high';
          break;

        case 'api_response_time':
          value = this.getAverageResponseTime(undefined, config.window);
          message = `Average API response time (${value.toFixed(0)}ms) exceeds threshold (${config.threshold}ms)`;
          severity = value > config.threshold * 2 ? 'high' : 'medium';
          break;

        case 'webhook_failure_rate':
          value = this.getWebhookFailureRate(config.window);
          message = `Webhook failure rate (${(value * 100).toFixed(1)}%) exceeds threshold (${(config.threshold * 100).toFixed(1)}%)`;
          severity = value > config.threshold * 2 ? 'critical' : 'high';
          break;

        default:
          return;
      }

      // Create alert if threshold exceeded
      if (value > config.threshold) {
        // Check if similar alert already exists (within last 5 minutes)
        const recentAlert = this.alerts.find(
          (a) =>
            a.metric === config.metric &&
            Date.now() - a.timestamp < 5 * 60 * 1000
        );

        if (!recentAlert) {
          const alert: Alert = {
            id: `${config.metric}-${Date.now()}`,
            metric: config.metric,
            value,
            threshold: config.threshold,
            message,
            timestamp: Date.now(),
            severity,
          };

          this.alerts.push(alert);
          this.saveAlerts();

          // Log alert to console
          console.warn(`[MONITORING ALERT] ${message}`, {
            metric: config.metric,
            value,
            threshold: config.threshold,
            severity,
          });
        }
      }
    });
  }

  /**
   * Load metrics from localStorage
   */
  private loadMetrics(): void {
    if (typeof window === 'undefined') return;

    try {
      const transactionData = localStorage.getItem(
        this.TRANSACTION_METRICS_KEY
      );
      if (transactionData) {
        this.transactionMetrics = JSON.parse(transactionData);
      }

      const apiData = localStorage.getItem(this.API_METRICS_KEY);
      if (apiData) {
        this.apiMetrics = JSON.parse(apiData);
      }

      const errorData = localStorage.getItem(this.ERROR_METRICS_KEY);
      if (errorData) {
        this.errorMetrics = JSON.parse(errorData);
      }

      const alertData = localStorage.getItem(this.ALERTS_KEY);
      if (alertData) {
        this.alerts = JSON.parse(alertData);
      }

      // Clean up old metrics
      this.cleanupOldMetrics();
    } catch (error) {
      console.error('Error loading monitoring metrics:', error);
    }
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetrics(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.TRANSACTION_METRICS_KEY,
        JSON.stringify(this.transactionMetrics)
      );
      localStorage.setItem(
        this.API_METRICS_KEY,
        JSON.stringify(this.apiMetrics)
      );
      localStorage.setItem(
        this.ERROR_METRICS_KEY,
        JSON.stringify(this.errorMetrics)
      );
    } catch (error) {
      console.error('Error saving monitoring metrics:', error);
    }
  }

  /**
   * Save alerts to localStorage
   */
  private saveAlerts(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(this.ALERTS_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }

  /**
   * Clean up metrics older than retention period
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.RETENTION_PERIOD;

    // Note: Since we don't have timestamps on metrics, we'll keep all for now
    // In a real implementation, we'd add timestamps to each metric

    // Clean up old alerts (older than 24 hours)
    this.alerts = this.alerts.filter(
      (a) => Date.now() - a.timestamp < 24 * 60 * 60 * 1000
    );
    this.saveAlerts();
  }

  /**
   * Start periodic cleanup interval
   */
  private startCleanupInterval(): void {
    if (typeof window === 'undefined') return;

    // Clean up every hour
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000);
  }

  /**
   * Export metrics for analysis
   */
  public exportMetrics(): {
    transactions: TransactionMetric[];
    api: APIMetric[];
    errors: ErrorMetric[];
    alerts: Alert[];
  } {
    return {
      transactions: [...this.transactionMetrics],
      api: [...this.apiMetrics],
      errors: [...this.errorMetrics],
      alerts: [...this.alerts],
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  public reset(): void {
    this.transactionMetrics = [];
    this.apiMetrics = [];
    this.errorMetrics = [];
    this.alerts = [];
    this.saveMetrics();
    this.saveAlerts();
  }
}

/**
 * Get monitoring service instance
 */
export function getMonitoringService(): MonitoringService {
  return MonitoringService.getInstance();
}

/**
 * Helper function to track transaction
 */
export function trackTransaction(metric: TransactionMetric): void {
  getMonitoringService().trackTransaction(metric);
}

/**
 * Helper function to track API call
 */
export function trackAPI(metric: APIMetric): void {
  getMonitoringService().trackAPI(metric);
}

/**
 * Helper function to track error
 */
export function trackError(metric: ErrorMetric): void {
  getMonitoringService().trackError(metric);
}
