"""
Path management for ThermIQ - supports both development and packaged modes

Handles paths correctly whether running as:
- Python script in development
- PyInstaller bundled .app (Mac)
- PyInstaller bundled .exe (Windows)
"""
import sys
import os
from pathlib import Path
import platform


def is_frozen() -> bool:
    """Check if running as a bundled executable"""
    return getattr(sys, 'frozen', False) and hasattr(sys, '_MEIPASS')


def get_base_dir() -> Path:
    """
    Get the base directory of the application.

    Development: /path/to/ThermIQ/backend
    Packaged Mac: /Applications/ThermIQ.app/Contents/Resources
    Packaged Windows: C:\\Program Files\\ThermIQ
    """
    if is_frozen():
        # Running as bundled executable
        if platform.system() == 'Darwin':  # Mac
            # In .app bundle, we're in Contents/MacOS, go up to Resources
            return Path(sys._MEIPASS).parent / 'Resources'
        else:  # Windows
            # Executable is in root of application folder
            return Path(sys.executable).parent
    else:
        # Running as script - backend directory
        return Path(__file__).parent.parent


def get_app_dir() -> Path:
    """
    Get the application directory (one level up from base).

    Development: /path/to/ThermIQ
    Packaged Mac: /Applications/ThermIQ.app/Contents
    Packaged Windows: C:\\Program Files\\ThermIQ
    """
    if is_frozen():
        if platform.system() == 'Darwin':
            return Path(sys._MEIPASS).parent.parent
        else:
            return Path(sys.executable).parent
    else:
        # Development - go up from backend to ThermIQ root
        return get_base_dir().parent


def get_data_dir() -> Path:
    """
    Get the data directory for user data (config, database, logs).

    Development: /path/to/ThermIQ/data
    Packaged Mac: ~/Library/Application Support/ThermIQ
    Packaged Windows: %APPDATA%\\ThermIQ

    User data should be writable and persist across updates.
    """
    if is_frozen():
        if platform.system() == 'Darwin':
            # Mac: Use Application Support
            data_dir = Path.home() / 'Library' / 'Application Support' / 'ThermIQ'
        elif platform.system() == 'Windows':
            # Windows: Use AppData
            appdata = os.environ.get('APPDATA', str(Path.home()))
            data_dir = Path(appdata) / 'ThermIQ'
        else:
            # Linux fallback
            data_dir = Path.home() / '.thermiq'
    else:
        # Development: use data directory in project
        data_dir = get_app_dir() / 'data'

    # Ensure directory exists
    data_dir.mkdir(parents=True, exist_ok=True)
    return data_dir


def get_config_path() -> Path:
    """Get path to config.yaml"""
    return get_data_dir() / 'config.yaml'


def get_database_path() -> Path:
    """Get path to SQLite database"""
    return get_data_dir() / 'thermiq.db'


def get_log_dir() -> Path:
    """Get logs directory"""
    log_dir = get_data_dir() / 'logs'
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir


def get_mosquitto_dir() -> Path:
    """
    Get directory containing Mosquitto binaries.

    Development: /path/to/ThermIQ/mosquitto
    Packaged: Inside app bundle/resources
    """
    if is_frozen():
        # Bundled with application
        return get_base_dir() / 'mosquitto'
    else:
        # Development: in project root
        return get_app_dir() / 'mosquitto'


def get_mosquitto_executable() -> Path:
    """Get path to Mosquitto executable"""
    mosquitto_dir = get_mosquitto_dir()

    if platform.system() == 'Darwin':
        # Check if we have platform-specific directory
        mac_binary = mosquitto_dir / 'mac' / 'mosquitto'
        if mac_binary.exists():
            return mac_binary
        return mosquitto_dir / 'mosquitto'
    elif platform.system() == 'Windows':
        win_binary = mosquitto_dir / 'windows' / 'mosquitto.exe'
        if win_binary.exists():
            return win_binary
        return mosquitto_dir / 'mosquitto.exe'
    else:
        return mosquitto_dir / 'mosquitto'


def get_mosquitto_config_path() -> Path:
    """Get path to Mosquitto configuration"""
    return get_data_dir() / 'mosquitto.conf'


def get_frontend_dir() -> Path:
    """Get directory containing frontend static files"""
    if is_frozen():
        return get_base_dir() / 'frontend'
    else:
        return get_app_dir() / 'frontend' / 'dist'


# Convenience functions
def ensure_data_structure():
    """Ensure all required directories exist"""
    dirs = [
        get_data_dir(),
        get_log_dir(),
        get_data_dir() / 'backups',
    ]

    for directory in dirs:
        directory.mkdir(parents=True, exist_ok=True)


def get_paths_info() -> dict:
    """Get information about all paths (for debugging)"""
    return {
        'frozen': is_frozen(),
        'platform': platform.system(),
        'base_dir': str(get_base_dir()),
        'app_dir': str(get_app_dir()),
        'data_dir': str(get_data_dir()),
        'config_path': str(get_config_path()),
        'database_path': str(get_database_path()),
        'log_dir': str(get_log_dir()),
        'mosquitto_dir': str(get_mosquitto_dir()),
        'mosquitto_executable': str(get_mosquitto_executable()),
        'frontend_dir': str(get_frontend_dir()),
    }


# Initialize data structure on import
ensure_data_structure()
