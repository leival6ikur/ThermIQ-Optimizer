"""
Weather service for fetching and caching weather forecasts
"""
import logging
import aiohttp
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class WeatherForecast:
    """Weather forecast for a specific time"""
    timestamp: datetime
    temperature: float  # °C
    feels_like: float  # °C
    humidity: int  # %
    wind_speed: float  # m/s
    clouds: int  # %
    description: str  # e.g., "clear sky", "light rain"
    icon: str  # weather icon code


class WeatherService:
    """Service for fetching weather forecasts from OpenWeather API"""

    def __init__(self, api_key: str, latitude: float, longitude: float):
        """
        Initialize weather service.

        Args:
            api_key: OpenWeather API key
            latitude: Location latitude
            longitude: Location longitude
        """
        self.api_key = api_key
        self.latitude = latitude
        self.longitude = longitude
        self.base_url = "https://api.openweathermap.org/data/2.5"

        # Cache
        self._forecast_cache: Optional[List[WeatherForecast]] = None
        self._cache_timestamp: Optional[datetime] = None
        self._cache_ttl = timedelta(hours=1)  # Refresh every hour

    async def get_current_weather(self) -> Optional[Dict[str, Any]]:
        """
        Get current weather conditions.

        Returns:
            Dictionary with current weather data or None on error
        """
        try:
            url = f"{self.base_url}/weather"
            params = {
                'lat': self.latitude,
                'lon': self.longitude,
                'appid': self.api_key,
                'units': 'metric'  # Celsius
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status == 200:
                        data = await response.json()

                        return {
                            'temperature': data['main']['temp'],
                            'feels_like': data['main']['feels_like'],
                            'humidity': data['main']['humidity'],
                            'wind_speed': data['wind']['speed'],
                            'clouds': data['clouds']['all'],
                            'description': data['weather'][0]['description'],
                            'icon': data['weather'][0]['icon'],
                            'timestamp': datetime.now()
                        }
                    else:
                        logger.error(f"Weather API error: {response.status}")
                        return None

        except Exception as e:
            logger.error(f"Error fetching current weather: {e}")
            return None

    async def get_forecast(self, hours: int = 48, force_refresh: bool = False) -> List[WeatherForecast]:
        """
        Get weather forecast for next N hours.

        Args:
            hours: Number of hours to forecast (max 48)
            force_refresh: Force refresh cache even if valid

        Returns:
            List of WeatherForecast objects
        """
        # Check cache
        if not force_refresh and self._is_cache_valid():
            logger.debug("Returning cached forecast")
            return self._forecast_cache[:self._hours_to_items(hours)]

        try:
            url = f"{self.base_url}/forecast"
            params = {
                'lat': self.latitude,
                'lon': self.longitude,
                'appid': self.api_key,
                'units': 'metric',  # Celsius
                'cnt': min(hours // 3 + 1, 40)  # OpenWeather returns 3-hour intervals, max 40 items (5 days)
            }

            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params, timeout=aiohttp.ClientTimeout(total=10)) as response:
                    if response.status != 200:
                        logger.error(f"Weather API error: {response.status}")
                        return self._forecast_cache or []

                    data = await response.json()

                    forecasts = []
                    for item in data['list']:
                        forecast = WeatherForecast(
                            timestamp=datetime.fromtimestamp(item['dt']),
                            temperature=item['main']['temp'],
                            feels_like=item['main']['feels_like'],
                            humidity=item['main']['humidity'],
                            wind_speed=item['wind']['speed'],
                            clouds=item['clouds']['all'],
                            description=item['weather'][0]['description'],
                            icon=item['weather'][0]['icon']
                        )
                        forecasts.append(forecast)

                    # Update cache
                    self._forecast_cache = forecasts
                    self._cache_timestamp = datetime.now()

                    logger.info(f"Fetched {len(forecasts)} weather forecast items")

                    return forecasts[:self._hours_to_items(hours)]

        except Exception as e:
            logger.error(f"Error fetching weather forecast: {e}")
            # Return cached data if available
            return self._forecast_cache or []

    def _is_cache_valid(self) -> bool:
        """Check if cached forecast is still valid"""
        if self._forecast_cache is None or self._cache_timestamp is None:
            return False

        age = datetime.now() - self._cache_timestamp
        return age < self._cache_ttl

    def _hours_to_items(self, hours: int) -> int:
        """
        Convert hours to number of forecast items.
        OpenWeather returns 3-hour intervals.
        """
        return (hours // 3) + 1

    async def get_temperature_trend(self, hours: int = 24) -> Dict[str, float]:
        """
        Get temperature trend analysis.

        Args:
            hours: Number of hours to analyze

        Returns:
            Dictionary with min, max, avg, and change
        """
        forecasts = await self.get_forecast(hours)

        if not forecasts:
            return {
                'min_temp': 0,
                'max_temp': 0,
                'avg_temp': 0,
                'change': 0
            }

        temps = [f.temperature for f in forecasts]

        return {
            'min_temp': min(temps),
            'max_temp': max(temps),
            'avg_temp': sum(temps) / len(temps),
            'change': temps[-1] - temps[0]  # Temperature change over period
        }

    async def get_heating_load_forecast(self, hours: int = 24) -> List[Dict[str, Any]]:
        """
        Estimate heating load based on weather forecast.

        Args:
            hours: Number of hours to forecast

        Returns:
            List of heating load estimates with timestamps
        """
        forecasts = await self.get_forecast(hours)

        heating_loads = []
        for forecast in forecasts:
            # Simplified heating load estimation
            # Lower outdoor temp = higher heating need
            # Wind and humidity also affect heat loss

            base_load = max(0, 20 - forecast.temperature)  # Base load from temp difference
            wind_factor = 1 + (forecast.wind_speed / 30)  # Wind increases heat loss
            humidity_factor = 1 + ((100 - forecast.humidity) / 200)  # Dry air feels colder

            estimated_load = base_load * wind_factor * humidity_factor

            # Categorize load
            if estimated_load < 5:
                load_level = 'low'
            elif estimated_load < 15:
                load_level = 'medium'
            else:
                load_level = 'high'

            heating_loads.append({
                'timestamp': forecast.timestamp.isoformat(),
                'temperature': forecast.temperature,
                'feels_like': forecast.feels_like,
                'wind_speed': forecast.wind_speed,
                'estimated_load': round(estimated_load, 2),
                'load_level': load_level,
                'description': forecast.description
            })

        return heating_loads


# Global instance
_weather_service: Optional[WeatherService] = None


def get_weather_service(api_key: str = None, latitude: float = None, longitude: float = None) -> Optional[WeatherService]:
    """
    Get or create global weather service instance.

    Args:
        api_key: OpenWeather API key
        latitude: Location latitude
        longitude: Location longitude

    Returns:
        WeatherService instance or None if not configured
    """
    global _weather_service

    if _weather_service is None:
        if api_key and latitude and longitude:
            _weather_service = WeatherService(api_key, latitude, longitude)
            logger.info(f"Weather service initialized for location ({latitude}, {longitude})")
        else:
            logger.debug("Weather service not initialized (no API key or location)")
            return None

    return _weather_service
