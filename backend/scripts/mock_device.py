#!/usr/bin/env python3
"""
Mock ThermIQ-ROOM2LP Device Simulator

Simulates a real ThermIQ device for development and testing purposes.
Publishes sensor data every 60 seconds (1 minute) and responds to control commands via MQTT.
"""
import json
import time
import random
import logging
from datetime import datetime
from typing import Dict, Any

import paho.mqtt.client as mqtt


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockThermIQDevice:
    """Simulates ThermIQ-ROOM2LP device behavior"""

    def __init__(
        self,
        broker: str = "localhost",
        port: int = 1883,
        device_id: str = "thermiq_room2lp"
    ):
        self.broker = broker
        self.port = port
        self.device_id = device_id

        # Simulated state
        self.indoor_temp = 21.0
        self.outdoor_temp = 5.0
        self.supply_temp = 35.0
        self.return_temp = 28.0
        self.target_temp = 21.0
        self.brine_in_temp = 0.0
        self.brine_out_temp = -3.0
        self.hot_water_temp = 48.0
        self.heating = True
        self.power = 1200.0  # Watts
        self.mode = "auto"
        self.heat_curve = 1.5

        # Thermal simulation parameters
        self.heat_loss_coefficient = 0.015  # Temperature loss per iteration
        self.heating_rate = 0.05  # Temperature gain when heating
        self.noise_amplitude = 0.1

        # MQTT client
        self.client = mqtt.Client(client_id=f"mock_{device_id}")
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.connected = False

    def on_connect(self, client, userdata, flags, rc):
        """Callback when connected to MQTT broker"""
        if rc == 0:
            self.connected = True
            logger.info(f"Connected to MQTT broker at {self.broker}:{self.port}")

            # Subscribe to control topics
            control_topics = [
                f"thermiq/{self.device_id}/control/setpoint",
                f"thermiq/{self.device_id}/control/mode",
            ]
            for topic in control_topics:
                self.client.subscribe(topic)
                logger.info(f"Subscribed to {topic}")
        else:
            logger.error(f"Connection failed with code {rc}")

    def on_message(self, client, userdata, msg):
        """Callback when message received"""
        try:
            payload = msg.payload.decode()
            logger.info(f"Received on {msg.topic}: {payload}")

            if "setpoint" in msg.topic:
                # Handle temperature setpoint change
                data = json.loads(payload)
                if "value" in data:
                    self.target_temp = float(data["value"])
                    logger.info(f"Target temperature set to {self.target_temp}°C")

            elif "mode" in msg.topic:
                # Handle mode change (on/off/auto)
                data = json.loads(payload)
                if "value" in data:
                    self.mode = data["value"]
                    if self.mode == "off":
                        self.heating = False
                    elif self.mode == "on":
                        self.heating = True
                    logger.info(f"Mode set to {self.mode}")

        except Exception as e:
            logger.error(f"Error processing message: {e}")

    def simulate_thermal_dynamics(self):
        """Simulate realistic heat pump thermal behavior"""
        # Calculate heat loss based on indoor-outdoor temperature difference
        temp_diff = self.indoor_temp - self.outdoor_temp
        heat_loss = temp_diff * self.heat_loss_coefficient

        # Apply heating if active
        if self.heating:
            self.indoor_temp += self.heating_rate
            self.power = random.uniform(1000, 1500)  # Variable power consumption
            self.supply_temp = self.indoor_temp + random.uniform(12, 18)
            self.return_temp = self.indoor_temp + random.uniform(5, 10)

            # Brine circuit (refrigerant from ground)
            self.brine_in_temp = self.outdoor_temp - random.uniform(2, 5)  # Cooler than outdoor
            self.brine_out_temp = self.brine_in_temp - random.uniform(2, 4)  # Heat extracted

            # Hot water heating during operation
            if self.hot_water_temp < 55:
                self.hot_water_temp += random.uniform(0.1, 0.3)
        else:
            self.power = random.uniform(50, 100)  # Standby power
            self.supply_temp = self.indoor_temp + random.uniform(2, 5)
            self.return_temp = self.indoor_temp + random.uniform(1, 3)

            # Brine temps when not heating
            self.brine_in_temp = self.outdoor_temp - random.uniform(0.5, 1.5)
            self.brine_out_temp = self.brine_in_temp - random.uniform(0.2, 0.5)

            # Hot water cooling when not heating
            if self.hot_water_temp > 40:
                self.hot_water_temp -= random.uniform(0.05, 0.15)

        # Apply heat loss
        self.indoor_temp -= heat_loss

        # Add realistic noise
        self.indoor_temp += random.uniform(-self.noise_amplitude, self.noise_amplitude)
        self.outdoor_temp += random.uniform(-0.05, 0.05)  # Slow outdoor temp change

        # Clamp values to realistic ranges
        self.indoor_temp = max(10, min(30, self.indoor_temp))
        self.outdoor_temp = max(-20, min(25, self.outdoor_temp))

        # Automatic heating control in auto mode
        if self.mode == "auto":
            if self.indoor_temp < self.target_temp - 0.5:
                self.heating = True
            elif self.indoor_temp > self.target_temp + 0.5:
                self.heating = False

    def publish_sensors(self):
        """Publish all sensor data to MQTT topics"""
        timestamp = datetime.now().isoformat()
        base_topic = f"thermiq/{self.device_id}"

        # Temperature sensors
        sensors = {
            f"{base_topic}/sensors/temperature/indoor": {
                "value": round(self.indoor_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/outdoor": {
                "value": round(self.outdoor_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/supply": {
                "value": round(self.supply_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/return": {
                "value": round(self.return_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/target": {
                "value": round(self.target_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/brine_in": {
                "value": round(self.brine_in_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/brine_out": {
                "value": round(self.brine_out_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/temperature/hot_water": {
                "value": round(self.hot_water_temp, 2),
                "unit": "celsius",
                "timestamp": timestamp
            },
            f"{base_topic}/sensors/power": {
                "value": round(self.power, 1),
                "unit": "watts",
                "timestamp": timestamp
            },
            f"{base_topic}/status/heating": {
                "value": self.heating,
                "timestamp": timestamp
            },
            f"{base_topic}/status/mode": {
                "value": self.mode,
                "timestamp": timestamp
            },
            f"{base_topic}/status/heat_curve": {
                "value": round(self.heat_curve, 1),
                "timestamp": timestamp
            },
        }

        # Publish all sensors
        for topic, payload in sensors.items():
            self.client.publish(topic, json.dumps(payload), qos=1)

        logger.info(
            f"Published: Indoor={self.indoor_temp:.1f}°C "
            f"Outdoor={self.outdoor_temp:.1f}°C "
            f"Supply={self.supply_temp:.1f}°C "
            f"HotWater={self.hot_water_temp:.1f}°C "
            f"Brine={self.brine_in_temp:.1f}/{self.brine_out_temp:.1f}°C "
            f"Heating={'ON' if self.heating else 'OFF'} "
            f"Power={self.power:.0f}W"
        )

    def run(self):
        """Main run loop"""
        logger.info(f"Starting mock ThermIQ device: {self.device_id}")
        logger.info(f"Connecting to MQTT broker: {self.broker}:{self.port}")

        try:
            self.client.connect(self.broker, self.port, keepalive=60)
            self.client.loop_start()

            # Wait for connection
            timeout = 10
            for _ in range(timeout):
                if self.connected:
                    break
                time.sleep(1)
            else:
                logger.error("Failed to connect to MQTT broker")
                return

            logger.info("Mock device running. Press Ctrl+C to stop.")

            # Main simulation loop
            while True:
                self.simulate_thermal_dynamics()
                self.publish_sensors()
                time.sleep(60)  # Publish every 60 seconds (1 minute)

        except KeyboardInterrupt:
            logger.info("Shutting down mock device...")
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
        finally:
            self.client.loop_stop()
            self.client.disconnect()
            logger.info("Mock device stopped")


def main():
    """Entry point"""
    import sys

    # Parse command line arguments
    broker = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    device = MockThermIQDevice(broker=broker)
    device.run()


if __name__ == "__main__":
    main()
