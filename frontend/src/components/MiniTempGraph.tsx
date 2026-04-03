import React from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

interface MiniTempGraphProps {
  data: Array<{ timestamp: string; value: number | null }>;
  color?: string;
}

export const MiniTempGraph: React.FC<MiniTempGraphProps> = ({ data, color = '#667eea' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-gray-400">
        No data
      </div>
    );
  }

  // Get last 6 hours of data (assuming data every 60s = 360 points)
  const last6Hours = data.slice(-360);

  const chartData = last6Hours
    .filter(d => d.value !== null)
    .map(d => ({
      value: d.value,
      time: new Date(d.timestamp).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));

  if (chartData.length === 0) {
    return (
      <div className="h-16 flex items-center justify-center text-xs text-gray-400">
        No data
      </div>
    );
  }

  const values = chartData.map(d => d.value).filter((v): v is number => v !== null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const yMin = range > 0 ? min - range * 0.1 : min - 1;
  const yMax = range > 0 ? max + range * 0.1 : max + 1;

  // Get current (latest) value
  const currentValue = chartData[chartData.length - 1]?.value ?? null;
  const validValues = chartData.map(d => d.value).filter((v): v is number => v !== null);
  const minDisplayValue = validValues.length > 0 ? Math.min(...validValues) : null;
  const maxDisplayValue = validValues.length > 0 ? Math.max(...validValues) : null;

  return (
    <div className="mt-2 h-16 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis domain={[yMin, yMax]} hide />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '11px',
              padding: '4px 8px',
            }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '4px 8px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 600, marginBottom: '2px' }}>{data.time}</div>
                    <div>{Number(data.value).toFixed(1)}°</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
      {/* Current value overlay */}
      {currentValue !== null && (
        <div className="absolute top-1 right-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-white/90 border border-gray-200" style={{ color }}>
          {currentValue.toFixed(1)}°
        </div>
      )}
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Min: {minDisplayValue !== null ? minDisplayValue.toFixed(1) : '--'}°</span>
        <span>Max: {maxDisplayValue !== null ? maxDisplayValue.toFixed(1) : '--'}°</span>
      </div>
    </div>
  );
};
