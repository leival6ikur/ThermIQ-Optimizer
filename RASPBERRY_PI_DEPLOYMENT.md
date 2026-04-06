# Raspberry Pi Deployment Guide

This guide ensures your Thermi-Nator system transfers seamlessly from Mac development to Raspberry Pi production.

## Prerequisites

- Raspberry Pi 3/4/5 with Raspberry Pi OS (64-bit recommended)
- MicroSD card (16GB+)
- Network connection (Ethernet or WiFi)
- SSH access or keyboard/monitor

## Automatic Path Management

The system automatically adapts to the platform:

| Platform | Data Directory | Config Path | Database Path |
|----------|---------------|-------------|---------------|
| Mac (dev) | `/Users/you/Documents/ThermIQ/data` | `data/config.yaml` | `data/thermiq.db` |
| Raspberry Pi | `/home/pi/.thermiq` | `~/.thermiq/config.yaml` | `~/.thermiq/thermiq.db` |
| Mac (packaged) | `~/Library/Application Support/Thermi-Nator` | `~/Library/.../config.yaml` | `~/Library/.../thermiq.db` |

**Your config, database, and logs automatically go to the right place!**

## Installation Steps

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    python3 python3-pip python3-venv \
    nodejs npm \
    mosquitto mosquitto-clients \
    git sqlite3
```

### 2. Clone Repository

```bash
cd ~
git clone https://github.com/yourusername/ThermIQ.git
cd ThermIQ
```

Or transfer your current working directory:
```bash
# On Mac:
rsync -avz --exclude 'venv' --exclude 'node_modules' \
    /Users/hvissel/Documents/ThermIQ/ \
    pi@raspberrypi.local:~/ThermIQ/
```

### 3. Configure Mosquitto

The exact same configuration you have on Mac:

```bash
sudo nano /etc/mosquitto/mosquitto.conf
```

Add:
```conf
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
```

Create password file (same credentials):
```bash
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd thermiq thermiq123
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto  # Auto-start on boot
```

### 4. Backend Setup

```bash
cd ~/ThermIQ/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Transfer Configuration

**Option A: Copy from Mac**
```bash
# On Mac:
scp /Users/hvissel/Documents/ThermIQ/data/config.yaml \
    pi@raspberrypi.local:~/.thermiq/
```

**Option B: Create fresh**
```bash
mkdir -p ~/.thermiq
cp backend/config.example.yaml ~/.thermiq/config.yaml
nano ~/.thermiq/config.yaml
```

Key settings (same as Mac):
```yaml
mqtt:
  broker: localhost
  port: 1883
  device_id: ThermIQ-room2
  username: thermiq
  password: thermiq123

nordpool:
  region: EE
  currency: EUR
```

### 6. Test Backend

```bash
cd ~/ThermIQ/backend
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check logs:
```bash
tail -f ~/.thermiq/logs/thermiq.log
```

### 7. Frontend Setup

```bash
cd ~/ThermIQ/frontend

# Install dependencies
npm install

# Build production version
npm run build

# Test (optional)
npm run preview -- --host 0.0.0.0
```

### 8. Setup Systemd Services (Auto-start)

Create backend service:
```bash
sudo nano /etc/systemd/system/thermiq-backend.service
```

```ini
[Unit]
Description=Thermi-Nator Backend
After=network.target mosquitto.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ThermIQ/backend
Environment="PATH=/home/pi/ThermIQ/backend/venv/bin"
ExecStart=/home/pi/ThermIQ/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create frontend service:
```bash
sudo nano /etc/systemd/system/thermiq-frontend.service
```

```ini
[Unit]
Description=Thermi-Nator Frontend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/ThermIQ/frontend
ExecStart=/usr/bin/npm run preview -- --host 0.0.0.0 --port 5173
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable thermiq-backend thermiq-frontend
sudo systemctl start thermiq-backend thermiq-frontend
```

Check status:
```bash
sudo systemctl status thermiq-backend
sudo systemctl status thermiq-frontend
```

## ThermIQ Device Configuration

**No changes needed!** The ThermIQ device will connect to the Raspberry Pi the same way it connects to your Mac.

Update ThermIQ MQTT URI from Mac IP to Raspberry Pi IP:
- Old: `192.168.1.231:1883` (Mac IP)
- New: `192.168.1.XXX:1883` (Raspberry Pi IP)

Find Raspberry Pi IP:
```bash
hostname -I
```

Everything else stays the same:
- Username: `thermiq`
- Password: `thermiq123`
- Device ID: `ThermIQ-room2`
- Topics: `ThermIQ/ThermIQ-room2/data` (same)
- Control: `ThermIQ/ThermIQ-room2/set/EVU` (same)

## Verification Checklist

After deployment, verify everything works:

### ✅ MQTT Connection
```bash
# Subscribe to ThermIQ data
mosquitto_sub -h localhost -p 1883 -u thermiq -P thermiq123 -t 'ThermIQ/#' -v
```

