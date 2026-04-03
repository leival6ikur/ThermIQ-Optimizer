# MQTT Setup Guide

Complete guide for setting up the Mosquitto MQTT broker for ThermIQ.

## What is MQTT?

MQTT (Message Queuing Telemetry Transport) is a lightweight messaging protocol perfect for IoT devices. Think of it as a post office:

- **Broker** (Mosquitto): The central post office that receives and routes messages
- **Publisher** (ThermIQ device): Sends temperature data to broker every 30 seconds
- **Subscriber** (Backend): Receives temperature data from broker
- **Topics**: Like mailbox addresses, e.g., `thermiq/device123/temperature/indoor`

## Installation

### macOS (Development)

#### 1. Install Mosquitto via Homebrew

```bash
brew install mosquitto
```

#### 2. Start Mosquitto Service

```bash
# Start now and on login
brew services start mosquitto

# Or run once without service
/opt/homebrew/opt/mosquitto/sbin/mosquitto -c /opt/homebrew/etc/mosquitto/mosquitto.conf
```

#### 3. Verify Installation

```bash
# Check if service is running
brew services list | grep mosquitto

# Test connection (Terminal 1 - Subscribe)
mosquitto_sub -h localhost -t "test/topic" -v

# Test connection (Terminal 2 - Publish)
mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT"
```

You should see "Hello MQTT" appear in Terminal 1.

### Windows (Production Deployment)

#### 1. Download Mosquitto

Visit https://mosquitto.org/download/ and download the Windows installer.

#### 2. Install

- Run the installer
- Choose "Service" option during installation
- Default installation path: `C:\Program Files\mosquitto`

#### 3. Configure Firewall

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="MQTT Mosquitto" dir=in action=allow protocol=TCP localport=1883
```

#### 4. Start Service

```cmd
# Start service
net start mosquitto

# Check status
sc query mosquitto
```

## Configuration

### Development Configuration (macOS)

The project includes a pre-configured file at `deployment/mqtt/mosquitto.conf`:

```conf
# Network Settings
listener 1883
allow_anonymous true

# Logging
log_dest file /opt/homebrew/var/log/mosquitto/mosquitto.log
log_type information

# Persistence
persistence true
persistence_location /opt/homebrew/var/lib/mosquitto/
```

### Production Configuration (Windows)

Create `C:\mosquitto\mosquitto.conf`:

```conf
# Network Settings
listener 1883
allow_anonymous false
password_file C:\mosquitto\passwords.txt

# Logging
log_dest file C:\mosquitto\mosquitto.log
log_type error
log_type warning
log_type information

# Persistence
persistence true
persistence_location C:\mosquitto\data\

# Security
max_keepalive 60
max_queued_messages 1000
```

### Adding Authentication (Production)

```bash
# Create password file
mosquitto_passwd -c /path/to/passwords.txt username

# Add more users
mosquitto_passwd -b /path/to/passwords.txt username2 password2

# Update mosquitto.conf
# Set: allow_anonymous false
# Set: password_file /path/to/passwords.txt

# Restart broker
brew services restart mosquitto  # macOS
net stop mosquitto && net start mosquitto  # Windows
```

## Testing MQTT

### Using Command Line Tools

**Subscribe to all ThermIQ topics:**
```bash
mosquitto_sub -h localhost -t "thermiq/#" -v
```

**Publish a test message:**
```bash
mosquitto_pub -h localhost -t "thermiq/test" -m '{"value": 21.5, "unit": "celsius"}'
```

**Monitor specific sensor:**
```bash
mosquitto_sub -h localhost -t "thermiq/+/sensors/temperature/indoor"
```

### Using MQTT Explorer (GUI)

1. **Download**: http://mqtt-explorer.com/
2. **Install** the application
3. **Connect**:
   - Host: `localhost`
   - Port: `1883`
   - Username/Password: (if configured)
4. **Explore**: Browse all topics in real-time with visual tree structure

### Using Python Monitor Script

```bash
cd backend
python scripts/mqtt_monitor.py
```

This will display all MQTT messages in a formatted view.

## ThermIQ Topics

The ThermIQ-ROOM2LP device publishes to these topics:

### Sensor Topics (Published by Device)

- `thermiq/{device_id}/sensors/temperature/indoor` - Indoor temperature
- `thermiq/{device_id}/sensors/temperature/outdoor` - Outdoor temperature
- `thermiq/{device_id}/sensors/temperature/supply` - Supply line temperature
- `thermiq/{device_id}/sensors/temperature/return` - Return line temperature
- `thermiq/{device_id}/sensors/temperature/target` - Target temperature
- `thermiq/{device_id}/sensors/power` - Power consumption (Watts)

### Status Topics (Published by Device)

- `thermiq/{device_id}/status/heating` - Heating on/off status
- `thermiq/{device_id}/status/mode` - Operating mode (auto/on/off)

### Control Topics (Subscribed by Device)

- `thermiq/{device_id}/control/setpoint` - Set target temperature
- `thermiq/{device_id}/control/mode` - Change operating mode

### Message Format

All messages are JSON:

```json
{
  "value": 21.5,
  "unit": "celsius",
  "timestamp": "2024-03-15T14:30:00"
}
```

## Troubleshooting

### Broker Won't Start

**Check if port is already in use:**
```bash
# macOS/Linux
lsof -i :1883

