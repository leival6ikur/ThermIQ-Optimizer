#!/usr/bin/env python3
"""
MQTT Monitor Tool

Simple tool to monitor all MQTT messages for debugging purposes.
"""
import paho.mqtt.client as mqtt
import json
import logging
from datetime import datetime


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def on_connect(client, userdata, flags, rc):
    """Callback when connected"""
    if rc == 0:
        logger.info("Connected to MQTT broker")
        client.subscribe("thermiq/#")
        logger.info("Subscribed to thermiq/# (all ThermIQ topics)")
    else:
        logger.error(f"Connection failed with code {rc}")


def on_message(client, userdata, msg):
    """Callback when message received"""
    try:
        # Try to parse as JSON
        payload = json.loads(msg.payload.decode())
        payload_str = json.dumps(payload, indent=2)
    except:
        # Not JSON, display as string
        payload_str = msg.payload.decode()

    print(f"\n{'='*80}")
    print(f"Topic: {msg.topic}")
    print(f"Time:  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Payload:")
    print(payload_str)
    print('='*80)


def main():
    """Entry point"""
    import sys

    broker = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    port = 1883

    logger.info(f"Starting MQTT monitor for broker: {broker}:{port}")
    logger.info("Press Ctrl+C to stop")

    client = mqtt.Client(client_id="thermiq_monitor")
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(broker, port, keepalive=60)
        client.loop_forever()
    except KeyboardInterrupt:
        logger.info("\nStopping monitor...")
    except Exception as e:
        logger.error(f"Error: {e}")
    finally:
        client.disconnect()


if __name__ == "__main__":
    main()
