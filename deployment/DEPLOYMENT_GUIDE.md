# Thermi-Nator Deployment Guide

Complete installation packages for macOS, Raspberry Pi, and Windows.

## 📦 Package Overview

| Platform | Installer | Service Manager | Requirements |
|----------|-----------|-----------------|--------------|
| macOS | `install.sh` | LaunchAgent | macOS 11+ (Big Sur or later) |
| Raspberry Pi | `install.sh` | systemd | Raspberry Pi OS (Debian 11+) |
| Windows | `install.ps1` | NSSM/Windows Services | Windows 10/11 |

## 🚀 Quick Start

### macOS Installation

```bash
# Clone or download the repository
cd ~/Downloads
# git clone https://github.com/yourusername/thermi-nator.git
# cd thermi-nator

# Navigate to installer and run
cd deployment/macos
chmod +x install.sh
./install.sh
```

**What it installs:**
- Homebrew (if not present)
- Python 3.11, Node.js 20, Mosquitto
- Thermi-Nator backend & frontend
- LaunchAgents for auto-start
- Configuration files

**Access:**
- Dashboard: http://localhost:5173
- API: http://localhost:8000

### Raspberry Pi Installation

```bash
# Clone or download the repository
cd ~
# git clone https://github.com/yourusername/thermi-nator.git
# cd thermi-nator

# Navigate to installer and run with sudo
cd deployment/raspberry-pi
chmod +x install.sh
sudo bash install.sh
```

**What it installs:**
- Python 3.11, Node.js, Mosquitto
- Thermi-Nator backend & frontend to `/opt/thermi-nator`
- systemd services for auto-start
- Configuration files

**Access:**
- Dashboard: http://[raspberry-pi-ip]:5173
- API: http://[raspberry-pi-ip]:8000

**Find your Pi's IP:**
```bash
hostname -I
```

### Windows Installation

```powershell
# Clone or download the repository
# git clone https://github.com/yourusername/thermi-nator.git
# cd thermi-nator

# Open PowerShell as Administrator
# Right-click PowerShell -> "Run as Administrator"

# Navigate to installer and run
cd deployment\windows
PowerShell -ExecutionPolicy Bypass -File install.ps1
```

**What it installs:**
- Chocolatey package manager
- Python 3.11, Node.js, Mosquitto, NSSM
- Thermi-Nator backend & frontend to `C:\Program Files\Thermi-Nator`
- Windows Services for auto-start
- Firewall rules for network access

**Access:**
- Dashboard: http://localhost:5173
- API: http://localhost:8000

## ⚙️ Post-Installation Configuration

### 1. Edit Configuration File

**macOS:**
```bash
nano ~/.thermi-nator/backend/.env
```

**Raspberry Pi:**
```bash
sudo nano /opt/thermi-nator/backend/.env
```

**Windows:**
```powershell
notepad "C:\Program Files\Thermi-Nator\backend\.env"
```

### 2. Required Settings

```env
# MQTT Connection (to your heat pump)
MQTT_BROKER=your-heat-pump-ip
MQTT_PORT=1883
MQTT_USER=your-username
MQTT_PASSWORD=your-password

# Location (for weather and electricity prices)
THERMIQ_ADDRESS=Your Address
THERMIQ_LATITUDE=58.378025
THERMIQ_LONGITUDE=26.728763
THERMIQ_TIMEZONE=Europe/Tallinn
```

### 3. Restart Services

**macOS:**
```bash
launchctl stop com.thermi-nator.backend
launchctl start com.thermi-nator.backend
```

**Raspberry Pi:**
```bash
sudo systemctl restart thermi-nator-backend
sudo systemctl restart thermi-nator-frontend
```

**Windows:**
```powershell
Restart-Service Thermi-Nator-Backend
Restart-Service Thermi-Nator-Frontend
```

## 🔧 Service Management

### macOS (launchctl)

```bash
# Check status
launchctl list | grep thermi-nator

# Start/Stop
launchctl start com.thermi-nator.backend
launchctl stop com.thermi-nator.backend

# View logs
tail -f ~/Library/Logs/thermi-nator-backend.log

# Disable auto-start
launchctl unload ~/Library/LaunchAgents/com.thermi-nator.backend.plist

# Enable auto-start
launchctl load ~/Library/LaunchAgents/com.thermi-nator.backend.plist
```

### Raspberry Pi (systemd)

```bash
# Check status
sudo systemctl status thermi-nator-backend
sudo systemctl status thermi-nator-frontend

# Start/Stop/Restart
sudo systemctl start thermi-nator-backend
sudo systemctl stop thermi-nator-backend
sudo systemctl restart thermi-nator-backend

# View logs (live)
sudo journalctl -u thermi-nator-backend -f

# View logs (recent)
sudo journalctl -u thermi-nator-backend -n 100

# Disable auto-start
sudo systemctl disable thermi-nator-backend

# Enable auto-start
sudo systemctl enable thermi-nator-backend
```

### Windows (Services)

```powershell
# Check status
Get-Service Thermi-Nator-*

# Start/Stop/Restart
Start-Service Thermi-Nator-Backend
Stop-Service Thermi-Nator-Backend
Restart-Service Thermi-Nator-Backend

# View logs
Get-Content "C:\ProgramData\Thermi-Nator\backend.log" -Tail 50 -Wait

# Or use Services GUI
services.msc
```

## 🌐 Network Access

### Enable Remote Access

**macOS:**
- Dashboard already accessible on LAN
- Find your IP: `ipconfig getifaddr en0`
- Access from other devices: `http://[mac-ip]:5173`

