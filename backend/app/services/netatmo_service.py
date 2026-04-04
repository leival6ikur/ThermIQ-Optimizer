"""
NetAtmo weather station integration service
"""
import logging
import pyatmo
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.models import TemperatureReading

logger = logging.getLogger(__name__)


class NetAtmoService:
    """Service for fetching temperature data from NetAtmo weather station"""

    def __init__(self, client_id: str, client_secret: str, username: str, password: str):
        """
        Initialize NetAtmo service.

        Args:
            client_id: NetAtmo app client ID
            client_secret: NetAtmo app client secret
            username: NetAtmo account email
            password: NetAtmo account password
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.username = username
        self.password = password

        # Initialize auth and weather data (will be done on first fetch)
        self.auth = None
        self.weather = None

        # Cache
        self._last_reading: Optional[TemperatureReading] = None
        self._last_fetch: Optional[datetime] = None
        self._cache_ttl = timedelta(minutes=10)  # NetAtmo updates every 5-10 min

    async def _ensure_authenticated(self):
        """Ensure auth and weather objects are initialized"""
        if self.auth is None:
            # ClientAuth.__init__ calls fetch_token synchronously, so run in executor
            loop = asyncio.get_event_loop()
            self.auth = await loop.run_in_executor(
                None,
                lambda: pyatmo.ClientAuth(
                    client_id=self.client_id,
                    client_secret=self.client_secret,
                    username=self.username,
                    password=self.password
                )
            )
        if self.weather is None:
            self.weather = pyatmo.AsyncWeatherStationData(self.auth)

    async def get_current_temperature(self, station_name: str = None,
                                     module_name: str = None) -> Optional[TemperatureReading]:
        """
        Fetch current temperature from NetAtmo.

        Args:
            station_name: Station name (optional - uses first available)
            module_name: Module name (optional - auto-detects outdoor module)

        Returns:
            TemperatureReading with indoor/outdoor temps, or None on error
        """
        # Check cache
        if self._is_cache_valid():
            logger.debug("Returning cached NetAtmo reading")
            return self._last_reading

        try:
            await self._ensure_authenticated()
            await self.weather.update()

            # Get station data
            stations = self.weather.stations
            if not stations:
                logger.error("No NetAtmo stations found")
                return None

            # Use first station if not specified
            station_id = list(stations.keys())[0] if not station_name else None

            # Get indoor module (base station)
            indoor_temp = None
            try:
                indoor_temp = self.weather.get_temperature(station_id)
            except Exception as e:
                logger.warning(f"Could not get indoor temperature: {e}")

            # Get outdoor module
            outdoor_temp = None
            try:
                outdoor_modules = self.weather.get_modules(station_id)
                for module_id in outdoor_modules:
                    module_data = self.weather.get_module(module_id)
                    if module_data.get('type') == 'NAModule1':  # Outdoor module type
                        dashboard_data = module_data.get('dashboard_data', {})
                        outdoor_temp = dashboard_data.get('Temperature')
                        break
            except Exception as e:
                logger.warning(f"Could not get outdoor temperature: {e}")

            # Create TemperatureReading
            reading = TemperatureReading(
                timestamp=datetime.now(),
                indoor=indoor_temp,
                outdoor=outdoor_temp,
                # Leave other fields None (heat pump will provide them)
                supply=None,
                return_temp=None,
                target=None,
                brine_in=None,
                brine_out=None,
                hot_water=None,
            )

            # Update cache
            self._last_reading = reading
            self._last_fetch = datetime.now()

            logger.info(f"NetAtmo reading: indoor={indoor_temp}°C, outdoor={outdoor_temp}°C")
            return reading

        except Exception as e:
            logger.error(f"Error fetching NetAtmo data: {e}")
            # Return cached data on error if available
            return self._last_reading

    def _is_cache_valid(self) -> bool:
        """Check if cached reading is still valid"""
        if self._last_reading is None or self._last_fetch is None:
            return False
        age = datetime.now() - self._last_fetch
        return age < self._cache_ttl

    async def test_connection(self) -> Dict[str, Any]:
        """
        Test NetAtmo connection and return station info.

        Returns:
            Dictionary with success status and message
        """
        try:
            await self._ensure_authenticated()
            await self.weather.update()
            stations = self.weather.stations

            if not stations:
                return {
                    "success": False,
                    "message": "No NetAtmo stations found for this account"
                }

            station_names = []
            for station_id, station_data in stations.items():
                station_name = station_data.get('station_name', station_id)
                station_names.append(station_name)

            return {
                "success": True,
                "stations": station_names,
                "message": f"Connected to {len(stations)} station(s): {', '.join(station_names)}"
            }
        except Exception as e:
            logger.error(f"NetAtmo connection test failed: {e}")
            return {
                "success": False,
                "message": f"Connection failed: {str(e)}"
            }


# Global singleton
_netatmo_service: Optional[NetAtmoService] = None


def get_netatmo_service(client_id: str = None, client_secret: str = None,
                       username: str = None, password: str = None) -> Optional[NetAtmoService]:
    """
    Get or create global NetAtmo service instance.

    Args:
        client_id: NetAtmo app client ID
        client_secret: NetAtmo app client secret
        username: NetAtmo account email
        password: NetAtmo account password

    Returns:
        NetAtmoService instance or None if not configured
    """
    global _netatmo_service

    if _netatmo_service is None:
        if all([client_id, client_secret, username, password]):
            _netatmo_service = NetAtmoService(client_id, client_secret, username, password)
            logger.info("NetAtmo service initialized")
        else:
            logger.debug("NetAtmo service not initialized (missing credentials)")
            return None

    return _netatmo_service
