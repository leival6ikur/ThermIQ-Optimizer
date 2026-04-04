import React, { useMemo } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Area,
  ComposedChart,
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

    // Deduplicate temperature data by timestamp (keep most recent for each timestamp)
    const uniqueDataMap = new Map<string, any>();
    temperatureData.forEach(reading => {
      const timestampKey = reading.timestamp;
      // Keep the latest reading for each timestamp
      uniqueDataMap.set(timestampKey, reading);
    });
    const uniqueData = Array.from(uniqueDataMap.values()).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // First pass: collect all temperature values to find min
    const allTemps: number[] = [];
    uniqueData.forEach(reading => {
      if (reading.indoor) allTemps.push(reading.indoor);
      if (reading.outdoor) allTemps.push(reading.outdoor);
    });
    const minTemp = allTemps.length > 0 ? Math.min(...allTemps) : 0;
    const heatingLineValue = minTemp - 1; // Position heating line 1°C below minimum temp

    // Calculate price percentiles once
    let p33 = 0;
    let p66 = 0;
    if (priceData.length > 0) {
      const sortedPrices = priceData.map(p => p.price).sort((a, b) => a - b);
      p33 = sortedPrices[Math.floor(sortedPrices.length * 0.33)];
      p66 = sortedPrices[Math.floor(sortedPrices.length * 0.66)];
      console.log('Price zones:', {
        totalPrices: priceData.length,
        p33: p33.toFixed(2),
        p66: p66.toFixed(2),
        min: sortedPrices[0].toFixed(2),
        max: sortedPrices[sortedPrices.length - 1].toFixed(2)
      });
    }

    // Create price map by hour for quick lookup
    const priceByHour = new Map<number, number>();
    priceData.forEach(p => {
      const hour = new Date(p.timestamp).getHours();
      priceByHour.set(hour, p.price);
    });
    console.log('Price by hour map size:', priceByHour.size);

    let zoneDebugCount = 0;
    return uniqueData.map((reading, idx) => {
      const timestamp = new Date(reading.timestamp);
      const time = timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

      // Find corresponding price
      const hour = timestamp.getHours();
      const priceForHour = priceByHour.get(hour);

      // Determine price zone (for background color)
      let priceZone = 0; // 0 = no data, 1 = cheap, 2 = medium, 3 = expensive
      if (priceForHour !== undefined) {
        if (priceForHour < p33) priceZone = 1;
        else if (priceForHour < p66) priceZone = 2;
        else priceZone = 3;

        // Debug first few and some samples
        if (zoneDebugCount < 3 || (idx % 50 === 0 && zoneDebugCount < 10)) {
          console.log(`Hour ${hour}: price=${priceForHour.toFixed(2)}, zone=${priceZone} (p33=${p33.toFixed(2)}, p66=${p66.toFixed(2)})`);
          zoneDebugCount++;
        }
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
        heatingLine: isHeating ? heatingLineValue : null, // Bold line near bottom when heating
      };
    });
  }, [temperatureData, priceData, targetTemp]);

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

  // Calculate X-axis ticks to show clean hour marks (00:00, 01:00, etc.)
  const xAxisTicks: number[] = [];
  if (chartData.length > 0) {
    const firstTimestamp = chartData[0].timestamp;
    const lastTimestamp = chartData[chartData.length - 1].timestamp;
    const firstDate = new Date(firstTimestamp);

    // Start from the first full hour
    const startHour = new Date(firstDate);
    startHour.setMinutes(0, 0, 0);
    if (startHour.getTime() < firstTimestamp) {
      startHour.setHours(startHour.getHours() + 1);
    }

    // Generate hourly ticks
    let currentTick = startHour.getTime();
    while (currentTick <= lastTimestamp) {
      xAxisTicks.push(currentTick);
      currentTick += 60 * 60 * 1000; // Add 1 hour
    }
  }

  // Show dots only if we have fewer than 100 data points (otherwise too cluttered)
  const showDots = chartData.length < 100;

  // Group consecutive price zones for ReferenceArea rendering
  const priceZoneGroups: Array<{ zone: number; x1: number; x2: number }> = [];
  if (showPriceZones && chartData.length > 0) {
    let currentZone = chartData[0].priceZone;
    let zoneStart = chartData[0].timestamp;

    for (let i = 1; i < chartData.length; i++) {
      const point = chartData[i];

      // If zone changed or it's the last point
      if (point.priceZone !== currentZone || i === chartData.length - 1) {
        if (currentZone > 0) {
          priceZoneGroups.push({
            zone: currentZone,
            x1: zoneStart,
            x2: i === chartData.length - 1 ? point.timestamp : chartData[i - 1].timestamp
          });
        }
        currentZone = point.priceZone;
        zoneStart = point.timestamp;
      }
    }

    // Add the last zone if it exists
    if (currentZone > 0) {
      priceZoneGroups.push({
        zone: currentZone,
        x1: zoneStart,
        x2: chartData[chartData.length - 1].timestamp
      });
    }

    console.log('Price zone groups:', priceZoneGroups.length, priceZoneGroups.slice(0, 5));
  }

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
            yAxisId="temp"
            domain={['dataMin - 2', 'dataMax + 2']}
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            tickFormatter={(value) => Math.round(value).toString()}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Price zone backgrounds using ReferenceArea */}
          {priceZoneGroups.map((group, index) => {
            const color = group.zone === 1 ? '#10b981' : // green
                         group.zone === 2 ? '#f59e0b' : // yellow
                         '#ef4444'; // red

            return (
              <ReferenceArea
                key={`price-zone-${index}`}
                x1={group.x1}
                x2={group.x2}
                yAxisId="temp"
                fill={color}
                fillOpacity={0.15}
                ifOverflow="extendDomain"
              />
            );
          })}

          {/* Comfort zone band */}
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="comfortMax"
            stroke="none"
            fill="url(#comfortZone)"
            fillOpacity={1}
          />
          <Area
            yAxisId="temp"
            type="monotone"
            dataKey="comfortMin"
            stroke="none"
            fill="url(#comfortZone)"
            fillOpacity={1}
          />

          {/* Heating periods indicator - bold line at bottom */}
          {showHeatingPeriods && (
            <Line
              yAxisId="temp"
              type="stepAfter"
              dataKey="heatingLine"
              stroke="#fb923c"
              strokeWidth={4}
              dot={false}
              name="Heating"
              isAnimationActive={false}
            />
          )}

          {/* Temperature lines */}
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="indoor"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={showDots ? { fill: '#3b82f6', r: 2 } : false}
            name="Indoor"
            connectNulls={true}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="outdoor"
            stroke="#9ca3af"
            strokeWidth={1.5}
            dot={showDots ? { fill: '#9ca3af', r: 1.5 } : false}
            name="Outdoor"
            connectNulls={true}
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
            connectNulls={true}
          />

          {/* Reference lines for comfort zone */}
          <ReferenceLine yAxisId="temp" y={targetTemp + 0.5} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine yAxisId="temp" y={targetTemp - 0.5} stroke="#10b981" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Info text */}
      <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>• <strong>Green dashed lines:</strong> Comfort zone (target ±0.5°C)</p>
        {showPriceZones && <p>• <strong>Background colors:</strong> Green = cheap electricity, Yellow = medium, Red = expensive</p>}
        {showHeatingPeriods && <p>• <strong>Orange line at bottom:</strong> Heating periods detected</p>}
        {showDots && <p>• <strong>Dots:</strong> Show actual data collection points</p>}
        <p>• <strong>Hover</strong> over chart to see detailed values. Gaps indicate no data collected during those times.</p>
        <p className="text-gray-500 dark:text-gray-500">Data collected at irregular intervals. Showing {chartData.length} unique readings.</p>
      </div>
    </div>
  );
};
