# ThermIQ Troubleshooting Guide

Quick solutions for common problems.

---

## Connection Issues

### MQTT Status Shows "Down"

**Symptoms:**
- Red "MQTT: Down" indicator
- No real-time temperature updates
- "MQTT connection lost" error

**Solutions:**

1. **Check if Mosquitto broker is running:**
   ```bash
   ps aux | grep mosquitto
   ```
   
   If not running:
   ```bash
   mosquitto -c /path/to/mosquitto.conf -d
   ```

2. **Verify MQTT configuration:**
   - Check `data/config.yaml`
   - Ensure `mqtt.host` and `mqtt.port` are correct
   - Default: `localhost:1883`

3. **Test MQTT connection:**
   ```bash
   mosquitto_sub -h localhost -p 1883 -t "#" -v
   ```
   Should see messages if broker working

4. **Restart backend:**
   ```bash
   cd backend
   source venv/bin/activate
   python -m app.main
   ```

**Still not working?**
- Check firewall rules (port 1883)
- Verify heat pump MQTT client configured
- Check broker logs: `/var/log/mosquitto/mosquitto.log`

---

### WebSocket Shows "Down"

**Symptoms:**
- Red "WS: Down" indicator
- No live updates in browser
- Need to refresh page manually

**Solutions:**

1. **Refresh the page:**
   - Press F5 or Cmd+R
   - WebSocket will attempt reconnect

2. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return JSON with status

3. **Verify WebSocket endpoint:**
   - Open browser console (F12)
   - Look for WebSocket errors
   - Should connect to `ws://localhost:8000/ws`

4. **Check for port conflicts:**
   ```bash
   lsof -i :8000
   ```
   Only one process should be using port 8000

---

## Temperature Problems

### Indoor Temperature Not Updating

**Symptoms:**
- Temperature shows "--" or old value
- Last update time is old (>5 minutes)
- "No temperature data" error

**Causes & Solutions:**

1. **MQTT disconnected** → See MQTT troubleshooting above

2. **Heat pump not publishing data:**
   - Check heat pump display (is it powered?)
   - Verify MQTT topic configuration
   - Expected topic: `/thermiq/temperatures`
   
   Test:
   ```bash
   mosquitto_sub -h localhost -t "/thermiq/#" -v
   ```

3. **Wrong MQTT topics:**
   - Check heat pump MQTT settings
   - Verify topics match config.yaml
   - Update if needed and restart

---

### Temperature Fluctuating Wildly

**Symptoms:**
- Indoor temp varies >2°C in short time
- Constant up/down swings
- Poor comfort

**Solutions:**

1. **Reduce optimization aggressiveness:**
   - Settings → Strategy → Change to "Conservative"
   - Reduce tolerance to 0.5°C
   - Extend comfort hours

2. **Check heat curve:**
   - May be set too high
   - Try reducing by 1-2 points
   - Monitor for 24 hours

3. **Check for air leaks:**
   - Drafts cause rapid temperature changes
   - Seal windows, doors
   - Check ventilation system

4. **Verify sensor placement:**
   - Indoor sensor should be:
     - Away from direct sunlight
     - Not near heating vents
     - Central location
     - 1.5m above floor

---

### Temperature Always Below Target

**Symptoms:**
- Indoor temp consistently 1-2°C low
- System seems to be heating but not enough
- COP looks normal

**Solutions:**

1. **Check heating schedule:**
   - Is system scheduling enough heating hours?
   - Try aggressive strategy temporarily
   - Verify prices are being fetched

2. **Increase heat curve:**
   - Settings → Heat Curve → Increase by 2 points
   - Increases supply temperature
   - Monitor for 24-48 hours

3. **Check for heat loss:**
   - Unusual cold weather?
   - New air leaks?
   - Insulation issues?
   - Windows left open?

4. **Verify heat pump operation:**
   - Check compressor running
   - Listen for circulation pump
   - Check brine temps (should have 2-3°C delta)

---

## Pricing & Schedule Issues

### No Price Data Available

**Symptoms:**
- "No electricity price data" warning
- Empty price chart
- Schedule shows "--" prices

