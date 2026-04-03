import React, { useEffect, useState } from 'react';

interface Alert {
  id: number;
  alert_type: 'efficiency' | 'price_opportunity' | 'comfort' | 'maintenance' | 'savings' | 'system_error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
  acknowledged_at?: string;
  is_active: boolean;
}

interface AlertsPanelProps {
  maxAlerts?: number;
  showAcknowledged?: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  maxAlerts = 5,
  showAcknowledged = false,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/alerts?active_only=${!showAcknowledged}&limit=${maxAlerts}`
      );

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

    // Refresh alerts every 30 seconds
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, [showAcknowledged, maxAlerts]);

  const acknowledgeAlert = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh alerts
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
        // Refresh alerts
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

  const getAlertColor = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-50',
          border: 'border-red-300',
          text: 'text-red-900',
          button: 'hover:bg-red-100',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          text: 'text-yellow-900',
          button: 'hover:bg-yellow-100',
        };
      default:
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-300',
          text: 'text-blue-900',
          button: 'hover:bg-blue-100',
        };
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">✅</div>
        <div className="text-sm">No active alerts - system running smoothly</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const colors = getAlertColor(alert.severity);

        return (
          <div
            key={alert.id}
            className={`${colors.bg} ${colors.border} border rounded-lg p-4 transition-all ${
              alert.acknowledged_at ? 'opacity-60' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-2xl mt-0.5">
                  {getAlertIcon(alert.alert_type, alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-semibold ${colors.text}`}>{alert.title}</h4>
                    <span className="text-xs text-gray-500">{formatTime(alert.created_at)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alert.message}</p>

                  {alert.data && Object.keys(alert.data).length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      {Object.entries(alert.data).map(([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="font-medium capitalize">{key.replace(/_/g, ' ')}:</span>
                          <span>
                            {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1 ml-2">
                {!alert.acknowledged_at && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className={`text-xs px-2 py-1 rounded ${colors.button} transition-colors`}
                    title="Mark as read"
                  >
                    ✓ Ack
                  </button>
                )}
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className={`text-xs px-2 py-1 rounded ${colors.button} transition-colors`}
                  title="Resolve and dismiss"
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
