import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TemperatureReading } from '../types/index.js';

interface TemperatureChartProps {
  data: TemperatureReading[];
}

export const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Downsample data: show every 10th point for cleaner visualization
  // For 24h @ 1/min (1440 points) -> 144 points
  // For 1h @ 1/min (60 points) -> 6 points
  const samplingRate = data.length > 200 ? 10 : 5;
  const sampledData = data.filter((_, index) => index % samplingRate === 0 || index === data.length - 1);

  const chartData = sampledData.map(reading => ({
    time: new Date(reading.timestamp).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    indoor: reading.indoor || null,
    outdoor: reading.outdoor || null,
    target: reading.target || null,
    supply: reading.supply || null,
    return: reading.return || null,
    brine_in: reading.brine_in || null,
    brine_out: reading.brine_out || null,
    hot_water: reading.hot_water || null,
  }));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Temperature History (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <ReferenceLine
            x={currentTime}
            stroke="#1f2937"
            strokeWidth={2}
            label={{
              value: 'NOW',
              position: 'top',
              fill: '#1f2937',
              fontSize: 12,
              fontWeight: 700,
            }}
          />
          <Line
            type="monotone"
            dataKey="indoor"
            stroke="#667eea"
            strokeWidth={2}
            dot={false}
            name="Indoor"
          />
          <Line
            type="monotone"
            dataKey="outdoor"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            name="Outdoor"
          />
          <Line
            type="monotone"
            dataKey="target"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Target"
          />
          <Line
            type="monotone"
            dataKey="supply"
            stroke="#f59e0b"
            strokeWidth={1}
            dot={false}
            name="Supply"
            opacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="return"
            stroke="#8b5cf6"
            strokeWidth={1}
            dot={false}
            name="Return"
            opacity={0.6}
          />
          <Line
            type="monotone"
            dataKey="hot_water"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            name="Hot Water"
          />
          <Line
            type="monotone"
            dataKey="brine_in"
            stroke="#06b6d4"
            strokeWidth={2}
            dot={false}
            name="Brine In"
          />
          <Line
            type="monotone"
            dataKey="brine_out"
            stroke="#14b8a6"
            strokeWidth={2}
            dot={false}
            name="Brine Out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
