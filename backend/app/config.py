"""
Configuration management for ThermIQ
"""
import yaml
import logging
import shutil
from pathlib import Path
from typing import Any, Dict

from app.paths import get_config_path, get_app_dir


logger = logging.getLogger(__name__)


class Config:
    """Application configuration manager"""

    def __init__(self, config_path: Path = None):
        if config_path is None:
            self.config_path = get_config_path()
        else:
            self.config_path = Path(config_path)

        self._config: Dict[str, Any] = {}
        self._ensure_config_exists()
        self.load()

    def _ensure_config_exists(self) -> None:
        """Ensure configuration file exists, create from example if needed"""
        if self.config_path.exists():
            return

        # Look for example config in project root
        example_paths = [
            get_app_dir() / 'config' / 'config.yaml.example',
            get_app_dir() / 'config.yaml.example',
        ]

        for example_path in example_paths:
            if example_path.exists():
                logger.info(f"Creating config from example: {example_path}")
                shutil.copy(example_path, self.config_path)
                return

        # If no example found, create default config
        logger.warning("No example config found, creating default configuration")
        self._create_default_config()

    def _create_default_config(self) -> None:
        """Create a default configuration file"""
        default_config = {
            'mqtt': {
                'broker': 'localhost',
                'port': 1883,
                'device_id': 'thermiq_room2lp',
                'username': None,
                'password': None,
                'reconnect_delay': 5,
                'keepalive': 60,
            },
            'nordpool': {
                'region': 'EE',
                'currency': 'EUR',
                'api_url': 'https://dataportal-api.nordpoolgroup.com/api/DayAheadPrices',
                'fetch_time': '13:00',
                'cache_hours': 48,
                'retry_attempts': 3,
            },
            'location': {
                'address': 'Sirkli 6, Lombi küla, Tartu vald, Estonia',
                'latitude': 58.3780,
                'longitude': 26.7290,
                'timezone': 'Europe/Tallinn',
            },
            'optimization': {
                'strategy': 'balanced',
                'target_temperature': 21.0,
                'temperature_tolerance': 1.0,
                'comfort_hours_start': '06:00',
                'comfort_hours_end': '23:00',
                'update_interval': 300,
            },
            'building': {
                'insulation_quality': 'good',
                'thermal_mass': 'medium',
                'estimated_heat_loss_per_degree': 0.5,
                'heating_rate': 2.0,
            },
            'api': {
                'host': '0.0.0.0',
                'port': 8000,
                'cors_origins': ['http://localhost:3000', 'http://localhost:5173'],
            },
            'database': {
                'path': str(get_app_dir() / 'data' / 'thermiq.db'),
                'backup_enabled': True,
                'backup_interval_hours': 24,
            },
            'logging': {
                'level': 'INFO',
                'file': str(get_app_dir() / 'data' / 'logs' / 'thermiq.log'),
                'rotation': 'daily',
                'retention_days': 30,
            },
            'costs': {
                'vat_enabled': False,
                'vat_rate': 0.0,  # percentage (e.g., 20.0 for 20%)
                'currency': 'EUR',
            },
            'setup_complete': False,  # Will be set to True after first-run wizard
        }

        self.config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(self.config_path, 'w') as f:
            yaml.safe_dump(default_config, f, default_flow_style=False)

        logger.info(f"Created default configuration at {self.config_path}")

    def load(self) -> None:
        """Load configuration from YAML file"""
        with open(self.config_path, 'r') as f:
            self._config = yaml.safe_load(f)

        logger.info(f"Configuration loaded from {self.config_path}")

    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value by dot-separated key path"""
        keys = key.split('.')
        value = self._config

        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
                if value is None:
                    return default
            else:
                return default

        return value

    def set(self, key: str, value: Any) -> None:
        """Set configuration value by dot-separated key path"""
        keys = key.split('.')
        config = self._config

        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]

        config[keys[-1]] = value

    def save(self) -> None:
        """Save configuration to YAML file"""
        with open(self.config_path, 'w') as f:
            yaml.safe_dump(self._config, f, default_flow_style=False)

        logger.info(f"Configuration saved to {self.config_path}")

    @property
    def mqtt(self) -> Dict[str, Any]:
        """MQTT broker configuration"""
        return self._config.get('mqtt', {})

    @property
    def nordpool(self) -> Dict[str, Any]:
        """Nord Pool API configuration"""
        return self._config.get('nordpool', {})

    @property
    def optimization(self) -> Dict[str, Any]:
        """Optimization settings"""
        return self._config.get('optimization', {})

    @property
    def building(self) -> Dict[str, Any]:
        """Building thermal characteristics"""
        return self._config.get('building', {})

    @property
    def api(self) -> Dict[str, Any]:
        """API server settings"""
        return self._config.get('api', {})

    @property
    def database(self) -> Dict[str, Any]:
        """Database settings"""
        return self._config.get('database', {})

    @property
    def logging_config(self) -> Dict[str, Any]:
        """Logging configuration"""
        return self._config.get('logging', {})

    @property
    def location(self) -> Dict[str, Any]:
        """Installation location"""
        return self._config.get('location', {})

    @property
    def costs(self) -> Dict[str, Any]:
        """Cost and VAT settings"""
        return self._config.get('costs', {})

    def is_setup_complete(self) -> bool:
        """Check if first-run setup has been completed"""
        return self._config.get('setup_complete', False)

    def mark_setup_complete(self) -> None:
        """Mark first-run setup as complete"""
        self.set('setup_complete', True)
        self.save()

    def apply_vat_to_price(self, price: float) -> float:
        """
        Apply VAT to price for display purposes only.
        Does not modify stored data.

        Args:
            price: Pre-VAT price

        Returns:
            Price with VAT applied if enabled, otherwise original price
        """
        if self.costs.get('vat_enabled', False):
            vat_rate = self.costs.get('vat_rate', 0.0)
            return price * (1 + vat_rate / 100)
        return price


# Global configuration instance
_config_instance: Config = None


def get_config() -> Config:
    """Get global configuration instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = Config()
    return _config_instance


def reload_config() -> Config:
    """Reload configuration from file"""
    global _config_instance
    _config_instance = Config()
    return _config_instance


def save_config(config: Config) -> None:
    """Save configuration to file"""
    config.save()
