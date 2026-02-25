/**
 * Monitoring Dashboard Component
 * 
 * Displays monitoring and analytics data for MavaPay integration
 * 
 * Requirements: All (Task 25)
 */

'use client';

import { useState } from 'react';
import { useMonitoring } from '@/hooks/useMonitoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  XCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface MonitoringDashboardProps {
  className?: string;
}

export function MonitoringDashboard({ className }: MonitoringDashboardProps) {
  const [timeWindow, setTimeWindow] = useState<number | undefined>(60 * 60 * 1000); // 1 hour
  const { summary, alerts, clearAlert, clearAllAlerts, refresh, isLoading } = useMonitoring(timeWindow);

  if (isLoading || !summary) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertCircle className="h-4 w-4" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Monitoring Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Real-time analytics for MavaPay integration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeWindow || 'all'}
            onChange={(e) => setTimeWindow(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="900000">Last 15 minutes</option>
            <option value="3600000">Last hour</option>
            <option value="86400000">Last 24 hours</option>
            <option value="604800000">Last 7 days</option>
            <option value="all">All time</option>
          </select>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Active Alerts ({alerts.length})</h3>
            <Button onClick={clearAllAlerts} variant="ghost" size="sm">
              Clear All
            </Button>
          </div>
          {alerts.map((alert) => (
            <Alert key={alert.id} variant={getSeverityColor(alert.severity) as any}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  {getSeverityIcon(alert.severity)}
                  <div>
                    <AlertTitle className="capitalize">{alert.severity} Alert</AlertTitle>
                    <AlertDescription>{alert.message}</AlertDescription>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => clearAlert(alert.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="api">API Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transaction Success Rate</CardTitle>
                {summary.transactionSuccessRate >= 0.9 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(summary.transactionSuccessRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.transactionSuccessRate >= 0.9 ? 'Healthy' : 'Needs attention'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">API Error Rate</CardTitle>
                {summary.apiErrorRate <= 0.05 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(summary.apiErrorRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.apiErrorRate <= 0.05 ? 'Normal' : 'Elevated'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(summary.averageResponseTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.averageResponseTime < 500 ? 'Fast' : summary.averageResponseTime < 2000 ? 'Normal' : 'Slow'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Webhook Failure Rate</CardTitle>
                {summary.webhookFailureRate <= 0.05 ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(summary.webhookFailureRate)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.webhookFailureRate <= 0.05 ? 'Healthy' : 'Issues detected'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>On-Ramp Transactions</CardTitle>
                <CardDescription>NGN → BTC conversions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-medium">{summary.onRampMetrics.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success</span>
                  <span className="font-medium text-green-600">{summary.onRampMetrics.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium text-red-600">{summary.onRampMetrics.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-yellow-600">{summary.onRampMetrics.pending}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="font-bold">{formatPercentage(summary.onRampMetrics.successRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Off-Ramp Transactions</CardTitle>
                <CardDescription>BTC → NGN conversions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-medium">{summary.offRampMetrics.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Success</span>
                  <span className="font-medium text-green-600">{summary.offRampMetrics.success}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium text-red-600">{summary.offRampMetrics.failed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending</span>
                  <span className="font-medium text-yellow-600">{summary.offRampMetrics.pending}</span>
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Success Rate</span>
                    <span className="font-bold">{formatPercentage(summary.offRampMetrics.successRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Performance Metrics</CardTitle>
              <CardDescription>Response times and error rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Average Response Time</span>
                  <Badge variant={summary.averageResponseTime < 500 ? 'default' : summary.averageResponseTime < 2000 ? 'secondary' : 'destructive'}>
                    {formatTime(summary.averageResponseTime)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Error Rate</span>
                  <Badge variant={summary.apiErrorRate <= 0.05 ? 'default' : 'destructive'}>
                    {formatPercentage(summary.apiErrorRate)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Webhook Failure Rate</span>
                  <Badge variant={summary.webhookFailureRate <= 0.05 ? 'default' : 'destructive'}>
                    {formatPercentage(summary.webhookFailureRate)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Breakdown</CardTitle>
              <CardDescription>Errors by type</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(summary.errorBreakdown).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>No errors recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(summary.errorBreakdown).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm capitalize">{type}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
