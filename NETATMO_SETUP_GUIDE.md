# NetAtmo Weather Station Setup Guide

## Why NetAtmo?

Your heat pump's internal sensor reads **~20°C** while your NetAtmo shows **24.1°C**. This 4°C difference matters for optimization! NetAtmo provides:

- **More accurate room temperature** (sensor placement independent of heat pump)
- **Better optimization decisions** (based on actual room conditions)
- **Dedicated outdoor sensor** (more reliable than heat pump sensor)

## Prerequisites

✅ NetAtmo Weather Station already installed and working  
✅ NetAtmo account with access to your station  
✅ Internet connection for API access  

## Step-by-Step Setup

### 1. Get NetAtmo API Credentials

**Go to NetAtmo Developer Portal:**
```
https://dev.netatmo.com/
```

**Create Developer Account:**
- Log in with your regular NetAtmo account credentials
- Accept developer terms if prompted

**Create an App:**
1. Click **"Create"** → **"Create an app"**
2. Fill in the form:
   - **App Name**: `ThermIQ Integration` (or any name you prefer)
   - **Description**: `Personal weather station integration for home automation`
   - **Data Protection Officer**: Your email address
   - **Data Protection Officer Email**: Same as above
3. Click **"Create"**

**Get Your Credentials:**
After creating the app, you'll see:
- **Client ID**: `5a1b2c3d4e5f6a7b8c9d0e1f` (example)
- **Client Secret**: `abc123def456ghi789jkl012` (example)

**Important:** Keep these credentials secure!

### 2. Configure in Thermi-Nator

**Open Settings Page:**
```
http://localhost:5173/settings
```

**Find NetAtmo Section:**
- Scroll down to "NetAtmo Weather Station"
- Click **"Setup NetAtmo"** button

**Enter Credentials:**
1. **Enable NetAtmo Integration**: Check the box
2. **Client ID**: Paste from developer portal
3. **Client Secret**: Paste from developer portal
4. **Username**: Your NetAtmo account email
5. **Password**: Your NetAtmo account password
6. **Polling Interval**: 600 seconds (default, NetAtmo updates every 5-10 min)

**Test Connection:**
- Click **"Test Connection"** button
- Should show: ✓ Connection Successful
- Should display current temperatures:
  - Indoor: 24.1°C (example)
  - Outdoor: 5.0°C (example)
- Lists your weather station name

**Save Configuration:**
- Click **"Save Configuration"**
- You'll see: "NetAtmo configuration saved. Restart backend to apply changes."

### 3. Restart Backend

**Stop the backend:**
- Go to the terminal where backend is running
- Press `Ctrl+C` to stop

**Restart the backend:**
```bash
cd /Users/hvissel/Documents/ThermIQ/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Check Logs:**
You should see:
```
NetAtmo service initialized
NetAtmo polling task started (interval: 600s)
```

After 10-15 seconds, you should see:
```
NetAtmo reading: indoor=24.1°C, outdoor=5.0°C
NetAtmo temperature data saved to database
```

### 4. Verify Integration

**Check API Status:**
```bash
curl http://localhost:8000/api/status | python3 -m json.tool
```

Should show:
```json
{
  "current_temperature": {
    "indoor": 24.1,
    "outdoor": 5.0,
    ...
  }
}
```

**Check Dashboard:**
- Open http://localhost:5173
- Indoor temperature should now show NetAtmo reading (~24°C)
- More accurate than heat pump sensor (~20°C)

## How It Works

1. **Polling**: Backend polls NetAtmo API every 10 minutes
2. **Caching**: Readings cached for 10 minutes to reduce API calls
3. **Database**: Saved with `source='netatmo'` tag
4. **Blending**: Can use NetAtmo for indoor and heat pump for other sensors

## Data Flow

```
NetAtmo Cloud API
      ↓ (every 10 min)
Backend NetAtmo Service
      ↓
Database (source='netatmo')
      ↓
Dashboard Display
      ↓
Optimization Engine
```

## Configuration Options

### Polling Interval
- **Min**: 300 seconds (5 minutes)
- **Max**: 3600 seconds (60 minutes)
- **Default**: 600 seconds (10 minutes)
- **Recommended**: 600s (NetAtmo updates every 5-10 min anyway)

### Temperature Sources
Currently, NetAtmo provides:
- `indoor`: Room temperature (from main station)
- `outdoor`: Outside temperature (from outdoor module)

Heat pump still provides:
- `supply`: Floor heating supply temperature
- `return`: Floor heating return temperature
- `hot_water`: Hot water tank temperature
- `brine_in`: Brine input temperature
- `brine_out`: Brine output temperature

## Troubleshooting

### "Connection Failed" Error

**Check credentials:**
- Client ID and Secret correct?
- Username is your NetAtmo email
- Password is your NetAtmo password

**Check NetAtmo account:**
- Can you log in to https://my.netatmo.com/?
- Is your weather station visible there?

**Check network:**
- Is the backend machine connected to internet?
- Can you access dev.netatmo.com from your browser?

### "No stations found"

**Verify ownership:**
- Station must be registered to the NetAtmo account you're using
- If station belongs to someone else, ask them to add you as a "Guest" in NetAtmo app

### Backend doesn't start polling

**Check logs:**
```bash
tail -f /Users/hvissel/Documents/ThermIQ/data/logs/thermiq.log | grep -i netatmo
```

Should see:
```
NetAtmo service initialized
NetAtmo polling task started
```

If you see errors, they'll appear here.

### Indoor temp still shows ~20°C on dashboard

**Wait 10 minutes:**
- NetAtmo polling happens every 10 minutes
- Initial reading comes within first interval

**Check database:**
```bash
sqlite3 /Users/hvissel/Documents/ThermIQ/data/thermiq.db "SELECT timestamp, indoor, outdoor, source FROM temperature_readings WHERE source='netatmo' ORDER BY timestamp DESC LIMIT 5;"
```

Should show recent NetAtmo readings.

## Security Notes

### Credentials Storage
- Credentials stored in `/Users/hvissel/Documents/ThermIQ/data/config.yaml`
- File permissions: `0600` (only you can read)
- Never commit config.yaml to git (already in .gitignore)

### API Rate Limits
NetAtmo API limits:
- **50 requests per 10 seconds** (burst)
- **500 requests per hour**

Our polling rate (every 10 minutes = 6/hour) is well within limits.

### OAuth2 vs Password
NetAtmo officially deprecated password authentication in favor of OAuth2. However:
- Password auth still works for personal use
- OAuth2 requires web server callback (complex setup)
- For single-user home automation, password auth is simpler

If NetAtmo fully disables password auth in the future, we'll need to implement OAuth2 flow.

## Raspberry Pi Deployment

When you move to Raspberry Pi:

1. **Copy config.yaml** from Mac:
```bash
scp /Users/hvissel/Documents/ThermIQ/data/config.yaml pi@raspberrypi:~/.thermiq/
```

2. **Restart backend on Pi:**
```bash
sudo systemctl restart thermiq-backend
```

3. **Check logs on Pi:**
```bash
sudo journalctl -u thermiq-backend -f | grep -i netatmo
```

**Everything else works identically!** Same credentials, same API calls, same data flow.

## Summary

✅ **More accurate temperature** - NetAtmo sensor vs heat pump sensor  
✅ **Better optimization** - Decisions based on actual room conditions  
✅ **Easy setup** - 5 minutes to configure  
✅ **Automatic polling** - No manual data fetching  
✅ **Database persistence** - All readings saved  
✅ **Portable** - Same config works on Mac and Raspberry Pi  

Your optimization engine now has the most accurate temperature data possible!
