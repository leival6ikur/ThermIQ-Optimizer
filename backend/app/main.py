"""
ThermIQ Heat Pump Optimizer - Main Application

FastAPI backend for ThermIQ smart heat pump control system.
"""
import logging
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, time
from pathlib import Path
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.config import get_config
from app.database import get_database
from app.services.mqtt_manager import get_mqtt_manager
from app.services.nord_pool_client import get_nordpool_client
from app.services.optimization_engine import get_optimization_engine
from app.services.broker_manager import get_broker_manager, check_system_mosquitto
from app.api.routes import router as api_router, fetch_and_store_prices
from app.api.websocket import router as ws_router, register_mqtt_callbacks, set_event_loop
from app.api.setup import router as setup_router
from app.paths import get_paths_info


# Configure logging
def setup_logging():
    """Configure application logging"""
    from app.paths import get_log_dir

    config = get_config()
    log_config = config.logging_config

    log_level = log_config.get('level', 'INFO')
    log_file = get_log_dir() / 'thermiq.log'

    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )


setup_logging()
logger = logging.getLogger(__name__)


# Scheduler for background tasks
scheduler = AsyncIOScheduler()


async def scheduled_price_fetch():
    """Scheduled task to fetch Nord Pool prices"""
    logger.info("Running scheduled price fetch...")
    try:
        await fetch_and_store_prices()
    except Exception as e:
        logger.error(f"Error in scheduled price fetch: {e}")


async def scheduled_optimization():
    """Scheduled task to recalculate and apply heating schedule"""
    logger.info("Running scheduled optimization...")
    try:
        db = await get_database()
        engine = get_optimization_engine()
        mqtt = get_mqtt_manager()

        # Get today's prices
        from datetime import date, timedelta
        today = date.today()
        start = datetime.combine(today, datetime.min.time())
        end = start + timedelta(days=1)

        prices = await db.get_electricity_prices(start, end)

        if not prices:
            logger.warning("No prices available for optimization")
            return

        # Get current temperature
        current_temp_reading = mqtt.get_latest_temperature()
        current_temp = current_temp_reading.indoor if current_temp_reading else None

        # Calculate schedule
        schedule = engine.calculate_schedule(prices, current_temp)

        if not schedule:
            logger.warning("Failed to calculate schedule")
            return

        # Determine if we should be heating now
        current_hour = datetime.now().hour
        current_schedule = next((s for s in schedule if s.hour == current_hour), None)

        if current_schedule:
            if current_schedule.should_heat:
                # Should be heating - ensure mode is auto and setpoint is correct
                mqtt.publish_mode("auto")
                mqtt.publish_setpoint(engine.target_temp)
                logger.info(f"Hour {current_hour}: Heating enabled (price: {current_schedule.price:.2f} EUR/MWh)")
            else:
                # Should not be heating - this is a cheap implementation
                # In reality, we might just lower the setpoint
                target = engine.target_temp - engine.tolerance - 0.5
                mqtt.publish_setpoint(target)
                logger.info(f"Hour {current_hour}: Heating reduced (price: {current_schedule.price:.2f} EUR/MWh)")

    except Exception as e:
        logger.error(f"Error in scheduled optimization: {e}")


async def scheduled_data_maintenance():
    """Scheduled task to aggregate old data and clean up raw records"""
    logger.info("Running daily data maintenance...")
    try:
        db = await get_database()
        result = await db.run_daily_maintenance()
        logger.info(f"Data maintenance complete: {result}")
    except Exception as e:
        logger.error(f"Error in data maintenance: {e}")


# Global event loop reference for MQTT callbacks
_main_loop: Optional[asyncio.AbstractEventLoop] = None


def save_temperature_reading(reading):
    """Callback to save temperature readings to database (called from MQTT thread)"""
    global _main_loop

    try:
        if _main_loop is None:
            return  # Silently skip if not initialized

        if _main_loop.is_closed() or not _main_loop.is_running():
            return  # Silently skip if loop not ready

        async def _save():
            try:
                db = await get_database()
                await db.save_temperature(reading)
            except Exception as e:
                logger.error(f"Error saving temperature: {e}")

        asyncio.run_coroutine_threadsafe(_save(), _main_loop)
    except RuntimeError as e:
        # Silently ignore "no running event loop" errors during startup/shutdown
        if "no running event loop" not in str(e).lower():
            logger.error(f"Error scheduling temperature save: {e}")
    except Exception as e:
        logger.error(f"Error in temperature callback: {e}")


