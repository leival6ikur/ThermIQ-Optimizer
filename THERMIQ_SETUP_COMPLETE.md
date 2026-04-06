# ThermIQ Hardware Setup - Complete ✅

## Summary

Successfully integrated ThermIQ Room2 hardware with Thermi-Nator system for Thermia Optimum G3 heat pump.

## What's Working

### ✅ Real-time Monitoring
- **MQTT Connection**: ThermIQ device connected to local Mosquitto broker
- **Authentication**: Username/password auth configured (thermiq/thermiq123)
- **Data Flow**: Receiving sensor data every 30 seconds
- **Database Persistence**: All readings saved to SQLite database

### ✅ Temperature Sensors
Verified register mappings against heat pump display:
- **Indoor**: 20.5°C (from INDR_T field)
- **Outdoor**: 6°C (d0)
- **Floor Supply**: 35-37°C (d5)
- **Return**: 28-29°C (d6)
- **Hot Water Tank**: 48-49°C (d7)
- **Brine In**: 4°C (d9)
- **Brine Out**: 1°C (d8)

### ✅ Heat Pump Control
- **EVU Control**: Successfully tested ON/OFF commands
- **Topic**: `ThermIQ/ThermIQ-room2/set/EVU`
- **Payload**: `0` = Allow compressor, `1` = Block compressor
- **Verification**: EVU status visible in backend logs

### ✅ API Endpoints
- **Status**: http://localhost:8000/api/status
- **Dashboard**: http://localhost:5173
- **Health Check**: http://localhost:8000/health

## Configuration

### MQTT Settings (`data/config.yaml`)
```yaml
mqtt:
  broker: localhost
  port: 1883
  device_id: ThermIQ-room2
  username: thermiq
  password: thermiq123
```

### ThermIQ Device
- **IP Address**: 192.168.1.231:1883
- **MQTT URI**: 192.168.1.231:1883
- **Credentials**: thermiq / thermiq123

## How It Works

1. **ThermIQ** reads Modbus registers from heat pump every 30 seconds
2. **Publishes** data to topic: `ThermIQ/ThermIQ-room2/data`
3. **Backend** receives MQTT messages, parses registers
4. **Database** stores temperature and status readings
5. **API** serves data to frontend dashboard
6. **Frontend** displays real-time heat pump status

## Control Flow

The system can control the heat pump via EVU (Energy Utility) port:

- **Optimization Engine** calculates optimal heating schedule based on electricity prices
- **MQTT Manager** publishes EVU commands to ThermIQ
- **ThermIQ** writes to heat pump's EVU register
- **Heat Pump** blocks/allows compressor based on EVU state

## Testing Control

Use the test script:
```bash
cd /Users/hvissel/Documents/ThermIQ/backend
source venv/bin/activate
python test_control.py
```

Options:
1. Turn heating ON (EVU=0)
2. Turn heating OFF (EVU=1)
3. Set to AUTO mode (EVU=0)

Verify in logs:
```bash
tail -f /Users/hvissel/Documents/ThermIQ/data/logs/thermiq.log | grep EVU
```

## Known Limitations

1. **Indoor Temperature**: Heat pump's internal sensor reads ~20°C while NetAtmo shows ~24°C
   - This is a sensor placement/calibration issue, not a ThermIQ problem
   - Consider enabling NetAtmo integration for more accurate room temperature

2. **Temperature Setpoint Control**: Not yet tested (may require different Modbus register)

3. **Heating Status**: `d4` register shows compressor status but not always reliable

## Next Steps

- [ ] Test automatic optimization with price-based scheduling
- [ ] Monitor EVU control over 24 hours
- [ ] Enable NetAtmo integration for accurate room temperature
- [ ] Test temperature setpoint control (if needed)
- [ ] Configure alert thresholds

## Startup Commands

Start all services:
```bash
# Terminal 1: Mosquitto (if not running as service)
brew services start mosquitto

# Terminal 2: Backend
cd /Users/hvissel/Documents/ThermIQ/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload

# Terminal 3: Frontend
cd /Users/hvissel/Documents/ThermIQ/frontend
npm run dev
```

Access dashboard: http://localhost:5173

## Date Completed
2026-04-06
