# ThermIQ Quick Start Guide

Get the ThermIQ Heat Pump Optimizer running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.11+)
python3 --version

# Check if Mosquitto is installed
brew list mosquitto

# Check if in correct directory
ls config/config.yaml
```

## One-Command Setup

```bash
# Install all dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..

# Start everything
./start.sh
```

## Manual Start (If Preferred)

### Terminal 1: MQTT Broker
```bash
brew services start mosquitto
```

### Terminal 2: Mock Device
```bash
cd backend
source venv/bin/activate
python scripts/mock_device.py
```

### Terminal 3: Backend API
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

### Terminal 4 (Optional): MQTT Monitor
```bash
cd backend
source venv/bin/activate
python scripts/mqtt_monitor.py
```

## Quick Tests

Once running, open another terminal:

```bash
# Use the test script
./test-api.sh

# Or manual tests
curl http://localhost:8000/health
curl http://localhost:8000/api/status
curl http://localhost:8000/docs  # Open in browser
```

## Expected Output

### Mock Device
```
2024-03-15 14:30:00 - INFO - Starting mock ThermIQ device
2024-03-15 14:30:01 - INFO - Connected to MQTT broker
2024-03-15 14:30:01 - INFO - Published: Indoor=21.0°C Outdoor=5.0°C Heating=ON Power=1200W
```

### Backend API
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Health Check
```json
{
  "status": "healthy",
  "mqtt_connected": true,
  "last_message_age_seconds": 15.3,
  "timestamp": "2024-03-15T14:30:15.123456"
}
```

## Web Interface

Open in your browser:

- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **System Status**: http://localhost:8000/api/status

## Common Issues

### "Port already in use"
```bash
# Find and kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or change port
uvicorn app.main:app --port 8001
```

### "MQTT connection failed"
```bash
# Restart Mosquitto
brew services restart mosquitto

# Check if running
brew services list | grep mosquitto
```

### "No module named 'app'"
```bash
# Ensure you're in backend directory and venv is activated
cd backend
source venv/bin/activate
```

## Interactive Testing

### Test Manual Override
```bash
curl -X POST http://localhost:8000/api/override \
  -H "Content-Type: application/json" \
  -d '{"target_temperature": 23.0}'
```

Watch mock device logs - temperature should start rising toward 23°C!

### Test MQTT Commands
```bash
# Publish setpoint command
mosquitto_pub -h localhost -t "thermiq/thermiq_room2lp/control/setpoint" \
  -m '{"value": 24.0}'

# Subscribe to temperature updates
mosquitto_sub -h localhost -t "thermiq/+/sensors/temperature/indoor" -v
```

### Test WebSocket
Open browser console at `http://localhost:8000` and run:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
ws.send('ping');
```

## Next Steps

1. **Explore the API**
   - Open http://localhost:8000/docs
   - Try different endpoints
   - View real-time data updates

2. **Monitor MQTT Traffic**
   - Use MQTT Explorer (GUI): http://mqtt-explorer.com/
   - Or command line: `mosquitto_sub -h localhost -t "thermiq/#" -v`

3. **Check Logs**
   - Mock device: `tail -f data/logs/mock_device.log`
   - API server: `tail -f data/logs/api.log`
   - System: `tail -f data/logs/thermiq.log`

4. **Customize Configuration**
   - Edit `config/config.yaml`
   - Change optimization strategy
   - Adjust comfort hours
   - Set target temperature

5. **Build Frontend** (Next Phase)
   - React dashboard coming soon!
   - Real-time charts
   - Interactive controls

## Stopping the System

If using `start.sh`:
```bash
Press Ctrl+C
```

If manual:
```bash
# Stop each terminal with Ctrl+C
# Then stop Mosquitto if needed
brew services stop mosquitto
```

## Getting Help

- **Documentation**: See `docs/MQTT_SETUP.md` and `docs/DEVELOPMENT.md`
- **API Reference**: http://localhost:8000/docs
- **Logs**: Check `data/logs/` directory
- **Issues**: Review logs for error messages

## Success Checklist

- [ ] Mosquitto broker running
- [ ] Mock device publishing data (every 30 seconds)
- [ ] Backend API responding to health checks
- [ ] Can view API docs at /docs
- [ ] Can see system status
- [ ] Manual override works
- [ ] Temperature changes visible in mock device

Once all checked, you're ready for Phase 2: Frontend Development! 🎉
