#!/usr/bin/env python3
"""
Seed database with mock historical data for development and testing.

Generates:
- 7 days of temperature readings (every minute)
- Hot water heating events (realistic heating cycles)
- Sample alerts
- Electricity prices (if not already fetched)
"""
import asyncio
import sys
import random
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import Database, get_database
from app.config import get_config


async def seed_temperature_readings(db: Database, days: int = 7):
    """Generate realistic temperature readings for the past N days"""
    print(f"Seeding {days} days of temperature readings...")

    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)

    # Simulation parameters
    indoor_temp = 21.0
    outdoor_temp = 5.0
    target_temp = 21.0
    hot_water_temp = 48.0
    heating = False

    readings_count = 0
    current_time = start_time

    # Open connection once for all inserts
    import aiosqlite
    async with aiosqlite.connect(db.db_path) as conn:
        while current_time < end_time:
            # Simulate thermal dynamics
            temp_diff = indoor_temp - outdoor_temp
            heat_loss = temp_diff * 0.015

            # Heating control
            if indoor_temp < target_temp - 0.5:
                heating = True
            elif indoor_temp > target_temp + 0.5:
                heating = False

            # Apply heating or cooling
            if heating:
                indoor_temp += 0.05
                power = random.uniform(1000, 1500)
                supply_temp = indoor_temp + random.uniform(12, 18)
                return_temp = indoor_temp + random.uniform(5, 10)

                # Hot water heating
                if hot_water_temp < 55:
                    hot_water_temp += random.uniform(0.1, 0.3)
            else:
                power = random.uniform(50, 100)
                supply_temp = indoor_temp + random.uniform(2, 5)
                return_temp = indoor_temp + random.uniform(1, 3)

                # Hot water cooling
                if hot_water_temp > 40:
                    hot_water_temp -= random.uniform(0.05, 0.15)

            indoor_temp -= heat_loss
            indoor_temp += random.uniform(-0.1, 0.1)
            outdoor_temp += random.uniform(-0.05, 0.05)

            # Clamp values
            indoor_temp = max(10, min(30, indoor_temp))
            outdoor_temp = max(-20, min(25, outdoor_temp))
            hot_water_temp = max(35, min(65, hot_water_temp))

            # Brine temps
            brine_in = outdoor_temp - random.uniform(2, 5)
            brine_out = brine_in - random.uniform(2, 4)

            # Save reading - use direct SQL since save_temperature expects TemperatureReading object
            await conn.execute(
                """
                INSERT INTO temperature_readings
                (timestamp, indoor, outdoor, supply, return_temp, target, brine_in, brine_out, hot_water)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (current_time, indoor_temp, outdoor_temp, supply_temp, return_temp,
                 target_temp, brine_in, brine_out, hot_water_temp)
            )

            readings_count += 1
            current_time += timedelta(minutes=1)

            # Commit every 1000 readings and show progress
            if readings_count % 1000 == 0:
                await conn.commit()
                print(f"  Generated {readings_count} readings...")

        # Final commit
        await conn.commit()

    print(f"✓ Seeded {readings_count} temperature readings")


async def seed_hot_water_events(db: Database, days: int = 7):
    """Generate realistic hot water heating events"""
    print(f"Seeding hot water events for {days} days...")

    config = get_config()
    electricity_price = 0.15  # Default price per kWh

    end_time = datetime.now()
    start_time = end_time - timedelta(days=days)

    events_count = 0
    current_time = start_time

    # Simulate 2-3 hot water heating cycles per day
    while current_time < end_time:
        # Random time for heating cycle (typically morning, evening)
        hour = random.choice([6, 7, 18, 19, 20])
        event_start = current_time.replace(hour=hour, minute=random.randint(0, 59), second=0)

        if event_start >= end_time:
            break

        # Heating cycle parameters
        start_temp = random.uniform(42, 50)
        target_temp = random.choice([52, 55, 60, 63])  # Sometimes legionella cycle
        is_legionella = target_temp >= 60

        # Duration: 20-60 minutes depending on temp difference
        temp_diff = target_temp - start_temp
        duration_minutes = int(20 + (temp_diff * 2) + random.uniform(-5, 5))
        duration_minutes = max(15, min(90, duration_minutes))

        event_end = event_start + timedelta(minutes=duration_minutes)
        peak_temp = target_temp + random.uniform(-1, 2)
        end_temp = peak_temp - random.uniform(0.5, 2)

        # Energy consumption: ~2-3 kW for hot water heating
        avg_power_kw = random.uniform(2.0, 3.0)
        energy_kwh = (avg_power_kw * duration_minutes) / 60
        estimated_cost = energy_kwh * electricity_price

        event_type = 'legionella_protection' if is_legionella else 'normal_heating'

        # Create event
        event_id = await db.start_hot_water_event(event_start, start_temp)
        await db.end_hot_water_event(
            event_id=event_id,
            end_time=event_end,
            peak_temp=peak_temp,
            end_temp=end_temp,
            energy_kwh=energy_kwh,
            estimated_cost=estimated_cost,
            event_type=event_type,
            is_legionella=is_legionella
        )

        events_count += 1
        current_time += timedelta(days=1)

    print(f"✓ Seeded {events_count} hot water events")


async def seed_alerts(db: Database):
    """Generate sample alerts"""
    print("Seeding sample alerts...")

    alerts = [
        {
            'alert_type': 'price_opportunity',
            'severity': 'info',
            'title': 'Low Electricity Prices Ahead',
            'message': 'Electricity prices will be 40% below average in the next 3 hours. Good time to pre-heat.',
            'data': {'price_cents': 4.5, 'avg_price': 7.8, 'savings_potential': 0.15}
        },
        {
            'alert_type': 'efficiency',
            'severity': 'warning',
            'title': 'Low COP Detected',
            'message': 'Heat pump efficiency (COP) has been below 2.0 for the past hour. May indicate an issue.',
            'data': {'cop': 1.8, 'threshold': 2.0, 'duration_minutes': 62}
        },
        {
            'alert_type': 'comfort',
            'severity': 'warning',
            'title': 'Temperature Falling Below Target',
            'message': 'Indoor temperature is 1.5°C below target and trending down. Consider manual override.',
            'data': {'indoor_temp': 19.5, 'target_temp': 21.0, 'diff': -1.5}
        },
    ]

    import json
    import aiosqlite
    for alert_data in alerts:
        async with aiosqlite.connect(db.db_path) as conn:
            await conn.execute(
                """
                INSERT INTO alerts (alert_type, severity, title, message, data, created_at, is_active)
                VALUES (?, ?, ?, ?, ?, datetime('now'), 1)
                """,
                (alert_data['alert_type'], alert_data['severity'], alert_data['title'],
                 alert_data['message'], json.dumps(alert_data.get('data', {})))
            )
            await conn.commit()

    print(f"✓ Seeded {len(alerts)} alerts")


async def main(force=False):
    """Main seeding function"""
    print("=" * 60)
    print("Database Seeding Script")
    print("=" * 60)

    # Initialize database
    print("\n1. Initializing database...")
    db = Database()
    await db.init_db()
    print("✓ Database initialized")

    # Check if already seeded
    import aiosqlite
    async with aiosqlite.connect(db.db_path) as conn:
        conn.row_factory = aiosqlite.Row
        async with conn.execute("SELECT COUNT(*) as count FROM temperature_readings") as cursor:
            row = await cursor.fetchone()
            temp_count = row['count'] if row else 0

        if temp_count > 0:
            print(f"\n⚠️  Database already contains {temp_count} temperature readings.")
            if not force:
                try:
                    response = input("Clear and reseed? (y/N): ")
                    if response.lower() != 'y':
                        print("Aborted.")
                        return
                except EOFError:
                    print("\nNon-interactive mode detected. Use --force to skip prompt.")
                    return

            # Clear existing data
            print("\n2. Clearing existing data...")
            await conn.execute("DELETE FROM temperature_readings")
            await conn.execute("DELETE FROM hot_water_events")
            await conn.execute("DELETE FROM alerts")
            await conn.commit()
            print("✓ Cleared existing data")

    # Seed data
    print("\n3. Seeding temperature readings (this may take a few minutes)...")
    await seed_temperature_readings(db, days=7)

    print("\n4. Seeding hot water events...")
    await seed_hot_water_events(db, days=7)

    print("\n5. Seeding sample alerts...")
    await seed_alerts(db)

    print("\n" + "=" * 60)
    print("✓ Database seeding complete!")
    print("=" * 60)
    print("\nSummary:")

    # Get final counts
    import aiosqlite
    async with aiosqlite.connect(db.db_path) as conn:
        conn.row_factory = aiosqlite.Row

        async with conn.execute("SELECT COUNT(*) as count FROM temperature_readings") as cursor:
            temp_count = (await cursor.fetchone())['count']

        async with conn.execute("SELECT COUNT(*) as count FROM hot_water_events") as cursor:
            hw_count = (await cursor.fetchone())['count']

        async with conn.execute("SELECT COUNT(*) as count FROM alerts") as cursor:
            alert_count = (await cursor.fetchone())['count']

    print(f"  Temperature readings: {temp_count:,}")
    print(f"  Hot water events:     {hw_count}")
    print(f"  Alerts:               {alert_count}")
    print("\nYou can now view the dashboard with historical data!")
    print()


if __name__ == "__main__":
    force = '--force' in sys.argv
    asyncio.run(main(force=force))
