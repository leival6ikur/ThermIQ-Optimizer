import React, { useMemo } from 'react';
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import type { ElectricityPrice } from '../types/index.js';

interface PowerReading {
  timestamp: string;
  power: number; // Watts
  heating: boolean;
}

interface EnergyDashboardProps {
  powerHistory: PowerReading[];
  priceData: ElectricityPrice[];
  vatRate?: number;
}

export const EnergyDashboard: React.FC<EnergyDashboardProps> = ({
  powerHistory,
  priceData,
  vatRate = 24,
}) => {
  // Calculate energy consumption and costs
  const energyData = useMemo(() => {
    if (!powerHistory.length) return { hourly: [], daily: null };

    // Sort by timestamp
    const sortedHistory = [...powerHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Group by hour and calculate kWh
    const hourlyMap = new Map<string, { power: number[]; heating: number; count: number }>();

    sortedHistory.forEach((reading) => {
      const hour = new Date(reading.timestamp);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!hourlyMap.has(hourKey)) {
        hourlyMap.set(hourKey, { power: [], heating: 0, count: 0 });
      }

      const hourData = hourlyMap.get(hourKey)!;
      hourData.power.push(reading.power);
      if (reading.heating) hourData.heating++;
      hourData.count++;
    });

    // Calculate kWh per hour and costs
    const hourlyData = Array.from(hourlyMap.entries()).map(([hourKey, data]) => {
      const timestamp = new Date(hourKey);
      const hour = timestamp.getHours();

      // Calculate average power for the hour
      const avgPower = data.power.reduce((sum, p) => sum + p, 0) / data.power.length;

      // Calculate kWh (assuming readings every minute, so 60 readings per hour)
      // kWh = (average power in watts / 1000) * (readings / 60)
      // Simplified: if we have 60 readings, that's 1 hour
      const hoursOfData = data.count / 60;
      const kWh = (avgPower / 1000) * hoursOfData;

      // Find price for this hour
      const priceMatch = priceData.find(p => {
        const priceHour = new Date(p.timestamp).getHours();
        return priceHour === hour;
      });

      const pricePerKWh = priceMatch ? priceMatch.price / 10 : 0; // Convert EUR/MWh to cents/kWh
      const cost = kWh * (pricePerKWh / 100); // Cost in EUR

      // Duty cycle for this hour
      const dutyCycle = (data.heating / data.count) * 100;

      return {
        timestamp: timestamp.getTime(),
        hour: timestamp.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        date: timestamp.toLocaleDateString('en-GB'),
        avgPower: avgPower / 1000, // Convert to kW
        kWh: Number(kWh.toFixed(3)),
        cost: Number(cost.toFixed(2)),
        pricePerKWh: Number(pricePerKWh.toFixed(1)),
        dutyCycle: Number(dutyCycle.toFixed(0)),
      };
    });

    // Calculate daily totals
    const totalKWh = hourlyData.reduce((sum, h) => sum + h.kWh, 0);
    const totalCost = hourlyData.reduce((sum, h) => sum + h.cost, 0);
    const avgPower = hourlyData.reduce((sum, h) => sum + h.avgPower, 0) / hourlyData.length;
    const avgPrice = hourlyData.reduce((sum, h) => sum + h.pricePerKWh, 0) / hourlyData.length;
    const avgDutyCycle = hourlyData.reduce((sum, h) => sum + h.dutyCycle, 0) / hourlyData.length;

    // Estimate baseline cost (if heating 24/7 at average power)
    const baselineKWh = (avgPower * 24);
    const baselineCost = baselineKWh * (avgPrice / 100);
    const savingsPercent = baselineCost > 0 ? ((baselineCost - totalCost) / baselineCost) * 100 : 0;

    return {
      hourly: hourlyData,
      daily: {
        totalKWh: Number(totalKWh.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        avgPower: Number(avgPower.toFixed(2)),
        avgPrice: Number(avgPrice.toFixed(1)),
        avgDutyCycle: Number(avgDutyCycle.toFixed(0)),
        baselineCost: Number(baselineCost.toFixed(2)),
        savings: Number((baselineCost - totalCost).toFixed(2)),
        savingsPercent: Number(savingsPercent.toFixed(0)),
      },
    };
  }, [powerHistory, priceData]);

  // Custom tooltip for power chart
  const PowerTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border">
        <div className="text-xs text-gray-500 mb-2">{data.hour}</div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span>Power:</span>
            <span className="font-semibold">{data.avgPower.toFixed(2)} kW</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Energy:</span>
            <span className="font-semibold">{data.kWh} kWh</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Cost:</span>
            <span className="font-semibold">€{data.cost}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Price:</span>
            <span className="text-xs">{data.pricePerKWh} ¢/kWh</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>Duty:</span>
            <span className="text-xs">{data.dutyCycle}%</span>
          </div>
        </div>
      </div>
    );
  };

  if (!energyData.hourly.length) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚡</div>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">No Power Data Yet</h4>
              <p className="text-sm text-yellow-800">
                Power consumption tracking requires historical data. Keep the system running to collect data.
                Typically takes 1-2 hours to show meaningful statistics.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { hourly, daily } = energyData;

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      {daily && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="text-sm text-blue-700 mb-1">Total Energy</div>
            <div className="text-2xl font-bold text-blue-900">{daily.totalKWh} kWh</div>
            <div className="text-xs text-blue-600 mt-1">Today so far</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-sm text-green-700 mb-1">Total Cost</div>
            <div className="text-2xl font-bold text-green-900">€{daily.totalCost}</div>
            <div className="text-xs text-green-600 mt-1">Incl. {vatRate}% VAT</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="text-sm text-orange-700 mb-1">Avg Power</div>
            <div className="text-2xl font-bold text-orange-900">{daily.avgPower} kW</div>
            <div className="text-xs text-orange-600 mt-1">Duty: {daily.avgDutyCycle}%</div>
          </div>

          <div className={`bg-gradient-to-br rounded-lg p-4 border ${
            daily.savingsPercent > 0
              ? 'from-purple-50 to-purple-100 border-purple-200'
              : 'from-gray-50 to-gray-100 border-gray-200'
          }`}>
            <div className={`text-sm mb-1 ${
              daily.savingsPercent > 0 ? 'text-purple-700' : 'text-gray-700'
            }`}>
              Savings
            </div>
            <div className={`text-2xl font-bold ${
              daily.savingsPercent > 0 ? 'text-purple-900' : 'text-gray-900'
            }`}>
              {daily.savingsPercent > 0 ? `${daily.savingsPercent}%` : '--'}
            </div>
            <div className={`text-xs mt-1 ${
              daily.savingsPercent > 0 ? 'text-purple-600' : 'text-gray-600'
            }`}>
              {daily.savingsPercent > 0 ? `€${daily.savings} saved` : 'Calculating...'}
            </div>
          </div>
        </div>
      )}

      {/* Power Consumption Graph */}
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-semibold text-gray-900 mb-4">Power Consumption (24h)</h4>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={hourly}>
            <defs>
              <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleTimeString('en-GB', { hour: '2-digit' }) + 'h';
              }}
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              label={{ value: 'kW', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<PowerTooltip />} />
            <Area
              type="monotone"
              dataKey="avgPower"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#powerGradient)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Energy & Cost Chart */}
      <div className="bg-white rounded-lg p-4 border">
        <h4 className="font-semibold text-gray-900 mb-4">Energy Consumption & Cost</h4>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={hourly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp) => {
                const date = new Date(timestamp);
                return date.toLocaleTimeString('en-GB', { hour: '2-digit' }) + 'h';
              }}
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              label={{ value: 'kWh', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#6b7280"
              style={{ fontSize: '11px' }}
              label={{ value: 'EUR', angle: 90, position: 'insideRight' }}
            />
            <Tooltip content={<PowerTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="kWh"
              fill="#3b82f6"
              name="Energy (kWh)"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cost"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Cost (€)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Savings Explanation */}
      {daily && daily.savingsPercent > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">💰</div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">How Savings Are Calculated</h4>
              <div className="text-sm text-purple-800 space-y-1">
                <p>
                  <strong>Baseline:</strong> €{daily.baselineCost} (if heating continuously at average power)
                </p>
                <p>
                  <strong>Actual:</strong> €{daily.totalCost} (optimized heating schedule)
                </p>
                <p>
                  <strong>Savings:</strong> €{daily.savings} ({daily.savingsPercent}% reduction)
                </p>
                <p className="mt-2 text-xs">
                  Savings achieved by heating during cheaper hours and utilizing building's thermal mass.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
