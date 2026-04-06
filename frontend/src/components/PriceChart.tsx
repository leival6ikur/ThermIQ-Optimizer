import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { ElectricityPrice, VATConfig } from '../types/index.js';

interface PriceChartProps {
  prices: ElectricityPrice[];
  currentHour?: number;
  vatConfig?: VATConfig;
  viewMode?: 'today' | 'tomorrow' | 'rolling';
  onViewModeChange?: (mode: 'today' | 'tomorrow' | 'rolling') => void;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  prices,
  currentHour: _currentHour,
  vatConfig,
  viewMode = 'today',
  onViewModeChange,
}) => {
  if (!prices || prices.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Electricity Prices</h3>
        <div className="text-center text-gray-500 py-8">
          No price data available
        </div>
      </div>
    );
  }

  const vatLabel = vatConfig?.vat_enabled
    ? ` (incl. ${vatConfig.vat_rate}% VAT)`
    : '';

  // Convert prices to ¢/kWh and prepare chart data
  let chartData;

  if (viewMode === 'rolling') {
    // Rolling view: center on current hour, show exactly 12 before and 12 after
    const now = new Date();
    const currentHourStart = new Date(now);
    currentHourStart.setMinutes(0, 0, 0);
    const currentHourTime = currentHourStart.getTime();

    // Calculate time boundaries: 12 hours before and 12 hours after current hour
    const startTime = currentHourTime - (12 * 60 * 60 * 1000);
    const endTime = currentHourTime + (12 * 60 * 60 * 1000);

    // Filter prices within the rolling window
    const rollingPrices = prices
      .filter(p => {
        // Parse UTC timestamp properly
        const pTime = new Date(p.timestamp).getTime();
        return pTime >= startTime && pTime <= endTime;
      })
      .sort((a, b) => {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });

    chartData = rollingPrices.map((price) => {
      // Parse UTC timestamp and convert to browser's local timezone
      const timestamp = new Date(price.timestamp);
      const hour = timestamp.getHours(); // Gets local hour
      const hoursFromNow = Math.round((timestamp.getTime() - currentHourTime) / (1000 * 60 * 60));

      let label: string;
      if (hoursFromNow === 0) {
        label = 'Now';
      } else if (hoursFromNow > 0) {
        label = `+${hoursFromNow}h`;
      } else {
        label = `${hoursFromNow}h`;
      }

      return {
        hour: label,
        actualHour: hour,
        price: Number((price.price / 10).toFixed(2)),
        originalPrice: price.price,
        timestamp: timestamp.getTime(),
        isCurrent: hoursFromNow === 0,
      };
    });
  } else {
    // Today/Tomorrow view: show prices from 0:00-23:00 for the selected day
    const now = new Date();
    const targetDate = viewMode === 'tomorrow'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Define boundaries for the target day (0:00 to 23:59:59 local time)
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // Filter prices for the target day and deduplicate by hour
    const priceMap = new Map<number, any>();
    prices.forEach((price) => {
      // Parse UTC timestamp and convert to browser's local timezone
      const timestamp = new Date(price.timestamp);
      const timestampTime = timestamp.getTime();

      // Only include prices within the target day
      if (timestampTime >= dayStart.getTime() && timestampTime <= dayEnd.getTime()) {
        const hour = timestamp.getHours(); // Gets local hour
        if (!priceMap.has(hour)) {
          priceMap.set(hour, {
            hour: `${hour}:00`,
            actualHour: hour,
            price: Number((price.price / 10).toFixed(2)),
            originalPrice: price.price,
            timestamp: timestampTime,
            isCurrent: false, // Will set after deduplication
          });
        }
      }
    });

    chartData = Array.from(priceMap.values()).sort((a, b) => a.actualHour - b.actualHour);

    // Mark current hour only if viewing today
    if (viewMode === 'today') {
      const nowHour = now.getHours();
      chartData.forEach(entry => {
        entry.isCurrent = entry.actualHour === nowHour;
      });
    }
  }

  // Calculate percentiles for color coding (using converted prices)
  const convertedPrices = chartData.map(d => d.price).sort((a, b) => a - b);
  const p30 = convertedPrices[Math.floor(convertedPrices.length * 0.3)];
  const p70 = convertedPrices[Math.floor(convertedPrices.length * 0.7)];

  const getBarColor = (price: number) => {
    if (price <= p30) return '#10b981'; // Green - cheap
    if (price >= p70) return '#ef4444'; // Red - expensive
    return '#f59e0b'; // Amber - medium
  };

  // Check if tomorrow's data is available
  const isTomorrowDataMissing = viewMode === 'tomorrow' && chartData.length === 0;
  const isTomorrowDataPartial = viewMode === 'tomorrow' && chartData.length > 0 && chartData.length < 24;

  // Dismissable state (resets on page reload)
  const [dismissedMissing, setDismissedMissing] = React.useState(false);
  const [dismissedPartial, setDismissedPartial] = React.useState(false);

  // Reset dismissed state when view mode changes
  React.useEffect(() => {
    setDismissedMissing(false);
    setDismissedPartial(false);
  }, [viewMode]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Electricity Prices{vatLabel}</h3>
          {/* Today/Tomorrow/Rolling Toggle */}
          {onViewModeChange && (
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange('today')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'today'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => onViewModeChange('tomorrow')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'tomorrow'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Tomorrow
              </button>
              <button
                onClick={() => onViewModeChange('rolling')}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  viewMode === 'rolling'
                    ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Rolling 24h
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Cheap</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Expensive</span>
          </div>
        </div>
      </div>

      {/* Tomorrow's Data Unavailable Indicator */}
      {isTomorrowDataMissing && !dismissedMissing && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                Tomorrow's prices not available yet
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Nord Pool publishes next day prices around <strong>13:00 EET</strong>. Check back after that time.
              </p>
            </div>
            <button
              onClick={() => setDismissedMissing(true)}
              className="flex-shrink-0 text-blue-400 hover:text-blue-600 dark:text-blue-500 dark:hover:text-blue-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isTomorrowDataPartial && !dismissedPartial && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                Partial data ({chartData.length}/24 hours)
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                Tomorrow's prices are being published. Full data typically available after 13:00 EET.
              </p>
            </div>
            <button
              onClick={() => setDismissedPartial(true)}
              className="flex-shrink-0 text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="hour"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            interval={viewMode === 'rolling' ? 1 : 2}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: '¢/kWh', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: any) => [`${value}¢/kWh`, 'Price']}
          />
          <Bar dataKey="price" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.price)}
                opacity={entry.isCurrent ? 1 : 0.7}
                stroke={entry.isCurrent ? '#000000' : 'none'}
                strokeWidth={entry.isCurrent ? 3 : 0}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
