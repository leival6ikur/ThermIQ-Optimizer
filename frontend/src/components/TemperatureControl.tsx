import { useState, useEffect } from 'react';

interface TemperatureControlProps {
  className?: string;
}

export function TemperatureControl({ className = '' }: TemperatureControlProps) {
  const [targetTemp, setTargetTemp] = useState<number>(21.5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current target temperature on mount
  useEffect(() => {
    fetchTargetTemp();
  }, []);

  const fetchTargetTemp = async () => {
    try {
      const response = await fetch('/api/control/setpoint');
      if (!response.ok) throw new Error('Failed to fetch target temperature');

      const data = await response.json();
      setTargetTemp(data.target_temperature);
    } catch (err) {
      console.error('Error fetching target temperature:', err);
      setError('Failed to load current temperature');
    }
  };

  const handleTempChange = async (newTemp: number) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/control/setpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ temperature: newTemp }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to set temperature');
      }

      const data = await response.json();
      setTargetTemp(data.target_temperature);
      setSuccessMessage(`Temperature set to ${data.target_temperature}°C`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set temperature');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementTemp = () => {
    const newTemp = Math.min(25, targetTemp + 0.5);
    handleTempChange(newTemp);
  };

  const decrementTemp = () => {
    const newTemp = Math.max(18, targetTemp - 0.5);
    handleTempChange(newTemp);
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Target Temperature
      </h3>

      <div className="flex items-center justify-center gap-4">
        {/* Decrease button */}
        <button
          onClick={decrementTemp}
          disabled={isLoading || targetTemp <= 18}
          className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-2xl flex items-center justify-center transition-colors"
          aria-label="Decrease temperature"
        >
          −
        </button>

        {/* Temperature display */}
        <div className="text-center min-w-[120px]">
          <div className="text-4xl font-bold text-gray-900 dark:text-white">
            {targetTemp.toFixed(1)}°C
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Range: 18-25°C
          </div>
        </div>

        {/* Increase button */}
        <button
          onClick={incrementTemp}
          disabled={isLoading || targetTemp >= 25}
          className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-bold text-2xl flex items-center justify-center transition-colors"
          aria-label="Increase temperature"
        >
          +
        </button>
      </div>

      {/* Status messages */}
      {isLoading && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Updating temperature...
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-red-600 dark:text-red-400 mt-4">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="text-center text-sm text-green-600 dark:text-green-400 mt-4">
          ✓ {successMessage}
        </p>
      )}

      {/* Info text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Changes apply immediately to the heat pump
      </p>
    </div>
  );
}
