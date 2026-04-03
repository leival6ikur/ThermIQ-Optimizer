"""
API Routes for ThermIQ Backend
"""
import logging
from datetime import datetime, timedelta, date
from typing import List, Optional

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel

from app.models import (
    SystemStatus,
    ManualOverride,
    OptimizationConfig,
    DailyPriceSummary,
    ElectricityPrice,
    HeatingSchedule,
    Alert,
    AlertConfig,
)
from app.services.mqtt_manager import get_mqtt_manager
from app.services.nord_pool_client import get_nordpool_client
from app.services.optimization_engine import get_optimization_engine
from app.services.weather_service import get_weather_service
from app.database import get_database
from app.config import get_config


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["api"])


# Pydantic models for VAT configuration
class VATConfig(BaseModel):
    """VAT configuration for cost display"""
    vat_enabled: bool
    vat_rate: float  # percentage (0-100)


@router.get("/status", response_model=SystemStatus)
async def get_status():
    """Get current system status"""
    try:
        mqtt = get_mqtt_manager()
        db = await get_database()

        # Get latest readings
        latest_temp = mqtt.get_latest_temperature()
        latest_status = mqtt.get_latest_status()

        # Get last Nord Pool fetch time
        today = date.today()
        prices_today = await db.get_electricity_prices(
            datetime.combine(today, datetime.min.time()),
            datetime.combine(today + timedelta(days=1), datetime.min.time())
        )

        nordpool_last_fetch = None
        if prices_today:
            # Get creation time of most recent price
            nordpool_last_fetch = datetime.now()  # Placeholder

        return SystemStatus(
            mqtt_connected=mqtt.is_connected(),
            last_device_update=mqtt.last_message_time,
            nordpool_last_fetch=nordpool_last_fetch,
            current_temperature=latest_temp,
            heat_pump_status=latest_status,
            optimization_active=True,
        )

    except Exception as e:
        logger.error(f"Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices", response_model=DailyPriceSummary)
