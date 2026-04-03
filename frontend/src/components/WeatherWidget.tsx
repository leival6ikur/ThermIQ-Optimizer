import React, { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  feels_like: number;
  humidity: number;
  wind_speed: number;
  clouds: number;
  description: string;
  icon: string;
}

interface WeatherForecast {
  timestamp: string;
  temperature: number;
  description: string;
  icon: string;
}

interface HeatingLoad {
  timestamp: string;
  temperature: number;
  estimated_load: number;
  load_level: 'low' | 'medium' | 'high';
  description: string;
}

interface WeatherWidgetProps {
  showForecast?: boolean;
  showHeatingLoad?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  showForecast = false,
  showHeatingLoad = false,
}) => {
  const [current, setCurrent] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [heatingLoads, setHeatingLoads] = useState<HeatingLoad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current weather
        const currentRes = await fetch('http://localhost:8000/api/weather/current');
        if (currentRes.status === 503) {
          setError('Weather service not configured');
          return;
        }

        if (currentRes.ok) {
          const data = await currentRes.json();
          setCurrent(data);
        }

        // Fetch forecast if requested
        if (showForecast) {
          const forecastRes = await fetch('http://localhost:8000/api/weather/forecast?hours=24');
          if (forecastRes.ok) {
            const data = await forecastRes.json();
            setForecast(data.forecasts || []);
          }
        }

        // Fetch heating load if requested
        if (showHeatingLoad) {
          const loadRes = await fetch('http://localhost:8000/api/weather/heating-load?hours=24');
          if (loadRes.ok) {
            const data = await loadRes.json();
            setHeatingLoads(data.heating_loads || []);
          }
        }
      } catch (err) {
        setError('Unable to fetch weather data');
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();

    // Refresh every hour
    const interval = setInterval(fetchWeather, 3600000);
    return () => clearInterval(interval);
  }, [showForecast, showHeatingLoad]);

  if (loading && !current) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          ℹ️ {error}
        </div>
      </div>
    );
  }

  if (!current) {
    return null;
  }

  const getWeatherIcon = (icon: string) => {
    // OpenWeather icon codes to emojis (simplified)
    if (icon.includes('01')) return '☀️'; // clear sky
    if (icon.includes('02')) return '⛅'; // few clouds
    if (icon.includes('03')) return '☁️'; // scattered clouds
    if (icon.includes('04')) return '☁️'; // broken clouds
    if (icon.includes('09')) return '🌧️'; // shower rain
    if (icon.includes('10')) return '🌦️'; // rain
    if (icon.includes('11')) return '⛈️'; // thunderstorm
    if (icon.includes('13')) return '🌨️'; // snow
    if (icon.includes('50')) return '🌫️'; // mist
    return '🌤️';
  };

  const getLoadColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-900/30';
      case 'high':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30';
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Weather Card */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">Current Weather</h3>
            <div className="flex items-center gap-3">
              <div className="text-4xl">{getWeatherIcon(current.icon)}</div>
              <div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {current.temperature.toFixed(1)}°C
                </div>
                <div className="text-xs text-blue-700 dark:text-blue-300 capitalize">{current.description}</div>
              </div>
            </div>
          </div>
          <div className="text-right text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <div>Feels like: {current.feels_like.toFixed(1)}°C</div>
            <div>Humidity: {current.humidity}%</div>
            <div>Wind: {current.wind_speed.toFixed(1)} m/s</div>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {showForecast && forecast.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">24h Forecast</h4>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {forecast.slice(0, 8).map((f, i) => {
              const time = new Date(f.timestamp).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={i} className="text-center">
                  <div className="text-xs text-gray-600 dark:text-gray-400">{time}</div>
                  <div className="text-xl my-1">{getWeatherIcon(f.icon)}</div>
                  <div className="text-sm font-semibold dark:text-gray-200">{f.temperature.toFixed(0)}°</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heating Load Forecast */}
      {showHeatingLoad && heatingLoads.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Heating Load Forecast</h4>
          <div className="space-y-2">
            {heatingLoads.slice(0, 6).map((load, i) => {
              const time = new Date(load.timestamp).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{time}</span>
                  <span className="text-gray-900 dark:text-gray-100">{load.temperature.toFixed(1)}°C</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getLoadColor(
                      load.load_level
                    )}`}
                  >
                    {load.load_level.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{load.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
