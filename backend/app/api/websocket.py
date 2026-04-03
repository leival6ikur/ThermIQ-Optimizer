"""
WebSocket Handler for Real-time Updates
"""
import json
import logging
import asyncio
from typing import Set, Optional
from datetime import datetime

from fastapi import WebSocket, WebSocketDisconnect
from fastapi.routing import APIRouter

from app.services.mqtt_manager import get_mqtt_manager
from app.models import TemperatureReading, HeatPumpStatus


logger = logging.getLogger(__name__)
router = APIRouter()


class ConnectionManager:
    """Manages WebSocket connections"""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return

        message_json = json.dumps(message)
        disconnected = set()

        for connection in self.active_connections:
            try:
                await connection.send_text(message_json)
            except Exception as e:
                logger.error(f"Error sending to WebSocket: {e}")
                disconnected.add(connection)

        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)


# Global connection manager
manager = ConnectionManager()

# Event loop reference for thread-safe task scheduling
_loop: Optional[asyncio.AbstractEventLoop] = None


def set_event_loop(loop: asyncio.AbstractEventLoop):
    """Store event loop reference for MQTT callbacks"""
    global _loop
    _loop = loop


# MQTT callbacks to broadcast via WebSocket
def on_temperature_update(reading: TemperatureReading):
    """Called when temperature update received from MQTT"""
    try:
        if _loop and not _loop.is_closed():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({
                    "type": "temperature",
                    "data": {
                        "timestamp": reading.timestamp.isoformat(),
                        "indoor": reading.indoor,
                        "outdoor": reading.outdoor,
                        "supply": reading.supply,
                        "return": reading.return_temp,
                        "target": reading.target,
                        "brine_in": reading.brine_in,
                        "brine_out": reading.brine_out,
                        "hot_water": reading.hot_water,
                    }
                }),
                _loop
            )
    except Exception as e:
        logger.error(f"Error broadcasting temperature update: {e}")


def on_status_update(status: HeatPumpStatus):
    """Called when status update received from MQTT"""
    try:
        if _loop and not _loop.is_closed():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({
                    "type": "status",
                    "data": {
                        "timestamp": status.timestamp.isoformat(),
                        "heating": status.heating,
                        "power": status.power,
                        "mode": status.mode,
                    }
                }),
                _loop
            )
    except Exception as e:
        logger.error(f"Error broadcasting status update: {e}")


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await manager.connect(websocket)

    try:
        # Send initial state
        try:
            mqtt = get_mqtt_manager()
            latest_temp = mqtt.get_latest_temperature()
            latest_status = mqtt.get_latest_status()

            if latest_temp:
                await websocket.send_json({
                    "type": "temperature",
                    "data": {
                        "timestamp": latest_temp.timestamp.isoformat(),
                        "indoor": latest_temp.indoor,
                        "outdoor": latest_temp.outdoor,
                        "supply": latest_temp.supply,
                        "return": latest_temp.return_temp,
                        "target": latest_temp.target,
                        "brine_in": latest_temp.brine_in,
                        "brine_out": latest_temp.brine_out,
                        "hot_water": latest_temp.hot_water,
                    }
                })

            if latest_status:
                await websocket.send_json({
                    "type": "status",
                    "data": {
                        "timestamp": latest_status.timestamp.isoformat(),
                        "heating": latest_status.heating,
                        "power": latest_status.power,
                        "mode": latest_status.mode,
                    }
                })
        except Exception as e:
            logger.error(f"Error sending initial WebSocket data: {e}", exc_info=True)
            # Continue anyway - client will get updates from broadcasts

        # Keep connection alive
        while True:
            # Wait for messages from client (ping/pong)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                # Echo back for ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
            except asyncio.TimeoutError:
                # Send keepalive
                await websocket.send_json({"type": "keepalive", "timestamp": datetime.now().isoformat()})

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)


def register_mqtt_callbacks():
    """Register MQTT callbacks for WebSocket broadcasting"""
    mqtt = get_mqtt_manager()
    mqtt.register_temperature_callback(on_temperature_update)
    mqtt.register_status_callback(on_status_update)
    logger.info("MQTT callbacks registered for WebSocket broadcasting")