Should see messages every 30 seconds.

### ✅ Backend Running
```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "mqtt_connected": true
}
```

### ✅ Frontend Running
Open browser to: `http://raspberrypi.local:5173` or `http://[raspberry-pi-ip]:5173`

### ✅ Database Working
```bash
sqlite3 ~/.thermiq/thermiq.db "SELECT COUNT(*) FROM temperature_readings;"
```

Should show growing number of readings.

### ✅ Control Working
```bash
cd ~/ThermIQ/backend
source venv/bin/activate
python test_control.py
```

Test EVU on/off - same as Mac!

## Data Migration (Optional)

To transfer your existing data from Mac to Raspberry Pi:

```bash
# On Mac, copy database and config
scp /Users/hvissel/Documents/ThermIQ/data/thermiq.db \
    pi@raspberrypi.local:~/.thermiq/
scp /Users/hvissel/Documents/ThermIQ/data/config.yaml \
    pi@raspberrypi.local:~/.thermiq/
```

Your historical data will be preserved!

## Remote Access

Access from any device on your network:

- **Dashboard**: `http://raspberrypi.local:5173`
- **API**: `http://raspberrypi.local:8000`
- **Docs**: `http://raspberrypi.local:8000/docs`

From outside your network (optional):
- Set up port forwarding on your router
- Use Tailscale/Wireguard VPN
- Set up reverse proxy with Let's Encrypt

## Monitoring

View logs:
```bash
# Backend logs
sudo journalctl -u thermiq-backend -f

# Frontend logs
sudo journalctl -u thermiq-frontend -f

# Application logs
tail -f ~/.thermiq/logs/thermiq.log

# MQTT messages
mosquitto_sub -h localhost -u thermiq -P thermiq123 -t '#' -v
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
sudo journalctl -u thermiq-backend -n 50

# Test manually
cd ~/ThermIQ/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

### MQTT connection fails
```bash
# Check Mosquitto status
sudo systemctl status mosquitto

# Test connection
mosquitto_pub -h localhost -u thermiq -P thermiq123 -t test -m "hello"

# Check password file
sudo cat /etc/mosquitto/passwd
```

### ThermIQ not connecting
1. Check Raspberry Pi IP: `hostname -I`
2. Update ThermIQ config to new IP
3. Verify firewall allows port 1883
4. Test with `mosquitto_sub` (see above)

## Performance

Raspberry Pi 3/4/5 is more than sufficient:
- Backend: ~50MB RAM, <5% CPU
- Frontend: ~100MB RAM during build
- Mosquitto: ~10MB RAM, <1% CPU
- Database: Grows ~1MB per month

Expected response times:
- API calls: <50ms
- Dashboard load: <2s
- MQTT latency: <10ms

## Updates

Pull latest code:
```bash
cd ~/ThermIQ
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
cd ../frontend && npm install && npm run build
sudo systemctl restart thermiq-backend thermiq-frontend
```

## Key Differences from Mac

| Aspect | Mac Development | Raspberry Pi Production |
|--------|----------------|------------------------|
| Data location | `~/Documents/ThermIQ/data` | `~/.thermiq` |
| Services | Manual start | Systemd auto-start |
| Mosquitto | Homebrew | System package |
| Frontend | Dev mode (Vite) | Production build |
| Access | localhost | Network-wide |
| Startup | Manual | Automatic on boot |

## Everything Else is Identical

✅ MQTT topics and payloads  
✅ Database schema  
✅ API endpoints  
✅ Configuration format  
✅ ThermIQ register mappings  
✅ EVU control commands  
✅ Optimization logic  
✅ Alert thresholds  

**Your Mac setup is a perfect development environment. When you move to Raspberry Pi, it's just a deployment - not a rewrite!**

## Quick Setup Script

Save this as `setup_raspberry.sh`:

```bash
#!/bin/bash
set -e

echo "Installing Thermi-Nator on Raspberry Pi..."

# System packages
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm mosquitto mosquitto-clients git sqlite3

# Mosquitto config
echo "Configuring Mosquitto..."
sudo bash -c 'cat > /etc/mosquitto/mosquitto.conf <<EOF
listener 1883
allow_anonymous false
password_file /etc/mosquitto/passwd
EOF'
sudo mosquitto_passwd -c -b /etc/mosquitto/passwd thermiq thermiq123
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Backend
echo "Setting up backend..."
cd ~/ThermIQ/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
echo "Setting up frontend..."
cd ~/ThermIQ/frontend
npm install
npm run build

echo "✅ Installation complete!"
echo "Next steps:"
echo "1. Copy config: scp mac:~/Documents/ThermIQ/data/config.yaml ~/.thermiq/"
echo "2. Test backend: cd ~/ThermIQ/backend && source venv/bin/activate && python -m uvicorn app.main:app"
echo "3. Set up systemd services (see guide)"
echo "4. Update ThermIQ device with Raspberry Pi IP"
```

Run with: `bash setup_raspberry.sh`