async def get_prices(target_date: Optional[str] = None):
    """
    Get electricity prices for specified date.

    Args:
        target_date: Date in format YYYY-MM-DD (defaults to today)
    """
    try:
        db = await get_database()

        if target_date:
            try:
                target = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            target = date.today()

        # Get prices from database
        start = datetime.combine(target, datetime.min.time())
        end = start + timedelta(days=1)

        prices = await db.get_electricity_prices(start, end)

        if not prices:
            raise HTTPException(status_code=404, detail=f"No prices found for {target}")

        # Deduplicate by hour (in case DB has duplicates)
        seen_hours = {}
        for p in prices:
            hour = p.timestamp.hour
            if hour not in seen_hours:
                seen_hours[hour] = p
        prices = list(seen_hours.values())

        # Apply VAT for display if enabled
        from app.config import get_config as get_cfg_price
        config = get_cfg_price()
        display_prices = []
        for p in prices:
            display_price = ElectricityPrice(
                timestamp=p.timestamp,
                price=config.apply_vat_to_price(p.price),
                currency=p.currency,
                region=p.region
            )
            display_prices.append(display_price)

        # Calculate summary
        price_values = [p.price for p in display_prices]
        return DailyPriceSummary(
            date=target.isoformat(),
            min_price=min(price_values),
            max_price=max(price_values),
            average_price=sum(price_values) / len(price_values),
            prices=display_prices,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/prices/today-tomorrow")
async def get_today_tomorrow_prices():
    """Get prices for today and tomorrow (if available)"""
    try:
        db = await get_database()

        today = date.today()
        tomorrow = today + timedelta(days=1)

        # Get today's prices
        today_start = datetime.combine(today, datetime.min.time())
        today_end = today_start + timedelta(days=1)
        prices_today = await db.get_electricity_prices(today_start, today_end)

        # Get tomorrow's prices
        tomorrow_start = datetime.combine(tomorrow, datetime.min.time())
        tomorrow_end = tomorrow_start + timedelta(days=1)
        prices_tomorrow = await db.get_electricity_prices(tomorrow_start, tomorrow_end)

        # Deduplicate by hour (in case DB has duplicates)
        def dedupe_by_hour(prices):
            seen = {}
            for p in prices:
                hour = p.timestamp.hour
                if hour not in seen:
                    seen[hour] = p
            return list(seen.values())

        prices_today_deduped = dedupe_by_hour(prices_today)
        prices_tomorrow_deduped = dedupe_by_hour(prices_tomorrow)

        return {
            "today": {
                "date": today.isoformat(),
                "prices": [{"hour": p.timestamp.hour, "price": p.price} for p in prices_today_deduped]
            },
            "tomorrow": {
                "date": tomorrow.isoformat(),
                "prices": [{"hour": p.timestamp.hour, "price": p.price} for p in prices_tomorrow_deduped]
            }
        }

    except Exception as e:
        logger.error(f"Error getting today/tomorrow prices: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule", response_model=List[HeatingSchedule])
async def get_schedule(target_date: Optional[str] = None):
    """
    Get heating schedule for specified date.

    Args:
        target_date: Date in format YYYY-MM-DD (defaults to today)
    """
    try:
        db = await get_database()

        if target_date:
            try:
                target = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            target = date.today()

        schedule = await db.get_heating_schedule(target.isoformat())

        if not schedule:
            raise HTTPException(status_code=404, detail=f"No schedule found for {target}")

        return schedule

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schedule/past")
async def get_past_schedule():
    """
    Get past 24h schedule with actual heating status.

    Returns schedule for the past 24 hours showing:
    - Planned heating (should_heat from schedule)
    - Actual heating (was pump actually running)
    - Prices and costs
    """
    try:
        db = await get_database()
        from app.config import get_config as get_cfg_past
        config = get_cfg_past()
        now = datetime.now()
        past_24h = now - timedelta(hours=24)

        # Get historical heating status
        status_history = await db.get_heat_pump_status_history(past_24h, now)

        # Build hourly aggregation
        result = []
        for i in range(24):
            hour_start = past_24h + timedelta(hours=i)
            hour_end = hour_start + timedelta(hours=1)
            hour_num = hour_start.hour
            hour_date = hour_start.date()

            # Get schedule for this hour
            schedule_data = await db.get_heating_schedule(hour_date.isoformat())
            schedule_item = next((s for s in schedule_data if s.hour == hour_num), None) if schedule_data else None

            # Get prices for this hour
            prices = await db.get_electricity_prices(hour_start, hour_end)
            price = prices[0].price if prices else 0

            # Determine if pump was actually heating during this hour
            hour_statuses = [s for s in status_history if hour_start <= datetime.fromisoformat(s['timestamp']) < hour_end]
            was_heating = any(s['heating'] for s in hour_statuses) if hour_statuses else False

            # Calculate heating minutes and average power during this hour
            heating_statuses = [s for s in hour_statuses if s['heating']]
            heating_minutes = len(heating_statuses)  # Each status = 1 minute
            avg_power = sum(s.get('power', 0) for s in heating_statuses) / len(heating_statuses) if heating_statuses else 0

            # Apply VAT for display
            display_price = config.apply_vat_to_price(price)
            estimated_cost = schedule_item.estimated_cost if schedule_item else price * avg_power / 1000
            display_cost = config.apply_vat_to_price(estimated_cost)

            result.append({
                "timestamp": hour_start.isoformat(),
                "hour": hour_num,
                "date": hour_date.isoformat(),
                "should_heat": schedule_item.should_heat if schedule_item else None,
                "was_heating": was_heating,
                "heating_minutes": heating_minutes,
                "price": display_price,
                "estimated_cost": display_cost,
                "avg_power": round(avg_power, 1) if avg_power else None,
            })

        return result

    except Exception as e:
        logger.error(f"Error getting past schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/override")
async def manual_override(override: ManualOverride):
    """
    Manually override temperature setpoint.

    Args:
        override: Temperature and optional duration
    """
    try:
        mqtt = get_mqtt_manager()

        if not mqtt.is_connected():
            raise HTTPException(status_code=503, detail="MQTT not connected")

        # Publish setpoint command
        success = mqtt.publish_setpoint(override.target_temperature)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to publish setpoint")

        return {
            "success": True,
            "message": f"Setpoint changed to {override.target_temperature}°C",
            "duration_minutes": override.duration_minutes
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config", response_model=OptimizationConfig)
async def get_optimization_config():
    """Get current optimization configuration"""
    try:
        engine = get_optimization_engine()
        config = engine.get_current_config()

        return OptimizationConfig(**config)

    except Exception as e:
        logger.error(f"Error getting config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/config/vat", response_model=VATConfig)
async def get_vat_config():
    """Get current VAT configuration"""
    try:
        config = get_config()
        costs = config.costs

        return VATConfig(
            vat_enabled=costs.get('vat_enabled', False),
            vat_rate=costs.get('vat_rate', 0.0)
        )

    except Exception as e:
        logger.error(f"Error getting VAT config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config/vat")
async def update_vat_config(vat_config: VATConfig):
    """Update VAT configuration"""
    try:
        # Validate VAT rate
        if vat_config.vat_rate < 0 or vat_config.vat_rate > 100:
            raise HTTPException(status_code=400, detail="VAT rate must be between 0 and 100")

        config = get_config()
        config.set('costs.vat_enabled', vat_config.vat_enabled)
        config.set('costs.vat_rate', vat_config.vat_rate)
        config.save()

        return {
            "success": True,
            "message": "VAT configuration updated",
            "vat_config": {
                "vat_enabled": vat_config.vat_enabled,
                "vat_rate": vat_config.vat_rate
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating VAT config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/prices/refresh")
async def refresh_prices(background_tasks: BackgroundTasks):
    """Manually trigger price refresh"""
    try:
        background_tasks.add_task(fetch_and_store_prices)

        return {
            "success": True,
            "message": "Price refresh triggered"
        }

    except Exception as e:
        logger.error(f"Error triggering price refresh: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/temperatures/history")
async def get_temperature_history(hours: int = 24):
    """
    Get temperature history for specified number of hours.

    Args:
        hours: Number of hours to fetch (default 24, max 168)
    """
    try:
        if hours > 168:
            raise HTTPException(status_code=400, detail="Maximum 168 hours (7 days)")

        db = await get_database()
        since = datetime.now() - timedelta(hours=hours)

        temperatures = await db.get_temperatures_since(since)

        return {
            "since": since.isoformat(),
            "count": len(temperatures),
            "temperatures": temperatures
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting temperature history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/combined")
async def get_combined_history(hours: int = 24):
    """
    Get combined temperature and price history for charting.

    Returns temperature readings and electricity prices for the specified time period,
    suitable for displaying on a dual-axis chart.

    Args:
        hours: Number of hours to fetch (default 24, max 168)
    """
    try:
        if hours > 168:
            raise HTTPException(status_code=400, detail="Maximum 168 hours (7 days)")

        db = await get_database()
        from app.config import get_config as get_cfg_hist
        config = get_cfg_hist()
        now = datetime.now()
        since = now - timedelta(hours=hours)

        # Get temperature history
        temperatures = await db.get_temperatures_since(since)

        # Get electricity prices for the same period
        prices = await db.get_electricity_prices(since, now)

        # Apply VAT to prices for display
        display_prices = []
        for p in prices:
            display_price = ElectricityPrice(
                timestamp=p.timestamp,
                price=config.apply_vat_to_price(p.price),
                currency=p.currency,
                region=p.region
            )
            display_prices.append(display_price)

        # Get heating status history
        status_history = await db.get_heat_pump_status_history(since, now)

        return {
            "since": since.isoformat(),
            "until": now.isoformat(),
            "temperatures": temperatures,
            "prices": display_prices,
            "heating_status": status_history,
            "metadata": {
                "temperature_count": len(temperatures),
                "price_count": len(display_prices),
                "status_count": len(status_history),
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting combined history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/maintenance/run")
async def run_maintenance_now():
    """
    Manually trigger data maintenance (aggregation and cleanup).
    Useful for testing or manual administration.
    """
    try:
        db = await get_database()
        result = await db.run_daily_maintenance()
        return {
            "success": True,
            "message": "Data maintenance completed successfully",
            "details": result
        }
    except Exception as e:
        logger.error(f"Error running maintenance: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def fetch_and_store_prices():
    """Background task to fetch and store prices"""
    try:
        logger.info("Fetching Nord Pool prices...")

        client = get_nordpool_client()
        result = await client.fetch_today_and_tomorrow()

        db = await get_database()

        # Store today's prices
        if result['today']:
            await db.save_electricity_prices(result['today'])
            logger.info(f"Stored {len(result['today'])} prices for today")

            # Calculate and store schedule
            engine = get_optimization_engine()
            mqtt = get_mqtt_manager()
            current_temp_reading = mqtt.get_latest_temperature()
            current_temp = current_temp_reading.indoor if current_temp_reading else None

            schedule = engine.calculate_schedule(result['today'], current_temp)
            if schedule:
                await db.save_heating_schedule(date.today().isoformat(), schedule)
                logger.info(f"Stored heating schedule for today")

        # Store tomorrow's prices
        if result['tomorrow']:
            await db.save_electricity_prices(result['tomorrow'])
            logger.info(f"Stored {len(result['tomorrow'])} prices for tomorrow")

            # Calculate tomorrow's schedule
            engine = get_optimization_engine()
            schedule = engine.calculate_schedule(result['tomorrow'], None)
            if schedule:
                tomorrow = date.today() + timedelta(days=1)
                await db.save_heating_schedule(tomorrow.isoformat(), schedule)
                logger.info(f"Stored heating schedule for tomorrow")

    except Exception as e:
        logger.error(f"Error in fetch_and_store_prices: {e}")


@router.put("/config")
async def update_config(config_update: dict):
    """Update configuration"""
    try:
        config = get_config()

        # Update optimization settings
        if 'optimization' in config_update:
            opt = config_update['optimization']
            if 'strategy' in opt:
                config.optimization['strategy'] = opt['strategy']
            if 'target_temperature' in opt:
                config.optimization['target_temperature'] = opt['target_temperature']
            if 'temperature_tolerance' in opt:
                config.optimization['temperature_tolerance'] = opt['temperature_tolerance']
            if 'comfort_hours_start' in opt:
                config.optimization['comfort_hours_start'] = opt['comfort_hours_start']
            if 'comfort_hours_end' in opt:
                config.optimization['comfort_hours_end'] = opt['comfort_hours_end']

        # Update heat curve
        if 'heat_curve' in config_update:
            config.optimization['heat_curve'] = config_update['heat_curve']

        # Update building settings
        if 'building' in config_update:
            building = config_update['building']
            if 'insulation_quality' in building:
                config.building['insulation_quality'] = building['insulation_quality']

        # Update Nord Pool settings
        if 'nordpool' in config_update:
            np = config_update['nordpool']
            if 'region' in np:
                config.nordpool['region'] = np['region']
            if 'currency' in np:
                config.nordpool['currency'] = np['currency']

        # Save configuration
        config.save()

        # Reinitialize optimization engine with new settings
        from app.services.optimization_engine import get_optimization_engine
        engine = get_optimization_engine()
        engine.strategy = config.optimization['strategy']
        engine.target_temp = config.optimization['target_temperature']
        engine.comfort_start = config.optimization['comfort_hours_start']
        engine.comfort_end = config.optimization['comfort_hours_end']

        logger.info(f"Configuration updated: strategy={config.optimization['strategy']}, "
                   f"target={config.optimization['target_temperature']}°C")

        return {"status": "success", "message": "Configuration updated successfully"}

    except Exception as e:
        logger.error(f"Error updating config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/override")
async def manual_override(override: ManualOverride):
    """Set manual temperature override"""
    try:
        mqtt = get_mqtt_manager()

        # Publish new setpoint to MQTT
        success = mqtt.publish_setpoint(override.target_temperature)

        if not success:
            raise HTTPException(status_code=500, detail="Failed to send command to heat pump")

        # Store override in database with expiration time
        expires_at = None
        if override.duration_minutes:
            from datetime import datetime, timedelta
            expires_at = datetime.now() + timedelta(minutes=override.duration_minutes)
            logger.info(f"Manual override set: {override.target_temperature}°C for {override.duration_minutes} minutes (expires {expires_at})")
        else:
            logger.info(f"Manual override set: {override.target_temperature}°C (no expiration)")

        return {
            "status": "success",
            "message": f"Temperature set to {override.target_temperature}°C",
            "expires_at": expires_at.isoformat() if expires_at else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting manual override: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts", response_model=List[Alert])
async def get_alerts(active_only: bool = True, limit: int = 20):
    """
    Get system alerts.

    Args:
        active_only: Return only active alerts (default True)
        limit: Maximum number of alerts to return
    """
    try:
        db = await get_database()

        if active_only:
            alerts_data = await db.get_active_alerts(limit=limit)
        else:
            alerts_data = await db.get_all_alerts(limit=limit, include_inactive=True)

        # Convert to Alert models
        alerts = []
        for data in alerts_data:
            alerts.append(Alert(
                id=data['id'],
                alert_type=data['alert_type'],
                severity=data['severity'],
                title=data['title'],
                message=data['message'],
                data=data.get('data'),
                created_at=datetime.fromisoformat(data['created_at']),
                acknowledged_at=datetime.fromisoformat(data['acknowledged_at']) if data.get('acknowledged_at') else None,
                resolved_at=datetime.fromisoformat(data['resolved_at']) if data.get('resolved_at') else None,
                is_active=bool(data['is_active'])
            ))

        return alerts

    except Exception as e:
        logger.error(f"Error getting alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/all", response_model=List[Alert])
async def get_all_alerts_history(limit: int = 100):
    """Get all alerts including resolved ones for alerts history page"""
    try:
        db = await get_database()
        alerts_data = await db.get_all_alerts(limit=limit, include_inactive=True)

        # Convert to Alert models
        alerts = []
        for data in alerts_data:
            alerts.append(Alert(
                id=data['id'],
                alert_type=data['alert_type'],
                severity=data['severity'],
                title=data['title'],
                message=data['message'],
                data=data.get('data'),
                created_at=datetime.fromisoformat(data['created_at']),
                acknowledged_at=datetime.fromisoformat(data['acknowledged_at']) if data.get('acknowledged_at') else None,
                resolved_at=datetime.fromisoformat(data['resolved_at']) if data.get('resolved_at') else None,
                is_active=bool(data['is_active'])
            ))

        return alerts
    except Exception as e:
        logger.error(f"Error getting all alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: int):
    """Acknowledge an alert"""
    try:
        db = await get_database()
        success = await db.acknowledge_alert(alert_id)

        if success:
            return {"success": True, "message": f"Alert {alert_id} acknowledged"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error acknowledging alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: int):
    """Resolve an alert"""
    try:
        db = await get_database()
        success = await db.resolve_alert(alert_id)

        if success:
            return {"success": True, "message": f"Alert {alert_id} resolved"}
        else:
            raise HTTPException(status_code=404, detail="Alert not found")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving alert: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/config", response_model=AlertConfig)
async def get_alert_config():
    """Get alert system configuration"""
    try:
        config = get_config()
        alerts_config = config.get('alerts', {})

        return AlertConfig(
            enabled=alerts_config.get('enabled', True),
            efficiency_cop_threshold=alerts_config.get('efficiency_cop_threshold', 2.0),
            efficiency_check_interval_minutes=alerts_config.get('efficiency_check_interval_minutes', 60),
            price_opportunity_threshold_percent=alerts_config.get('price_opportunity_threshold_percent', 30),
            comfort_deviation_threshold=alerts_config.get('comfort_deviation_threshold', 1.0),
            comfort_duration_minutes=alerts_config.get('comfort_duration_minutes', 30),
            max_active_alerts=alerts_config.get('max_active_alerts', 20)
        )

    except Exception as e:
        logger.error(f"Error getting alert config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/alerts/config")
async def update_alert_config(alert_config: AlertConfig):
    """Update alert system configuration"""
    try:
        config = get_config()

        # Update config (need to access internal _config for setting)
        if 'alerts' not in config._config:
            config._config['alerts'] = {}

        config._config['alerts']['enabled'] = alert_config.enabled
        config._config['alerts']['efficiency_cop_threshold'] = alert_config.efficiency_cop_threshold
        config._config['alerts']['efficiency_check_interval_minutes'] = alert_config.efficiency_check_interval_minutes
        config._config['alerts']['price_opportunity_threshold_percent'] = alert_config.price_opportunity_threshold_percent
        config._config['alerts']['comfort_deviation_threshold'] = alert_config.comfort_deviation_threshold
        config._config['alerts']['comfort_duration_minutes'] = alert_config.comfort_duration_minutes
        config._config['alerts']['max_active_alerts'] = alert_config.max_active_alerts

        config.save()

        return {
            "success": True,
            "message": "Alert configuration updated",
            "config": alert_config
        }

    except Exception as e:
        logger.error(f"Error updating alert config: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/evaluate")
async def evaluate_alerts(background_tasks: BackgroundTasks):
    """Manually trigger alert evaluation"""
    try:
        from app.services.alert_service import AlertService

        async def run_evaluation():
            db = await get_database()
            alert_service = AlertService(db)

            # Get current config
            config = get_config()
            alerts_config = config.get('alerts', {})
            if alerts_config:
                alert_service.update_config(AlertConfig(**alerts_config))

            # Run evaluation
            alert_ids = await alert_service.evaluate_all()
            logger.info(f"Alert evaluation complete: {len(alert_ids)} new alerts created")

        background_tasks.add_task(run_evaluation)

        return {
            "success": True,
            "message": "Alert evaluation triggered"
        }

    except Exception as e:
        logger.error(f"Error triggering alert evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/current")
async def get_current_weather():
    """Get current weather conditions"""
    try:
        weather_service = get_weather_service()

        if not weather_service:
            raise HTTPException(
                status_code=503,
                detail="Weather service not configured. Add API key and location in config.yaml"
            )

        current = await weather_service.get_current_weather()

        if not current:
            raise HTTPException(status_code=503, detail="Unable to fetch weather data")

        return current

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting current weather: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/forecast")
async def get_weather_forecast(hours: int = 48):
    """
    Get weather forecast for next N hours.

    Args:
        hours: Number of hours to forecast (default 48, max 120)
    """
    try:
        if hours > 120:
            raise HTTPException(status_code=400, detail="Maximum 120 hours forecast")

        weather_service = get_weather_service()

        if not weather_service:
            raise HTTPException(
                status_code=503,
                detail="Weather service not configured. Add API key and location in config.yaml"
            )

        forecasts = await weather_service.get_forecast(hours)

        return {
            "forecasts": [
                {
                    "timestamp": f.timestamp.isoformat(),
                    "temperature": f.temperature,
                    "feels_like": f.feels_like,
                    "humidity": f.humidity,
                    "wind_speed": f.wind_speed,
                    "clouds": f.clouds,
                    "description": f.description,
                    "icon": f.icon
                }
                for f in forecasts
            ],
            "count": len(forecasts)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting weather forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/heating-load")
async def get_heating_load_forecast(hours: int = 24):
    """
    Get estimated heating load forecast based on weather.

    Args:
        hours: Number of hours to forecast (default 24, max 48)
    """
    try:
        if hours > 48:
            raise HTTPException(status_code=400, detail="Maximum 48 hours for heating load forecast")

        weather_service = get_weather_service()

        if not weather_service:
            raise HTTPException(
                status_code=503,
                detail="Weather service not configured. Add API key and location in config.yaml"
            )

        heating_loads = await weather_service.get_heating_load_forecast(hours)

        return {
            "heating_loads": heating_loads,
            "count": len(heating_loads)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting heating load forecast: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather/temperature-trend")
async def get_temperature_trend(hours: int = 24):
    """Get temperature trend analysis"""
    try:
        weather_service = get_weather_service()

        if not weather_service:
            raise HTTPException(
                status_code=503,
                detail="Weather service not configured. Add API key and location in config.yaml"
            )

        trend = await weather_service.get_temperature_trend(hours)

        return trend

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting temperature trend: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot-water/events")
async def get_hot_water_events(days: int = 7):
    """
    Get hot water heating events for the past N days.

    Args:
        days: Number of days to fetch (default 7, max 30)
    """
    try:
        if days > 30:
            raise HTTPException(status_code=400, detail="Maximum 30 days")

        db = await get_database()
        end = datetime.now()
        start = end - timedelta(days=days)

        events = await db.get_hot_water_events(start, end)

        return {
            "events": events,
            "count": len(events),
            "period_days": days
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hot water events: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot-water/stats")
async def get_hot_water_stats(days: int = 7):
    """
    Get hot water statistics for the past N days.

    Args:
        days: Number of days to analyze (default 7, max 30)
    """
    try:
        if days > 30:
            raise HTTPException(status_code=400, detail="Maximum 30 days")

        db = await get_database()
        end = datetime.now()
        start = end - timedelta(days=days)

        stats = await db.get_hot_water_stats(start, end)

        # Calculate daily averages
        if stats.get('total_energy'):
            daily_avg_kwh = stats['total_energy'] / days
            daily_avg_cost = stats['total_cost'] / days
        else:
            daily_avg_kwh = 0
            daily_avg_cost = 0

        return {
            "period_days": days,
            "total_events": stats.get('event_count', 0),
            "total_energy_kwh": round(stats.get('total_energy', 0), 2),
            "total_cost": round(stats.get('total_cost', 0), 2),
            "daily_avg_kwh": round(daily_avg_kwh, 2),
            "daily_avg_cost": round(daily_avg_cost, 2),
            "avg_peak_temp": round(stats.get('avg_peak_temp', 0), 1) if stats.get('avg_peak_temp') else None,
            "avg_duration_minutes": round(stats.get('avg_duration', 0), 0) if stats.get('avg_duration') else None,
            "legionella_cycles": stats.get('legionella_cycles', 0)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hot water stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot-water/insights")
async def get_hot_water_insights(days: int = 7):
    """Get comprehensive hot water insights including patterns and recommendations"""
    try:
        if days > 30:
            raise HTTPException(status_code=400, detail="Maximum 30 days")

        from app.services.hot_water_service import get_hot_water_service
        service = await get_hot_water_service()

        insights = await service.get_hot_water_insights(days)

        return insights

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hot water insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hot-water/schedule")
async def get_hot_water_schedule(target_date: Optional[str] = None):
    """
    Get optimal hot water heating schedule for a specific date.

    Args:
        target_date: Date in format YYYY-MM-DD (defaults to today)
    """
    try:
        if target_date:
            try:
                target = datetime.strptime(target_date, '%Y-%m-%d').date()
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
        else:
            target = date.today()

        # Get prices for the target date
        db = await get_database()
        start = datetime.combine(target, datetime.min.time())
        end = start + timedelta(days=1)

        prices = await db.get_electricity_prices(start, end)

        if not prices:
            raise HTTPException(status_code=404, detail=f"No prices found for {target}")

        # Generate hot water schedule
        from app.services.hot_water_service import get_hot_water_service
        service = await get_hot_water_service()

        schedule = await service.get_daily_hot_water_schedule(prices)

        return {
            "date": target.isoformat(),
            "schedule": schedule,
            "count": len(schedule)
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hot water schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))
