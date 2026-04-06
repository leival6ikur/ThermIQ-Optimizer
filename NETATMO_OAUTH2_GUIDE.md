# NetAtmo OAuth2 Setup Guide (Future-Proof)

## ✨ What's New: OAuth2 Authorization Code Flow

Your Thermi-Nator now uses **OAuth2 Authorization Code flow** instead of password-based authentication. This is:

- ✅ **More secure** - No password storage
- ✅ **Future-proof** - Standard OAuth2 won't be deprecated
- ✅ **User-controlled** - Manage access via NetAtmo's website
- ✅ **Auto-refreshing** - Tokens refresh automatically, no re-authentication

## Quick Setup (5 Minutes)

### Step 1: Get NetAtmo API Credentials

**1. Go to NetAtmo Developer Portal:**
```
https://dev.netatmo.com/
```

**2. Create an App:**
- Click **"Create"** → **"Create an app"**
- **Name**: `ThermIQ Integration`
- **Description**: `Home automation weather integration`
- **Data Protection Officer**: Your email
- Click **"Create"**

**3. Copy Credentials:**
- **Client ID**: `5a1b2c3d4e5f6a7b8c9d0e1f` (example)
- **Client Secret**: `abc123def456...` (example)

### Step 2: Configure in Thermi-Nator

**1. Open Settings:**
```
http://localhost:5173/settings
```

**2. Find NetAtmo Section:**
- Scroll to "NetAtmo Weather Station"
- Click **"Setup NetAtmo"** or **"Configure NetAtmo"**

**3. Enter Credentials:**
- Paste **Client ID**
- Paste **Client Secret**
- Click **"Connect to NetAtmo"**

**4. Authorize in Popup:**
- NetAtmo authorization page opens in popup
- Log in with your NetAtmo account
- Click **"Authorize"** or **"Accept"**
- Popup closes automatically
- You'll see: ✓ Successfully connected to NetAtmo!

**5. Restart Backend:**
```bash
# Stop the backend (Ctrl+C in terminal)

cd /Users/hvissel/Documents/ThermIQ/backend
source venv/bin/activate
python -m uvicorn app.main:app --reload
```

**Check logs for:**
```
NetAtmo OAuth2 service initialized and connected
NetAtmo OAuth2 polling task started (interval: 600s)
```

### Step 3: Verify It's Working

**Check Connection Status:**
```bash
curl http://localhost:8000/api/auth/netatmo/status | python3 -m json.tool
```

Should show:
```json
{
  "connected": true,
  "message": "Connected and working",
  "indoor_temp": 24.1,
  "outdoor_temp": 5.0
}
```

**Check Dashboard:**
- Open http://localhost:5173
- Indoor temperature should show NetAtmo reading (~24°C)

## How OAuth2 Works

### Traditional Password Flow (Old)
```
❌ You enter username + password
❌ Stored in config file
❌ Less secure
❌ May be deprecated
```

### OAuth2 Authorization Code Flow (New)
```
✅ You authorize via NetAtmo's website
✅ Backend receives secure tokens
✅ Tokens auto-refresh
✅ Standard OAuth2 protocol
```

### The Flow

```
┌─────────────┐
│   You       │
│ (Browser)   │
└──────┬──────┘
       │ 1. Click "Connect to NetAtmo"
       ▼
┌─────────────────────┐
│ Thermi-Nator        │
│ GET /authorize      │  2. Generate auth URL
└──────┬──────────────┘
       │ 3. Redirect to NetAtmo
       ▼
┌──────────────────────┐
│ NetAtmo Website      │
│ (OAuth Server)       │  4. User logs in & authorizes
└──────┬───────────────┘
       │ 5. Redirect back with code
       ▼
┌─────────────────────┐
│ Thermi-Nator        │
│ /callback           │  6. Exchange code for tokens
│                     │  7. Store tokens securely
│ Polls API every     │  8. Fetch temperature data
│ 10 minutes          │
└─────────────────────┘
```

## Token Management

### Where Tokens are Stored
```
/Users/hvissel/Documents/ThermIQ/data/netatmo_token.json
```

**File permissions:** `0600` (only you can read)

**Token structure:**
```json
{
  "access_token": "abc123...",
  "refresh_token": "xyz789...",
  "expires_in": 10800,
  "expires_at": 1713456789
}
```

### Automatic Token Refresh

**pyatmo handles this automatically:**
- Access tokens expire after ~3 hours
- Refresh token is used to get new access token
- No user interaction needed
- New tokens saved via `token_updater` callback

**Backend logs:**
```
NetAtmo token refreshed
```

### Manual Token Refresh

If needed, restart the backend or call:
```bash
curl -X POST http://localhost:8000/api/auth/netatmo/disconnect
# Then reconnect via settings page
```

## Configuration

### config.yaml Settings

```yaml
netatmo:
  enabled: true
  oauth_connected: true  # Set by OAuth flow
  client_id: '5a1b2c3d4e5f6a7b8c9d0e1f'
  client_secret: 'your_secret_here'
  polling_interval: 600  # seconds
```

