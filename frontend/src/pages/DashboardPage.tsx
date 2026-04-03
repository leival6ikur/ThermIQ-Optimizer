import React, { useEffect, useState } from 'react';
import { StatusCard } from '../components/StatusCard';
import { TemperatureChart } from '../components/TemperatureChart';
import { PriceChart } from '../components/PriceChart';
import { ScheduleTimeline } from '../components/ScheduleTimeline';
import { ErrorNotification } from '../components/ErrorNotification';
import { HistoryChart } from '../components/HistoryChart';
import { AlertsPanel } from '../components/AlertsPanel';
import { useWebSocket } from '../hooks/useWebSocket';
import type {
  SystemStatus,
  ElectricityPrice,
  HeatingSchedule,
  TemperatureReading,
  VATConfig,
} from '../types/index.js';

export const DashboardPage: React.FC = () => {
  const { isConnected: wsConnected, isConnecting: wsConnecting, latestTemperature, latestStatus } = useWebSocket();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [dayPrices, setDayPrices] = useState<ElectricityPrice[]>([]);
  const [rollingPrices, setRollingPrices] = useState<ElectricityPrice[]>([]);
  const [schedule, setSchedule] = useState<HeatingSchedule[]>([]);
  const [temperatureHistory, setTemperatureHistory] = useState<TemperatureReading[]>([]);
  const [vatConfig, setVatConfig] = useState<VATConfig>({ vat_enabled: false, vat_rate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideTemp, setOverrideTemp] = useState(21);
  const [overrideDuration, setOverrideDuration] = useState(240); // 4 hours default
  const [overrideIndefinite, setOverrideIndefinite] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);
  const [manualOverrideActive, setManualOverrideActive] = useState(false);
  const [priceViewMode, setPriceViewMode] = useState<'day' | 'rolling'>('day');

  // Fetch initial data including past 60min for graphs
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Add small delay on initial load to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        // Fetch both price views in parallel to pre-load
        const [statusRes, dayPricesRes, rollingPricesRes, scheduleRes, historyRes, vatRes] = await Promise.all([
          fetch('http://localhost:8000/api/status'),
          fetch('http://localhost:8000/api/prices'),
          fetch('http://localhost:8000/api/prices/today-tomorrow'),
          fetch('http://localhost:8000/api/schedule'),
          fetch('http://localhost:8000/api/temperatures/history?hours=24'),
          fetch('http://localhost:8000/api/config/vat'),
        ]);

        // Process VAT config first
        let vatMultiplier = 1;
        if (vatRes.ok) {
          const vatData = await vatRes.json();
          setVatConfig({
            vat_enabled: vatData.vat_enabled || false,
            vat_rate: vatData.vat_rate || 0,
          });
          if (vatData.vat_enabled && vatData.vat_rate) {
            vatMultiplier = 1 + (vatData.vat_rate / 100);
          }
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          // Flatten nested structure for easier access
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

        // Process day view prices
        if (dayPricesRes.ok) {
          const dayPricesData = await dayPricesRes.json();
          setDayPrices(dayPricesData.prices || []);
        }

        // Process rolling view prices
        if (rollingPricesRes.ok) {
          const rollingPricesData = await rollingPricesRes.json();

          // today-tomorrow endpoint returns: { today: {prices: [...]}, tomorrow: {prices: [...]} }
          const todayPrices = rollingPricesData.today?.prices || [];
          const tomorrowPrices = rollingPricesData.tomorrow?.prices || [];

          // Convert to ElectricityPrice format with full timestamps
          // Backend returns hours in UTC, so we need to create UTC timestamps
          const today = new Date();
          const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0, 0);
          const tomorrowUTC = todayUTC + (24 * 60 * 60 * 1000);

          // Deduplicate by hour - backend returns duplicates
          const dedupeByHour = (prices: any[], baseTimestamp: number): ElectricityPrice[] => {
            const priceMap = new Map<number, number>();
            prices.forEach(p => {
              if (!priceMap.has(p.hour)) {
                priceMap.set(p.hour, p.price);
              }
            });
            return Array.from(priceMap.entries()).map(([hour, price]) => ({
              timestamp: new Date(baseTimestamp + hour * 60 * 60 * 1000).toISOString(),
              price: price * vatMultiplier,
              currency: 'EUR',
              region: 'EE',
            }));
          };

          const allPrices = [
            ...dedupeByHour(todayPrices, todayUTC),
            ...dedupeByHour(tomorrowPrices, tomorrowUTC),
          ];

          setRollingPrices(allPrices);
        }

        if (scheduleRes.ok) {
          const scheduleData = await scheduleRes.json();

          // Convert schedule hours from UTC to browser's local timezone
          // Get timezone offset in hours (e.g., Estonia is UTC+3, offset = -180 minutes = -3 hours)
          const offsetHours = -(new Date().getTimezoneOffset() / 60);

          const localSchedule = scheduleData.map((item: HeatingSchedule) => ({
            ...item,
            hour: (item.hour + offsetHours + 24) % 24, // Add 24 and modulo to handle negative hours
          }));

          setSchedule(localSchedule);
        }

        if (historyRes.ok) {
          const historyData = await historyRes.json();
          // Pre-populate temperature history with past 24 hours
          if (historyData.temperatures && historyData.temperatures.length > 0) {
            setTemperatureHistory(historyData.temperatures);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // No automatic polling - WebSocket handles real-time updates
    // User can manually refresh page for updated prices/schedule
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

  // Extract heating status from nested structure
  const isHeating = status?.heat_pump_status?.heating || status?.heating_active || false;

  // Update temperature history from WebSocket
  useEffect(() => {
    if (latestTemperature) {
      // Ensure all fields are present
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
        // Keep last 24 hours (assuming data every 60s = 1440 points)
        return newHistory.slice(-1440);
      });
    }
  }, [latestTemperature]);

  // Initialize override temp from current target
  useEffect(() => {
    if (status?.target_temp && overrideTemp === 21) {
      setOverrideTemp(status.target_temp);
    }
  }, [status?.target_temp]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-white text-2xl">Loading dashboard...</div>
      </div>
    );
  }

  if (error && !status) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="card max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Connection Error</h2>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const currentHour = new Date().getHours();
  const currentScheduleItem = Array.isArray(schedule) ? schedule.find((s) => s.hour === currentHour) : null;
  const todaysCost = Array.isArray(schedule) ? schedule.slice(0, currentHour + 1).reduce((sum, s) => sum + s.estimated_cost, 0) : 0;

  // Use day prices for calculations (representative of today's data)
  const avgPrice = Array.isArray(dayPrices) && dayPrices.length > 0 ? dayPrices.reduce((sum, p) => sum + p.price, 0) / dayPrices.length : 0;
  const currentPrice = Array.isArray(dayPrices) ? (dayPrices.find((p) => new Date(p.timestamp).getHours() === currentHour)?.price || 0) : 0;
  const savingsPercent = avgPrice > 0 ? ((avgPrice - currentPrice) / avgPrice * 100) : 0;

  // Detect issues and build error/warning/info messages
  const errors: string[] = [];
  const warnings: string[] = [];
  const infos: string[] = [];

  if (!status?.mqtt_connected) {
    errors.push('MQTT connection lost - Not receiving real-time data from heat pump. Check MQTT broker is running.');
  }

  if (!status?.indoor_temp && status?.mqtt_connected) {
    errors.push('No temperature data available - Heat pump may not be responding or publishing data.');
  }

  if (status?.last_device_update) {
    const lastUpdate = new Date(status.last_device_update);
    const ageMinutes = (Date.now() - lastUpdate.getTime()) / 60000;
    if (ageMinutes > 5) {
      warnings.push(`Stale data - Last update from heat pump was ${Math.round(ageMinutes)} minutes ago. Expected update every 60 seconds.`);
    }
  }

  if (!dayPrices || dayPrices.length === 0) {
    warnings.push('No electricity price data available - Nord Pool prices not yet fetched. Heating schedule may be incomplete. Prices are typically published at 13:00 UTC.');
  }

  if (dayPrices && dayPrices.length > 0 && dayPrices.length < 24) {
    infos.push(`We have ${dayPrices.length} hours of price data available. Tomorrow's prices are typically published around 13:00 UTC and will be automatically loaded.`);
  }

  if (!wsConnected && !wsConnecting) {
    warnings.push('WebSocket disconnected - Real-time temperature and status updates are paused. Refresh the page to reconnect.');
  }

  // Prepare graph data for temperature cards
  const indoorGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.indoor || null,
  }));

  const outdoorGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.outdoor || null,
  }));

  const supplyGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.supply || null,
  }));

  const returnGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.return || null,
  }));

  const hotWaterGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.hot_water || null,
  }));

  const brineInGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.brine_in || null,
  }));

  const brineOutGraphData = temperatureHistory.map(r => ({
    timestamp: r.timestamp,
    value: r.brine_out || null,
  }));

  const handleOverride = async () => {
    try {
      setOverrideMessage(null);
      const response = await fetch('http://localhost:8000/api/override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_temperature: overrideTemp,
          duration_minutes: overrideIndefinite ? null : overrideDuration,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOverrideMessage(`✓ ${data.message}`);
        setManualOverrideActive(true);
        setTimeout(() => {
          setShowOverrideModal(false);
          setOverrideMessage(null);
        }, 2000);
      } else {
        setOverrideMessage('✗ Failed to set override');
      }
    } catch (error) {
      setOverrideMessage('✗ Error setting override');
    }
  };

  const toggleManualOverride = async () => {
    if (manualOverrideActive) {
      // Resume automatic optimization
      setManualOverrideActive(false);
      // Could add API call to resume optimization
    } else {
      // Activate manual override
      setShowOverrideModal(true);
    }
  };

  const handleToggleHour = async (hour: number, shouldHeat: boolean) => {
    // TODO: Implement per-hour toggle API
    console.log(`Toggle hour ${hour} to ${shouldHeat ? 'ON' : 'OFF'}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">ThermIQ Optimizer</h1>
              <p className="text-sm text-gray-600">Sirkli 6, Lombi küla, Tartu vald</p>
            </div>
            <div className="flex items-center gap-4">
              {/* System Status */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">MQTT:</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    status?.mqtt_connected ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      status?.mqtt_connected ? 'bg-green-600' : 'bg-red-600'
                    } animate-pulse`} />
                    {status?.mqtt_connected ? 'OK' : 'Down'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">WS:</span>
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    wsConnected ? 'text-green-600' : wsConnecting ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      wsConnected ? 'bg-green-600' : wsConnecting ? 'bg-blue-600' : 'bg-red-600'
                    } animate-pulse`} />
                    {wsConnected ? 'OK' : wsConnecting ? 'Connecting...' : 'Down'}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-2 border-l border-gray-300">
                  <span className="text-xs text-gray-600">Heater:</span>
                  <span className={`text-xs font-semibold ${
                    isHeating ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {isHeating ? '🔥 HEATING' : '❄️ IDLE'}
                  </span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-200">
                <span className="text-sm font-medium text-gray-700">Mode:</span>
                <button
                  onClick={toggleManualOverride}
                  className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
                    manualOverrideActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}
                >
                  {manualOverrideActive ? '🔧 Manual' : '🤖 Optimized'}
                </button>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-2">
                <a
                  href="/insights"
                  className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
                >
                  📊 Insights
                </a>
                <a
                  href="/settings"
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Settings
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error, Warning, and Info Notifications */}
        <ErrorNotification errors={errors} warnings={warnings} infos={infos} />

        {/* Smart Alerts Panel */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">System Alerts</h2>
          </div>
          <AlertsPanel maxAlerts={5} showAcknowledged={false} />
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          <StatusCard
            title="Indoor Temperature"
            value={`${status?.indoor_temp?.toFixed(1) || '--'}°C`}
            subtitle={`Target: ${status?.target_temp?.toFixed(1) || '--'}°C`}
            icon="🏠"
            color={
              status?.indoor_temp && status?.target_temp
                ? Math.abs(status.indoor_temp - status.target_temp) < 0.5
                  ? 'success'
                  : 'warning'
                : 'neutral'
            }
            graphData={indoorGraphData}
            graphColor="#667eea"
          />

          <StatusCard
            title="Outdoor Temperature"
            value={`${status?.outdoor_temp?.toFixed(1) || '--'}°C`}
            icon="🌡️"
            color="neutral"
            graphData={outdoorGraphData}
            graphColor="#3b82f6"
          />

          <StatusCard
            title="Floor Heating Supply"
            value={`${status?.supply_temp?.toFixed(1) || '--'}°C`}
            subtitle="Water going to floor"
            icon="♨️"
            color="warning"
            graphData={supplyGraphData}
            graphColor="#f59e0b"
          />

          <StatusCard
            title="Floor Heating Return"
            value={`${status?.return_temp?.toFixed(1) || '--'}°C`}
            subtitle="Water coming back"
            icon="🔄"
            color="primary"
            graphData={returnGraphData}
            graphColor="#8b5cf6"
          />

          <StatusCard
            title="Hot Water Tank"
            value={`${status?.hot_water_temp?.toFixed(1) || '--'}°C`}
            subtitle="Household water"
            icon="🚿"
            color={
              status?.hot_water_temp
                ? status.hot_water_temp >= 45
                  ? 'success'
                  : status.hot_water_temp >= 40
                  ? 'warning'
                  : 'danger'
                : 'neutral'
            }
            graphData={hotWaterGraphData}
            graphColor="#ef4444"
          />

          <StatusCard
            title="Brine In"
            value={`${status?.brine_in_temp?.toFixed(1) || '--'}°C`}
            subtitle="From ground collector"
            icon="❄️"
            color="primary"
            graphData={brineInGraphData}
            graphColor="#06b6d4"
          />

          <StatusCard
            title="Brine Out"
            value={`${status?.brine_out_temp?.toFixed(1) || '--'}°C`}
            subtitle="To ground collector"
            icon="🌡️"
            color="neutral"
            graphData={brineOutGraphData}
            graphColor="#14b8a6"
          />

          <StatusCard
            title="Heat Pump Mode"
            value={status?.heat_pump_mode || 'Auto'}
            subtitle={
              status?.heat_curve
                ? `Heat curve: ${status.heat_curve.toFixed(1)}`
                : 'No curve data'
            }
            icon="⚙️"
            color={status?.heating_active ? 'danger' : 'success'}
          />

          <StatusCard
            title="Heating Status"
            value={status?.heating_active ? 'ON' : 'OFF'}
            subtitle={status?.power ? `${status.power.toFixed(1)} kW` : 'No power data'}
            icon={status?.heating_active ? '🔥' : '❄️'}
            color={status?.heating_active ? 'danger' : 'primary'}
          />

          <StatusCard
            title="Today's Cost"
            value={`€${todaysCost.toFixed(2)}`}
            subtitle={`${savingsPercent >= 0 ? 'Saving' : 'Over'} ${Math.abs(savingsPercent).toFixed(0)}%`}
            icon="💰"
            trend={savingsPercent >= 0 ? 'down' : 'up'}
            trendValue={`${Math.abs(savingsPercent).toFixed(0)}%`}
            color={savingsPercent >= 0 ? 'success' : 'danger'}
          />

          <StatusCard
            title="Current Price"
            value={`${(currentPrice / 10).toFixed(1)}¢/kWh`}
            subtitle="per MWh"
            icon="⚡"
            color={
              currentPrice < avgPrice * 0.7
                ? 'success'
                : currentPrice > avgPrice * 1.3
                ? 'danger'
                : 'warning'
            }
          />

          <StatusCard
            title="Optimization"
            value={status?.optimization_mode || 'Balanced'}
            subtitle={
              currentScheduleItem
                ? currentScheduleItem.should_heat
                  ? 'Heating scheduled'
                  : 'Heating paused'
                : 'Loading...'
            }
            icon="🎯"
            color="primary"
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <TemperatureChart data={temperatureHistory} />
          <PriceChart
            prices={priceViewMode === 'day' ? dayPrices : rollingPrices}
            currentHour={currentHour}
            vatConfig={vatConfig}
            viewMode={priceViewMode}
            onViewModeChange={setPriceViewMode}
          />
        </div>

        {/* Schedule Timeline */}
        <ScheduleTimeline
          schedule={schedule}
          currentHour={currentHour}
          onToggleHour={handleToggleHour}
          manualOverride={manualOverrideActive}
          vatConfig={vatConfig}
        />

        {/* History Chart */}
        <HistoryChart hours={24} />
      </main>

      {/* Manual Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Manual Temperature Override</h3>
            <p className="text-sm text-gray-600 mb-4">
              Temporarily override the automatic schedule. System will resume optimization when override expires.
            </p>

            {overrideMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                overrideMessage.startsWith('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {overrideMessage}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Temperature: {overrideTemp}°C
                </label>
                <input
                  type="range"
                  min="18"
                  max="25"
                  step="0.5"
                  value={overrideTemp}
                  onChange={(e) => setOverrideTemp(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>18°C</span>
                  <span>25°C</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration: {overrideIndefinite ? 'Until next action' : `${overrideDuration} minutes (${(overrideDuration / 60).toFixed(1)} hours)`}
                </label>
                {!overrideIndefinite && (
                  <>
                    <input
                      type="range"
                      min="30"
                      max="720"
                      step="30"
                      value={overrideDuration}
                      onChange={(e) => setOverrideDuration(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>30 min</span>
                      <span>12 hours</span>
                    </div>
                  </>
                )}
                <label className="flex items-center gap-2 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={overrideIndefinite}
                    onChange={(e) => setOverrideIndefinite(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Override indefinitely (until next action)</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowOverrideModal(false);
                    setOverrideMessage(null);
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverride}
                  className="flex-1 btn-primary"
                >
                  Apply Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
