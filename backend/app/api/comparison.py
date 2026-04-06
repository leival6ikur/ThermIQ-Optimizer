"""
Comparison API endpoints for week-over-week, month-over-month analysis
"""
import logging
from datetime import datetime, timedelta, date
from typing import Optional
from fastapi import APIRouter, HTTPException, Request

from app.database import get_database
from app.middleware.rate_limit import data_limit

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/compare", tags=["comparison"])


@router.get("/week")
@data_limit
async def compare_weeks(
    request: Request,
    week1: Optional[str] = None,
    week2: Optional[str] = None
):
    """
    Compare two weeks of data.

    Args:
        week1: ISO week format YYYY-WW (e.g., "2026-14"), defaults to current week
        week2: ISO week format YYYY-WW, defaults to previous week

    Returns:
        Comparison data including energy, cost, comfort, temperatures
    """
    try:
        db = await get_database()

        # Parse weeks
        if week1:
            year1, week_num1 = map(int, week1.split('-W'))
            start1 = datetime.strptime(f'{year1}-W{week_num1}-1', '%Y-W%W-%w')
        else:
            # Current week
            now = datetime.now()
            start1 = now - timedelta(days=now.weekday())
            start1 = start1.replace(hour=0, minute=0, second=0, microsecond=0)

        if week2:
            year2, week_num2 = map(int, week2.split('-W'))
            start2 = datetime.strptime(f'{year2}-W{week_num2}-1', '%Y-W%W-%w')
        else:
            # Previous week
            start2 = start1 - timedelta(days=7)

        end1 = start1 + timedelta(days=7)
        end2 = start2 + timedelta(days=7)

        # Get data for both weeks
        week1_data = await _get_week_stats(db, start1, end1)
        week2_data = await _get_week_stats(db, start2, end2)

        # Calculate changes
        energy_change = ((week1_data['energy_kwh'] - week2_data['energy_kwh']) / week2_data['energy_kwh'] * 100) if week2_data['energy_kwh'] > 0 else 0
        cost_change = ((week1_data['cost'] - week2_data['cost']) / week2_data['cost'] * 100) if week2_data['cost'] > 0 else 0
        comfort_change = week1_data['comfort_score'] - week2_data['comfort_score']
        temp_change = week1_data['avg_indoor_temp'] - week2_data['avg_indoor_temp']

        return {
            'week1': {
                'start': start1.isoformat(),
                'end': end1.isoformat(),
                'label': start1.strftime('%b %d') + ' - ' + end1.strftime('%b %d, %Y'),
                **week1_data
            },
            'week2': {
                'start': start2.isoformat(),
                'end': end2.isoformat(),
                'label': start2.strftime('%b %d') + ' - ' + end2.strftime('%b %d, %Y'),
                **week2_data
            },
            'changes': {
                'energy_change_percent': round(energy_change, 1),
                'cost_change_percent': round(cost_change, 1),
                'comfort_change_points': round(comfort_change, 1),
                'temp_change_celsius': round(temp_change, 2),
                'energy_improved': energy_change < 0,
                'cost_improved': cost_change < 0,
                'comfort_improved': comfort_change > 0,
            }
        }

    except Exception as e:
        logger.error(f"Error comparing weeks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/month")
async def compare_months(
    month1: Optional[str] = None,
    month2: Optional[str] = None
):
    """
    Compare two months of data.

    Args:
        month1: Format YYYY-MM (e.g., "2026-04"), defaults to current month
        month2: Format YYYY-MM, defaults to previous month

    Returns:
        Comparison data including energy, cost, comfort, temperatures
    """
    try:
        db = await get_database()

        # Parse months
        if month1:
            start1 = datetime.strptime(month1 + '-01', '%Y-%m-%d')
        else:
            # Current month
            now = datetime.now()
            start1 = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        if month2:
            start2 = datetime.strptime(month2 + '-01', '%Y-%m-%d')
        else:
            # Previous month
            if start1.month == 1:
                start2 = start1.replace(year=start1.year - 1, month=12)
            else:
                start2 = start1.replace(month=start1.month - 1)

        # Calculate end dates (first day of next month)
        if start1.month == 12:
            end1 = start1.replace(year=start1.year + 1, month=1)
        else:
            end1 = start1.replace(month=start1.month + 1)

        if start2.month == 12:
            end2 = start2.replace(year=start2.year + 1, month=1)
        else:
            end2 = start2.replace(month=start2.month + 1)

        # Get data for both months
        month1_data = await _get_period_stats(db, start1, end1)
        month2_data = await _get_period_stats(db, start2, end2)

        # Calculate changes
        energy_change = ((month1_data['energy_kwh'] - month2_data['energy_kwh']) / month2_data['energy_kwh'] * 100) if month2_data['energy_kwh'] > 0 else 0
        cost_change = ((month1_data['cost'] - month2_data['cost']) / month2_data['cost'] * 100) if month2_data['cost'] > 0 else 0
        comfort_change = month1_data['comfort_score'] - month2_data['comfort_score']
        temp_change = month1_data['avg_indoor_temp'] - month2_data['avg_indoor_temp']

        return {
            'month1': {
                'start': start1.isoformat(),
                'end': end1.isoformat(),
                'label': start1.strftime('%B %Y'),
                **month1_data
            },
            'month2': {
                'start': start2.isoformat(),
                'end': end2.isoformat(),
                'label': start2.strftime('%B %Y'),
                **month2_data
            },
            'changes': {
                'energy_change_percent': round(energy_change, 1),
                'cost_change_percent': round(cost_change, 1),
                'comfort_change_points': round(comfort_change, 1),
                'temp_change_celsius': round(temp_change, 2),
                'energy_improved': energy_change < 0,
                'cost_improved': cost_change < 0,
                'comfort_improved': comfort_change > 0,
            }
        }

    except Exception as e:
        logger.error(f"Error comparing months: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/daily")
