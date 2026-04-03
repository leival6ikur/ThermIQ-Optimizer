import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
} from 'recharts';
import type { TemperatureReading, ElectricityPrice } from '../types/index.js';

interface EnhancedTemperatureChartProps {
  temperatureData: TemperatureReading[];
  priceData?: ElectricityPrice[];
  targetTemp?: number;
  showPriceZones?: boolean;
  showHeatingPeriods?: boolean;
}

export const EnhancedTemperatureChart: React.FC<EnhancedTemperatureChartProps> = ({
  temperatureData,
  priceData = [],
  targetTemp = 21,
  showPriceZones = true,
  showHeatingPeriods = true,
}) => {
  // Prepare chart data
  const chartData = useMemo(() => {
    if (!temperatureData.length) return [];

    return temperatureData.map((reading) => {
      const timestamp = new Date(reading.timestamp);
      const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Find corresponding price
      const hour = timestamp.getHours();
      const matchingPrice = priceData.find(p => {
        const priceHour = new Date(p.timestamp).getHours();
        return priceHour === hour;
      });

      // Determine price zone (for background color)
      let priceZone = 0; // 0 = no data, 1 = cheap, 2 = medium, 3 = expensive
      if (matchingPrice && priceData.length > 0) {
        const prices = priceData.map(p => p.price).sort((a, b) => a - b);
        const p33 = prices[Math.floor(prices.length * 0.33)];
        const p66 = prices[Math.floor(prices.length * 0.66)];

        if (matchingPrice.price < p33) priceZone = 1;
        else if (matchingPrice.price < p66) priceZone = 2;
        else priceZone = 3;
      }

      // Estimate if heating was active (simplified: supply temp significantly higher than return)
      const isHeating = reading.supply && reading.return
        ? (reading.supply - reading.return) > 3
        : false;

      return {
        time,
        timestamp: timestamp.getTime(),
        indoor: reading.indoor || null,
        outdoor: reading.outdoor || null,
        target: targetTemp,
        comfortMin: targetTemp - 0.5,
        comfortMax: targetTemp + 0.5,
        priceZone,
        isHeating: isHeating ? 1 : 0,
        heatingIndicator: isHeating ? 30 : null, // For bar chart overlay
      };
    });
  }, [temperatureData, priceData, targetTemp]);

  // Calculate price zone colors
  const getPriceZoneColor = (zone: number) => {
    switch (zone) {
      case 1: return '#dcfce7'; // green-100
      case 2: return '#fef3c7'; // yellow-100
      case 3: return '#fee2e2'; // red-100
      default: return 'transparent';
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const timestamp = new Date(data.timestamp);

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-xs text-gray-500 mb-2">
          {timestamp.toLocaleString('en-GB', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        <div className="space-y-1 text-sm">
          {data.indoor !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-blue-600 font-medium">Indoor:</span>
              <span className="font-semibold">{data.indoor.toFixed(1)}°C</span>
            </div>
          )}
          {data.outdoor !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-gray-600">Outdoor:</span>
              <span className="font-semibold">{data.outdoor.toFixed(1)}°C</span>
            </div>
          )}
          {data.target !== null && (
            <div className="flex items-center justify-between gap-4">
              <span className="text-green-600">Target:</span>
              <span className="font-semibold">{data.target.toFixed(1)}°C</span>
            </div>
          )}
          {data.isHeating === 1 && (
            <div className="mt-2 pt-2 border-t text-orange-600 font-medium">
              🔥 Heating Active
            </div>
          )}
          {data.priceZone > 0 && (
            <div className="mt-2 pt-2 border-t text-xs text-gray-600">
              Price: {data.priceZone === 1 ? '💚 Cheap' : data.priceZone === 2 ? '💛 Medium' : '❤️ Expensive'}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!chartData.length) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No temperature data available
      </div>
    );
  }

  // Sample data points for X-axis (show every 4 hours)
  const xAxisTicks = chartData
    .filter((_, index) => index % (4 * 60) === 0) // Assuming 1-minute intervals
    .map(d => d.timestamp);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Indoor Temp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gray-400 rounded"></div>
          <span>Outdoor Temp</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Target</span>
        </div>
        {showPriceZones && (
          <div className="flex items-center gap-2">
            <div className="flex">
              <div className="w-3 h-3 bg-green-100 border"></div>
              <div className="w-3 h-3 bg-yellow-100 border"></div>
              <div className="w-3 h-3 bg-red-100 border"></div>
            </div>
            <span>Price Zones</span>
          </div>
        )}
        {showHeatingPeriods && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-300 rounded"></div>
            <span>Heating Active</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <defs>
            {/* Gradient for comfort zone */}
            <linearGradient id="comfortZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={xAxisTicks.length > 0 ? xAxisTicks : undefined}
            tickFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            }}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />

          <YAxis
            domain={['dataMin - 2', 'dataMax + 2']}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Comfort zone band */}
          <Area
            type="monotone"
            dataKey="comfortMax"
            stroke="none"
            fill="url(#comfortZone)"
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="comfortMin"
            stroke="none"
            fill="url(#comfortZone)"
            fillOpacity={1}
          />

          {/* Heating periods (bars) */}
          {showHeatingPeriods && (
            <Bar
              dataKey="heatingIndicator"
              fill="#fb923c"
              fillOpacity={0.3}
              barSize={10}
            />
          )}

          {/* Temperature lines */}
          <Line
            type="monotone"
            dataKey="indoor"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Indoor"
          />
          <Line
            type="monotone"
            dataKey="outdoor"
            stroke="#9ca3af"
            strokeWidth={1.5}
            dot={false}
            name="Outdoor"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />

          {/* Reference lines for comfort zone */}
          <ReferenceLine y={targetTemp + 0.5} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={targetTemp - 0.5} stroke="#10b981" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Info text */}
      <div className="text-xs text-gray-600 space-y-1">
        <p>• <strong>Green dashed lines:</strong> Comfort zone (target ±0.5°C)</p>
        {showPriceZones && <p>• <strong>Background colors:</strong> Green = cheap electricity, Yellow = medium, Red = expensive</p>}
        {showHeatingPeriods && <p>• <strong>Orange bars:</strong> Heating periods detected</p>}
        <p>• <strong>Hover</strong> over chart to see detailed values</p>
      </div>
    </div>
  );
};
