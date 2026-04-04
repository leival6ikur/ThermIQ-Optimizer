import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TemperaturePoint {
  timestamp: string;
  indoor?: number;
  outdoor?: number;
  supply?: number;
  return?: number;
  target?: number;
  brine_in?: number;
  brine_out?: number;
  hot_water?: number;
}

interface PricePoint {
  timestamp: string;
  price: number;
}

interface HeatingStatus {
  timestamp: string;
  heating: boolean;
  power?: number;
}

interface HistoryData {
  temperatures: TemperaturePoint[];
  prices: PricePoint[];
  heating_status: HeatingStatus[];
}

interface HistoryChartProps {
  hours?: number;
}

export const HistoryChart: React.FC<HistoryChartProps> = ({ hours = 24 }) => {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vatLabel, setVatLabel] = useState('');
  const [selectedSensors, setSelectedSensors] = useState({
    indoor: true,
    outdoor: true,
    supply: true,
    return: false,
    target: false,
    brine_in: false,
    brine_out: false,
    hot_water: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [historyRes, vatRes] = await Promise.all([
          fetch(`http://localhost:8000/api/history/combined?hours=${hours}`),
          fetch('http://localhost:8000/api/config/vat'),
        ]);

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          setData(historyData);
        }

        if (vatRes.ok) {
          const vatData = await vatRes.json();
          if (vatData.vat_enabled) {
            setVatLabel(` (incl. ${vatData.vat_rate}% VAT)`);
          } else {
            setVatLabel('');
          }
        }
      } catch (error) {
        console.error('Failed to fetch history data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [hours]);

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Temperature & Price History ({hours}h)</h3>
        <div className="text-center text-gray-500 py-8">Loading history data...</div>
      </div>
    );
  }

  if (!data || (data.temperatures.length === 0 && data.prices.length === 0)) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Temperature & Price History ({hours}h)</h3>
        <div className="text-center text-gray-500 py-8">
          No historical data available yet. Data will appear after the first readings are recorded.
        </div>
      </div>
    );
  }

  // Merge temperature and price data by timestamp
  // Group by hourly buckets for cleaner visualization
  const chartData: any[] = [];
  const tempMap = new Map<string, TemperaturePoint>();
  const priceMap = new Map<string, number>();

  // Group temperatures by hour
  data.temperatures.forEach(temp => {
    const date = new Date(temp.timestamp);
    const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
    if (!tempMap.has(hourKey)) {
      tempMap.set(hourKey, temp);
    }
  });

  // Group prices by hour
  data.prices.forEach(price => {
    const date = new Date(price.timestamp);
    const hourKey = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString();
    priceMap.set(hourKey, price.price / 10); // Convert to ¢/kWh
  });

  // Combine data
  const allHours = new Set([...tempMap.keys(), ...priceMap.keys()]);
  Array.from(allHours).sort().forEach(hourKey => {
    const temp = tempMap.get(hourKey);
    const price = priceMap.get(hourKey);
    const date = new Date(hourKey);

    chartData.push({
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      timestamp: hourKey,
      indoor: temp?.indoor ?? null,
      outdoor: temp?.outdoor ?? null,
      supply: temp?.supply ?? null,
      return: temp?.return ?? null,
      target: temp?.target ?? null,
      brine_in: temp?.brine_in ?? null,
      brine_out: temp?.brine_out ?? null,
      hot_water: temp?.hot_water ?? null,
      price: price ?? null,
    });
  });

  const sensorColors = {
    indoor: '#667eea',
    outdoor: '#3b82f6',
    supply: '#ef4444',
    return: '#f59e0b',
    target: '#10b981',
    brine_in: '#8b5cf6',
    brine_out: '#ec4899',
    hot_water: '#f97316',
  };

  const sensorNames = {
    indoor: 'Indoor',
    outdoor: 'Outdoor',
    supply: 'Supply',
    return: 'Return',
    target: 'Target',
    brine_in: 'Brine In',
    brine_out: 'Brine Out',
    hot_water: 'Hot Water',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Temperature & Price History ({hours}h)</h3>

        {/* Sensor toggles */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.keys(selectedSensors).map((sensor) => (
            <button
              key={sensor}
              onClick={() =>
                setSelectedSensors((prev) => ({
                  ...prev,
                  [sensor]: !prev[sensor as keyof typeof prev],
                }))
              }
              className={`px-2 py-1 rounded border transition-colors ${
                selectedSensors[sensor as keyof typeof selectedSensors]
                  ? 'border-current font-semibold'
                  : 'border-gray-300 text-gray-400'
              }`}
              style={{
                color: selectedSensors[sensor as keyof typeof selectedSensors]
                  ? sensorColors[sensor as keyof typeof sensorColors]
                  : undefined,
              }}
            >
              {sensorNames[sensor as keyof typeof sensorNames]}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* X-Axis: Time */}
          <XAxis
            dataKey="time"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            interval="preserveStartEnd"
          />

          {/* Left Y-Axis: Temperature (°C) */}
          <YAxis
            yAxisId="temperature"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            label={{ value: 'Temperature (°C)', angle: -90, position: 'insideLeft' }}
            domain={['dataMin - 5', 'dataMax + 5']}
            tickFormatter={(value) => Math.round(value).toString()}
          />

          {/* Right Y-Axis: Price (¢/kWh) */}
          <YAxis
            yAxisId="price"
            orientation="right"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            label={{ value: `¢/kWh${vatLabel}`, angle: 90, position: 'insideRight' }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: any, name: any) => {
              if (value === null || value === undefined) {
                return ['--', name];
              }
              const numValue = Number(value);
              if (name === 'price') {
                return [`${numValue.toFixed(2)}¢/kWh`, 'Price'];
              }
              return [`${numValue.toFixed(2)}°C`, sensorNames[name as keyof typeof sensorNames] || name];
            }}
          />

          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />

          {/* Temperature lines */}
          {selectedSensors.indoor && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="indoor"
              name="Indoor"
              stroke={sensorColors.indoor}
              strokeWidth={2}
              dot={false}
            />
          )}
          {selectedSensors.outdoor && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="outdoor"
              name="Outdoor"
              stroke={sensorColors.outdoor}
              strokeWidth={2}
              dot={false}
            />
          )}
          {selectedSensors.supply && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="supply"
              name="Supply"
              stroke={sensorColors.supply}
              strokeWidth={2}
              dot={false}
            />
          )}
          {selectedSensors.return && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="return"
              name="Return"
              stroke={sensorColors.return}
              strokeWidth={2}
              dot={false}
            />
          )}
          {selectedSensors.target && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="target"
              name="Target"
              stroke={sensorColors.target}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          )}
          {selectedSensors.brine_in && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="brine_in"
              name="Brine In"
              stroke={sensorColors.brine_in}
              strokeWidth={1.5}
              dot={false}
            />
          )}
          {selectedSensors.brine_out && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="brine_out"
              name="Brine Out"
              stroke={sensorColors.brine_out}
              strokeWidth={1.5}
              dot={false}
            />
          )}
          {selectedSensors.hot_water && (
            <Line
              yAxisId="temperature"
              type="monotone"
              dataKey="hot_water"
              name="Hot Water"
              stroke={sensorColors.hot_water}
              strokeWidth={1.5}
              dot={false}
            />
          )}

          {/* Price bars */}
          <Bar
            yAxisId="price"
            dataKey="price"
            name="Price"
            fill="#fbbf24"
            opacity={0.3}
          />
        </ComposedChart>
      </ResponsiveContainer>

      <div className="mt-4 text-xs text-gray-500">
        Click sensor names above to show/hide temperature lines. Chart shows hourly averages.
      </div>
    </div>
  );
};