async def get_daily_breakdown(days: int = 7):
    """
    Get daily breakdown for the last N days.

    Args:
        days: Number of days to retrieve (default 7, max 30)

    Returns:
        Daily stats for charting week-over-week comparisons
    """
    try:
        if days > 30:
            raise HTTPException(status_code=400, detail="Maximum 30 days")

        db = await get_database()
        end_date = datetime.now().replace(hour=23, minute=59, second=59)
        start_date = end_date - timedelta(days=days)

        daily_stats = []
        current_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)

        while current_date < end_date:
            next_date = current_date + timedelta(days=1)
            stats = await _get_period_stats(db, current_date, next_date)

            daily_stats.append({
                'date': current_date.strftime('%Y-%m-%d'),
                'day_name': current_date.strftime('%A'),
                **stats
            })

            current_date = next_date

        return {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'days_count': len(daily_stats),
            'daily_data': daily_stats
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting daily breakdown: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _get_week_stats(db, start: datetime, end: datetime) -> dict:
    """Get statistics for a week period"""
    return await _get_period_stats(db, start, end)


async def _get_period_stats(db, start: datetime, end: datetime) -> dict:
    """
    Calculate statistics for any time period.

    Returns:
        Dictionary with energy, cost, comfort, temperature stats
    """
    import aiosqlite

    async with aiosqlite.connect(db.db_path) as conn:
        conn.row_factory = aiosqlite.Row

        # Get temperature readings and power consumption
        async with conn.execute(
            """
            SELECT
                COUNT(*) as readings_count,
                AVG(indoor) as avg_indoor,
                AVG(outdoor) as avg_outdoor,
                AVG(target) as avg_target,
                AVG(power) as avg_power,
                SUM(CASE WHEN heating = 1 THEN 1 ELSE 0 END) as heating_minutes
            FROM temperature_readings
            WHERE timestamp >= ? AND timestamp < ?
            """,
            (start, end)
        ) as cursor:
            row = await cursor.fetchone()

            readings_count = row['readings_count'] or 0
            avg_indoor = row['avg_indoor'] or 0
            avg_outdoor = row['avg_outdoor'] or 0
            avg_target = row['avg_target'] or 21.0
            avg_power = row['avg_power'] or 0
            heating_minutes = row['heating_minutes'] or 0

        # Calculate energy consumption (kWh)
        # Power is in watts, readings every minute
        energy_kwh = (avg_power * readings_count / 60) / 1000 if readings_count > 0 else 0

        # Get electricity prices for cost calculation
        async with conn.execute(
            """
            SELECT AVG(price) as avg_price
            FROM electricity_prices
            WHERE timestamp >= ? AND timestamp < ?
            """,
            (start, end)
        ) as cursor:
            row = await cursor.fetchone()
            avg_price_eur_mwh = row['avg_price'] if row and row['avg_price'] else 80.0

        # Convert price from EUR/MWh to EUR/kWh
        avg_price_eur_kwh = avg_price_eur_mwh / 1000

        # Calculate cost
        cost_eur = energy_kwh * avg_price_eur_kwh

        # Calculate comfort score (% time within ±1°C of target)
        async with conn.execute(
            """
            SELECT
                COUNT(*) as comfort_readings
            FROM temperature_readings
            WHERE timestamp >= ? AND timestamp < ?
                AND ABS(indoor - target) <= 1.0
            """,
            (start, end)
        ) as cursor:
            row = await cursor.fetchone()
            comfort_readings = row['comfort_readings'] or 0

        comfort_score = (comfort_readings / readings_count * 100) if readings_count > 0 else 0

        # Calculate duty cycle
        duty_cycle = (heating_minutes / readings_count * 100) if readings_count > 0 else 0

        # Get hot water events count
        async with conn.execute(
            """
            SELECT COUNT(*) as hw_events
            FROM hot_water_events
            WHERE start_time >= ? AND start_time < ?
            """,
            (start, end)
        ) as cursor:
            row = await cursor.fetchone()
            hw_events = row['hw_events'] or 0

    return {
        'energy_kwh': round(energy_kwh, 2),
        'cost': round(cost_eur, 2),
        'avg_indoor_temp': round(avg_indoor, 1),
        'avg_outdoor_temp': round(avg_outdoor, 1),
        'avg_target_temp': round(avg_target, 1),
        'comfort_score': round(comfort_score, 1),
        'duty_cycle': round(duty_cycle, 1),
        'heating_hours': round(heating_minutes / 60, 1),
        'hot_water_events': hw_events,
        'avg_price_eur_kwh': round(avg_price_eur_kwh, 4)
    }
