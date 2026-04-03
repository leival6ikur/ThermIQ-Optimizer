"""
Optimization Engine

Price-based heating schedule optimization for ThermIQ heat pump.
"""
import logging
from datetime import datetime, time
from typing import List, Optional, Dict, Any

from app.models import ElectricityPrice, HeatingSchedule
from app.config import get_config


logger = logging.getLogger(__name__)


class OptimizationEngine:
    """Optimizes heating schedule based on electricity prices"""

    def __init__(self):
        self.config = get_config()
        self.opt_config = self.config.optimization

        self.strategy = self.opt_config.get('strategy', 'balanced')
        self.target_temp = self.opt_config.get('target_temperature', 21.0)
        self.tolerance = self.opt_config.get('temperature_tolerance', 1.0)

        # Parse comfort hours
        comfort_start_str = self.opt_config.get('comfort_hours_start', '06:00')
        comfort_end_str = self.opt_config.get('comfort_hours_end', '23:00')

        self.comfort_start = self._parse_time(comfort_start_str)
        self.comfort_end = self._parse_time(comfort_end_str)

        logger.info(
            f"Optimization engine initialized: strategy={self.strategy}, "
            f"target={self.target_temp}°C, comfort={comfort_start_str}-{comfort_end_str}"
        )

    def _parse_time(self, time_str: str) -> time:
        """Parse time string (HH:MM) to datetime.time object"""
        try:
            # Handle both string and already-parsed time objects
            if isinstance(time_str, time):
                return time_str
            # Convert to string if it's not
            time_str = str(time_str)
            # Parse HH:MM format
            hour, minute = map(int, time_str.split(':'))
            return time(hour=hour, minute=minute)
        except Exception as e:
            logger.error(f"Error parsing time '{time_str}': {e}")
            # Return default time on error
            return time(hour=6, minute=0)

    def _parse_time(self, time_str: str) -> time:
        """Parse time string (HH:MM) to time object"""
        try:
            hour, minute = map(int, time_str.split(':'))
            return time(hour=hour, minute=minute)
        except:
            logger.warning(f"Invalid time format: {time_str}, using default")
            return time(hour=6, minute=0)

    def _is_comfort_hour(self, hour: int) -> bool:
        """Check if hour is within comfort hours"""
        hour_time = time(hour=hour)

        # Handle case where comfort period crosses midnight
        if self.comfort_start <= self.comfort_end:
            return self.comfort_start <= hour_time < self.comfort_end
        else:
            return hour_time >= self.comfort_start or hour_time < self.comfort_end

    def calculate_schedule(
        self,
        prices: List[ElectricityPrice],
        current_temp: Optional[float] = None
    ) -> List[HeatingSchedule]:
        """
        Calculate optimal heating schedule based on prices and strategy.

        Args:
            prices: List of hourly electricity prices (should be 24 hours)
            current_temp: Current indoor temperature (optional)

        Returns:
            List of 24 hourly heating decisions
        """
        if not prices:
            logger.warning("No prices provided, cannot calculate schedule")
            return []

        if len(prices) < 24:
            logger.warning(f"Only {len(prices)} prices provided, expected 24")

        # Sort prices by timestamp to ensure correct order
        prices = sorted(prices, key=lambda p: p.timestamp)

        # Normalize prices to 0-1 scale
        price_values = [p.price for p in prices]
        min_price = min(price_values)
        max_price = max(price_values)

        if max_price == min_price:
            # All prices are the same, heat according to comfort hours
            logger.info("All prices equal, heating based on comfort hours only")
            normalized_prices = [0.5] * len(prices)
        else:
            normalized_prices = [
                (p - min_price) / (max_price - min_price) for p in price_values
            ]

        # Determine price thresholds based on strategy
        thresholds = {
            'aggressive': 0.3,   # Heat in cheapest 30% of hours
            'balanced': 0.5,     # Heat in cheapest 50% of hours
            'conservative': 0.7  # Heat in cheapest 70% of hours
        }
        price_threshold = thresholds.get(self.strategy, 0.5)

        # Calculate schedule
        schedule = []
        for i, price in enumerate(prices):
            hour = price.timestamp.hour
            norm_price = normalized_prices[i]
            is_comfort = self._is_comfort_hour(hour)

            # Decide whether to heat
            should_heat = self._should_heat_hour(
                hour=hour,
                norm_price=norm_price,
                price_threshold=price_threshold,
                is_comfort=is_comfort,
                current_temp=current_temp
            )

            # Estimate cost (assuming 1.5 kWh per hour when heating)
            # This is a rough estimate - actual consumption varies
            consumption_kwh = 1.5 if should_heat else 0.1  # Standby consumption
            estimated_cost = (price.price / 1000) * consumption_kwh  # Convert EUR/MWh to EUR

            # Estimate expected temperature (simplified model)
            expected_temp = self._estimate_temperature(
                current_temp=current_temp,
                heating=should_heat,
                outdoor_temp=5.0  # We don't have this yet, use default
            )

            schedule.append(
                HeatingSchedule(
                    hour=hour,
                    should_heat=should_heat,
                    price=price.price,
                    estimated_cost=estimated_cost,
                    expected_temperature=expected_temp
                )
            )

        logger.info(
            f"Generated schedule: {sum(1 for s in schedule if s.should_heat)}/24 hours heating"
        )

        return schedule

    def _should_heat_hour(
        self,
        hour: int,
        norm_price: float,
        price_threshold: float,
        is_comfort: bool,
        current_temp: Optional[float]
    ) -> bool:
        """
        Decide whether to heat during this hour.

        Logic:
        1. If price is below threshold and comfort hour, always heat
        2. If price is above threshold but temperature is critical, heat anyway
        3. If price is below threshold outside comfort hours, heat (pre-heating)
        4. Otherwise, don't heat
        """

        # Critical temperature check
        if current_temp is not None and current_temp < (self.target_temp - self.tolerance - 1.0):
            # Temperature is critically low, always heat
            return True

        # Comfort hours logic
        if is_comfort:
            # During comfort hours, heat if price is reasonable
            # Or if temperature is below target
            if norm_price < price_threshold:
                return True
            if current_temp is not None and current_temp < self.target_temp:
                return True
            return False
        else:
            # Outside comfort hours, heat only during very cheap periods (pre-heating)
            # This allows thermal mass storage
            return norm_price < (price_threshold * 0.7)

    def _estimate_temperature(
        self,
        current_temp: Optional[float],
        heating: bool,
        outdoor_temp: float
    ) -> Optional[float]:
        """
        Estimate temperature after one hour (very simplified model).

        This is a placeholder - actual thermal modeling requires building characteristics.
        """
        if current_temp is None:
            return None

        building_config = self.config.building
        heat_loss_rate = building_config.get('estimated_heat_loss_per_degree', 0.5)
        heating_rate = building_config.get('heating_rate', 2.0)

        # Heat loss based on temperature difference
        temp_diff = current_temp - outdoor_temp
        heat_loss = temp_diff * (heat_loss_rate / 10)  # Scale down for per-hour

        if heating:
            # Heating on: gain temperature
            estimated = current_temp + (heating_rate - heat_loss)
        else:
            # Heating off: lose temperature
            estimated = current_temp - heat_loss

        # Clamp to reasonable range
        return max(10, min(30, estimated))

    def update_strategy(self, strategy: str):
        """Update optimization strategy"""
        if strategy in ['aggressive', 'balanced', 'conservative']:
            self.strategy = strategy
            logger.info(f"Strategy updated to: {strategy}")
        else:
            logger.warning(f"Invalid strategy: {strategy}")

    def update_target_temperature(self, temp: float):
        """Update target temperature"""
        if 10 <= temp <= 30:
            self.target_temp = temp
            logger.info(f"Target temperature updated to: {temp}°C")
        else:
            logger.warning(f"Invalid temperature: {temp}")

    def get_current_config(self) -> Dict[str, Any]:
        """Get current optimization configuration"""
        # Handle both time objects and strings for comfort hours
        if isinstance(self.comfort_start, time):
            comfort_start = self.comfort_start.strftime('%H:%M')
        else:
            comfort_start = str(self.comfort_start)

        if isinstance(self.comfort_end, time):
            comfort_end = self.comfort_end.strftime('%H:%M')
        else:
            comfort_end = str(self.comfort_end)

        return {
            'strategy': self.strategy,
            'target_temperature': self.target_temp,
            'temperature_tolerance': self.tolerance,
            'comfort_hours_start': comfort_start,
            'comfort_hours_end': comfort_end,
        }


# Global optimization engine instance
_optimization_engine: Optional[OptimizationEngine] = None


def get_optimization_engine() -> OptimizationEngine:
    """Get global optimization engine instance"""
    global _optimization_engine
    if _optimization_engine is None:
        _optimization_engine = OptimizationEngine()
    return _optimization_engine