def save_status_reading(status):
    """Callback to save status readings to database (called from MQTT thread)"""
    global _main_loop

    try:
        if _main_loop is None:
            return  # Silently skip if not initialized

        if _main_loop.is_closed() or not _main_loop.is_running():
            return  # Silently skip if loop not ready

        async def _save():
            try:
                db = await get_database()
                await db.save_heat_pump_status(status)
            except Exception as e:
                logger.error(f"Error saving status: {e}")

        asyncio.run_coroutine_threadsafe(_save(), _main_loop)
    except RuntimeError as e:
        # Silently ignore "no running event loop" errors during startup/shutdown
        if "no running event loop" not in str(e).lower():
            logger.error(f"Error scheduling status save: {e}")
    except Exception as e:
        logger.error(f"Error in status callback: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting ThermIQ Heat Pump Optimizer...")

    # Store event loop reference for WebSocket callbacks and database saves
    global _main_loop
    loop = asyncio.get_running_loop()
    _main_loop = loop
    set_event_loop(loop)

    # Log path information
    paths_info = get_paths_info()
    logger.info(f"Running in {'PACKAGED' if paths_info['frozen'] else 'DEVELOPMENT'} mode")
    logger.info(f"Data directory: {paths_info['data_dir']}")
    logger.info(f"Config path: {paths_info['config_path']}")

    broker = None

    try:
        # Start embedded MQTT broker (if needed)
        system_broker_running = check_system_mosquitto()

        if system_broker_running:
            logger.info("System Mosquitto broker detected, using existing broker")
        else:
            logger.info("Starting embedded Mosquitto broker...")
            broker = get_broker_manager(use_system=False)

            if not broker.start():
                logger.error("Failed to start embedded broker")
                raise RuntimeError("Could not start MQTT broker")

            logger.info("Embedded Mosquitto broker started successfully")

        # Initialize database
        db = await get_database()
        logger.info("Database initialized")

        # Connect MQTT
        mqtt = get_mqtt_manager()
        mqtt.connect()
        logger.info("MQTT manager started")

        # Register callbacks for data persistence
        mqtt.register_temperature_callback(save_temperature_reading)
        mqtt.register_status_callback(save_status_reading)

        # Register WebSocket callbacks
        register_mqtt_callbacks()

        # Initialize optimization engine
        engine = get_optimization_engine()
        logger.info("Optimization engine initialized")

        # Fetch initial prices
        logger.info("Fetching initial prices...")
        await fetch_and_store_prices()

        # Start scheduler
        scheduler.start()

        # Schedule price fetch daily at configured time
        config = get_config()
        fetch_time_str = config.nordpool.get('fetch_time', '13:00')
        fetch_hour, fetch_minute = map(int, fetch_time_str.split(':'))

        scheduler.add_job(
            scheduled_price_fetch,
            'cron',
            hour=fetch_hour,
            minute=fetch_minute,
            id='price_fetch'
        )
        logger.info(f"Scheduled daily price fetch at {fetch_time_str} UTC")

        # Schedule optimization every 5 minutes
        update_interval = config.optimization.get('update_interval', 300)  # seconds
        scheduler.add_job(
            scheduled_optimization,
            'interval',
            seconds=update_interval,
            id='optimization'
        )
        logger.info(f"Scheduled optimization every {update_interval} seconds")

        # Schedule daily data maintenance at 1 AM
        scheduler.add_job(
            scheduled_data_maintenance,
            'cron',
            hour=1,
            minute=0,
            id='data_maintenance'
        )
        logger.info("Scheduled daily data maintenance at 01:00")

        logger.info("ThermIQ backend started successfully")

    except Exception as e:
        logger.error(f"Error during startup: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down ThermIQ backend...")

    try:
        # Stop scheduler
        scheduler.shutdown()

        # Disconnect MQTT
        mqtt = get_mqtt_manager()
        mqtt.disconnect()

        # Close Nord Pool client
        client = get_nordpool_client()
        await client.close()

        # Stop embedded broker if we started it
        if broker and broker.is_running():
            logger.info("Stopping embedded Mosquitto broker...")
            broker.stop()

        logger.info("Shutdown complete")

    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="ThermIQ Heat Pump Optimizer",
    description="Smart heat pump control with Nord Pool price optimization",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
config = get_config()
api_config = config.api

app.add_middleware(
    CORSMiddleware,
    allow_origins=api_config.get('cors_origins', ["*"]),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(setup_router)
app.include_router(api_router)
app.include_router(ws_router)


# Middleware to redirect to setup if not complete
@app.middleware("http")
async def check_setup_complete(request, call_next):
    """Redirect to setup wizard if first-run setup not complete"""
    # Allow setup endpoints, docs, and health/status endpoints
    allowed_paths = ["/setup", "/health", "/docs", "/openapi", "/redoc", "/ws"]

    for allowed in allowed_paths:
        if request.url.path.startswith(allowed):
            return await call_next(request)

    # Check if setup is complete
    config = get_config()
    if not config.is_setup_complete():
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/setup")

    return await call_next(request)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "ThermIQ Heat Pump Optimizer",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    mqtt = get_mqtt_manager()
    db = await get_database()

    return {
        "status": "healthy",
        "mqtt_connected": mqtt.is_connected(),
        "last_message_age_seconds": mqtt.get_last_message_age(),
        "timestamp": datetime.now().isoformat()
    }


if __name__ == "__main__":
    import uvicorn

    host = config.api.get('host', '0.0.0.0')
    port = config.api.get('port', 8000)

    logger.info(f"Starting server on {host}:{port}")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
