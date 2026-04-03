import React, { useEffect, useState } from 'react';
import type { VATConfig } from '../types/index.js';

interface Settings {
  target_temperature: number;
  temperature_tolerance: number;
  comfort_hours_start: string;
  comfort_hours_end: string;
  optimization_strategy: 'aggressive' | 'balanced' | 'conservative';
  heat_curve: number;
  building_insulation: 'poor' | 'average' | 'good' | 'excellent';
  region: string;
  currency: string;
}

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    target_temperature: 21.5,
    temperature_tolerance: 1.0,
    comfort_hours_start: '06:00',
    comfort_hours_end: '23:00',
    optimization_strategy: 'balanced',
    heat_curve: 1.5,
    building_insulation: 'good',
    region: 'EE',
    currency: 'EUR',
  });

  const [vatConfig, setVatConfig] = useState<VATConfig>({
    vat_enabled: false,
    vat_rate: 0.0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        // Add small delay to ensure backend is ready
        await new Promise(resolve => setTimeout(resolve, 500));

        const [configRes, vatRes] = await Promise.all([
          fetch('http://localhost:8000/api/config'),
          fetch('http://localhost:8000/api/config/vat'),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          setSettings({
            target_temperature: data.optimization?.target_temperature || 21.5,
            temperature_tolerance: data.optimization?.temperature_tolerance || 1.0,
            comfort_hours_start: data.optimization?.comfort_hours_start || '06:00',
            comfort_hours_end: data.optimization?.comfort_hours_end || '23:00',
            optimization_strategy: data.optimization?.strategy || 'balanced',
            heat_curve: data.heat_curve || 1.5,
            building_insulation: data.building?.insulation_quality || 'good',
            region: data.nordpool?.region || 'EE',
            currency: data.nordpool?.currency || 'EUR',
          });
        } else {
          console.error('Failed to fetch config:', configRes.status, await configRes.text());
        }

        if (vatRes.ok) {
          const vatData = await vatRes.json();
          setVatConfig({
            vat_enabled: vatData.vat_enabled || false,
            vat_rate: vatData.vat_rate || 0.0,
          });
        } else {
          console.error('Failed to fetch VAT config:', vatRes.status, await vatRes.text());
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const [configRes, vatRes] = await Promise.all([
        fetch('http://localhost:8000/api/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            optimization: {
              strategy: settings.optimization_strategy,
              target_temperature: settings.target_temperature,
              temperature_tolerance: settings.temperature_tolerance,
              comfort_hours_start: settings.comfort_hours_start,
              comfort_hours_end: settings.comfort_hours_end,
            },
            heat_curve: settings.heat_curve,
            building: {
              insulation_quality: settings.building_insulation,
            },
            nordpool: {
              region: settings.region,
              currency: settings.currency,
            },
          }),
        }),
        fetch('http://localhost:8000/api/config/vat', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            vat_enabled: vatConfig.vat_enabled,
            vat_rate: vatConfig.vat_rate,
          }),
        }),
      ]);

      if (configRes.ok && vatRes.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-gray-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-sm text-gray-600">Configure ThermIQ Optimizer</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {message && (
          <div className={`card mb-6 border-2 ${
            message.type === 'success' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          }`}>
            <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
              {message.text}
            </p>
          </div>
        )}

        {/* Temperature Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Temperature Settings</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Temperature: {settings.target_temperature}°C
              </label>
              <input
                type="range"
                min="18"
                max="25"
                step="0.5"
                value={settings.target_temperature}
                onChange={(e) => setSettings({ ...settings, target_temperature: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>18°C</span>
                <span>25°C</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature Tolerance: ±{settings.temperature_tolerance}°C
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.5"
                value={settings.temperature_tolerance}
                onChange={(e) => setSettings({ ...settings, temperature_tolerance: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Allowed temperature deviation from target
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Heat Curve: {settings.heat_curve}
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={settings.heat_curve}
                onChange={(e) => setSettings({ ...settings, heat_curve: parseFloat(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.5 (Mild)</span>
                <span>3.0 (Steep)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Comfort Hours */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Comfort Hours</h2>
          <p className="text-sm text-gray-600 mb-4">
            Temperature must stay within tolerance during these hours
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={settings.comfort_hours_start}
                onChange={(e) => setSettings({ ...settings, comfort_hours_start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={settings.comfort_hours_end}
                onChange={(e) => setSettings({ ...settings, comfort_hours_end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Optimization Strategy */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Optimization Strategy</h2>

          <div className="space-y-3">
            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: settings.optimization_strategy === 'aggressive' ? '#667eea' : '#e5e7eb' }}>
              <input
                type="radio"
                name="strategy"
                value="aggressive"
                checked={settings.optimization_strategy === 'aggressive'}
                onChange={(e) => setSettings({ ...settings, optimization_strategy: e.target.value as any })}
                className="mt-1"
              />
              <div className="ml-3">
                <div className="font-semibold">Aggressive</div>
                <div className="text-sm text-gray-600">
                  Heat only during cheapest 30% of hours. Maximum cost savings, may have temperature fluctuations.
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: settings.optimization_strategy === 'balanced' ? '#667eea' : '#e5e7eb' }}>
              <input
                type="radio"
                name="strategy"
                value="balanced"
                checked={settings.optimization_strategy === 'balanced'}
                onChange={(e) => setSettings({ ...settings, optimization_strategy: e.target.value as any })}
                className="mt-1"
              />
              <div className="ml-3">
                <div className="font-semibold">Balanced (Recommended)</div>
                <div className="text-sm text-gray-600">
                  Heat during cheapest 50% of hours, prioritize comfort during comfort hours.
                </div>
              </div>
            </label>

            <label className="flex items-start p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              style={{ borderColor: settings.optimization_strategy === 'conservative' ? '#667eea' : '#e5e7eb' }}>
              <input
                type="radio"
                name="strategy"
                value="conservative"
                checked={settings.optimization_strategy === 'conservative'}
                onChange={(e) => setSettings({ ...settings, optimization_strategy: e.target.value as any })}
                className="mt-1"
              />
              <div className="ml-3">
                <div className="font-semibold">Conservative</div>
                <div className="text-sm text-gray-600">
                  Heat during cheapest 70% of hours. Prioritize stable temperature over cost savings.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Building Characteristics */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Building Characteristics</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insulation Quality
            </label>
            <select
              value={settings.building_insulation}
              onChange={(e) => setSettings({ ...settings, building_insulation: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="poor">Poor - Older building, drafty</option>
              <option value="average">Average - Standard insulation</option>
              <option value="good">Good - Modern insulation</option>
              <option value="excellent">Excellent - Passive house standard</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Affects how quickly building loses heat
            </p>
          </div>
        </div>

        {/* Nord Pool Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Electricity Market</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region
              </label>
              <select
                value={settings.region}
                onChange={(e) => setSettings({ ...settings, region: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="EE">Estonia (EE)</option>
                <option value="FI">Finland (FI)</option>
                <option value="LV">Latvia (LV)</option>
                <option value="LT">Lithuania (LT)</option>
                <option value="SE1">Sweden SE1</option>
                <option value="SE2">Sweden SE2</option>
                <option value="SE3">Sweden SE3</option>
                <option value="SE4">Sweden SE4</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Cost Settings */}
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">Cost Settings</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure how costs are displayed in the application
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium text-gray-900">Include VAT in prices</div>
                <div className="text-sm text-gray-600">
                  Apply VAT to all displayed electricity prices and costs
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={vatConfig.vat_enabled}
                  onChange={(e) => setVatConfig({ ...vatConfig, vat_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {vatConfig.vat_enabled && (
              <div className="pl-4 border-l-4 border-primary">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VAT Rate (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={vatConfig.vat_rate === 0 ? '' : vatConfig.vat_rate}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Parse the value, default to 0 if empty or NaN
                      const numValue = value === '' ? 0 : parseFloat(value);
                      setVatConfig({
                        ...vatConfig,
                        vat_rate: isNaN(numValue) ? 0 : numValue
                      });
                    }}
                    onBlur={(e) => {
                      // On blur, ensure we have a valid number
                      if (e.target.value === '' || isNaN(parseFloat(e.target.value))) {
                        setVatConfig({ ...vatConfig, vat_rate: 0 });
                      }
                    }}
                    placeholder="0"
                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="text-gray-700">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Standard VAT rate in Estonia is 24% (since 1 July 2025). Enter your applicable rate.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </main>
    </div>
  );
};