**Raspberry Pi:**
- Already configured for network access
- Find IP: `hostname -I`
- Access: `http://[pi-ip]:5173`

**Windows:**
- Firewall rules automatically added
- Find IP: `ipconfig` (look for IPv4 Address)
- Access: `http://[windows-ip]:5173`

### Port Forwarding (Optional)

To access from outside your home network:

1. **Router Port Forwarding:**
   - Forward external port 8080 → internal port 5173 (frontend)
   - Forward external port 8000 → internal port 8000 (API)

2. **Security Warning:** 
   - ⚠️ Exposing services to internet requires proper security
   - Consider using VPN instead (WireGuard, Tailscale)
   - Or use reverse proxy with SSL (nginx, Caddy)

## 🔄 Updating Thermi-Nator

### macOS

```bash
cd ~/.thermi-nator
git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
cd ../frontend
npm install
npm run build
launchctl restart com.thermi-nator.backend
launchctl restart com.thermi-nator.frontend
```

### Raspberry Pi

```bash
cd /opt/thermi-nator
sudo git pull origin main
cd backend
source venv/bin/activate
pip install -r requirements.txt
cd ../frontend
npm install
npm run build
sudo systemctl restart thermi-nator-backend
sudo systemctl restart thermi-nator-frontend
```

### Windows

```powershell
cd "C:\Program Files\Thermi-Nator"
git pull origin main

# Update backend
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
deactivate

# Update frontend
cd ..\frontend
npm install
npm run build

# Restart services
Restart-Service Thermi-Nator-Backend
Restart-Service Thermi-Nator-Frontend
```

## 🗑️ Uninstallation

### macOS

```bash
# Stop and remove services
launchctl stop com.thermi-nator.backend
launchctl stop com.thermi-nator.frontend
launchctl unload ~/Library/LaunchAgents/com.thermi-nator.backend.plist
launchctl unload ~/Library/LaunchAgents/com.thermi-nator.frontend.plist
rm ~/Library/LaunchAgents/com.thermi-nator.*.plist

# Remove files
rm -rf ~/.thermi-nator

# Optional: stop Mosquitto
brew services stop mosquitto
```

### Raspberry Pi

```bash
# Stop and disable services
sudo systemctl stop thermi-nator-backend thermi-nator-frontend
sudo systemctl disable thermi-nator-backend thermi-nator-frontend

# Remove service files
sudo rm /etc/systemd/system/thermi-nator-*.service
sudo systemctl daemon-reload

# Remove installation
sudo rm -rf /opt/thermi-nator
sudo rm -rf /var/lib/thermi-nator

# Optional: stop Mosquitto
sudo systemctl stop mosquitto
sudo systemctl disable mosquitto
```

### Windows

```powershell
# Stop and remove services
Stop-Service Thermi-Nator-Backend
Stop-Service Thermi-Nator-Frontend
nssm remove Thermi-Nator-Backend confirm
nssm remove Thermi-Nator-Frontend confirm

# Remove firewall rules
Remove-NetFirewallRule -DisplayName "Thermi-Nator Frontend"
Remove-NetFirewallRule -DisplayName "Thermi-Nator Backend"
Remove-NetFirewallRule -DisplayName "Mosquitto MQTT"

# Remove files
Remove-Item -Path "C:\Program Files\Thermi-Nator" -Recurse -Force
Remove-Item -Path "C:\ProgramData\Thermi-Nator" -Recurse -Force

# Optional: stop Mosquitto
Stop-Service mosquitto
```

## 🐛 Troubleshooting

### Service won't start

**Check logs:**
- macOS: `tail -f ~/Library/Logs/thermi-nator-backend.log`
- Raspberry Pi: `sudo journalctl -u thermi-nator-backend -n 100`
- Windows: `Get-Content "C:\ProgramData\Thermi-Nator\backend.log" -Tail 50`

**Common issues:**
1. Port already in use: Another service using port 5173 or 8000
2. MQTT connection failed: Check broker IP/credentials in `.env`
3. Permission denied: Ensure proper file permissions

### Can't access dashboard

1. Check if services are running
2. Check firewall settings
3. Try `http://localhost:5173` first
4. Check for correct IP address
5. Ensure you're on the same network

### Database errors

**Reset database:**
```bash
# macOS
rm ~/.thermi-nator/backend/thermi_nator.db

# Raspberry Pi
sudo rm /var/lib/thermi-nator/thermi_nator.db

# Windows
Remove-Item "C:\ProgramData\Thermi-Nator\thermi_nator.db"

# Restart service to recreate
```

## 📞 Support

- Documentation: [/docs](/docs)
- Issues: https://github.com/yourusername/thermi-nator/issues
- Configuration: See `.env` file comments

## 🔒 Security Best Practices

1. **Change default credentials** for MQTT if applicable
2. **Use strong passwords** for any exposed services
3. **Keep system updated** regularly
4. **Firewall configuration** - only open necessary ports
5. **HTTPS/SSL** - consider reverse proxy with SSL for production
6. **VPN access** - use VPN instead of port forwarding when possible

## 📋 System Requirements

### Minimum

- **CPU:** 1 GHz (Raspberry Pi 3B+ or better)
- **RAM:** 512 MB (1 GB recommended)
- **Storage:** 2 GB free space
- **Network:** Ethernet or Wi-Fi
- **MQTT Broker:** Local or remote

### Recommended

- **CPU:** 2+ cores, 1.5 GHz+
- **RAM:** 2 GB+
- **Storage:** 10 GB+ (for long-term data)
- **Network:** Ethernet (more stable)
- **MQTT Broker:** Local Mosquitto instance
