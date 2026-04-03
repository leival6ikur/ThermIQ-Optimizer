# Development Guide

Complete guide for developing ThermIQ without the physical hardware.

## Overview

You can fully develop and test the ThermIQ system before the physical device arrives by using the mock device simulator. This simulates realistic heat pump behavior including thermal dynamics, temperature fluctuations, and response to control commands.

## Prerequisites

- Python 3.11+
- Mosquitto MQTT broker installed
- macOS (development environment)

## Setup

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start MQTT Broker

```bash
brew services start mosquitto
```

Verify it's running:
```bash
brew services list | grep mosquitto
```

### 3. Configure Application

The default configuration in `config/config.yaml` is ready for development:
```yaml
mqtt:
  broker: localhost
  port: 1883
  device_id: thermiq_room2lp

nordpool:
  region: EE  # Estonia
  
optimization:
  strategy: balanced
  target_temperature: 21.0
```

## Running the System

You need **4 terminal windows**:

### Terminal 1: MQTT Monitor (Optional but Recommended)

```bash
cd backend
source venv/bin/activate
python scripts/mqtt_monitor.py
```

This shows all MQTT traffic in real-time.

### Terminal 2: Mock Device

```bash
cd backend
source venv/bin/activate
python scripts/mock_device.py
```

You'll see output like:
```
2024-03-15 14:30:00 - INFO - Starting mock ThermIQ device
2024-03-15 14:30:01 - INFO - Connected to MQTT broker
2024-03-15 14:30:01 - INFO - Published: Indoor=21.0°C Outdoor=5.0°C Heating=ON Power=1200W
```

### Terminal 3: Backend API

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Terminal 4: Testing/Interaction

Use this terminal to test the API:

```bash
# Check health
curl http://localhost:8000/health

# Get current status
curl http://localhost:8000/api/status

# Get today's prices
curl http://localhost:8000/api/prices

# Get heating schedule
curl http://localhost:8000/api/schedule

# Manual override
curl -X POST http://localhost:8000/api/override \
  -H "Content-Type: application/json" \
  -d '{"target_temperature": 23.0}'
```

## Mock Device Behavior

The mock device simulates realistic behavior:

### Thermal Dynamics

- **Heat loss**: Temperature drops based on indoor-outdoor difference
- **Heating gain**: Temperature rises when heating is active
- **Thermal inertia**: Changes happen gradually (not instant)
- **Noise**: Small random fluctuations mimic real sensors

### Control Response

**Setpoint Change:**
```bash
# Publish command
mosquitto_pub -h localhost -t "thermiq/thermiq_room2lp/control/setpoint" \
  -m '{"value": 22.0}'

# Device will gradually adjust indoor temp toward 22°C
```

**Mode Change:**
```bash
# Turn heating off
mosquitto_pub -h localhost -t "thermiq/thermiq_room2lp/control/mode" \
  -m '{"value": "off"}'

# Turn heating on
mosquitto_pub -h localhost -t "thermiq/thermiq_room2lp/control/mode" \
  -m '{"value": "on"}'

# Auto mode (temperature-based)
mosquitto_pub -h localhost -t "thermiq/thermiq_room2lp/control/mode" \
  -m '{"value": "auto"}'
```

### Customizing Mock Device

Edit `backend/scripts/mock_device.py` to adjust:

- Initial temperatures
- Heat loss/gain rates
- Power consumption levels
- Publishing frequency
- Sensor noise levels

## Testing Scenarios

### Scenario 1: Price Response Testing

```bash
# 1. Check current schedule
curl http://localhost:8000/api/schedule | jq

# 2. Observe which hours heating is enabled
# Heating should be scheduled during cheap hours

# 3. Monitor mock device logs
# Verify heating turns on/off according to schedule
```

### Scenario 2: Manual Override

```bash
# 1. Note current indoor temperature
curl http://localhost:8000/api/status | jq '.current_temperature.indoor'

# 2. Set high target
curl -X POST http://localhost:8000/api/override \
  -H "Content-Type: application/json" \
  -d '{"target_temperature": 25.0}'

# 3. Watch mock device logs
# Temperature should gradually increase toward 25°C
```

### Scenario 3: Connection Loss Recovery

```bash
# 1. Stop Mosquitto broker
brew services stop mosquitto

# 2. Observe backend logs
# Should log "disconnected" and attempt reconnection

# 3. Restart broker
brew services start mosquitto

# 4. Backend should reconnect automatically
```

### Scenario 4: Optimization Strategy Testing

