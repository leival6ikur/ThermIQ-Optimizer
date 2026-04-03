"""
Database management for ThermIQ
"""
import aiosqlite
import logging
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import List, Optional, Dict, Any

from app.models import TemperatureReading, HeatPumpStatus, ElectricityPrice, HeatingSchedule
from app.paths import get_database_path


logger = logging.getLogger(__name__)

# Data retention configuration
RAW_DATA_RETENTION_DAYS = 30  # Keep raw 1-minute data for 30 days


class Database:
    """SQLite database manager"""

    def __init__(self, db_path: Path = None):
        if db_path is None:
            self.db_path = get_database_path()
        else:
            self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    async def init_db(self) -> None:
        """Initialize database tables"""
        async with aiosqlite.connect(self.db_path) as db:
            # Temperature readings table (raw 1-minute data, kept for 30 days)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS temperature_readings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    indoor REAL,
                    outdoor REAL,
                    supply REAL,
                    return_temp REAL,
                    target REAL,
                    brine_in REAL,
                    brine_out REAL,
                    hot_water REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Heat pump status table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS heat_pump_status (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    heating BOOLEAN NOT NULL,
                    power REAL,
                    mode TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Electricity prices table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS electricity_prices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL UNIQUE,
                    price REAL NOT NULL,
                    currency TEXT DEFAULT 'EUR',
                    region TEXT DEFAULT 'EE',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Heating schedules table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS heating_schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    schedule_date DATE NOT NULL,
                    hour INTEGER NOT NULL,
                    should_heat BOOLEAN NOT NULL,
                    price REAL NOT NULL,
                    estimated_cost REAL NOT NULL,
                    expected_temperature REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(schedule_date, hour)
                )
            """)

            # Hourly temperature aggregates (kept indefinitely)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS temperature_hourly (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hour_start DATETIME NOT NULL UNIQUE,
                    indoor_avg REAL,
                    indoor_min REAL,
                    indoor_max REAL,
                    outdoor_avg REAL,
                    outdoor_min REAL,
                    outdoor_max REAL,
                    supply_avg REAL,
                    supply_min REAL,
                    supply_max REAL,
                    return_avg REAL,
                    return_min REAL,
                    return_max REAL,
                    target_avg REAL,
                    brine_in_avg REAL,
                    brine_in_min REAL,
                    brine_in_max REAL,
                    brine_out_avg REAL,
                    brine_out_min REAL,
                    brine_out_max REAL,
                    hot_water_avg REAL,
                    hot_water_min REAL,
                    hot_water_max REAL,
                    sample_count INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Hourly heating status aggregates (kept indefinitely)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS heat_pump_status_hourly (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hour_start DATETIME NOT NULL UNIQUE,
                    heating_minutes INTEGER NOT NULL,
                    heating_percentage REAL NOT NULL,
                    avg_power REAL,
                    total_energy_kwh REAL,
                    sample_count INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Alerts table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS alerts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    title TEXT NOT NULL,
                    message TEXT NOT NULL,
                    data TEXT,
                    created_at DATETIME NOT NULL,
                    acknowledged_at DATETIME,
                    resolved_at DATETIME,
                    is_active BOOLEAN NOT NULL DEFAULT 1
                )
            """)

            # Performance metrics table (hourly calculated metrics)
            await db.execute("""
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    period_start DATETIME NOT NULL,
                    period_end DATETIME NOT NULL,
                    cop REAL,
                    duty_cycle REAL,
                    cycles_per_hour REAL,
                    ground_delta REAL,
                    heating_delta REAL,
                    total_kwh REAL,
                    total_cost REAL,
                    avg_power REAL,
                    avg_indoor_temp REAL,
                    avg_outdoor_temp REAL,
                    heating_minutes INTEGER,
                    samples_count INTEGER NOT NULL,
                    UNIQUE(period_start, period_end)
                )
            """)

            # Hot water events table
            await db.execute("""
                CREATE TABLE IF NOT EXISTS hot_water_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    start_temp REAL NOT NULL,
                    peak_temp REAL,
                    end_temp REAL,
                    duration_minutes INTEGER,
                    energy_kwh REAL,
                    estimated_cost REAL,
                    event_type TEXT,
                    is_legionella_cycle BOOLEAN DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create indices for performance
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_temp_timestamp ON temperature_readings(timestamp)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_status_timestamp ON heat_pump_status(timestamp)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_price_timestamp ON electricity_prices(timestamp)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_schedule_date ON heating_schedules(schedule_date)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_temp_hourly_hour ON temperature_hourly(hour_start)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_status_hourly_hour ON heat_pump_status_hourly(hour_start)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_alerts_active ON alerts(is_active)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_metrics_period ON performance_metrics(period_start, period_end)"
            )
            await db.execute(
                "CREATE INDEX IF NOT EXISTS idx_hot_water_start ON hot_water_events(start_time)"
            )

            await db.commit()
            logger.info("Database initialized successfully")

    async def save_temperature(self, reading: TemperatureReading) -> None:
        """Save temperature reading"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO temperature_readings
                (timestamp, indoor, outdoor, supply, return_temp, target, brine_in, brine_out, hot_water)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reading.timestamp,
                    reading.indoor,
                    reading.outdoor,
                    reading.supply,
                    reading.return_temp,
                    reading.target,
                    reading.brine_in,
                    reading.brine_out,
                    reading.hot_water,
                ),
            )
            await db.commit()

    async def save_heat_pump_status(self, status: HeatPumpStatus) -> None:
        """Save heat pump status"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                """
                INSERT INTO heat_pump_status (timestamp, heating, power, mode)
                VALUES (?, ?, ?, ?)
                """,
                (status.timestamp, status.heating, status.power, status.mode),
            )
            await db.commit()

    async def get_heat_pump_status_history(self, start_time: datetime, end_time: datetime) -> List[Dict[str, Any]]:
        """Get heat pump status history for a time period"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT timestamp, heating, power, mode
                FROM heat_pump_status
                WHERE timestamp >= ? AND timestamp < ?
                ORDER BY timestamp ASC
                """,
                (start_time, end_time),
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def save_electricity_prices(self, prices: List[ElectricityPrice]) -> None:
        """Save electricity prices (upsert)"""
        async with aiosqlite.connect(self.db_path) as db:
            for price in prices:
                await db.execute(
                    """
                    INSERT INTO electricity_prices (timestamp, price, currency, region)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT(timestamp) DO UPDATE SET
                        price = excluded.price,
                        currency = excluded.currency,
                        region = excluded.region
                    """,
                    (price.timestamp, price.price, price.currency, price.region),
                )
            await db.commit()
            logger.info(f"Saved {len(prices)} electricity prices")

    async def save_heating_schedule(self, schedule_date: str, schedules: List[HeatingSchedule]) -> None:
        """Save heating schedule for a specific date"""
        async with aiosqlite.connect(self.db_path) as db:
            for schedule in schedules:
                await db.execute(
                    """
                    INSERT INTO heating_schedules
                    (schedule_date, hour, should_heat, price, estimated_cost, expected_temperature)
                    VALUES (?, ?, ?, ?, ?, ?)
                    ON CONFLICT(schedule_date, hour) DO UPDATE SET
                        should_heat = excluded.should_heat,
                        price = excluded.price,
                        estimated_cost = excluded.estimated_cost,
                        expected_temperature = excluded.expected_temperature
                    """,
                    (
                        schedule_date,
                        schedule.hour,
                        schedule.should_heat,
                        schedule.price,
                        schedule.estimated_cost,
                        schedule.expected_temperature,
                    ),
                )
            await db.commit()
            logger.info(f"Saved heating schedule for {schedule_date}")

    async def get_latest_temperature(self) -> Optional[TemperatureReading]:
        """Get most recent temperature reading"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM temperature_readings
                ORDER BY timestamp DESC LIMIT 1
                """
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    return TemperatureReading(
                        timestamp=datetime.fromisoformat(row["timestamp"]),
                        indoor=row["indoor"],
                        outdoor=row["outdoor"],
                        supply=row["supply"],
                        return_temp=row["return_temp"],
                        target=row["target"],
                    )
        return None

    async def get_temperatures_since(self, since: datetime) -> List[TemperatureReading]:
        """
        Get temperature readings since specified time.
        Automatically uses raw data (1-minute) for recent data or hourly aggregates for older data.
        """
        now = datetime.now()
        cutoff_date = now - timedelta(days=RAW_DATA_RETENTION_DAYS)

        results = []

        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row

            # If requested time is within retention period, use raw data
            if since >= cutoff_date:
                async with db.execute(
                    """
                    SELECT * FROM temperature_readings
                    WHERE timestamp >= ?
                    ORDER BY timestamp ASC
                    """,
                    (since,),
                ) as cursor:
                    rows = await cursor.fetchall()
                    results = [
                        TemperatureReading(
                            timestamp=datetime.fromisoformat(row["timestamp"]),
                            indoor=row["indoor"],
                            outdoor=row["outdoor"],
                            supply=row["supply"],
                            return_temp=row["return_temp"],
                            target=row["target"],
                            brine_in=row["brine_in"] if "brine_in" in row.keys() else None,
                            brine_out=row["brine_out"] if "brine_out" in row.keys() else None,
                            hot_water=row["hot_water"] if "hot_water" in row.keys() else None,
                        )
                        for row in rows
                    ]
            else:
                # Use hourly aggregates for older data, raw for recent
                # Get aggregates for old period
                async with db.execute(
                    """
                    SELECT * FROM temperature_hourly
                    WHERE hour_start >= ? AND hour_start < ?
                    ORDER BY hour_start ASC
                    """,
                    (since, cutoff_date),
                ) as cursor:
                    rows = await cursor.fetchall()
                    for row in rows:
                        # Use average values from hourly aggregates
                        results.append(TemperatureReading(
                            timestamp=datetime.fromisoformat(row["hour_start"]),
                            indoor=row["indoor_avg"],
                            outdoor=row["outdoor_avg"],
                            supply=row["supply_avg"],
                            return_temp=row["return_avg"],
                            target=row["target_avg"],
                            brine_in=row["brine_in_avg"],
                            brine_out=row["brine_out_avg"],
                            hot_water=row["hot_water_avg"],
                        ))

                # Get raw data for recent period
                async with db.execute(
                    """
                    SELECT * FROM temperature_readings
                    WHERE timestamp >= ?
                    ORDER BY timestamp ASC
                    """,
                    (cutoff_date,),
                ) as cursor:
                    rows = await cursor.fetchall()
                    for row in rows:
                        results.append(TemperatureReading(
                            timestamp=datetime.fromisoformat(row["timestamp"]),
                            indoor=row["indoor"],
                            outdoor=row["outdoor"],
                            supply=row["supply"],
                            return_temp=row["return_temp"],
                            target=row["target"],
                            brine_in=row.get("brine_in"),
                            brine_out=row.get("brine_out"),
                            hot_water=row.get("hot_water"),
                        ))

        return results

    async def get_electricity_prices(self, start: datetime, end: datetime) -> List[ElectricityPrice]:
        """Get electricity prices for date range"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM electricity_prices
                WHERE timestamp >= ? AND timestamp < ?
                ORDER BY timestamp ASC
                """,
                (start, end),
            ) as cursor:
                rows = await cursor.fetchall()
                return [
                    ElectricityPrice(
                        timestamp=datetime.fromisoformat(row["timestamp"]),
                        price=row["price"],
                        currency=row["currency"],
                        region=row["region"],
                    )
                    for row in rows
                ]

    async def get_heating_schedule(self, schedule_date: str) -> List[HeatingSchedule]:
        """Get heating schedule for specific date"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM heating_schedules
                WHERE schedule_date = ?
                ORDER BY hour ASC
                """,
                (schedule_date,),
            ) as cursor:
                rows = await cursor.fetchall()
                return [
                    HeatingSchedule(
                        hour=row["hour"],
                        should_heat=bool(row["should_heat"]),
                        price=row["price"],
                        estimated_cost=row["estimated_cost"],
                        expected_temperature=row["expected_temperature"],
                    )
                    for row in rows
                ]

    async def cleanup_old_data(self, days: int = 30) -> None:
        """Delete data older than specified days"""
        cutoff = datetime.now() - timedelta(days=days)
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute("DELETE FROM temperature_readings WHERE timestamp < ?", (cutoff,))
            await db.execute("DELETE FROM heat_pump_status WHERE timestamp < ?", (cutoff,))
            await db.commit()
            logger.info(f"Cleaned up data older than {days} days")


    async def aggregate_temperature_data(self, target_date: date) -> int:
        """
        Aggregate raw temperature data for a specific date into hourly averages.

        Args:
            target_date: Date to aggregate

        Returns:
            Number of hourly records created
        """
        async with aiosqlite.connect(self.db_path) as db:
            # For each hour of the target date
            records_created = 0
            for hour in range(24):
                hour_start = datetime.combine(target_date, datetime.min.time()) + timedelta(hours=hour)
                hour_end = hour_start + timedelta(hours=1)

                # Calculate aggregates for this hour
                async with db.execute(
                    """
                    SELECT
                        AVG(indoor) as indoor_avg, MIN(indoor) as indoor_min, MAX(indoor) as indoor_max,
                        AVG(outdoor) as outdoor_avg, MIN(outdoor) as outdoor_min, MAX(outdoor) as outdoor_max,
                        AVG(supply) as supply_avg, MIN(supply) as supply_min, MAX(supply) as supply_max,
                        AVG(return_temp) as return_avg, MIN(return_temp) as return_min, MAX(return_temp) as return_max,
                        AVG(target) as target_avg,
                        AVG(brine_in) as brine_in_avg, MIN(brine_in) as brine_in_min, MAX(brine_in) as brine_in_max,
                        AVG(brine_out) as brine_out_avg, MIN(brine_out) as brine_out_min, MAX(brine_out) as brine_out_max,
                        AVG(hot_water) as hot_water_avg, MIN(hot_water) as hot_water_min, MAX(hot_water) as hot_water_max,
                        COUNT(*) as sample_count
                    FROM temperature_readings
                    WHERE timestamp >= ? AND timestamp < ?
                    """,
                    (hour_start, hour_end)
                ) as cursor:
                    row = await cursor.fetchone()

                    if row and row[0] is not None:  # Has data for this hour
                        await db.execute(
                            """
                            INSERT OR REPLACE INTO temperature_hourly
                            (hour_start, indoor_avg, indoor_min, indoor_max,
                             outdoor_avg, outdoor_min, outdoor_max,
                             supply_avg, supply_min, supply_max,
                             return_avg, return_min, return_max,
                             target_avg,
                             brine_in_avg, brine_in_min, brine_in_max,
                             brine_out_avg, brine_out_min, brine_out_max,
                             hot_water_avg, hot_water_min, hot_water_max,
                             sample_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """,
                            (hour_start, *row)
                        )
                        records_created += 1

            await db.commit()
            logger.info(f"Aggregated temperature data for {target_date}: {records_created} hourly records")
            return records_created

    async def aggregate_heating_status(self, target_date: date) -> int:
        """
        Aggregate raw heating status data for a specific date into hourly summaries.

        Args:
            target_date: Date to aggregate

        Returns:
            Number of hourly records created
        """
        async with aiosqlite.connect(self.db_path) as db:
            records_created = 0
            for hour in range(24):
                hour_start = datetime.combine(target_date, datetime.min.time()) + timedelta(hours=hour)
                hour_end = hour_start + timedelta(hours=1)

                # Calculate heating statistics for this hour
                async with db.execute(
                    """
                    SELECT
                        SUM(CASE WHEN heating = 1 THEN 1 ELSE 0 END) as heating_count,
                        COUNT(*) as total_count,
                        AVG(CASE WHEN heating = 1 THEN power END) as avg_power,
                        AVG(power) as avg_power_all
                    FROM heat_pump_status
                    WHERE timestamp >= ? AND timestamp < ?
                    """,
                    (hour_start, hour_end)
                ) as cursor:
                    row = await cursor.fetchone()

                    if row and row[1] > 0:  # Has data for this hour
                        heating_count, total_count, avg_power_heating, avg_power_all = row
                        heating_minutes = int((heating_count / total_count) * 60)
                        heating_percentage = (heating_count / total_count) * 100

                        # Estimate energy: avg_power (W) * heating_percentage / 100 * 1 hour / 1000 = kWh
                        total_energy_kwh = (avg_power_heating or 0) * heating_minutes / 60 / 1000

                        await db.execute(
                            """
                            INSERT OR REPLACE INTO heat_pump_status_hourly
                            (hour_start, heating_minutes, heating_percentage, avg_power, total_energy_kwh, sample_count)
                            VALUES (?, ?, ?, ?, ?, ?)
                            """,
                            (hour_start, heating_minutes, heating_percentage, avg_power_heating, total_energy_kwh, total_count)
                        )
                        records_created += 1

            await db.commit()
            logger.info(f"Aggregated heating status for {target_date}: {records_created} hourly records")
            return records_created

    async def cleanup_old_raw_data(self, retention_days: int = RAW_DATA_RETENTION_DAYS) -> tuple:
        """
        Delete raw data older than retention period.

        Args:
            retention_days: Number of days to keep raw data (default 30)

        Returns:
            Tuple of (temp_records_deleted, status_records_deleted)
        """
        cutoff_date = datetime.now() - timedelta(days=retention_days)

        async with aiosqlite.connect(self.db_path) as db:
            # Delete old temperature readings
            async with db.execute(
                "DELETE FROM temperature_readings WHERE timestamp < ?",
                (cutoff_date,)
            ) as cursor:
                temp_deleted = cursor.rowcount

            # Delete old heating status
            async with db.execute(
                "DELETE FROM heat_pump_status WHERE timestamp < ?",
                (cutoff_date,)
            ) as cursor:
                status_deleted = cursor.rowcount

            await db.commit()
            logger.info(f"Cleaned up raw data older than {retention_days} days: {temp_deleted} temp, {status_deleted} status")
            return (temp_deleted, status_deleted)

    async def run_daily_maintenance(self) -> Dict[str, Any]:
        """
        Run daily data maintenance tasks:
        1. Aggregate yesterday's raw data
        2. Clean up old raw data (older than retention period)

        Returns:
            Dictionary with maintenance results
        """
        yesterday = date.today() - timedelta(days=1)

        # Aggregate yesterday's data
        temp_aggregated = await self.aggregate_temperature_data(yesterday)
        status_aggregated = await self.aggregate_heating_status(yesterday)

        # Clean up old raw data
        temp_deleted, status_deleted = await self.cleanup_old_raw_data()

        result = {
            "date_aggregated": yesterday.isoformat(),
            "temp_hourly_created": temp_aggregated,
            "status_hourly_created": status_aggregated,
            "temp_raw_deleted": temp_deleted,
            "status_raw_deleted": status_deleted,
            "timestamp": datetime.now().isoformat()
        }

        logger.info(f"Daily maintenance complete: {result}")
        return result

    async def save_alert(self, alert_type: str, severity: str, title: str, message: str, data: dict = None) -> int:
        """Create a new alert"""
        import json
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO alerts (alert_type, severity, title, message, data, created_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?, 1)
                """,
                (alert_type, severity, title, message, json.dumps(data) if data else None, datetime.now())
            )
            await db.commit()
            return cursor.lastrowid

    async def get_active_alerts(self, limit: int = 20) -> List[Dict[str, Any]]:
        """Get active alerts"""
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM alerts
                WHERE is_active = 1
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (limit,)
            ) as cursor:
                rows = await cursor.fetchall()
                return [
                    {
                        **dict(row),
                        'data': json.loads(row['data']) if row['data'] else None
                    }
                    for row in rows
                ]

    async def get_all_alerts(self, limit: int = 100, include_inactive: bool = False) -> List[Dict[str, Any]]:
        """Get all alerts (optionally including inactive)"""
        import json
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            query = """
                SELECT * FROM alerts
                {}
                ORDER BY created_at DESC
                LIMIT ?
            """.format("WHERE is_active = 1" if not include_inactive else "")

            async with db.execute(query, (limit,)) as cursor:
                rows = await cursor.fetchall()
                return [
                    {
                        **dict(row),
                        'data': json.loads(row['data']) if row['data'] else None
                    }
                    for row in rows
                ]

    async def acknowledge_alert(self, alert_id: int) -> bool:
        """Mark alert as acknowledged"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE alerts SET acknowledged_at = ? WHERE id = ?",
                (datetime.now(), alert_id)
            )
            await db.commit()
            return True

    async def resolve_alert(self, alert_id: int) -> bool:
        """Mark alert as resolved and inactive"""
        async with aiosqlite.connect(self.db_path) as db:
            await db.execute(
                "UPDATE alerts SET resolved_at = ?, is_active = 0 WHERE id = ?",
                (datetime.now(), alert_id)
            )
            await db.commit()
            return True

    async def cleanup_old_alerts(self, days: int = 30) -> int:
        """Delete resolved alerts older than specified days"""
        cutoff = datetime.now() - timedelta(days=days)
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                "DELETE FROM alerts WHERE is_active = 0 AND resolved_at < ?",
                (cutoff,)
            )
            await db.commit()
            deleted = cursor.rowcount
            logger.info(f"Cleaned up {deleted} old resolved alerts")
            return deleted

    async def save_performance_metrics(self, metrics: Dict[str, Any]) -> int:
        """Save performance metrics for a period"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT OR REPLACE INTO performance_metrics
                (timestamp, period_start, period_end, cop, duty_cycle, cycles_per_hour,
                 ground_delta, heating_delta, total_kwh, total_cost, avg_power,
                 avg_indoor_temp, avg_outdoor_temp, heating_minutes, samples_count)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    metrics.get('timestamp', datetime.now()),
                    metrics['period_start'],
                    metrics['period_end'],
                    metrics.get('cop'),
                    metrics.get('duty_cycle'),
                    metrics.get('cycles_per_hour'),
                    metrics.get('ground_delta'),
                    metrics.get('heating_delta'),
                    metrics.get('total_kwh'),
                    metrics.get('total_cost'),
                    metrics.get('avg_power'),
                    metrics.get('avg_indoor_temp'),
                    metrics.get('avg_outdoor_temp'),
                    metrics.get('heating_minutes'),
                    metrics.get('samples_count', 0)
                )
            )
            await db.commit()
            return cursor.lastrowid

    async def get_performance_metrics(self, start: datetime, end: datetime) -> List[Dict[str, Any]]:
        """Get performance metrics for a time range"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM performance_metrics
                WHERE period_start >= ? AND period_end <= ?
                ORDER BY period_start ASC
                """,
                (start, end)
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def start_hot_water_event(self, start_time: datetime, start_temp: float) -> int:
        """Start tracking a new hot water heating event"""
        async with aiosqlite.connect(self.db_path) as db:
            cursor = await db.execute(
                """
                INSERT INTO hot_water_events (start_time, start_temp)
                VALUES (?, ?)
                """,
                (start_time, start_temp)
            )
            await db.commit()
            return cursor.lastrowid

    async def end_hot_water_event(self, event_id: int, end_time: datetime, peak_temp: float,
                                   end_temp: float, energy_kwh: float, estimated_cost: float,
                                   event_type: str, is_legionella: bool = False) -> bool:
        """Complete a hot water heating event with final data"""
        duration_minutes = 0
        async with aiosqlite.connect(self.db_path) as db:
            # Get start time to calculate duration
            async with db.execute(
                "SELECT start_time FROM hot_water_events WHERE id = ?",
                (event_id,)
            ) as cursor:
                row = await cursor.fetchone()
                if row:
                    start = datetime.fromisoformat(row[0])
                    duration_minutes = int((end_time - start).total_seconds() / 60)

            await db.execute(
                """
                UPDATE hot_water_events
                SET end_time = ?, peak_temp = ?, end_temp = ?, duration_minutes = ?,
                    energy_kwh = ?, estimated_cost = ?, event_type = ?, is_legionella_cycle = ?
                WHERE id = ?
                """,
                (end_time, peak_temp, end_temp, duration_minutes, energy_kwh,
                 estimated_cost, event_type, is_legionella, event_id)
            )
            await db.commit()
            return True

    async def get_hot_water_events(self, start: datetime, end: datetime) -> List[Dict[str, Any]]:
        """Get hot water heating events for a time range"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT * FROM hot_water_events
                WHERE start_time >= ? AND start_time < ?
                ORDER BY start_time DESC
                """,
                (start, end)
            ) as cursor:
                rows = await cursor.fetchall()
                return [dict(row) for row in rows]

    async def get_hot_water_stats(self, start: datetime, end: datetime) -> Dict[str, Any]:
        """Get hot water statistics for a time range"""
        async with aiosqlite.connect(self.db_path) as db:
            db.row_factory = aiosqlite.Row
            async with db.execute(
                """
                SELECT
                    COUNT(*) as event_count,
                    SUM(energy_kwh) as total_energy,
                    SUM(estimated_cost) as total_cost,
                    AVG(peak_temp) as avg_peak_temp,
                    AVG(duration_minutes) as avg_duration,
                    SUM(CASE WHEN is_legionella_cycle = 1 THEN 1 ELSE 0 END) as legionella_cycles
                FROM hot_water_events
                WHERE start_time >= ? AND start_time < ? AND end_time IS NOT NULL
                """,
                (start, end)
            ) as cursor:
                row = await cursor.fetchone()
                return dict(row) if row else {}


# Global database instance
_db_instance: Database = None


async def get_database() -> Database:
    """Get global database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = Database()
        await _db_instance.init_db()
    return _db_instance
