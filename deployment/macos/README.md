# Thermi-Nator for macOS

One-command installation for macOS.

## Requirements

- macOS 11 (Big Sur) or later
- Administrator access
- Internet connection

## Installation

```bash
./install.sh
```

The installer will:
1. Install Homebrew (if needed)
2. Install Python 3.11, Node.js 20, and Mosquitto
3. Set up Thermi-Nator in `~/.thermi-nator`
4. Create LaunchAgents for automatic startup
5. Start all services

## Post-Installation

1. **Edit configuration:**
   ```bash
   nano ~/.thermi-nator/backend/.env
   ```

2. **Update MQTT and location settings**

3. **Restart services:**
   ```bash
   launchctl stop com.thermi-nator.backend
   launchctl start com.thermi-nator.backend
   ```

4. **Access dashboard:**
   Open http://localhost:5173 in your browser

## Service Management

### Check Status
```bash
launchctl list | grep thermi-nator
```

### View Logs
```bash
tail -f ~/Library/Logs/thermi-nator-backend.log
tail -f ~/Library/Logs/thermi-nator-frontend.log
```

### Restart Services
```bash
launchctl restart com.thermi-nator.backend
launchctl restart com.thermi-nator.frontend
```

## Uninstall

```bash
# Stop services
launchctl unload ~/Library/LaunchAgents/com.thermi-nator.backend.plist
launchctl unload ~/Library/LaunchAgents/com.thermi-nator.frontend.plist

# Remove files
rm ~/Library/LaunchAgents/com.thermi-nator.*.plist
rm -rf ~/.thermi-nator
```

## Troubleshooting

**Services won't start:**
- Check logs in `~/Library/Logs/thermi-nator-*.log`
- Verify MQTT settings in `~/.thermi-nator/backend/.env`

**Can't access dashboard:**
- Ensure services are running: `launchctl list | grep thermi-nator`
- Try http://127.0.0.1:5173

**Port already in use:**
- Check if another service is using port 5173 or 8000
- Stop conflicting service or change Thermi-Nator ports
