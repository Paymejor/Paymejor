# Monitoring and Analytics Implementation

## Overview

This document describes the implementation of monitoring and analytics for the MavaPay BTC ↔ NGN on/off-ramp integration (Task 25).

## Implementation Summary

### Core Components

1. **Monitoring Service** (`frontend/lib/monitoring.ts`)
   - Singleton service for tracking metrics
   - Stores metrics in localStorage with 7-day retention
   - Provides real-time analytics and alerting

2. **useMonitoring Hook** (`frontend/hooks/useMonitoring.ts`)
   - React hook for accessing monitoring data
   - Auto-refresh capability
   - Alert management

3. **Monitoring Dashboard** (`frontend/components/monitoring-dashboard.tsx`)
   - Visual dashboard for viewing metrics
   - Real-time updates
   - Alert notifications

### Features Implemented

#### 1. Transaction Success Rate Tracking
- Tracks all on-ramp and off-ramp transactions
- Calculates success rate by transaction type
- Provides breakdown of success/failed/pending transactions
- **Location**: `MonitoringService.trackTransaction()`

#### 2. API Response Time Monitoring
- Tracks response time for all API endpoints
- Calculates average response time
- Endpoint-specific metrics
- **Location**: `MonitoringService.trackAPI()`

#### 3. Error Rate Tracking by Type
- Categorizes errors by type (validation, api, network, payment, webhook, unknown)
- Provides error breakdown statistics
- Tracks error frequency
- **Location**: `MonitoringService.trackError()`

#### 4. Anomaly Detection and Alerting
- Automatic alert generation when thresholds exceeded
- Configurable alert thresholds:
  - Transaction failure rate > 10%
  - API error rate > 5%
  - API response time > 2000ms
  - Webhook failure rate > 5%
- Alert severity levels (low, medium, high, critical)
- **Location**: `MonitoringService.checkAlerts()`

### Integration Points

#### API Routes
All API routes now track metrics:

1. **Quote Endpoint** (`/api/ramp/quote`)
   - Tracks successful quote requests
   - Tracks validation errors
   - Tracks API errors
   - Records response times

2. **Payout Endpoint** (`/api/ramp/payout`)
   - Tracks successful payout initiations
   - Tracks validation errors
   - Tracks API errors
   - Records response times

3. **On-Ramp Endpoint** (`/api/ramp/on-ramp`)
   - Tracks successful on-ramp initiations
   - Tracks validation errors
   - Tracks API errors
   - Records response times

4. **Webhook Endpoint** (`/api/ramp/webhook`)
   - Tracks successful webhook processing
   - Tracks webhook failures
   - Records processing times

#### Frontend Hooks

**useMavaPay Hook** (`frontend/hooks/useMavaPay.ts`)
- Tracks transaction initiations (success/failure)
- Tracks error occurrences
- Records transaction durations

### Metrics Tracked

#### Transaction Metrics
```typescript
{
  transactionId: string;
  type: 'on-ramp' | 'off-ramp';
  status: 'success' | 'failed' | 'pending';
  duration?: number;
  errorType?: string;
  errorMessage?: string;
  amount?: string;
  currency?: string;
}
```

#### API Metrics
```typescript
{
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  success: boolean;
  errorType?: string;
  errorMessage?: string;
  retryCount?: number;
}
```

#### Error Metrics
```typescript
{
  type: 'validation' | 'api' | 'network' | 'payment' | 'webhook' | 'unknown';
  message: string;
  endpoint?: string;
  statusCode?: number;
  stack?: string;
  metadata?: Record<string, any>;
}
```

### Alert Configuration

Default alert thresholds:

| Metric | Threshold | Window | Severity |
|--------|-----------|--------|----------|
| Transaction Failure Rate | 10% | 1 hour | High/Critical |
| API Error Rate | 5% | 1 hour | High/Critical |
| API Response Time | 2000ms | 15 minutes | Medium/High |
| Webhook Failure Rate | 5% | 1 hour | High/Critical |

