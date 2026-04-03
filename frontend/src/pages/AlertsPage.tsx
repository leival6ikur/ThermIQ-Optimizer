import React, { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { NotificationDropdown } from '../components/NotificationDropdown';

interface Alert {
  id: number;
  alert_type: 'efficiency' | 'price_opportunity' | 'comfort' | 'maintenance' | 'savings' | 'system_error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  is_active: boolean;
}

export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      // Get all alerts, not just active ones
      const response = await fetch('http://localhost:8000/api/alerts/all?limit=100');
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Refresh every minute
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  const acknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const resolveAlert = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/resolve`, {
        method: 'POST',
      });
      if (response.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  const getAlertIcon = (type: Alert['alert_type'], severity: Alert['severity']) => {
    if (severity === 'critical') return '🚨';
    if (severity === 'warning') return '⚠️';

    switch (type) {
      case 'efficiency':
        return '📉';
      case 'price_opportunity':
        return '💰';
      case 'comfort':
        return '🌡️';
      case 'maintenance':
        return '🔧';
      case 'savings':
        return '💚';
      default:
        return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      default:
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'active') return alert.is_active;
    if (filter === 'resolved') return !alert.is_active;
    return true;
  });

  const activeCount = alerts.filter(a => a.is_active).length;
  const resolvedCount = alerts.filter(a => !a.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All Alerts</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {activeCount} active, {resolvedCount} resolved
              </p>
            </div>
            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <ThemeToggle />
              <a
                href="/"
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                ← Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'active'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'resolved'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Resolved ({resolvedCount})
          </button>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-white dark:bg-gray-800 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-12 text-center">
            <div className="text-4xl mb-4">
              {filter === 'active' ? '✅' : '📭'}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {filter === 'active' ? 'No Active Alerts' : 'No Resolved Alerts'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {filter === 'active'
                ? 'System is running smoothly'
                : 'No alerts have been resolved yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-6 ${getSeverityColor(alert.severity)} ${
                  !alert.is_active ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className="text-3xl">
                      {getAlertIcon(alert.alert_type, alert.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {alert.title}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            alert.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              : alert.severity === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        {!alert.is_active && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            RESOLVED
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                        {alert.message}
                      </p>

                      {/* Metadata */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Created:</span>{' '}
                          {formatDateTime(alert.created_at)}
                        </div>
                        {alert.acknowledged_at && (
                          <div>
                            <span className="font-medium">Acknowledged:</span>{' '}
                            {formatDateTime(alert.acknowledged_at)}
                          </div>
                        )}
                        {alert.resolved_at && (
                          <div>
                            <span className="font-medium">Resolved:</span>{' '}
                            {formatDateTime(alert.resolved_at)}
                          </div>
                        )}
                      </div>

                      {/* Additional Data */}
                      {alert.data && Object.keys(alert.data).length > 0 && (
                        <div className="mt-3 p-3 bg-white/50 dark:bg-gray-900/30 rounded text-xs">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Additional Details:
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(alert.data).map(([key, value]) => (
                              <div key={key}>
                                <span className="text-gray-600 dark:text-gray-400 capitalize">
                                  {key.replace(/_/g, ' ')}:
                                </span>{' '}
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                  {typeof value === 'number' ? value.toFixed(2) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {alert.is_active && (
                    <div className="flex flex-col gap-2 ml-4">
                      {!alert.acknowledged_at && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
                        >
                          ✓ Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border dark:border-gray-600"
                      >
                        ✕ Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
