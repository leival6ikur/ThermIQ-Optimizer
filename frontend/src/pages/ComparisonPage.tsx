import React, { useEffect, useState } from 'react';
import { ThemeToggle } from '../components/ThemeToggle';
import { NotificationDropdown } from '../components/NotificationDropdown';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ComparisonData {
  week1?: PeriodData;
  week2?: PeriodData;
  month1?: PeriodData;
  month2?: PeriodData;
  changes: ChangeData;
}

interface PeriodData {
  label: string;
  energy_kwh: number;
  cost: number;
  avg_indoor_temp: number;
  comfort_score: number;
  duty_cycle: number;
  heating_hours: number;
}

interface ChangeData {
  energy_change_percent: number;
  cost_change_percent: number;
  comfort_change_points: number;
  temp_change_celsius: number;
  energy_improved: boolean;
  cost_improved: boolean;
  comfort_improved: boolean;
}

interface DailyData {
  date: string;
  day_name: string;
  energy_kwh: number;
  cost: number;
  comfort_score: number;
}

export const ComparisonPage: React.FC = () => {
  const [weekComparison, setWeekComparison] = useState<ComparisonData | null>(null);
  const [monthComparison, setMonthComparison] = useState<ComparisonData | null>(null);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [weekRes, monthRes, dailyRes] = await Promise.all([
          fetch('http://localhost:8000/api/compare/week'),
          fetch('http://localhost:8000/api/compare/month'),
          fetch('http://localhost:8000/api/compare/daily?days=14'),
        ]);

        if (weekRes.ok) {
          setWeekComparison(await weekRes.json());
        }
        if (monthRes.ok) {
          setMonthComparison(await monthRes.json());
        }
        if (dailyRes.ok) {
          const data = await dailyRes.json();
          setDailyData(data.daily_data);
        }
      } catch (err) {
        console.error('Error fetching comparison data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const comparison = viewMode === 'week' ? weekComparison : monthComparison;

  // Get period data based on view mode
  const period1 = viewMode === 'week' ? comparison?.week1 : comparison?.month1;
  const period2 = viewMode === 'week' ? comparison?.week2 : comparison?.month2;

  const formatChange = (value: number, improved: boolean) => {
    const sign = value > 0 ? '+' : '';
    const color = improved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
    return <span className={`font-semibold ${color}`}>{sign}{value}%</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Logo - Click to go home */}
              <a href="/" className="flex items-center transition-opacity hover:opacity-80" title="Thermi-Nator Home">
                <img
                  src="/logo_v3.svg"
                  alt="Thermi-Nator"
                  style={{ height: '67px', width: 'auto', objectFit: 'contain' }}
                />
              </a>
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
        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setViewMode('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'week'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Week Comparison
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'month'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Month Comparison
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading comparison data...</p>
          </div>
        ) : comparison ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Period 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Current {viewMode === 'week' ? 'Week' : 'Month'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{period1?.label}</p>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Energy Used:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period1?.energy_kwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">€{period1?.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Comfort Score:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period1?.comfort_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Temperature:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period1?.avg_indoor_temp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Heating Hours:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period1?.heating_hours}h</span>
                  </div>
                </div>
              </div>

              {/* Period 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Previous {viewMode === 'week' ? 'Week' : 'Month'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{period2?.label}</p>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Energy Used:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period2?.energy_kwh} kWh</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">€{period2?.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Comfort Score:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period2?.comfort_score}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Avg Temperature:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period2?.avg_indoor_temp}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Heating Hours:</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">{period2?.heating_hours}h</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 dark:from-gray-800 dark:to-gray-800 rounded-lg shadow-sm border border-blue-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                📊 Performance Change
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Energy Usage</div>
                  <div className="text-2xl">
                    {formatChange(comparison.changes.energy_change_percent, comparison.changes.energy_improved)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {comparison.changes.energy_improved ? '✓ Reduced' : '⚠️ Increased'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cost</div>
                  <div className="text-2xl">
                    {formatChange(comparison.changes.cost_change_percent, comparison.changes.cost_improved)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {comparison.changes.cost_improved ? '✓ Saved money' : '⚠️ Higher cost'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Comfort</div>
                  <div className="text-2xl">
                    <span className={`font-semibold ${
                      comparison.changes.comfort_improved ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {comparison.changes.comfort_change_points > 0 ? '+' : ''}{comparison.changes.comfort_change_points}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {comparison.changes.comfort_improved ? '✓ Better' : '⚠️ Lower'}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Temperature</div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {comparison.changes.temp_change_celsius > 0 ? '+' : ''}{comparison.changes.temp_change_celsius}°C
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Average change
                  </div>
                </div>
              </div>
            </div>

            {/* Daily Breakdown Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Daily Energy & Cost Breakdown (Last 14 Days)
              </h3>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis
                    dataKey="day_name"
                    stroke="#6B7280"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#3B82F6"
                    tick={{ fill: '#3B82F6' }}
                    label={{ value: 'Energy (kWh)', angle: -90, position: 'insideLeft', fill: '#3B82F6' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#10B981"
                    tick={{ fill: '#10B981' }}
                    label={{ value: 'Cost (€)', angle: 90, position: 'insideRight', fill: '#10B981' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(31, 41, 55, 0.9)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="energy_kwh" fill="#3B82F6" name="Energy (kWh)" />
                  <Bar yAxisId="right" dataKey="cost" fill="#10B981" name="Cost (€)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">No comparison data available</p>
          </div>
        )}
      </main>
    </div>
  );
};
