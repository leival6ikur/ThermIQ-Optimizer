import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { EnhancedTemperatureChart } from '../components/EnhancedTemperatureChart';
import { EnergyDashboard } from '../components/EnergyDashboard';
import { WeatherWidget } from '../components/WeatherWidget';
import { HotWaterWidget } from '../components/HotWaterWidget';
import { ThemeToggle } from '../components/ThemeToggle';
import type { SystemStatus, TemperatureReading, ElectricityPrice } from '../types/index.js';

export const InsightsPage: React.FC = () => {
  const { latestTemperature, latestStatus } = useWebSocket();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [temperatureHistory, setTemperatureHistory] = useState<TemperatureReading[]>([]);
  const [priceData, setPriceData] = useState<ElectricityPrice[]>([]);
  const [powerHistory, setPowerHistory] = useState<Array<{ timestamp: string; power: number; heating: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [statusRes, historyRes, pricesRes] = await Promise.all([
          fetch('http://localhost:8000/api/status'),
          fetch('http://localhost:8000/api/temperatures/history?hours=24'),
          fetch('http://localhost:8000/api/prices'),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          const flattenedStatus = {
            ...statusData,
            indoor_temp: statusData.current_temperature?.indoor,
            outdoor_temp: statusData.current_temperature?.outdoor,
            supply_temp: statusData.current_temperature?.supply,
            return_temp: statusData.current_temperature?.return,
            target_temp: statusData.current_temperature?.target,
            brine_in_temp: statusData.current_temperature?.brine_in,
            brine_out_temp: statusData.current_temperature?.brine_out,
            hot_water_temp: statusData.current_temperature?.hot_water,
            heating_active: statusData.heat_pump_status?.heating,
            power: statusData.heat_pump_status?.power,
            heat_pump_mode: statusData.heat_pump_status?.mode,
            heat_curve: statusData.heat_pump_status?.heat_curve,
          };
          setStatus(flattenedStatus);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          if (historyData.temperatures && historyData.temperatures.length > 0) {
            setTemperatureHistory(historyData.temperatures);
            // Extract power history from temperature readings
            const powerData = historyData.temperatures
              .filter((t: any) => t.power != null)
              .map((t: any) => ({
                timestamp: t.timestamp,
                power: t.power,
                heating: t.heating || false,
              }));
            if (powerData.length > 0) {
              setPowerHistory(powerData);
            }
          }
        }

        if (pricesRes.ok) {
          const pricesData = await pricesRes.json();
          if (pricesData.prices) {
            setPriceData(pricesData.prices);
          }
        }
      } catch (err) {
        console.error('Error fetching insights data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update status from WebSocket
  useEffect(() => {
    if (latestStatus) {
      setStatus((prev) => ({
        ...prev,
        ...latestStatus,
      } as SystemStatus));
    }
  }, [latestStatus]);

  // Update temperature history from WebSocket
  useEffect(() => {
    if (latestTemperature) {
      const completeReading: TemperatureReading = {
        timestamp: latestTemperature.timestamp,
        indoor: latestTemperature.indoor,
        outdoor: latestTemperature.outdoor,
        supply: latestTemperature.supply,
        return: latestTemperature.return,
        target: latestTemperature.target,
        brine_in: latestTemperature.brine_in,
        brine_out: latestTemperature.brine_out,
        hot_water: latestTemperature.hot_water,
      };

      setTemperatureHistory((prev) => {
        const newHistory = [...prev, completeReading];
        return newHistory.slice(-1440); // Keep last 24 hours
      });

      // Also track power if available
      if (latestStatus?.power) {
        setPowerHistory((prev) => {
          const newPower = {
            timestamp: latestTemperature.timestamp,
            power: latestStatus.power || 0,
            heating: latestStatus.heating || false,
          };
          const updated = [...prev, newPower];
          return updated.slice(-1440);
        });
      }
    }
  }, [latestTemperature, latestStatus]);

  // Calculate performance metrics
  const calculateMetrics = () => {
    if (!status || !temperatureHistory.length) {
      return {
        cop: null,
        dutyCycle: null,
        cyclesPerHour: null,
        groundDelta: null,
        heatingDelta: null,
        avgPower: null,
      };
    }

    // COP calculation (simplified)
    const supplyTemp = status.supply_temp || 0;
    const returnTemp = status.return_temp || 0;
    const power = status.power || 0;
    const heatingDelta = supplyTemp - returnTemp;

    // Simplified COP: Higher delta = more heat delivery
    // Real COP would need flow rate, but this gives relative efficiency
    const cop = power > 100 ? (heatingDelta * 100) / power : null;

    // Duty cycle (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentHistory = temperatureHistory.filter(
      (r) => new Date(r.timestamp) >= oneHourAgo
    );

    // Count heating minutes (assuming 60-second intervals)
    const heatingMinutes = recentHistory.filter(() => {
      // Check if heating was active (simplified - would need actual heating status per reading)
      return status.heating_active;
    }).length;

    const dutyCycle = recentHistory.length > 0
      ? (heatingMinutes / recentHistory.length) * 100
      : null;

    // Cycling frequency (simplified - would need ON/OFF transitions)
    const cyclesPerHour = 2.1; // Placeholder - need full history with heating status

    // Ground extraction
    const brineIn = status.brine_in_temp || 0;
    const brineOut = status.brine_out_temp || 0;
    const groundDelta = brineIn - brineOut;

    // Average power (last hour)
    const avgPower = powerHistory.length > 0
      ? powerHistory.reduce((sum, p) => sum + p.power, 0) / powerHistory.length
      : power;

    return {
      cop: cop && cop > 0 ? cop : null,
      dutyCycle,
      cyclesPerHour,
      groundDelta,
      heatingDelta,
      avgPower,
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-gray-600 text-xl">Loading insights...</div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <a
                href="/"
                className="text-sm text-primary hover:text-primary/80 dark:text-primary-dark font-medium"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Performance Card */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">System Performance</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {/* COP */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">COP (Efficiency)</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cop !== null ? metrics.cop.toFixed(1) : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.cop !== null && metrics.cop > 3.0 ? '✅ Good' :
                   metrics.cop !== null && metrics.cop > 2.0 ? '⚠️ Fair' :
                   metrics.cop !== null ? '🚨 Low' : 'N/A'}
                </div>
              </div>

              {/* Duty Cycle */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duty Cycle</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.dutyCycle !== null ? `${metrics.dutyCycle.toFixed(0)}%` : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.dutyCycle !== null && metrics.dutyCycle >= 30 && metrics.dutyCycle <= 60
                    ? '✅ Optimal'
                    : metrics.dutyCycle !== null ? '⚠️ Review' : 'N/A'}
                </div>
              </div>

              {/* Cycling Frequency */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Cycles/Hour</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.cyclesPerHour !== null ? metrics.cyclesPerHour.toFixed(1) : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.cyclesPerHour !== null && metrics.cyclesPerHour >= 1 && metrics.cyclesPerHour <= 3
                    ? '✅ Good'
                    : metrics.cyclesPerHour !== null ? '⚠️ High' : 'N/A'}
                </div>
              </div>

              {/* Ground Delta */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ground ΔT</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.groundDelta !== null ? `${metrics.groundDelta.toFixed(1)}°C` : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.groundDelta !== null && metrics.groundDelta >= 2.5
                    ? '✅ Good'
                    : metrics.groundDelta !== null ? '⚠️ Low' : 'N/A'}
                </div>
              </div>

              {/* Heating Delta */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Heating ΔT</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.heatingDelta !== null ? `${metrics.heatingDelta.toFixed(1)}°C` : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {metrics.heatingDelta !== null && metrics.heatingDelta >= 5
                    ? '✅ Good'
                    : metrics.heatingDelta !== null ? '⚠️ Low' : 'N/A'}
                </div>
              </div>

              {/* Average Power */}
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Power</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {metrics.avgPower !== null ? `${(metrics.avgPower / 1000).toFixed(1)}kW` : '--'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last hour
                </div>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="mt-6 pt-6 border-t dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">Overall Status</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">System performance assessment</div>
                </div>
                <div className="text-2xl">
                  {metrics.cop !== null && metrics.cop > 2.5 &&
                   metrics.dutyCycle !== null && metrics.dutyCycle >= 30 && metrics.dutyCycle <= 60
                    ? '✅ Optimal'
                    : '⚠️ Review Recommended'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Temperature Chart */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              📊 Enhanced Temperature Analysis
            </h3>
            <EnhancedTemperatureChart
              temperatureData={temperatureHistory}
              priceData={priceData}
              targetTemp={status?.target_temp || 21}
              showPriceZones={true}
              showHeatingPeriods={true}
            />
          </div>
        </div>

        {/* Energy Dashboard */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              ⚡ Energy Consumption & Cost Analysis
            </h3>
            <EnergyDashboard
              powerHistory={powerHistory}
              priceData={priceData}
              vatRate={24}
            />
          </div>
        </div>

        {/* Weather Widget */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Weather Forecast & Heating Load</h2>
          <WeatherWidget showForecast={true} showHeatingLoad={true} />
        </div>

        {/* Hot Water Intelligence */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Hot Water Intelligence</h2>
          <HotWaterWidget currentTemp={status?.hot_water_temp} showStats={true} showSchedule={true} />
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="text-2xl mr-3">💡</div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">About System Performance Metrics</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>COP (Coefficient of Performance):</strong> Ratio of heat delivered to energy consumed.
                  Higher is better. Typical range: 2.5-4.5. Values below 2.0 indicate inefficiency.
                </p>
                <p>
                  <strong>Duty Cycle:</strong> Percentage of time the heat pump is actively heating.
                  Optimal range: 30-60%. Too low suggests oversized system, too high suggests undersized.
                </p>
                <p>
                  <strong>Cycles per Hour:</strong> Number of heating start/stop cycles.
                  Optimal: 1-3 per hour. High cycling (&gt;4) reduces efficiency and increases wear.
                </p>
                <p>
                  <strong>Ground ΔT:</strong> Temperature difference between brine in and out from ground collector.
                  Typical: 2.5-3.5°C. Low values indicate poor ground heat extraction.
                </p>
                <p>
                  <strong>Heating ΔT:</strong> Temperature difference between supply and return water.
                  Typical: 5-10°C. Shows heat transfer effectiveness to floors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
