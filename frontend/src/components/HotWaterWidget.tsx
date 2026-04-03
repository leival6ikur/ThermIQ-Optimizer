import React, { useEffect, useState } from 'react';

interface HotWaterStats {
  period_days: number;
  total_events: number;
  total_energy_kwh: number;
  total_cost: number;
  daily_avg_kwh: number;
  daily_avg_cost: number;
  avg_peak_temp: number | null;
  avg_duration_minutes: number | null;
  legionella_cycles: number;
}

interface HotWaterSchedule {
  hour: number;
  action: string;
  target_temp: number;
  reason: string;
  priority: string;
}

interface HotWaterWidgetProps {
  currentTemp?: number;
  showStats?: boolean;
  showSchedule?: boolean;
}

export const HotWaterWidget: React.FC<HotWaterWidgetProps> = ({
  currentTemp,
  showStats = true,
  showSchedule = true,
}) => {
  const [stats, setStats] = useState<HotWaterStats | null>(null);
  const [schedule, setSchedule] = useState<HotWaterSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (showStats) {
          const statsRes = await fetch('http://localhost:8000/api/hot-water/stats?days=7');
          if (statsRes.ok) {
            const data = await statsRes.json();
            setStats(data);
          }
        }

        if (showSchedule) {
          const scheduleRes = await fetch('http://localhost:8000/api/hot-water/schedule');
          if (scheduleRes.ok) {
            const data = await scheduleRes.json();
            setSchedule(data.schedule || []);
          }
        }
      } catch (err) {
        console.error('Error fetching hot water data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [showStats, showSchedule]);

  const getTempColor = (temp: number | undefined) => {
    if (!temp) return 'text-gray-400 dark:text-gray-600';
    if (temp >= 60) return 'text-red-600 dark:text-red-400';
    if (temp >= 50) return 'text-orange-600 dark:text-orange-400';
    if (temp >= 45) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getTempStatus = (temp: number | undefined) => {
    if (!temp) return 'Unknown';
    if (temp >= 60) return 'Legionella Protection';
    if (temp >= 50) return 'Hot - Ready';
    if (temp >= 45) return 'Warm';
    return 'Heating Needed';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Temperature Card */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-orange-200 dark:border-orange-900/30 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2">
              Hot Water Tank
            </h3>
            <div className="flex items-baseline gap-2">
              <div className={`text-4xl font-bold ${getTempColor(currentTemp)}`}>
                {currentTemp ? `${currentTemp.toFixed(1)}°C` : '--°C'}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400">
                {getTempStatus(currentTemp)}
              </div>
            </div>
          </div>
          <div className="text-4xl">🚿</div>
        </div>

        {currentTemp && currentTemp < 45 && (
          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded text-sm text-yellow-800 dark:text-yellow-300">
            ⚠️ Temperature low - heating may be needed
          </div>
        )}

        {currentTemp && currentTemp >= 60 && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded text-sm text-green-800 dark:text-green-300">
            ✓ Legionella protection active (≥60°C)
          </div>
        )}
      </div>

      {/* Stats Card */}
      {showStats && stats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            7-Day Hot Water Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily Energy</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.daily_avg_kwh.toFixed(1)} kWh
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Daily Cost</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                €{stats.daily_avg_cost.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Heating Events</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_events}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Peak Temp</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avg_peak_temp ? `${stats.avg_peak_temp.toFixed(1)}°C` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Duration</div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {stats.avg_duration_minutes ? `${stats.avg_duration_minutes.toFixed(0)}min` : '--'}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Legionella Cycles</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.legionella_cycles}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Card */}
      {showSchedule && schedule.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Today's Hot Water Schedule
          </h4>
          <div className="space-y-3">
            {schedule.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {item.hour.toString().padStart(2, '0')}:00
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      Heat to {item.target_temp}°C
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {item.reason.replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                  {item.priority.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!showStats && !showSchedule && !currentTemp && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-600 dark:text-gray-400">
          No hot water data available yet. Keep the system running to collect data.
        </div>
      )}
    </div>
  );
};
