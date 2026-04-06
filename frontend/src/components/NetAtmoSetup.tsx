import { useState, useEffect } from 'react';

interface NetAtmoConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
  station_name: string;
  polling_interval: number;
}

interface NetAtmoSetupProps {
  onClose?: () => void;
}

export function NetAtmoSetup({ onClose }: NetAtmoSetupProps) {
  const [config, setConfig] = useState<NetAtmoConfig>({
    enabled: false,
    client_id: '',
    client_secret: '',
    username: '',
    password: '',
    station_name: '',
    polling_interval: 600,
  });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/config/netatmo');
      if (!response.ok) throw new Error('Failed to fetch config');

      const data = await response.json();
      setConfig({
        enabled: data.enabled || false,
        client_id: data.client_id || '',
        client_secret: '',  // Never sent from backend
        username: data.username || '',
        password: '',  // Never sent from backend
        station_name: data.station_name || '',
        polling_interval: data.polling_interval || 600,
      });
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/config/netatmo/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const result = await response.json();
      setTestResult(result);
    } catch (err) {
      setError('Test failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/config/netatmo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save');
      }

      const result = await response.json();
      alert(result.message);
      if (onClose) onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          NetAtmo Weather Station Setup
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      {/* Help Section */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="font-semibold text-blue-900 dark:text-blue-100">
            📖 How to get NetAtmo API credentials
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            {showHelp ? '▲' : '▼'}
          </span>
        </button>

        {showHelp && (
          <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p><strong>1. Create NetAtmo Developer Account:</strong></p>
            <p className="ml-4">
              • Go to: <a href="https://dev.netatmo.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">https://dev.netatmo.com/</a>
            </p>
            <p className="ml-4">• Log in with your NetAtmo account</p>

            <p className="mt-3"><strong>2. Create an App:</strong></p>
            <p className="ml-4">• Click "Create" → "Create an app"</p>
            <p className="ml-4">• Name: "ThermIQ Integration" (or anything)</p>
            <p className="ml-4">• Description: "Personal weather station integration"</p>
            <p className="ml-4">• Data Protection Officer: your email</p>

            <p className="mt-3"><strong>3. Get Credentials:</strong></p>
            <p className="ml-4">• After creating app, copy <strong>Client ID</strong> and <strong>Client Secret</strong></p>
            <p className="ml-4">• Username/Password: Your regular NetAtmo account credentials</p>

            <p className="mt-3 text-yellow-700 dark:text-yellow-300">
              ⚠️ Keep credentials secure - they provide access to your NetAtmo data
            </p>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="space-y-4">
        {/* Enable/Disable */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="enabled"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <label htmlFor="enabled" className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
            Enable NetAtmo Integration
          </label>
        </div>

        {config.enabled && (
          <>
            {/* Client ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client ID *
              </label>
              <input
                type="text"
                value={config.client_id}
                onChange={(e) => setConfig({ ...config, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="5a1b2c3d4e5f6a7b8c9d0e1f"
              />
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Client Secret *
              </label>
              <input
                type="password"
                value={config.client_secret}
                onChange={(e) => setConfig({ ...config, client_secret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter client secret"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NetAtmo Username (Email) *
              </label>
              <input
                type="email"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="your@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                NetAtmo Password *
              </label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter password"
              />
            </div>

            {/* Polling Interval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Polling Interval (seconds)
              </label>
              <input
                type="number"
                min="300"
                max="3600"
                value={config.polling_interval}
                onChange={(e) => setConfig({ ...config, polling_interval: parseInt(e.target.value) || 600 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How often to fetch data (NetAtmo updates every 5-10 min)
              </p>
            </div>
          </>
        )}
      </div>

      {/* Test Result */}
      {testResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          testResult.success
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          <p className={`font-semibold ${
            testResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
          }`}>
            {testResult.success ? '✓ Connection Successful' : '✗ Connection Failed'}
          </p>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300">
            {testResult.message}
          </p>
          {testResult.success && testResult.indoor_temp !== undefined && (
            <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              <p>Indoor: {testResult.indoor_temp?.toFixed(1)}°C</p>
              <p>Outdoor: {testResult.outdoor_temp?.toFixed(1)}°C</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {config.enabled && (
          <button
            onClick={handleTest}
            disabled={testing || !config.client_id || !config.client_secret || !config.username || !config.password}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Restart the backend after saving to apply changes
      </p>
    </div>
  );
}
