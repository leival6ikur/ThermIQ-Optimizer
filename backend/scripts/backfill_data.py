#!/usr/bin/env python3
"""
Backfill Database with 24h of Realistic Data

Generates realistic temperature, heating status, and price data for the past 24 hours.
Useful for testing and demonstration purposes.
"""
import sys
import asyncio
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_database
from app.models import TemperatureReading, HeatPumpStatus, ElectricityPrice


async def generate_temperature_data(start_time: datetime, hours: int = 24):
    """Generate realistic temperature readings for given time period"""
    readings = []

    # Base temperatures with realistic daily variation
    base_indoor = 20.0
    base_outdoor = 5.0
    base_supply = 35.0
    base_hot_water = 50.0

    current_time = start_time
    end_time = start_time + timedelta(hours=hours)

    # Generate reading every minute
    while current_time < end_time:
        # Hour of day for daily patterns
        hour = current_time.hour

        # Daily temperature patterns
        outdoor_variation = -3 * abs(12 - hour) / 12  # Coldest at midnight, warmest at noon
        indoor_variation = random.uniform(-0.5, 0.5)

        # Outdoor drops at night, rises during day
        outdoor_temp = base_outdoor + outdoor_variation + random.uniform(-1, 1)

        # Indoor stays relatively stable
        indoor_temp = base_indoor + indoor_variation + random.uniform(-0.3, 0.3)

        # Supply temp varies with heating demand
        heating_demand = max(0, (21 - indoor_temp) * 5)
        supply_temp = base_supply + heating_demand + random.uniform(-2, 2)

        # Return temp is cooler than supply
        return_temp = supply_temp - random.uniform(4, 8)

        # Brine temperatures (ground loop)
        brine_in = random.uniform(-1, 3)
        brine_out = brine_in - random.uniform(3, 5)

        # Hot water tank
        hot_water = base_hot_water + random.uniform(-3, 5)

        # Target temp
        target = 21.0

        readings.append(TemperatureReading(
            timestamp=current_time,
            indoor=round(indoor_temp, 2),
            outdoor=round(outdoor_temp, 2),
            supply=round(supply_temp, 2),
            return_temp=round(return_temp, 2),
            target=target,
            brine_in=round(brine_in, 2),
            brine_out=round(brine_out, 2),
            hot_water=round(hot_water, 2),
        ))

        current_time += timedelta(minutes=1)

    return readings


async def generate_status_data(start_time: datetime, hours: int = 24):
    """Generate realistic heating status data"""
    statuses = []

    current_time = start_time
    end_time = start_time + timedelta(hours=hours)

    # Heating tends to be on more during night (cheap electricity)
    # and when outdoor temp is lower

    while current_time < end_time:
        hour = current_time.hour

        # More heating during night hours (0-6) and evening (20-23)
        if 0 <= hour < 6 or 20 <= hour < 24:
            heating_probability = 0.7
        elif 6 <= hour < 10 or 17 <= hour < 20:
            heating_probability = 0.5
        else:
            heating_probability = 0.3

        heating = random.random() < heating_probability

        # Power consumption when heating
        if heating:
            power = random.uniform(900, 1500)
        else:
            power = random.uniform(50, 100)  # Standby power

        statuses.append(HeatPumpStatus(
            timestamp=current_time,
            heating=heating,
            power=round(power, 1),
            mode="auto",
            heat_curve=1.5,
        ))

        current_time += timedelta(minutes=1)

    return statuses


async def generate_price_data(start_time: datetime, hours: int = 24):
    """Generate realistic electricity price data (hourly)"""
    prices = []

    # Start from beginning of the hour
    current_time = start_time.replace(minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(hours=hours)

    while current_time < end_time:
        hour = current_time.hour

        # Nord Pool price pattern (EUR/MWh)
        # Cheap at night (1-6am), expensive in evening (17-21)
        if 1 <= hour < 6:
            base_price = random.uniform(30, 50)  # Very cheap
        elif 6 <= hour < 10:
            base_price = random.uniform(50, 70)  # Morning rise
        elif 10 <= hour < 17:
            base_price = random.uniform(60, 80)  # Daytime
        elif 17 <= hour < 21:
            base_price = random.uniform(80, 120)  # Peak evening
        else:
            base_price = random.uniform(50, 70)  # Evening decline

        # Add some random variation
        price = base_price + random.uniform(-10, 10)
        price = max(20, price)  # Minimum price

        prices.append(ElectricityPrice(
            timestamp=current_time,
            price=round(price, 2),
            currency="EUR",
            region="EE",
        ))

        current_time += timedelta(hours=1)

    return prices


async def backfill_database():
    """Main function to backfill database"""
    print("Starting database backfill with 24h of realistic data...")

    db = await get_database()
    await db.init_db()

    # Start from 24 hours ago
    now = datetime.now()
    start_time = now - timedelta(hours=24)

    print(f"\nGenerating data from {start_time} to {now}")

    # Generate temperature data (1440 readings = 24h * 60min)
    print("\nGenerating temperature readings...")
    temperatures = await generate_temperature_data(start_time, hours=24)
    print(f"Generated {len(temperatures)} temperature readings")

    # Generate heating status data (1440 statuses)
    print("\nGenerating heating status data...")
    statuses = await generate_status_data(start_time, hours=24)
    print(f"Generated {len(statuses)} status records")

    # Generate electricity prices (24-48 hours of hourly data)
    print("\nGenerating electricity prices...")
    prices = await generate_price_data(start_time - timedelta(hours=24), hours=48)
    print(f"Generated {len(prices)} hourly prices")

    # Save to database
    print("\nSaving to database...")

    print("Saving temperature readings...")
    for i, reading in enumerate(temperatures):
        await db.save_temperature(reading)
        if (i + 1) % 100 == 0:
            print(f"  Saved {i + 1}/{len(temperatures)} temperature readings")

    print("Saving heating status...")
    for i, status in enumerate(statuses):
        await db.save_heat_pump_status(status)
        if (i + 1) % 100 == 0:
            print(f"  Saved {i + 1}/{len(statuses)} status records")

    print("Saving electricity prices...")
    await db.save_electricity_prices(prices)

    print("\n✓ Backfill complete!")
    print(f"\nDatabase now contains:")
    print(f"  - {len(temperatures)} temperature readings (24 hours @ 1/min)")
    print(f"  - {len(statuses)} heating status records (24 hours @ 1/min)")
    print(f"  - {len(prices)} electricity prices (48 hours @ 1/hour)")
    print(f"\nData range: {start_time.strftime('%Y-%m-%d %H:%M')} to {now.strftime('%Y-%m-%d %H:%M')}")


if __name__ == "__main__":
    asyncio.run(backfill_database())
