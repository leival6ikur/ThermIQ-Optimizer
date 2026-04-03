"""
Embedded Mosquitto MQTT Broker Manager

Manages lifecycle of bundled Mosquitto broker:
- Starts broker on application startup
- Stops broker on shutdown
- Generates configuration
- Monitors broker health
"""
import os
import sys
import time
import signal
import logging
import subprocess
import platform
from pathlib import Path
from typing import Optional

from app.paths import (
    get_mosquitto_executable,
    get_mosquitto_config_path,
    get_data_dir,
    get_log_dir
)


logger = logging.getLogger(__name__)


class BrokerManager:
    """Manages embedded Mosquitto MQTT broker"""

    def __init__(self, port: int = 1883, use_system_broker: bool = False):
        """
        Initialize broker manager.

        Args:
            port: MQTT broker port
            use_system_broker: If True, use system Mosquitto instead of embedded
        """
        self.port = port
        self.use_system_broker = use_system_broker
        self.process: Optional[subprocess.Popen] = None
        self.mosquitto_path = get_mosquitto_executable()
        self.config_path = get_mosquitto_config_path()
        self.running = False

    def is_mosquitto_available(self) -> bool:
        """Check if Mosquitto executable exists"""
        if self.use_system_broker:
            # Check if system mosquitto is available
            try:
                result = subprocess.run(
                    ['which', 'mosquitto'],
                    capture_output=True,
                    text=True
                )
                return result.returncode == 0
            except Exception:
                return False
        else:
            # Check bundled mosquitto
            return self.mosquitto_path.exists()

    def generate_config(self) -> None:
        """Generate Mosquitto configuration file"""
        log_file = get_log_dir() / 'mosquitto.log'
        persistence_dir = get_data_dir() / 'mosquitto_persistence'
        persistence_dir.mkdir(exist_ok=True)

        config_content = f"""# ThermIQ Embedded Mosquitto Configuration
# Auto-generated - do not edit manually

# Network
listener {self.port}
allow_anonymous true

# Logging
log_dest file {log_file}
log_type error
log_type warning
log_type notice
log_timestamp true
log_timestamp_format %Y-%m-%d %H:%M:%S

# Persistence
persistence true
persistence_location {persistence_dir}/
autosave_interval 300

# Connection limits
max_connections 100
max_keepalive 60
max_queued_messages 1000

# Performance
max_inflight_messages 20
max_queued_bytes 0

# Security (development mode)
# For production, enable authentication
"""

        with open(self.config_path, 'w') as f:
            f.write(config_content)

        logger.info(f"Generated Mosquitto config: {self.config_path}")

    def start(self) -> bool:
        """
        Start the Mosquitto broker.

        Returns:
            True if started successfully
        """
        if self.running:
            logger.warning("Broker already running")
            return True

        if not self.is_mosquitto_available():
            logger.error(f"Mosquitto not found at {self.mosquitto_path}")
            return False

        # Generate config
        self.generate_config()

        try:
            if self.use_system_broker:
                # Use system mosquitto
                cmd = ['mosquitto', '-c', str(self.config_path)]
            else:
                # Use bundled mosquitto
                cmd = [str(self.mosquitto_path), '-c', str(self.config_path)]

            logger.info(f"Starting Mosquitto: {' '.join(cmd)}")

            # Start process
            if platform.system() == 'Windows':
                # Windows: CREATE_NEW_PROCESS_GROUP to allow proper termination
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                )
            else:
                # Mac/Linux: standard subprocess
                self.process = subprocess.Popen(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    preexec_fn=os.setsid  # Create new process group
                )

            # Wait a moment for broker to start
            time.sleep(2)

            # Check if still running
            if self.process.poll() is None:
                self.running = True
                logger.info(f"Mosquitto broker started successfully on port {self.port}")
                return True
            else:
                # Process died immediately
                stdout, stderr = self.process.communicate()
                logger.error(f"Mosquitto failed to start: {stderr.decode()}")
                return False

        except Exception as e:
            logger.error(f"Error starting Mosquitto: {e}")
            return False

    def stop(self) -> None:
        """Stop the Mosquitto broker"""
        if not self.running or self.process is None:
            logger.info("Broker not running")
            return

        try:
            logger.info("Stopping Mosquitto broker...")

            if platform.system() == 'Windows':
                # Windows: Send Ctrl+Break to process group
                self.process.send_signal(signal.CTRL_BREAK_EVENT)
            else:
                # Mac/Linux: Send SIGTERM to process group
                os.killpg(os.getpgid(self.process.pid), signal.SIGTERM)

            # Wait for graceful shutdown
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if didn't stop gracefully
                logger.warning("Broker didn't stop gracefully, forcing...")
                if platform.system() == 'Windows':
                    self.process.kill()
                else:
                    os.killpg(os.getpgid(self.process.pid), signal.SIGKILL)
                self.process.wait()

            self.process = None
            self.running = False
            logger.info("Mosquitto broker stopped")

        except Exception as e:
            logger.error(f"Error stopping Mosquitto: {e}")

    def is_running(self) -> bool:
        """Check if broker is running"""
        if not self.running or self.process is None:
            return False

        # Check if process is still alive
        return self.process.poll() is None

    def restart(self) -> bool:
        """Restart the broker"""
        self.stop()
        time.sleep(1)
        return self.start()

    def get_status(self) -> dict:
        """Get broker status information"""
        return {
            'running': self.is_running(),
            'port': self.port,
            'pid': self.process.pid if self.process else None,
            'config_path': str(self.config_path),
            'executable': str(self.mosquitto_path),
            'use_system': self.use_system_broker,
        }


# Global broker instance
_broker_manager: Optional[BrokerManager] = None


def get_broker_manager(port: int = 1883, use_system: bool = False) -> BrokerManager:
    """Get global broker manager instance"""
    global _broker_manager
    if _broker_manager is None:
        _broker_manager = BrokerManager(port=port, use_system_broker=use_system)
    return _broker_manager


def check_system_mosquitto() -> bool:
    """Check if system Mosquitto is already running"""
    try:
        import socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', 1883))
        sock.close()
        return result == 0  # Port is open = broker running
    except Exception:
        return False