**Solutions:**

1. **Wait for automatic fetch:**
   - Prices publish at 13:00 UTC
   - System automatically fetches
   - Check back after 13:10 UTC

2. **Manual price refresh:**
   - Settings → Refresh Prices button
   - Wait 10-30 seconds
   - Check if data appears

3. **Check Nord Pool API:**
   - Test: https://www.nordpoolgroup.com/api/marketdata/page/10
   - Should return JSON data
   - If down, wait for service restoration

4. **Verify region setting:**
   - Settings → Nord Pool Region
   - Should be "EE" for Estonia
   - Wrong region = no matching data

5. **Check internet connection:**
   ```bash
   ping 8.8.8.8
   curl https://www.google.com
   ```

---

### Schedule Not Following Prices

**Symptoms:**
- Heating during expensive hours
- Not heating during cheap hours
- Schedule seems random

**Solutions:**

1. **Check optimization strategy:**
   - Conservative strategy prioritizes comfort over savings
   - Try balanced or aggressive

2. **Verify tolerance settings:**
   - Very tight tolerance (0.1-0.3°C) limits optimization
   - Increase to 1.0°C for more flexibility

3. **Review comfort hours:**
   - During comfort hours, temp must stay exact
   - Reduces optimization flexibility
   - Consider narrowing window

4. **Check current temperature:**
   - If temp very low, system must heat regardless of price
   - This is correct behavior (safety)

5. **Verify manual override not active:**
   - Check mode shows "🤖 Optimized"
   - If manual, switch back to optimized

---

### Wrong Timezone in Schedule

**Symptoms:**
- Schedule times off by 2-3 hours
- Prices don't match hour labels
- Heat turning on at wrong times

**Solutions:**

1. **This should be fixed now:**
   - Recent update fixed UTC→Local conversion
   - Refresh browser (Ctrl+F5)
   - Check times now correct

2. **Verify system timezone:**
   ```bash
   timedatectl
   ```
   Should show your local timezone

3. **Check browser timezone:**
   - Browser uses system timezone
   - Ensure OS timezone correct
   - Restart browser after changing

---

## Performance Issues

### Low COP Warning

**Symptoms:**
- Alert: "Low Heat Pump Efficiency"
- COP < 2.0
- High power consumption

**Causes & Solutions:**

1. **Very cold weather:**
   - COP naturally drops when outdoor <-10°C
   - This is normal physics
   - Not a problem if temporary

2. **Heat curve too high:**
   - High supply temp → worse COP
   - Try reducing curve by 1-2 points
   - Lower supply temp = better efficiency

3. **Ground loop issues (GSHP):**
   - Check brine temperature delta
   - Should be 2-3°C difference
   - Low delta → poor ground heat extraction
   - Check circulation pump

4. **System needs service:**
   - Low refrigerant
   - Dirty filters
   - Compressor issues
   - → Call HVAC technician

---

### High Duty Cycle (>80%)

**Symptoms:**
- System running almost constantly
- Alert about high duty cycle
- Increased wear concerns

**Causes & Solutions:**

1. **Cold weather:**
   - High duty cycle normal when very cold
   - System working correctly
   - Will reduce when weather improves

2. **Undersized system:**
   - Heat pump too small for building
   - Cannot meet heating demand
   - Consider:
     - Improve insulation
     - Reduce heat loss
     - Supplemental heating
     - Upgrade heat pump (expensive)

3. **Heat curve too low:**
   - System trying but supply temp too low
   - Increase curve by 1-2 points
   - Find balance between COP and capacity

---

### Frequent Cycling (>4 per hour)

**Symptoms:**
- Heat pump turning on/off frequently
- Short run times (<15 minutes)
- Alert about cycling

**Causes & Solutions:**

1. **Oversized system:**
   - Heat pump too powerful for heating load
   - Reaches temp quickly, shuts off
   - Solutions:
     - Reduce heat curve
     - Consider buffer tank
     - Multi-stage compressor setting