**Notes:**
- `oauth_connected: true` enables OAuth2 service
- `oauth_connected: false` or missing falls back to password auth (legacy)
- No `username` or `password` fields needed!

### Polling Interval

- **Default**: 600 seconds (10 minutes)
- **Min**: 300 seconds (5 minutes)
- **Max**: 3600 seconds (60 minutes)
- **NetAtmo update frequency**: Every 5-10 minutes

## API Endpoints

### GET /api/auth/netatmo/authorize

Get authorization URL to redirect user.

**Response:**
```json
{
  "authorization_url": "https://api.netatmo.com/oauth2/authorize?...",
  "state": "random_csrf_token"
}
```

### GET /api/auth/netatmo/callback

OAuth callback (called by NetAtmo after authorization).

**Query params:**
- `code`: Authorization code
- `state`: CSRF protection token

**Response:** Redirects to `/settings?netatmo_success=true`

### GET /api/auth/netatmo/status

Check current connection status.

**Response:**
```json
{
  "connected": true,
  "message": "Connected and working",
  "indoor_temp": 24.1,
  "outdoor_temp": 5.0
}
```

### POST /api/auth/netatmo/disconnect

Disconnect and remove stored tokens.

**Response:**
```json
{
  "success": true,
  "message": "NetAtmo disconnected successfully"
}
```

## Troubleshooting

### "Not authenticated. Please connect to NetAtmo first."

**Solution:** Complete OAuth flow via Settings page → Setup NetAtmo → Connect

### "Authorization failed: invalid_grant"

**Causes:**
- Token expired and refresh failed
- App credentials changed in NetAtmo portal
- Token file corrupted

**Solution:**
```bash
# Remove token file
rm /Users/hvissel/Documents/ThermIQ/data/netatmo_token.json

# Reconnect via settings page
```

### Popup Blocked

**Solution:**
- Allow popups for localhost:5173
- Or manually open authorization URL in new tab

### Token Not Refreshing

**Check logs:**
```bash
tail -f /Users/hvissel/Documents/ThermIQ/data/logs/thermiq.log | grep -i "netatmo\|token"
```

**Should see:**
```
NetAtmo token refreshed
```

If not, disconnect and reconnect.

### "No NetAtmo stations found"

**Check:**
- Is your weather station visible at https://my.netatmo.com/?
- Are you logged in with the correct account?
- Did you authorize read_station scope?

## Backward Compatibility

### Migrating from Password Auth

If you previously used password authentication:

1. **Old config still works** (fallback to password auth)
2. **To migrate to OAuth2:**
   - Go to Settings → NetAtmo section
   - Click "Configure NetAtmo"
   - Click "Connect to NetAtmo"
   - Authorize in popup
3. **Backend detects OAuth connection** and switches automatically

### config.yaml Before (Password)
```yaml
netatmo:
  enabled: true
  client_id: 'abc123'
  client_secret: 'secret'
  username: 'your@email.com'
  password: 'your_password'
```

### config.yaml After (OAuth2)
```yaml
netatmo:
  enabled: true
  oauth_connected: true
  client_id: 'abc123'
  client_secret: 'secret'
  # No username/password needed!
```

## Security

### OAuth2 vs Password

| Aspect | Password Auth | OAuth2 |
|--------|--------------|---------|
| Password storage | ❌ Stored in config | ✅ Never stored |
| Token expiration | N/A | ✅ Auto-refreshes |
| Revoke access | Must change password | ✅ Via NetAtmo website |
| API compliance | ⚠️ Legacy method | ✅ Standard OAuth2 |
| Future-proof | ❌ May be deprecated | ✅ Industry standard |

### Token Security

**Stored securely:**
- File: `data/netatmo_token.json`
- Permissions: `0600` (owner read/write only)
- Not in git (in .gitignore)

**Access control:**
- Tokens scoped to `read_station` only
- Can't control devices or modify settings
- Can revoke via NetAtmo's website

**CSRF protection:**
- Random `state` parameter generated
- Validated on callback

## Raspberry Pi Deployment

**Same setup process!**

1. **Copy config:**
```bash
scp ~/Documents/ThermIQ/data/config.yaml pi@raspberrypi:~/.thermiq/
```

2. **Authorize via SSH tunnel** (if no GUI):
```bash
# On Pi, forward port 8000
ssh -L 8000:localhost:8000 pi@raspberrypi

# On Mac, open browser to:
http://localhost:8000/api/auth/netatmo/authorize
# Follow OAuth flow in browser
```

3. **Or authorize on Mac, then copy token:**
```bash
scp ~/Documents/ThermIQ/data/netatmo_token.json pi@raspberrypi:~/.thermiq/
```

**Everything else works identically!**

## Summary

✅ **OAuth2 Authorization Code flow** - Industry standard  
✅ **Secure token storage** - No password in config  
✅ **Automatic refresh** - No re-authentication  
✅ **User-controlled access** - Manage via NetAtmo  
✅ **Future-proof** - Won't be deprecated  
✅ **Backward compatible** - Password auth still works  
✅ **Easy migration** - One-click upgrade  

**Your NetAtmo integration is now future-proof and secure!** 🎉
