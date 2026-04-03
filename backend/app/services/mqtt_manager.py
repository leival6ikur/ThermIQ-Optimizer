"""
MQTT Manager Service

Handles all MQTT communication with ThermIQ device:
- Connection management
- Message parsing
- Command publishing
- State tracking
"""
import json
import logging
import asyncio
import os
import uuid
from datetime import datetime
from typing import Optional, Callable, Dict, Any
from collections import defaultdict

import paho.mqtt.client as mqtt

from app.models import TemperatureReading, HeatPumpStatus
from app.config import get_config


logger = logging.getLogger(__name__)


class MQTTManager:
    """Manages MQTT communication with ThermIQ device"""

    def __init__(self):
        self.config = get_config()
        mqtt_config = self.config.mqtt

        self.broker = mqtt_config.get('broker', 'localhost')
        self.port = mqtt_config.get('port', 1883)
        self.device_id = mqtt_config.get('device_id', 'thermiq_room2lp')
        self.username = mqtt_config.get('username')
        self.password = mqtt_config.get('password')
        self.reconnect_delay = mqtt_config.get('reconnect_delay', 5)

        # MQTT client with unique ID to avoid conflicts in dev mode
        # Use PID to make it unique per process (for uvicorn --reload)
        client_id = f"thermiq_backend_{os.getpid()}"
        self.client = mqtt.Client(client_id=client_id)
        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message

        if self.username and self.password:
            self.client.username_pw_set(self.username, self.password)

        # State tracking
        self.connected = False
        self.last_message_time: Optional[datetime] = None
        self.current_temperatures: Dict[str, float] = {}
        self.current_status: Dict[str, Any] = {}

        # Callbacks for message handling
        self.temperature_callbacks: list[Callable] = []
        self.status_callbacks: list[Callable] = []

    def on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected to MQTT broker at {self.broker}:{self.port}")

            # Subscribe to all device topics
            base_topic = f"thermiq/{self.device_id}"
            topics = [
                (f"{base_topic}/sensors/#", 1),
                (f"{base_topic}/status/#", 1),
            ]

            for topic, qos in topics:
                self.client.subscribe(topic, qos)
                logger.info(f"Subscribed to {topic}")
        else:
            self.connected = False
            logger.error(f"Connection failed with code {rc}")

    def on_disconnect(self, client, userdata, rc):
        """Callback when disconnected from broker"""
        self.connected = False
        if rc != 0:
            logger.warning(f"Unexpected disconnection (code {rc}). Will attempt to reconnect...")
        else:
            logger.info("Disconnected from MQTT broker")

    def on_message(self, client, userdata, msg):
        """Callback when message received"""
        try:
            self.last_message_time = datetime.now()
            topic = msg.topic
            payload = json.loads(msg.payload.decode())

            logger.debug(f"Received {topic}: {payload}")

            # Route message based on topic
            if "/sensors/temperature/" in topic:
                self._handle_temperature(topic, payload)
            elif "/sensors/power" in topic:
                self._handle_power(payload)
            elif "/status/" in topic:
                self._handle_status(topic, payload)

        except Exception as e:
            logger.error(f"Error processing message from {msg.topic}: {e}")

    def _handle_temperature(self, topic: str, payload: Dict[str, Any]):
        """Handle temperature sensor message"""
        try:
            # Extract sensor type from topic
            # e.g., "thermiq/device/sensors/temperature/indoor" -> "indoor"
            sensor_type = topic.split('/')[-1]
            value = payload.get('value')

            if value is not None:
                self.current_temperatures[sensor_type] = float(value)

                # If we have all temperatures, create TemperatureReading
                if len(self.current_temperatures) >= 3:  # At least indoor, outdoor, supply
                    reading = TemperatureReading(
                        timestamp=datetime.now(),
                        indoor=self.current_temperatures.get('indoor'),
                        outdoor=self.current_temperatures.get('outdoor'),
                        supply=self.current_temperatures.get('supply'),
                        return_temp=self.current_temperatures.get('return'),
                        target=self.current_temperatures.get('target'),
                        brine_in=self.current_temperatures.get('brine_in'),
                        brine_out=self.current_temperatures.get('brine_out'),
                        hot_water=self.current_temperatures.get('hot_water'),
                    )

                    # Notify callbacks
                    for callback in self.temperature_callbacks:
                        try:
                            callback(reading)
                        except Exception as e:
                            logger.error(f"Error in temperature callback: {e}")

        except Exception as e:
            logger.error(f"Error handling temperature: {e}")

    def _handle_power(self, payload: Dict[str, Any]):
        """Handle power consumption message"""
        try:
            value = payload.get('value')
            if value is not None:
                self.current_status['power'] = float(value)
        except Exception as e:
            logger.error(f"Error handling power: {e}")

    def _handle_status(self, topic: str, payload: Dict[str, Any]):
        """Handle status message"""
        try:
            # Extract status type from topic
            status_type = topic.split('/')[-1]
            value = payload.get('value')

            if value is not None:
                self.current_status[status_type] = value

                # If we have heating status, create HeatPumpStatus
                if 'heating' in self.current_status:
                    status = HeatPumpStatus(
                        timestamp=datetime.now(),
                        heating=bool(self.current_status['heating']),
                        power=self.current_status.get('power'),
                        mode=self.current_status.get('mode', 'auto'),
                        heat_curve=self.current_status.get('heat_curve'),
                    )

                    # Notify callbacks
                    for callback in self.status_callbacks:
                        try:
                            callback(status)
                        except Exception as e:
                            logger.error(f"Error in status callback: {e}")

        except Exception as e:
            logger.error(f"Error handling status: {e}")

    def register_temperature_callback(self, callback: Callable[[TemperatureReading], None]):
        """Register callback for temperature updates"""
        self.temperature_callbacks.append(callback)

    def register_status_callback(self, callback: Callable[[HeatPumpStatus], None]):
        """Register callback for status updates"""
        self.status_callbacks.append(callback)

    def connect(self):
        """Connect to MQTT broker"""
        try:
            logger.info(f"Connecting to MQTT broker: {self.broker}:{self.port}")
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()
        except Exception as e:
            logger.error(f"Failed to connect to MQTT broker: {e}")
            raise

    def disconnect(self):
        """Disconnect from MQTT broker"""
        self.client.loop_stop()
        self.client.disconnect()
        logger.info("Disconnected from MQTT broker")

    def publish_setpoint(self, temperature: float) -> bool:
        """Publish temperature setpoint command"""
        try:
            topic = f"thermiq/{self.device_id}/control/setpoint"
            payload = json.dumps({"value": temperature})

            result = self.client.publish(topic, payload, qos=1)

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published setpoint: {temperature}°C")
                return True
            else:
                logger.error(f"Failed to publish setpoint: {result.rc}")
                return False

        except Exception as e:
            logger.error(f"Error publishing setpoint: {e}")
            return False

    def publish_mode(self, mode: str) -> bool:
        """Publish mode command (on/off/auto)"""
        try:
            if mode not in ["on", "off", "auto"]:
                logger.error(f"Invalid mode: {mode}")
                return False

            topic = f"thermiq/{self.device_id}/control/mode"
            payload = json.dumps({"value": mode})

            result = self.client.publish(topic, payload, qos=1)

            if result.rc == mqtt.MQTT_ERR_SUCCESS:
                logger.info(f"Published mode: {mode}")
                return True
            else:
                logger.error(f"Failed to publish mode: {result.rc}")
                return False

        except Exception as e:
            logger.error(f"Error publishing mode: {e}")
            return False

    def get_latest_temperature(self) -> Optional[TemperatureReading]:
        """Get latest temperature reading"""
        if not self.current_temperatures:
            return None

        return TemperatureReading(
            timestamp=self.last_message_time or datetime.now(),
            indoor=self.current_temperatures.get('indoor'),
            outdoor=self.current_temperatures.get('outdoor'),
            supply=self.current_temperatures.get('supply'),
            return_temp=self.current_temperatures.get('return'),
            target=self.current_temperatures.get('target'),
            brine_in=self.current_temperatures.get('brine_in'),
            brine_out=self.current_temperatures.get('brine_out'),
            hot_water=self.current_temperatures.get('hot_water'),
        )

    def get_latest_status(self) -> Optional[HeatPumpStatus]:
        """Get latest heat pump status"""
        if 'heating' not in self.current_status:
            return None

        return HeatPumpStatus(
            timestamp=self.last_message_time or datetime.now(),
            heating=bool(self.current_status['heating']),
            power=self.current_status.get('power'),
            mode=self.current_status.get('mode', 'auto'),
            heat_curve=self.current_status.get('heat_curve'),
        )

    def is_connected(self) -> bool:
        """Check if connected to broker"""
        return self.connected

    def get_last_message_age(self) -> Optional[float]:
        """Get seconds since last message received"""
        if self.last_message_time:
            return (datetime.now() - self.last_message_time).total_seconds()
        return None


# Global MQTT manager instance
_mqtt_manager: Optional[MQTTManager] = None


def get_mqtt_manager() -> MQTTManager:
    """Get global MQTT manager instance"""
    global _mqtt_manager
    if _mqtt_manager is None:
        _mqtt_manager = MQTTManager()
    return _mqtt_manager
