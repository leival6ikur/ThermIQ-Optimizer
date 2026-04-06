"""
NetAtmo OAuth2 Service - Authorization Code Flow

Implements proper OAuth2 flow instead of password-based authentication.
"""
import logging
import json
import pyatmo
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pathlib import Path

from app.models import TemperatureReading
from app.paths import get_data_dir

logger = logging.getLogger(__name__)


class NetAtmoOAuth2Service:
    """Service for NetAtmo integration using OAuth2 Authorization Code flow"""

    def __init__(self, client_id: str, client_secret: str, redirect_uri: str):
        """
        Initialize NetAtmo OAuth2 service.

        Args:
            client_id: NetAtmo app client ID
            client_secret: NetAtmo app client secret
            redirect_uri: OAuth callback URI (e.g., http://localhost:8000/api/auth/netatmo/callback)
        """
        self.client_id = client_id
        self.client_secret = client_secret
        self.redirect_uri = redirect_uri

        # Token storage
        self._token_file = get_data_dir() / 'netatmo_token.json'
        self._token: Optional[Dict[str, Any]] = None
        self._load_token()

        # OAuth2 and Weather objects
        self.auth: Optional[pyatmo.NetatmoOAuth2] = None
        self.weather = None

        # Cache
        self._last_reading: Optional[TemperatureReading] = None
        self._last_fetch: Optional[datetime] = None
        self._cache_ttl = timedelta(minutes=10)

    def _load_token(self):
        """Load token from file if exists"""
        try:
            if self._token_file.exists():
                with open(self._token_file, 'r') as f:
                    self._token = json.load(f)
                logger.info("Loaded NetAtmo token from file")
        except Exception as e:
            logger.error(f"Error loading token: {e}")
            self._token = None

    def _save_token(self, token: Dict[str, Any]):
        """Save token to file"""
        try:
            self._token = token
            with open(self._token_file, 'w') as f:
                json.dump(token, f)
            # Set restrictive permissions (owner read/write only)
            self._token_file.chmod(0o600)
            logger.info("Saved NetAtmo token to file")
        except Exception as e:
            logger.error(f"Error saving token: {e}")

    def get_authorization_url(self, state: str = None) -> str:
        """
        Get OAuth2 authorization URL for user to visit.

        Args:
            state: Optional state parameter for CSRF protection

        Returns:
            URL to redirect user to for authorization
        """
        # Create temporary auth object just for getting URL
        auth = pyatmo.NetatmoOAuth2(
            client_id=self.client_id,
            client_secret=self.client_secret,
            redirect_uri=self.redirect_uri,
            scope='read_station'
        )

        return auth.get_authorization_url(state=state)

    async def handle_callback(self, authorization_response: str = None, code: str = None) -> Dict[str, Any]:
        """
        Handle OAuth2 callback with authorization code.

        Args:
            authorization_response: Full callback URL
            code: Authorization code from callback

        Returns:
            Dictionary with success status and message
        """
        try:
            # Create auth object
            self.auth = pyatmo.NetatmoOAuth2(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                token_updater=self._save_token,
                scope='read_station'
            )

            # Exchange code for token (runs in executor as it's synchronous)
            loop = asyncio.get_event_loop()
            token = await loop.run_in_executor(
                None,
                lambda: self.auth.request_token(
                    authorization_response=authorization_response,
                    code=code
                )
            )

            # Save token
            self._save_token(token)

            # Test connection - use sync API in executor
            self.weather = pyatmo.WeatherStationData(self.auth)
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.weather.update)

            stations = self.weather.stations
            if not stations:
                return {
                    "success": False,
                    "message": "No NetAtmo stations found"
                }

            station_names = [data.get('station_name', sid) for sid, data in stations.items()]

            return {
                "success": True,
                "message": f"Successfully connected to {len(stations)} station(s): {', '.join(station_names)}",
                "stations": station_names
            }

        except Exception as e:
            logger.error(f"Error handling OAuth callback: {e}")
            return {
                "success": False,
                "message": f"Authorization failed: {str(e)}"
            }

    async def _ensure_authenticated(self):
        """Ensure auth and weather objects are initialized with valid token"""
        if self._token is None:
            raise Exception("Not authenticated. Please connect to NetAtmo first.")

        if self.auth is None:
            self.auth = pyatmo.NetatmoOAuth2(
                client_id=self.client_id,
                client_secret=self.client_secret,
                redirect_uri=self.redirect_uri,
                token=self._token,
                token_updater=self._save_token,
                scope='read_station'
            )

        if self.weather is None:
            # Use sync WeatherStationData since OAuth2 doesn't have async support yet
            self.weather = pyatmo.WeatherStationData(self.auth)

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
            # Use sync update in executor
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self.weather.update)

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

    def is_connected(self) -> bool:
        """Check if we have a valid token"""
        return self._token is not None

    async def disconnect(self):
        """Disconnect and remove stored token"""
        try:
            if self._token_file.exists():
                self._token_file.unlink()
            self._token = None
            self.auth = None
            self.weather = None
            logger.info("NetAtmo disconnected and token removed")
        except Exception as e:
            logger.error(f"Error disconnecting NetAtmo: {e}")

    async def refresh_token_if_needed(self):
        """Refresh token if it's about to expire"""
        try:
            if self.auth and self._token:
                # pyatmo handles automatic refresh via token_updater callback
                loop = asyncio.get_event_loop()
                await loop.run_in_executor(None, self.auth.refresh_tokens)
                logger.debug("NetAtmo token refreshed")
        except Exception as e:
            logger.error(f"Error refreshing token: {e}")


# Global singleton
_netatmo_oauth_service: Optional[NetAtmoOAuth2Service] = None


def get_netatmo_oauth_service(client_id: str = None, client_secret: str = None,
                              redirect_uri: str = None) -> Optional[NetAtmoOAuth2Service]:
    """
    Get or create global NetAtmo OAuth2 service instance.

    Args:
        client_id: NetAtmo app client ID
        client_secret: NetAtmo app client secret
        redirect_uri: OAuth callback URI

    Returns:
        NetAtmoOAuth2Service instance or None if not configured
    """
    global _netatmo_oauth_service

    if _netatmo_oauth_service is None:
        if all([client_id, client_secret, redirect_uri]):
            _netatmo_oauth_service = NetAtmoOAuth2Service(client_id, client_secret, redirect_uri)
            logger.info("NetAtmo OAuth2 service initialized")
        else:
            logger.debug("NetAtmo OAuth2 service not initialized (missing configuration)")
            return None

    return _netatmo_oauth_service