```bash
# 1. Get current config
curl http://localhost:8000/api/config

# 2. Change to aggressive strategy (save costs)
curl -X PUT http://localhost:8000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "aggressive",
    "target_temperature": 21.0,
    "temperature_tolerance": 1.0,
    "comfort_hours_start": "06:00",
    "comfort_hours_end": "23:00"
  }'

# 3. Trigger schedule recalculation
curl -X POST http://localhost:8000/api/prices/refresh

# 4. Check new schedule
curl http://localhost:8000/api/schedule | jq
# Should see fewer heating hours (only cheapest 30%)
```

## API Exploration

### Swagger UI

Open `http://localhost:8000/docs` in your browser for interactive API documentation.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Current system status |
| `/api/prices` | GET | Today's electricity prices |
| `/api/schedule` | GET | 24h heating schedule |
| `/api/override` | POST | Manual temperature override |
| `/api/config` | GET/PUT | Optimization configuration |
| `/api/temperatures/history` | GET | Temperature history |
| `/health` | GET | Health check |

### WebSocket Testing

Test real-time updates:

```javascript
// In browser console at http://localhost:8000
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  console.log('Received:', JSON.parse(event.data));
};

ws.send('ping');  // Test keepalive
```

## Database Inspection

The SQLite database is at `data/thermiq.db`:

```bash
# Install sqlite3 if needed
brew install sqlite3

# Open database
sqlite3 data/thermiq.db

# Query examples
.tables
SELECT * FROM temperature_readings ORDER BY timestamp DESC LIMIT 10;
SELECT * FROM electricity_prices WHERE timestamp >= date('now');
SELECT * FROM heating_schedules WHERE schedule_date = date('now');
.quit
```

## Simulating Historical Data

### Load Historical Prices

Create test script `test_historical_prices.py`:

```python
import asyncio
from datetime import datetime, timedelta
from app.models import ElectricityPrice
from app.database import get_database

async def load_test_prices():
    db = await get_database()

    # Simulate volatile day (high price variation)
    base_time = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    prices = []

    # Create 24 hours of prices with high variation
    price_pattern = [45, 42, 40, 38, 35, 40, 60, 80, 95, 110, 100, 90,
                     85, 80, 75, 70, 85, 95, 105, 90, 75, 60, 50, 45]

    for hour, price in enumerate(price_pattern):
        prices.append(ElectricityPrice(
            timestamp=base_time + timedelta(hours=hour),
            price=price,
            currency="EUR",
            region="EE"
        ))

    await db.save_electricity_prices(prices)
    print(f"Loaded {len(prices)} test prices")

asyncio.run(load_test_prices())
```

Run it:
```bash
python test_historical_prices.py
```

## Debugging

### Enable Debug Logging

Edit `config/config.yaml`:
```yaml
logging:
  level: DEBUG
```

Restart backend to see verbose logs.

### Common Issues

**1. MQTT Connection Failed**
```bash
# Check broker is running
brew services list | grep mosquitto

# Check broker logs
tail -f /opt/homebrew/var/log/mosquitto/mosquitto.log
```

**2. No Prices Fetched**
```bash
# Check internet connection
ping www.nordpoolgroup.com

# Manually trigger fetch
curl -X POST http://localhost:8000/api/prices/refresh

# Check logs
tail -f data/logs/thermiq.log
```

**3. Mock Device Not Publishing**
```bash
# Verify MQTT connection
mosquitto_sub -h localhost -t "thermiq/#" -v

# Check mock device logs
# Should see "Published: Indoor=..." every 30 seconds
```

## Performance Testing

### Load Test API

```bash
# Install hey
brew install hey

# Test status endpoint
hey -n 1000 -c 10 http://localhost:8000/api/status

# Test WebSocket connections
# Use tool like Artillery or custom script
```

### Memory Profiling

```bash
# Install memory-profiler
pip install memory-profiler

# Profile main application
python -m memory_profiler backend/app/main.py
```

## Code Quality

### Run Tests

```bash
cd backend
source venv/bin/activate
pytest tests/ -v
```

### Format Code

```bash
black app/ scripts/
```

### Lint Code

```bash
flake8 app/ scripts/
```

## Next Steps

Once comfortable with development:

1. **Frontend Development**: Build React dashboard (see next phase)
2. **Integration Testing**: Test full stack locally
3. **Documentation**: Add inline comments to custom logic
4. **Deployment Prep**: Package for Windows

When device arrives:
1. **Physical Setup**: Connect ThermIQ-ROOM2LP to heat pump
2. **Calibration**: Run in monitoring mode for 24h
3. **Thermal Tuning**: Update building parameters in config
4. **Production**: Enable full optimization