### Data Storage

- **Storage**: Browser localStorage
- **Retention**: 7 days
- **Cleanup**: Automatic hourly cleanup
- **Keys**:
  - `mavapay_transaction_metrics`
  - `mavapay_api_metrics`
  - `mavapay_error_metrics`
  - `mavapay_alerts`

### Usage Examples

#### Tracking a Transaction
```typescript
import { trackTransaction } from '@/lib/monitoring';

trackTransaction({
  transactionId: 'tx-123',
  type: 'off-ramp',
  status: 'success',
  duration: 1500,
  amount: '100000',
  currency: 'BTC',
});
```

#### Tracking an API Call
```typescript
import { trackAPI } from '@/lib/monitoring';

const startTime = Date.now();
// ... make API call ...
const duration = Date.now() - startTime;

trackAPI({
  endpoint: '/api/ramp/quote',
  method: 'POST',
  statusCode: 200,
  responseTime: duration,
  success: true,
});
```

#### Tracking an Error
```typescript
import { trackError } from '@/lib/monitoring';

trackError({
  type: 'validation',
  message: 'Invalid amount',
  endpoint: '/api/ramp/quote',
});
```

#### Using the Monitoring Hook
```typescript
import { useMonitoring } from '@/hooks/useMonitoring';

function MyComponent() {
  const { summary, alerts, clearAlert } = useMonitoring(
    60 * 60 * 1000, // 1 hour window
    true, // auto-refresh
    30000 // refresh every 30 seconds
  );

  return (
    <div>
      <p>Success Rate: {(summary.transactionSuccessRate * 100).toFixed(1)}%</p>
      <p>API Error Rate: {(summary.apiErrorRate * 100).toFixed(1)}%</p>
      <p>Avg Response Time: {summary.averageResponseTime.toFixed(0)}ms</p>
      
      {alerts.map(alert => (
        <Alert key={alert.id} severity={alert.severity}>
          {alert.message}
          <button onClick={() => clearAlert(alert.id)}>Clear</button>
        </Alert>
      ))}
    </div>
  );
}
```

### Monitoring Dashboard

The monitoring dashboard provides a comprehensive view of all metrics:

- **Overview Tab**: Key metrics at a glance
- **Transactions Tab**: Detailed transaction metrics by type
- **API Performance Tab**: Response times and error rates
- **Errors Tab**: Error breakdown by type

Access the dashboard by importing and rendering the `MonitoringDashboard` component.

### Testing

Tests are located in:
- `frontend/lib/__tests__/monitoring.test.ts` - Comprehensive unit tests
- `frontend/lib/__tests__/monitoring-integration.test.ts` - Integration tests

Run tests:
```bash
npm test lib/__tests__/monitoring
```

### Future Enhancements

Potential improvements for future iterations:

1. **Server-Side Persistence**: Move from localStorage to database
2. **Real-Time Streaming**: WebSocket-based real-time updates
3. **Advanced Analytics**: Trend analysis, predictions
4. **Custom Dashboards**: User-configurable dashboard layouts
5. **Export Functionality**: CSV/JSON export of metrics
6. **Integration with External Services**: DataDog, New Relic, etc.
7. **Performance Metrics**: Memory usage, bundle size tracking
8. **User Behavior Analytics**: User flow tracking

### Requirements Satisfied

This implementation satisfies all requirements from Task 25:

- ✅ Implement transaction success rate tracking
- ✅ Add API response time monitoring
- ✅ Track error rates by type
- ✅ Set up alerts for anomalies

All requirements from the design document are met.

## Conclusion

The monitoring and analytics system is now fully integrated into the MavaPay ramp feature, providing comprehensive visibility into system health, performance, and reliability. The system automatically tracks all transactions, API calls, and errors, and generates alerts when anomalies are detected.
