#!/usr/bin/env python3
"""Test script to control heat pump via MQTT"""
import sys
import time
from app.services.mqtt_manager import get_mqtt_manager
from app.config import get_config

def main():
    print("Connecting to MQTT...")
    mqtt = get_mqtt_manager()
    mqtt.connect()

    time.sleep(2)  # Wait for connection

    if not mqtt.is_connected():
        print("ERROR: Not connected to MQTT broker")
        return

    print("Connected! Current status:")
    temp = mqtt.get_latest_temperature()
    status = mqtt.get_latest_status()

    if temp:
        print(f"  Indoor: {temp.indoor}°C")
        print(f"  Outdoor: {temp.outdoor}°C")

    if status:
        print(f"  Heating: {status.heating}")
        print(f"  Mode: {status.mode}")

    print("\nAvailable commands:")
    print("  1. Turn heating ON (mode=on)")
    print("  2. Turn heating OFF (mode=off)")
    print("  3. Set to AUTO mode")
    print("  4. Set temperature setpoint")
    print("  5. Exit")

    while True:
        choice = input("\nEnter choice: ").strip()

        if choice == "1":
            print("Setting mode to ON...")
            if mqtt.publish_mode("on"):
                print("✓ Command sent")
            else:
                print("✗ Failed to send command")

        elif choice == "2":
            print("Setting mode to OFF...")
            if mqtt.publish_mode("off"):
                print("✓ Command sent")
            else:
                print("✗ Failed to send command")

        elif choice == "3":
            print("Setting mode to AUTO...")
            if mqtt.publish_mode("auto"):
                print("✓ Command sent")
            else:
                print("✗ Failed to send command")

        elif choice == "4":
            temp = input("Enter target temperature (°C): ").strip()
            try:
                temp_val = float(temp)
                print(f"Setting setpoint to {temp_val}°C...")
                if mqtt.publish_setpoint(temp_val):
                    print("✓ Command sent")
                else:
                    print("✗ Failed to send command")
            except ValueError:
                print("Invalid temperature")

        elif choice == "5":
            print("Exiting...")
            mqtt.disconnect()
            break

        else:
            print("Invalid choice")

if __name__ == "__main__":
    main()
