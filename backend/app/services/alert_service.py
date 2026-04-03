"""
Alert evaluation and management service
"""
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from app.database import Database
from app.models import AlertConfig

logger = logging.getLogger(__name__)


class AlertService:
    """Service for evaluating system conditions and generating alerts"""

    def __init__(self, db: Database):
        self.db = db
        self.config = AlertConfig()  # Default config

    def update_config(self, config: AlertConfig):
        """Update alert configuration"""
        self.config = config
        logger.info("Alert configuration updated")

    async def evaluate_all(self) -> List[int]:
        """
        Evaluate all alert conditions and create alerts as needed.
        Returns list of created alert IDs.
        """
        if not self.config.enabled:
            return []

        alert_ids = []

        # Run all evaluations
        alert_ids.extend(await self.evaluate_efficiency_alerts())
        alert_ids.extend(await self.evaluate_comfort_alerts())
        alert_ids.extend(await self.evaluate_price_opportunity_alerts())
        alert_ids.extend(await self.evaluate_maintenance_alerts())

        # Clean up if too many active alerts
        await self.cleanup_excessive_alerts()

        return alert_ids

    async def evaluate_efficiency_alerts(self) -> List[int]:
        """Evaluate heat pump efficiency and generate alerts if needed"""
        alert_ids = []

        try:
            # Get recent data for COP calculation
            now = datetime.now()
            check_period = now - timedelta(minutes=self.config.efficiency_check_interval_minutes)

            # Get temperature readings
            temps = await self.db.get_temperatures_since(check_period)
            if len(temps) < 10:  # Need minimum data
                return alert_ids

            # Get heat pump status
            statuses = await self.db.get_heat_pump_status_history(check_period, now)
            if len(statuses) < 10:
                return alert_ids

            # Calculate metrics
            metrics = self._calculate_efficiency_metrics(temps, statuses)

            # Check COP
            if metrics.get('cop') and metrics['cop'] < self.config.efficiency_cop_threshold:
                # Check if we already have an active alert for low COP
                active_alerts = await self.db.get_active_alerts()
                has_cop_alert = any(
                    a['alert_type'] == 'efficiency' and 'COP' in a['title']
                    for a in active_alerts
                )

                if not has_cop_alert:
                    alert_id = await self.db.save_alert(
                        alert_type='efficiency',
                        severity='warning',
                        title='Low Heat Pump Efficiency',
                        message=f"Heat pump COP is {metrics['cop']:.1f}, below threshold of {self.config.efficiency_cop_threshold:.1f}. Consider checking system performance.",
                        data={
                            'cop': metrics['cop'],
                            'threshold': self.config.efficiency_cop_threshold,
                            'avg_power': metrics.get('avg_power'),
                            'heating_delta': metrics.get('heating_delta')
                        }
                    )
                    alert_ids.append(alert_id)
                    logger.info(f"Created low COP alert: {alert_id}")

            # Check duty cycle
            if metrics.get('duty_cycle'):
                if metrics['duty_cycle'] > 80:  # Potentially undersized system
                    active_alerts = await self.db.get_active_alerts()
                    has_duty_alert = any(
                        a['alert_type'] == 'efficiency' and 'duty cycle' in a['title'].lower()
                        for a in active_alerts
                    )

                    if not has_duty_alert:
                        alert_id = await self.db.save_alert(
                            alert_type='efficiency',
                            severity='info',
                            title='High Duty Cycle',
                            message=f"Heat pump is running {metrics['duty_cycle']:.0f}% of the time. System may be undersized for current conditions.",
                            data={'duty_cycle': metrics['duty_cycle']}
                        )
                        alert_ids.append(alert_id)

        except Exception as e:
            logger.error(f"Error evaluating efficiency alerts: {e}")

        return alert_ids

    async def evaluate_comfort_alerts(self) -> List[int]:
        """Evaluate temperature comfort and generate alerts if needed"""
        alert_ids = []

        try:
            # Get recent temperature readings
            now = datetime.now()
            check_period = now - timedelta(minutes=self.config.comfort_duration_minutes)
            temps = await self.db.get_temperatures_since(check_period)

            if len(temps) < 5:
                return alert_ids

            # Check if indoor temperature has been consistently off target
            deviations = []
            for temp in temps:
                if temp.indoor and temp.target:
                    deviation = abs(temp.indoor - temp.target)
                    deviations.append(deviation)

            if deviations and len(deviations) >= 5:
                avg_deviation = sum(deviations) / len(deviations)

                if avg_deviation > self.config.comfort_deviation_threshold:
                    # Check for existing comfort alert
                    active_alerts = await self.db.get_active_alerts()
                    has_comfort_alert = any(
                        a['alert_type'] == 'comfort'
                        for a in active_alerts
                    )

                    if not has_comfort_alert:
                        latest_temp = temps[-1]
                        direction = "above" if latest_temp.indoor > latest_temp.target else "below"

                        alert_id = await self.db.save_alert(
                            alert_type='comfort',
                            severity='warning',
                            title='Temperature Deviation',
                            message=f"Indoor temperature has been {avg_deviation:.1f}°C {direction} target for {self.config.comfort_duration_minutes} minutes.",
                            data={
                                'current_temp': latest_temp.indoor,
                                'target_temp': latest_temp.target,
                                'avg_deviation': avg_deviation,
                                'duration_minutes': self.config.comfort_duration_minutes
                            }
                        )
                        alert_ids.append(alert_id)
                        logger.info(f"Created comfort alert: {alert_id}")

        except Exception as e:
            logger.error(f"Error evaluating comfort alerts: {e}")

        return alert_ids

    async def evaluate_price_opportunity_alerts(self) -> List[int]:
        """Evaluate electricity price opportunities"""
        alert_ids = []

        try:
            now = datetime.now()
            # Get today's and tomorrow's prices
            start = datetime(now.year, now.month, now.day, 0, 0, 0)
            end = start + timedelta(days=2)

            prices = await self.db.get_electricity_prices(start, end)

            if len(prices) < 24:  # Need at least one day
                return alert_ids

            # Calculate average price
            avg_price = sum(p.price for p in prices) / len(prices)

            # Find upcoming cheap hours (next 6 hours)
            upcoming_end = now + timedelta(hours=6)
            upcoming_prices = [p for p in prices if now <= p.timestamp < upcoming_end]

            for price in upcoming_prices:
                price_below_avg_pct = ((avg_price - price.price) / avg_price) * 100

                if price_below_avg_pct >= self.config.price_opportunity_threshold_percent:
                    # Check if we already have an alert for this hour
                    active_alerts = await self.db.get_active_alerts()
                    hour_str = price.timestamp.strftime('%H:00')
                    has_price_alert = any(
                        a['alert_type'] == 'price_opportunity' and hour_str in a.get('message', '')
                        for a in active_alerts
                    )

                    if not has_price_alert:
                        alert_id = await self.db.save_alert(
                            alert_type='price_opportunity',
                            severity='info',
                            title='Cheap Electricity Coming Up',
                            message=f"Electricity price at {hour_str} will be {price_below_avg_pct:.0f}% below average ({price.price:.1f} vs {avg_price:.1f} EUR/MWh).",
                            data={
                                'hour': hour_str,
                                'price': price.price,
                                'avg_price': avg_price,
                                'savings_percent': price_below_avg_pct
                            }
                        )
                        alert_ids.append(alert_id)
                        logger.info(f"Created price opportunity alert: {alert_id}")

        except Exception as e:
            logger.error(f"Error evaluating price opportunity alerts: {e}")

        return alert_ids

    async def evaluate_maintenance_alerts(self) -> List[int]:
        """Evaluate system health and maintenance needs"""
        alert_ids = []

        try:
            # Check for ground loop efficiency (brine temperature delta)
            now = datetime.now()
            check_period = now - timedelta(hours=1)
            temps = await self.db.get_temperatures_since(check_period)

            if len(temps) < 10:
                return alert_ids

            # Calculate average ground extraction
            ground_deltas = []
            for temp in temps:
                if temp.brine_in and temp.brine_out:
                    delta = temp.brine_in - temp.brine_out
                    ground_deltas.append(delta)

            if ground_deltas:
                avg_ground_delta = sum(ground_deltas) / len(ground_deltas)

                # Alert if ground extraction is very low
                if avg_ground_delta < 2.0:
                    active_alerts = await self.db.get_active_alerts()
                    has_ground_alert = any(
                        a['alert_type'] == 'maintenance' and 'ground' in a['title'].lower()
                        for a in active_alerts
                    )

                    if not has_ground_alert:
                        alert_id = await self.db.save_alert(
                            alert_type='maintenance',
                            severity='warning',
                            title='Low Ground Heat Extraction',
                            message=f"Ground loop temperature delta is only {avg_ground_delta:.1f}°C. This may indicate poor ground loop performance or circulation issues.",
                            data={'ground_delta': avg_ground_delta}
                        )
                        alert_ids.append(alert_id)
                        logger.info(f"Created maintenance alert: {alert_id}")

        except Exception as e:
            logger.error(f"Error evaluating maintenance alerts: {e}")

        return alert_ids

    def _calculate_efficiency_metrics(self, temps: List, statuses: List) -> Dict[str, float]:
        """Calculate efficiency metrics from data"""
        metrics = {}

        try:
            # Calculate average temperatures
            supply_temps = [t.supply for t in temps if t.supply]
            return_temps = [t.return_temp for t in temps if t.return_temp]
            brine_in = [t.brine_in for t in temps if t.brine_in]
            brine_out = [t.brine_out for t in temps if t.brine_out]

            if supply_temps and return_temps:
                metrics['heating_delta'] = sum(supply_temps) / len(supply_temps) - sum(return_temps) / len(return_temps)

            if brine_in and brine_out:
                metrics['ground_delta'] = sum(brine_in) / len(brine_in) - sum(brine_out) / len(brine_out)

            # Calculate average power
            powers = [s['power'] for s in statuses if s.get('power')]
            if powers:
                metrics['avg_power'] = sum(powers) / len(powers)

            # Calculate duty cycle
            heating_count = sum(1 for s in statuses if s.get('heating'))
            metrics['duty_cycle'] = (heating_count / len(statuses)) * 100 if statuses else 0

            # Simplified COP calculation
            if metrics.get('heating_delta') and metrics.get('avg_power') and metrics['avg_power'] > 100:
                # This is a simplified relative COP - real COP needs flow rate
                metrics['cop'] = (metrics['heating_delta'] * 100) / metrics['avg_power']

        except Exception as e:
            logger.error(f"Error calculating efficiency metrics: {e}")

        return metrics

    async def cleanup_excessive_alerts(self):
        """Remove oldest active alerts if exceeding max count"""
        try:
            active_alerts = await self.db.get_active_alerts(limit=self.config.max_active_alerts + 10)

            if len(active_alerts) > self.config.max_active_alerts:
                # Resolve oldest low-priority alerts
                to_resolve = sorted(
                    [a for a in active_alerts if a['severity'] == 'info'],
                    key=lambda x: x['created_at']
                )[:len(active_alerts) - self.config.max_active_alerts]

                for alert in to_resolve:
                    await self.db.resolve_alert(alert['id'])

                logger.info(f"Auto-resolved {len(to_resolve)} old info alerts")

        except Exception as e:
            logger.error(f"Error cleaning up excessive alerts: {e}")
