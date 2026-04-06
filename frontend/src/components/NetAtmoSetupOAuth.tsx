import { useState, useEffect } from 'react';

interface NetAtmoConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
}

interface NetAtmoSetupOAuthProps {
  onClose?: () => void;
}

export function NetAtmoSetupOAuth({ onClose }: NetAtmoSetupOAuthProps) {
  const [config, setConfig] = useState<NetAtmoConfig>({
    enabled: false,
    client_id: '',
    client_secret: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    fetchConfig();
    checkStatus();
  }, []);

  // Check for OAuth callback success/error in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get('netatmo_success');
    const errorMsg = params.get('netatmo_error');

    if (success) {
      alert('✓ Successfully connected to NetAtmo!');
      checkStatus();
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (errorMsg) {
      setError(`Connection failed: ${errorMsg}`);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
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
      });
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await fetch('/api/auth/netatmo/status');
      const data = await response.json();
      setStatus(data);
    } catch (err) {
      console.error('Error checking status:', err);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);

    try {
      // First, save the client_id and client_secret
      const saveResponse = await fetch('/api/config/netatmo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: true,
          client_id: config.client_id,
          client_secret: config.client_secret,
          username: '',
          password: '',
          station_name: '',
          polling_interval: 600,
        }),
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save configuration');
      }

      // Get authorization URL
      const authResponse = await fetch('/api/auth/netatmo/authorize');
      if (!authResponse.ok) {
        const errorData = await authResponse.json();
        throw new Error(errorData.detail || 'Failed to get authorization URL');
      }

      const authData = await authResponse.json();

      // Open NetAtmo authorization in new window
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      window.open(
        authData.authorization_url,
        'NetAtmo Authorization',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Show waiting message
      alert('Please complete authorization in the popup window. This page will refresh when done.');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect NetAtmo?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/netatmo/disconnect', {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to disconnect');

      alert('NetAtmo disconnected successfully');
      await checkStatus();
      await fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch('/api/auth/netatmo/test', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to test connection');

      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  const isConnected = status?.connected === true;

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

      {/* Connection Status */}
      {isConnected && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold text-green-900 dark:text-green-100">
                ✓ Connected to NetAtmo
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {status.message}
              </p>
              {status.indoor_temp !== undefined && status.indoor_temp !== null && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  Indoor: {status.indoor_temp?.toFixed(1)}°C | Outdoor: {status.outdoor_temp?.toFixed(1)}°C
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleTest}
                disabled={testing}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {testing ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={handleDisconnect}
                className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`mt-3 p-3 rounded-lg ${
              testResult.success && testResult.indoor_temp !== null
                ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
                : testResult.success
                ? 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
                : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
            }`}>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {testResult.success ? '✓ Test Result:' : '✗ Test Failed:'}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {testResult.message}
              </p>
              {testResult.success && testResult.indoor_temp !== null && testResult.indoor_temp !== undefined ? (
                <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  <p>✓ Indoor: {testResult.indoor_temp?.toFixed(1)}°C</p>
                  <p>✓ Outdoor: {testResult.outdoor_temp?.toFixed(1)}°C</p>
                  <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                    NetAtmo is working! Temperature data will be polled every 10 minutes after backend restart.
                  </p>
                </div>
              ) : testResult.success ? (
                <p className="mt-2 text-sm text-yellow-800 dark:text-yellow-200">
                  ⚠️ Connected but no temperature data available. Check your NetAtmo station status at my.netatmo.com
                </p>
              ) : null}
            </div>
          )}
        </div>
      )}

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

            <p className="mt-3"><strong>3. Get Credentials:</strong></p>
            <p className="ml-4">• Copy <strong>Client ID</strong> and <strong>Client Secret</strong></p>

            <p className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              <strong>✨ OAuth2 Flow:</strong> You'll authorize the app securely via NetAtmo's website. No need to enter your password here!
            </p>
          </div>
        )}
      </div>

      {/* Configuration Form */}
      {!isConnected && (
        <div className="space-y-4">
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

          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Next step:</strong> Click "Connect to NetAtmo" below. You'll be redirected to NetAtmo's website to securely authorize this application.
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-900 dark:text-red-100">{error}</p>
        </div>
      )}

      {/* Actions */}
      {!isConnected && (
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleConnect}
            disabled={connecting || !config.client_id || !config.client_secret}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {connecting ? 'Opening NetAtmo...' : '🔗 Connect to NetAtmo'}
          </button>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        {isConnected
          ? 'Restart the backend to start polling NetAtmo data'
          : 'OAuth2 Authorization Code flow - Secure and future-proof'}
      </p>
    </div>
  );
}