2. **Poor control logic:**
   - Heat curve set incorrectly
   - Try reducing by 2-3 points
   - Longer run times at lower output

3. **Building fast response:**
   - Well-insulated = quick temp changes
   - Increase temperature tolerance
   - Allows longer cycles

---

## Alert Issues

### Too Many Alerts

**Symptoms:**
- Dozens of active alerts
- Alert panel overwhelming
- Mostly low-priority info

**Solutions:**

1. **Adjust alert thresholds:**
   - Settings → Alerts → Configuration
   - Increase COP threshold if getting false alarms
   - Increase price opportunity threshold
   - Increase max active alerts limit

2. **Dismiss old alerts:**
   - Click "✕ Dismiss" on resolved issues
   - Acknowledge (✓ Ack) less important ones
   - System auto-deletes after 30 days

3. **Disable alert types:**
   - Currently all-or-nothing
   - Feature request: Per-type enable/disable
   - Temporary: Set very high thresholds

---

### Missing Expected Alerts

**Symptoms:**
- No alerts appearing
- Known issues not triggering alerts
- Alert panel always empty

**Solutions:**

1. **Check if alerts enabled:**
   - Settings → Alerts → Enabled checkbox
   - Should be checked

2. **Verify evaluation running:**
   - Backend logs should show:
     ```
     Running scheduled alert evaluation...
     ```
   - Every 15 minutes

3. **Check alert thresholds:**
   - May be set too permissive
   - Lower COP threshold to test
   - Reduce price opportunity threshold

4. **Manual trigger:**
   - API: `POST /api/alerts/evaluate`
   - Or restart backend
   - Should see alerts within minutes

---

## Database Issues

### Database Errors in Logs

**Symptoms:**
- Errors about "database is locked"
- "unable to open database file"
- Data not saving

**Solutions:**

1. **Check database file permissions:**
   ```bash
   ls -l data/thermiq.db
   ```
   Should be writable by user running backend

2. **Fix permissions if needed:**
   ```bash
   chmod 644 data/thermiq.db
   chmod 755 data/
   ```

3. **Check disk space:**
   ```bash
   df -h
   ```
   Ensure sufficient free space (>1GB)

4. **Repair database (if corrupted):**
   ```bash
   sqlite3 data/thermiq.db "PRAGMA integrity_check;"
   ```
   
   If errors:
   ```bash
   sqlite3 data/thermiq.db ".dump" > backup.sql
   mv data/thermiq.db data/thermiq.db.old
   sqlite3 data/thermiq.db < backup.sql
   ```

---

### Database Growing Too Large

**Symptoms:**
- thermiq.db file >500MB
- Slow queries
- Disk space filling

**Solutions:**

1. **Run maintenance manually:**
   ```bash
   curl -X POST http://localhost:8000/api/maintenance/run
   ```
   
   Aggregates old data and cleans up

2. **Check retention settings:**
   - Default: 30 days raw data
   - After that, hourly aggregates only
   - Adjust in code if needed (database.py)

3. **Vacuum database:**
   ```bash
   sqlite3 data/thermiq.db "VACUUM;"
   ```
   Compacts database file

4. **Archive old data:**
   ```bash
   sqlite3 data/thermiq.db ".backup data/thermiq_backup_$(date +%Y%m%d).db"
   # Then delete old data from main DB
   ```

---

## Frontend Issues

### Page Not Loading

**Symptoms:**
- Blank page
- "Connection refused"
- Loading forever

**Solutions:**

1. **Check if frontend is running:**
   ```bash
   lsof -i :3000
   ```
   Should show node/vite process

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Check for build errors:**
   - Look for red errors in terminal
   - Fix TypeScript errors
   - Run `npm install` if packages missing

4. **Clear browser cache:**
   - Ctrl+Shift+Delete (Chrome)
   - Clear cache and reload
   - Or try incognito/private mode

---

### Charts Not Displaying

**Symptoms:**
- Empty chart area
- "No data available"
- Chart component errors

**Solutions:**

1. **Check browser console:**
   - F12 → Console tab
   - Look for errors
   - May reveal missing data

