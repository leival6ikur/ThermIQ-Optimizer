# Thermi-Nator Deployment Packages

Installation packages for macOS, Raspberry Pi, and Windows.

## 📦 Available Packages

```
deployment/
├── macos/
│   └── install.sh          # macOS installation script
├── raspberry-pi/
│   └── install.sh          # Raspberry Pi installation script
├── windows/
│   └── install.ps1         # Windows installation script
├── DEPLOYMENT_GUIDE.md     # Complete deployment documentation
└── README.md               # This file
```

## 🚀 Quick Start

Choose your platform:

### macOS
```bash
cd deployment/macos
chmod +x install.sh
./install.sh
```

### Raspberry Pi
```bash
cd deployment/raspberry-pi
chmod +x install.sh
sudo bash install.sh
```

### Windows (PowerShell as Administrator)
```powershell
cd deployment\windows
PowerShell -ExecutionPolicy Bypass -File install.ps1
```

## 📖 Documentation

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for:
- Detailed installation instructions
- Post-installation configuration
- Service management commands
- Network access setup
- Troubleshooting guide
- Update procedures
- Uninstallation steps

## ✅ What Gets Installed

All platforms install:
- ✅ Python 3.11 backend
- ✅ Node.js frontend
- ✅ Mosquitto MQTT broker
- ✅ System services (auto-start on boot)
- ✅ Configuration files

## 🌐 Default Access

After installation:
- **Dashboard:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **MQTT Broker:** localhost:1883

## ⚙️ Configuration Required

Edit the `.env` file to configure:
1. MQTT connection to your heat pump
2. Your location (address, coordinates, timezone)
3. Optional: Advanced settings

## 🔧 Service Names

- **macOS:** `com.thermi-nator.backend`, `com.thermi-nator.frontend`
- **Raspberry Pi:** `thermi-nator-backend`, `thermi-nator-frontend`
- **Windows:** `Thermi-Nator-Backend`, `Thermi-Nator-Frontend`

## 📝 Notes

- All installers include automatic dependency installation
- Services are configured to start on system boot
- Logs are stored in platform-specific locations
- MQTT broker (Mosquitto) is installed and configured automatically

## 🆘 Help

If you encounter issues:
1. Check the logs (see DEPLOYMENT_GUIDE.md)
2. Verify configuration in `.env` file
3. Ensure MQTT broker is accessible
4. Check firewall settings

For detailed troubleshooting, see [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md#troubleshooting).