# Windows
netstat -ano | findstr :1883
```

**Check logs:**
```bash
# macOS
tail -f /opt/homebrew/var/log/mosquitto/mosquitto.log

# Windows
type C:\mosquitto\mosquitto.log
```

### Can't Connect to Broker

1. **Verify broker is running:**
   ```bash
   # macOS
   brew services list | grep mosquitto

   # Windows
   sc query mosquitto
   ```

2. **Check firewall settings** (especially on Windows)

3. **Test with telnet:**
   ```bash
   telnet localhost 1883
   ```

### Messages Not Being Received

1. **Check topic subscription** - Use `#` wildcard: `thermiq/#`
2. **Verify QoS levels** - Use QoS 1 for guaranteed delivery
3. **Check client connection** - Look for disconnect messages in logs

### Performance Issues

1. **Increase max connections** in `mosquitto.conf`:
   ```conf
   max_connections 100
   ```

2. **Adjust persistence settings**:
   ```conf
   persistence true
   autosave_interval 1800  # 30 minutes
   ```

3. **Monitor resource usage**:
   ```bash
   # macOS
   ps aux | grep mosquitto

   # Windows
   tasklist | findstr mosquitto
   ```

## Security Best Practices

### Development

- ✓ Anonymous connections OK
- ✓ No encryption needed (localhost only)
- ✓ Simple setup for fast iteration

### Production

- ✗ **Never** allow anonymous connections
- ✓ Use username/password authentication
- ✓ Consider TLS/SSL encryption
- ✓ Restrict network access with firewall
- ✓ Regular password rotation
- ✓ Monitor for unauthorized access

### TLS/SSL Configuration (Advanced)

```conf
# Generate certificates first
listener 8883
cafile /path/to/ca.crt
certfile /path/to/server.crt
keyfile /path/to/server.key
require_certificate true
```

## Integration with ThermIQ

### 1. Mock Device (Development)

```bash
cd backend
python scripts/mock_device.py
```

The mock device will:
- Connect to MQTT broker
- Publish sensor data every 30 seconds
- Respond to control commands
- Simulate thermal dynamics

### 2. Real Device (Production)

When ThermIQ-ROOM2LP arrives:
1. Connect to heat pump EXT interface
2. Power via USB (2A minimum)
3. Configure WiFi via device setup
4. Device will auto-connect to broker
5. Verify with MQTT Explorer

### 3. Backend Connection

The backend automatically connects on startup:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

Check connection:
```bash
curl http://localhost:8000/health
```

## Resources

- **Mosquitto Documentation**: https://mosquitto.org/documentation/
- **MQTT Protocol Specification**: https://mqtt.org/
- **MQTT Explorer**: http://mqtt-explorer.com/
- **ThermIQ Documentation**: https://www.thermiq.net/

## Quick Reference

```bash
# Start broker
brew services start mosquitto  # macOS
net start mosquitto             # Windows

# Stop broker
brew services stop mosquitto    # macOS
net stop mosquitto              # Windows

# Subscribe to all topics
mosquitto_sub -h localhost -t "#" -v

# Publish message
mosquitto_pub -h localhost -t "topic" -m "message"

# Monitor logs
tail -f /opt/homebrew/var/log/mosquitto/mosquitto.log  # macOS
type C:\mosquitto\mosquitto.log                         # Windows
```
