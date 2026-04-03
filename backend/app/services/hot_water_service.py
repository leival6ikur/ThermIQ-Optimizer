"""
Hot water intelligence service for detecting and optimizing hot water heating
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from app.database import Database

logger = logging.getLogger(__name__)


class HotWaterService:
    """Service for hot water heating detection and optimization"""

    def __init__(self, db: Database):
        self.db = db
        self._active_event_id: Optional[int] = None
        self._event_start_time: Optional[datetime] = None
        self._event_start_temp: float = 0
        self._event_peak_temp: float = 0

    async def process_temperature_reading(self, timestamp: datetime, hot_water_temp: float, power: float = 0):
        """
        Process a hot water temperature reading and detect heating events.

        Args:
            timestamp: Reading timestamp
            hot_water_temp: Current hot water temperature
            power: Current power consumption (watts)
        """
        # Define thresholds
        HEATING_START_THRESHOLD = 45.0  # Start tracking when temp rises above 45°C
        HEATING_TEMP_RISE_RATE = 0.5  # °C per minute minimum rise to be considered heating
        LEGIONELLA_THRESHOLD = 60.0  # Legionella protection temperature
        HEATING_COMPLETE_THRESHOLD = 2.0  # Minutes without significant rise = event complete

        try:
            # Check if we have an active heating event
            if self._active_event_id is None:
                # Look for start of heating event
                if hot_water_temp >= HEATING_START_THRESHOLD:
                    # Start new event
                    self._active_event_id = await self.db.start_hot_water_event(timestamp, hot_water_temp)
                    self._event_start_time = timestamp
                    self._event_start_temp = hot_water_temp
                    self._event_peak_temp = hot_water_temp
                    logger.info(f"Started hot water event {self._active_event_id} at {hot_water_temp:.1f}°C")

            else:
                # Active event - track peak and detect end
                if hot_water_temp > self._event_peak_temp:
                    self._event_peak_temp = hot_water_temp

                # Check if heating has completed
                time_elapsed = (timestamp - self._event_start_time).total_seconds() / 60  # minutes
                temp_rise = hot_water_temp - self._event_start_temp

                # Event is complete if:
                # 1. Temperature has dropped significantly from peak (cooling down)
                # 2. Or we've been heating for a long time (>120 min) with minimal rise
                if (
                    (hot_water_temp < self._event_peak_temp - 3.0) or
                    (time_elapsed > 120 and temp_rise < 5.0)
                ):
                    # Complete the event
                    await self._complete_hot_water_event(
                        timestamp,
                        hot_water_temp,
                        power
                    )

        except Exception as e:
            logger.error(f"Error processing hot water reading: {e}")

    async def _complete_hot_water_event(self, end_time: datetime, end_temp: float, avg_power: float):
        """Complete an active hot water heating event"""
        if self._active_event_id is None:
            return

        # Calculate duration and energy
        duration_minutes = (end_time - self._event_start_time).total_seconds() / 60
        energy_kwh = (avg_power / 1000) * (duration_minutes / 60) if avg_power > 0 else 0

        # Estimate cost (simplified - would use real price data)
        estimated_cost = energy_kwh * 0.15  # €0.15/kWh average

        # Determine event type
        is_legionella = self._event_peak_temp >= 60.0
        if is_legionella:
            event_type = "legionella_protection"
        elif self._event_peak_temp >= 55.0:
            event_type = "full_heating"
        else:
            event_type = "maintenance_heating"

        # Save to database
        await self.db.end_hot_water_event(
            event_id=self._active_event_id,
            end_time=end_time,
            peak_temp=self._event_peak_temp,
            end_temp=end_temp,
            energy_kwh=energy_kwh,
            estimated_cost=estimated_cost,
            event_type=event_type,
            is_legionella=is_legionella
        )

        logger.info(f"Completed hot water event {self._active_event_id}: "
                   f"{duration_minutes:.0f}min, peak {self._event_peak_temp:.1f}°C, "
                   f"{energy_kwh:.2f}kWh, type={event_type}")

        # Reset tracking
        self._active_event_id = None
        self._event_start_time = None
        self._event_start_temp = 0
        self._event_peak_temp = 0

    async def get_daily_hot_water_schedule(self, prices: List[Any]) -> List[Dict[str, Any]]:
        """
        Generate optimal hot water heating schedule based on electricity prices.

        Args:
            prices: List of electricity prices for the day

        Returns:
            List of hot water heating schedule items
        """
        schedule = []

        if not prices:
            return schedule

        # Sort prices to find cheapest hours
        price_hours = [(p.timestamp.hour, p.price) for p in prices]
        price_hours.sort(key=lambda x: x[1])  # Sort by price

        # Hot water heating strategy:
        # 1. Heat once in morning (before 8 AM if possible, during cheap hour)
        # 2. Heat once in evening (before 6 PM if possible, during cheap hour)
        # 3. Weekly legionella protection (60°C, during cheapest hour)

        morning_hours = [h for h, _ in price_hours if 4 <= h <= 8]
        evening_hours = [h for h, _ in price_hours if 16 <= h <= 20]

        # Pick cheapest morning hour
        if morning_hours:
            morning_hour = morning_hours[0]
            schedule.append({
                "hour": morning_hour,
                "action": "heat_hot_water",
                "target_temp": 50,
                "reason": "morning_demand",
                "priority": "high"
            })

        # Pick cheapest evening hour
        if evening_hours:
            evening_hour = evening_hours[0]
            schedule.append({
                "hour": evening_hour,
                "action": "heat_hot_water",
                "target_temp": 50,
                "reason": "evening_demand",
                "priority": "high"
            })

        # Check if today is legionella day (e.g., every Sunday)
        today = datetime.now()
        if today.weekday() == 6:  # Sunday
            # Pick absolute cheapest hour for legionella
            cheapest_hour = price_hours[0][0]
            schedule.append({
                "hour": cheapest_hour,
                "action": "heat_hot_water",
                "target_temp": 60,
                "reason": "legionella_protection",
                "priority": "critical"
            })

        return schedule

    async def get_hot_water_insights(self, days: int = 7) -> Dict[str, Any]:
        """
        Get hot water usage insights for the past N days.

        Args:
            days: Number of days to analyze

        Returns:
            Dictionary with hot water insights
        """
        end = datetime.now()
        start = end - timedelta(days=days)

        # Get events and stats
        events = await self.db.get_hot_water_events(start, end)
        stats = await self.db.get_hot_water_stats(start, end)

        # Calculate daily average
        if stats.get('total_energy'):
            daily_avg_kwh = stats['total_energy'] / days
            daily_avg_cost = stats['total_cost'] / days
        else:
            daily_avg_kwh = 0
            daily_avg_cost = 0

        # Analyze patterns
        heating_by_hour = {}
        for event in events:
            if event['start_time']:
                hour = datetime.fromisoformat(event['start_time']).hour
                heating_by_hour[hour] = heating_by_hour.get(hour, 0) + 1

        peak_demand_hours = sorted(heating_by_hour.items(), key=lambda x: x[1], reverse=True)[:3]

        return {
            "period_days": days,
            "total_events": stats.get('event_count', 0),
            "total_energy_kwh": stats.get('total_energy', 0),
            "total_cost": stats.get('total_cost', 0),
            "daily_avg_kwh": daily_avg_kwh,
            "daily_avg_cost": daily_avg_cost,
            "avg_peak_temp": stats.get('avg_peak_temp', 0),
            "avg_duration_minutes": stats.get('avg_duration', 0),
            "legionella_cycles": stats.get('legionella_cycles', 0),
            "peak_demand_hours": [hour for hour, _ in peak_demand_hours],
            "events": events[:10]  # Last 10 events
        }


# Global instance
_hot_water_service: Optional[HotWaterService] = None


async def get_hot_water_service() -> HotWaterService:
    """Get or create global hot water service instance"""
    global _hot_water_service

    if _hot_water_service is None:
        from app.database import get_database
        db = await get_database()
        _hot_water_service = HotWaterService(db)
        logger.info("Hot water service initialized")

    return _hot_water_service
