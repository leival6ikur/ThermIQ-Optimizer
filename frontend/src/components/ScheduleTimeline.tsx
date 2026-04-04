import React, { useState, useEffect } from 'react';
import type { HeatingSchedule, VATConfig } from '../types/index.js';

interface ScheduleTimelineProps {
  schedule: HeatingSchedule[];
  currentHour: number;
}

interface ScheduleTimelinePropsExtended extends ScheduleTimelineProps {
  onToggleHour?: (hour: number, shouldHeat: boolean) => void;
  onResetSchedule?: () => void;
  manualOverride?: boolean;
  vatConfig?: VATConfig;
}

interface PastScheduleItem {
  timestamp: string;
  hour: number;
  date: string;
  should_heat: boolean | null;
  was_heating: boolean;
  heating_minutes: number;
  price: number;
  estimated_cost: number;
  avg_power: number | null;
}

export const ScheduleTimeline: React.FC<ScheduleTimelinePropsExtended> = ({
  schedule,
  currentHour,
  onToggleHour,
  onResetSchedule,
  manualOverride = false,
  vatConfig,
}) => {
  const vatLabel = vatConfig?.vat_enabled ? ` (incl. VAT)` : '';
  const [showPast, setShowPast] = useState(false);
  const [pastData, setPastData] = useState<PastScheduleItem[]>([]);
  const [loadingPast, setLoadingPast] = useState(false);

  // Fetch past 24h data when toggle is switched
  useEffect(() => {
    if (showPast) {
      const fetchPastData = async () => {
        setLoadingPast(true);
        try {
          const response = await fetch('http://localhost:8000/api/schedule/past');
          if (response.ok) {
            const data = await response.json();
            setPastData(data);
          }
        } catch (error) {
          console.error('Failed to fetch past schedule:', error);
        } finally {
          setLoadingPast(false);
        }
      };
      fetchPastData();
    }
  }, [showPast]);
  if (!schedule || schedule.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Heating Schedule (Next 24h)</h3>
        <div className="text-center text-gray-500 py-8">
          No schedule data available. Nord Pool prices are usually published at 13:00 GMT+0.
        </div>
      </div>
    );
  }

  // Generate full 24 hours starting from current hour
  const fullSchedule = Array.from({ length: 24 }, (_, i) => {
    const hour = (currentHour + i) % 24;
    const existing = schedule.find(s => s.hour === hour);
    return existing || {
      hour,
      should_heat: false,
      price: 0,
      estimated_cost: 0,
      hasPriceData: false,
    };
  });

  // Find next state change
  const nextChange = fullSchedule.find((s, i) => {
    if (i === 0) return false;
    const currentState = fullSchedule[0]?.should_heat;
    return s.should_heat !== currentState && (s as any).hasPriceData !== false;
  });

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">Heating Schedule</h3>
          {/* Past/Future Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setShowPast(false)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                !showPast
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Next 24h
            </button>
            <button
              onClick={() => setShowPast(true)}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                showPast
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Past 24h
            </button>
          </div>
          {/* Reset Schedule Button */}
          {onResetSchedule && !showPast && (
            <button
              onClick={onResetSchedule}
              className="px-3 py-1 text-sm font-medium rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm"
              title="Reset to optimized schedule"
            >
              🔄 Reset Schedule
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          {manualOverride && (
            <span className="text-sm font-semibold text-orange-600 px-3 py-1 bg-orange-100 rounded">
              Manual Override Active
            </span>
          )}
          {!manualOverride && nextChange && (nextChange as any).hasPriceData !== false && (
            <div className="text-sm text-gray-600">
              Next change: <span className="font-semibold">{nextChange.hour}:00</span> →{' '}
              <span className={nextChange.should_heat ? 'text-red-600' : 'text-blue-600'}>
                {nextChange.should_heat ? 'ON' : 'OFF'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="relative mb-4">
        <div className="relative h-12 bg-gray-100 rounded-lg overflow-visible">
          {fullSchedule.map((slot, index) => {
            const hasPriceData = (slot as any).hasPriceData !== false;

            return (
              <div
                key={`${slot.hour}-${index}`}
                className={`absolute h-full transition-all cursor-pointer hover:opacity-80 ${
                  !hasPriceData ? 'bg-gray-300 opacity-50' :
                  manualOverride ? 'bg-orange-500' :
                  slot.should_heat ? 'bg-red-500' : 'bg-blue-200'
                }`}
                style={{
                  left: `${(index / 24) * 100}%`,
                  width: `${100 / 24}%`,
                }}
                title={`${slot.hour}:00 - ${hasPriceData ? `${(slot.price / 10).toFixed(1)}¢/kWh` : 'No price data'}`}
                onClick={() => hasPriceData && onToggleHour && onToggleHour(slot.hour, !slot.should_heat)}
              />
            );
          })}

          {/* Current time indicator - prominent vertical line */}
          <div
            className="absolute -top-1 -bottom-1 w-1 bg-gray-900 z-10 shadow-lg"
            style={{ left: '0%' }}
          >
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="text-xs font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-900">
                NOW
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>

        {/* Hour labels under timeline */}
        <div className="relative h-5 flex">
          {fullSchedule.map((slot, index) => {
            // Show every 3rd hour to avoid overcrowding
            if (index % 3 !== 0) return null;

            return (
              <div
                key={`label-${slot.hour}-${index}`}
                className="absolute text-xs text-gray-600"
                style={{
                  left: `${(index / 24) * 100}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {slot.hour}:00
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500 rounded"></div>
          <span>Heating ON</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-200 rounded"></div>
          <span>Heating OFF</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border-2 border-gray-900 rounded"></div>
          <span>Current hour</span>
        </div>
      </div>

      {/* Detailed schedule table (all 24 hours) */}
      <div className="mt-4 overflow-x-auto max-h-96">
        {loadingPast && showPast ? (
          <div className="text-center py-8 text-gray-500">Loading past data...</div>
        ) : (
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1 text-left">Hour</th>
                <th className="px-2 py-1 text-left">Date</th>
                <th className="px-2 py-1 text-left">{showPast ? 'Planned' : 'Status'}</th>
                {showPast && <th className="px-2 py-1 text-left">Actual</th>}
                <th className="px-2 py-1 text-right">Price{vatLabel} (¢/kWh)</th>
                <th className="px-2 py-1 text-right">Cost{vatLabel} (€)</th>
                {showPast && <th className="px-2 py-1 text-right">Power (W)</th>}
                {onToggleHour && !showPast && <th className="px-2 py-1 text-center">Toggle</th>}
              </tr>
            </thead>
            <tbody>
            {showPast ? (
              // Render past 24h data
              pastData.map((item, index) => {
                const itemDate = new Date(item.timestamp);
                const dateStr = itemDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                const isMatch = item.should_heat === item.was_heating;

                return (
                  <tr key={`past-${index}`} className="border-t">
                    <td className="px-2 py-1">{item.hour}:00</td>
                    <td className="px-2 py-1 text-xs text-gray-500">{dateStr}</td>
                    <td className="px-2 py-1">
                      {item.should_heat === null ? (
                        <span className="text-gray-400">-- No plan</span>
                      ) : (
                        <span className={item.should_heat ? 'text-red-600' : 'text-blue-600'}>
                          {item.should_heat ? '🔥 ON' : '❄️ OFF'}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <span className={`inline-flex items-center gap-1 ${
                        item.was_heating ? 'text-red-600 font-semibold' : 'text-gray-500'
                      } ${!isMatch && item.should_heat !== null ? 'bg-yellow-100 px-1 rounded' : ''}`}>
                        {item.was_heating ? `✓ ${item.heating_minutes || 0} min` : '✗ Idle'}
                        {!isMatch && item.should_heat !== null && ' ⚠️'}
                      </span>
                    </td>
                    <td className="px-2 py-1 text-right">
                      {(item.price / 10).toFixed(1)}
                    </td>
                    <td className="px-2 py-1 text-right">
                      €{item.estimated_cost.toFixed(3)}
                    </td>
                    <td className="px-2 py-1 text-right text-gray-600">
                      {item.avg_power ? `${item.avg_power}W` : '--'}
                    </td>
                  </tr>
                );
              })
            ) : (
              // Render future 24h data
              fullSchedule.map((slot, index) => {
              const hasPriceData = (slot as any).hasPriceData !== false;
              const isCurrentHour = index === 0;

              // Calculate date for this hour
              const now = new Date();
              const hoursFromNow = index;
              const targetDate = new Date(now.getTime() + hoursFromNow * 60 * 60 * 1000);
              const dateStr = targetDate.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });

              return (
                <tr
                  key={`${slot.hour}-${index}`}
                  className={`border-t ${isCurrentHour ? 'bg-primary/10 font-semibold' : ''} ${
                    !hasPriceData ? 'text-gray-400' : ''
                  }`}
                >
                  <td className="px-2 py-1">{slot.hour}:00</td>
                  <td className="px-2 py-1 text-xs text-gray-500">{dateStr}</td>
                  <td className="px-2 py-1">
                    <span className={`inline-flex items-center gap-1 ${
                      !hasPriceData ? 'text-gray-400' :
                      manualOverride ? 'text-orange-600' :
                      slot.should_heat ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {!hasPriceData ? '⏳ Pending' :
                       manualOverride ? '🔧 Manual' :
                       slot.should_heat ? '🔥 ON' : '❄️ OFF'}
                    </span>
                  </td>
                  <td className="px-2 py-1 text-right">
                    {hasPriceData ? (slot.price / 10).toFixed(1) : '--'}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {hasPriceData ? `€${slot.estimated_cost.toFixed(3)}` : '--'}
                  </td>
                  {onToggleHour && (
                    <td className="px-2 py-1 text-center">
                      {hasPriceData && (
                        <button
                          onClick={() => onToggleHour(slot.hour, !slot.should_heat)}
                          className="px-2 py-0.5 text-xs rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                          disabled={manualOverride}
                        >
                          {slot.should_heat ? 'Turn OFF' : 'Turn ON'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
              })
            )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