2. **Verify API returning data:**
   ```bash
   curl http://localhost:8000/api/temperatures/history?hours=24
   ```
   Should return JSON with temperatures

3. **Check data format:**
   - Recharts expects specific format
   - Look for null/undefined values
   - Timestamps must be valid

4. **Reload page:**
   - Sometimes chart libraries need refresh
   - Ctrl+F5 (hard reload)

---

### Real-time Updates Not Working

**Symptoms:**
- Temperatures not updating live
- Need to refresh page manually
- WebSocket connected but no updates

**Solutions:**

1. **Check WebSocket connection:**
   - Status shows "WS: OK"?
   - If down, refresh page

2. **Verify MQTT messages flowing:**
   - MQTT must be connected
   - Heat pump must be publishing
   - Check with `mosquitto_sub`

3. **Check browser throttling:**
   - Some browsers throttle inactive tabs
   - Make sure tab is visible/active
   - Check browser console for errors

---

## System-Wide Issues

### Backend Won't Start

**Symptoms:**
- Error when running `python -m app.main`
- Import errors
- Port already in use

**Solutions:**

1. **Check Python version:**
   ```bash
   python --version
   ```
   Need Python 3.9 or newer

2. **Install dependencies:**
   ```bash
   cd backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Check port availability:**
   ```bash
   lsof -i :8000
   ```
   If in use, kill process or change port

4. **Check for import errors:**
   - Look at error message
   - Usually missing package
   - Install with pip

5. **Verify config file exists:**
   ```bash
   ls data/config.yaml
   ```
   If missing, run first-time setup

---

### High CPU Usage

**Symptoms:**
- System slow
- Fan running constantly
- Top shows high CPU for python/node

**Solutions:**

1. **Check for infinite loops:**
   - Look at backend logs
   - Any repeated errors?
   - May need to restart

2. **Reduce data retention:**
   - If processing huge datasets
   - Adjust retention in config
   - Run manual cleanup

3. **Optimize frontend:**
   - Reduce chart data points
   - Limit history hours
   - Use production build:
     ```bash
     npm run build
     ```

4. **Check for memory leaks:**
   - Restart services periodically
   - Monitor memory usage
   - Report if persistent

---

### System Not Starting After Reboot

**Symptoms:**
- After Raspberry Pi restart, nothing works
- Need to manually start everything
- Services don't auto-start

**Solutions:**

1. **Set up systemd services:**
   
   Create `/etc/systemd/system/thermiq-backend.service`:
   ```ini
   [Unit]
   Description=ThermIQ Backend
   After=network.target mosquitto.service
   
   [Service]
   Type=simple
   User=pi
   WorkingDirectory=/home/pi/ThermIQ
   ExecStart=/home/pi/ThermIQ/backend/venv/bin/python -m app.main
   Restart=always
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   Enable:
   ```bash
   sudo systemctl enable thermiq-backend
   sudo systemctl start thermiq-backend
   ```

2. **Set up Mosquitto auto-start:**
   ```bash
   sudo systemctl enable mosquitto
   sudo systemctl start mosquitto
   ```

3. **Frontend (for production):**
   - Build production bundle
   - Serve with nginx or similar
   - Or add systemd service for vite

---

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide** ✓
2. **Review USER_GUIDE.md** for feature explanations
3. **Check FAQ.md** for common questions
4. **Look at backend logs:**
   ```bash
   tail -f data/logs/thermiq.log
   ```
5. **Check browser console** (F12)

### How to Report Issues

Include:
- **What you expected to happen**
- **What actually happened**
- **Steps to reproduce**
- **Error messages** (full text)
- **Screenshots** (if relevant)
- **System info**:
  - OS version
  - Python version
  - Node version
  - Browser name/version

### Where to Get Help

- **GitHub Issues**: https://github.com/leival6ikur/ThermIQ-Optimizer/issues
- **Include "logs"** from:
  - `data/logs/thermiq.log`
  - Browser console (F12)
  - MQTT logs (if relevant)

---

**Last Updated:** April 3, 2026  
**Next Review:** When new features added or common issues discovered
