# Thermi-Nator Deployment Guide

This guide explains how to deploy and configure Thermi-Nator for different use cases.

## Location Configuration

Thermi-Nator needs to know your heat pump's location for weather data and accurate optimization. There are several ways to configure this depending on your deployment scenario:

### Option 1: Configuration File (Recommended for Self-Hosted)

Edit `/data/config.yaml` or copy and edit `/config/config.yaml.example`:

```yaml
location:
  address: "Your City, Country"  # Display name (appears in dashboard header)
  latitude: 51.5074              # Your location's latitude
  longitude: -0.1278              # Your location's longitude
  timezone: "Europe/London"       # IANA timezone identifier
```

**How to find your coordinates:**
- Use Google Maps: Right-click on your location → Click on coordinates to copy
- Use [LatLong.net](https://www.latlong.net/)
- Use GPS coordinates from your phone

**Timezone identifiers:** [List of tz database time zones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)

### Option 2: Environment Variables (Recommended for Docker/Cloud)

Set these environment variables before starting Thermi-Nator:

```bash
export THERMIQ_ADDRESS="Your City, Country"
export THERMIQ_LATITUDE="51.5074"
export THERMIQ_LONGITUDE="-0.1278"
export THERMIQ_TIMEZONE="Europe/London"
```

With Docker:

```bash
docker run -d \
  -e THERMIQ_ADDRESS="Your City, Country" \
  -e THERMIQ_LATITUDE="51.5074" \
  -e THERMIQ_LONGITUDE="-0.1278" \
  -e THERMIQ_TIMEZONE="Europe/London" \
  thermiq:latest
```

With Docker Compose:

```yaml
services:
  thermiq:
    image: thermiq:latest
    environment:
      THERMIQ_ADDRESS: "Your City, Country"
      THERMIQ_LATITUDE: "51.5074"
      THERMIQ_LONGITUDE: "-0.1278"
      THERMIQ_TIMEZONE: "Europe/London"
```

Environment variables take precedence over config file values.

### Option 3: Multi-Tenant / SaaS Deployment

If you're deploying Thermi-Nator as a service for multiple users, you'll need to implement per-user location storage:

**Database Schema Extension:**

```sql
CREATE TABLE user_installations (
    id INTEGER PRIMARY KEY,
    user_id TEXT NOT NULL,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Implementation Steps:**

1. Add user authentication (JWT, OAuth, etc.)
2. Create user settings API endpoints
3. Store location per user in database
4. Update optimization engine to use user-specific location
5. Add location configuration to Settings page UI

**Reference Implementation Files:**
- `backend/app/services/user_service.py` (to be created)
- `backend/app/api/routes.py` - Add `/api/users/{user_id}/location` endpoints
- `frontend/src/pages/SettingsPage.tsx` - Add location configuration form

## Deployment Scenarios

### Single User (Home Installation)

**Recommended:** Configuration file approach

1. Copy `config/config.yaml.example` to `data/config.yaml`
2. Edit location section with your coordinates
3. Start Thermi-Nator: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

### Multiple Separate Deployments

**Recommended:** Environment variables per instance

Each user deploys their own Thermi-Nator instance with their own configuration:

```bash
# User 1 deployment
THERMIQ_ADDRESS="Oslo, Norway" \
THERMIQ_LATITUDE="59.9139" \
THERMIQ_LONGITUDE="10.7522" \
THERMIQ_TIMEZONE="Europe/Oslo" \
uvicorn app.main:app --port 8001

# User 2 deployment
THERMIQ_ADDRESS="Helsinki, Finland" \
THERMIQ_LATITUDE="60.1699" \
THERMIQ_LONGITUDE="24.9384" \
THERMIQ_TIMEZONE="Europe/Helsinki" \
uvicorn app.main:app --port 8002
```

### Multi-Tenant SaaS

**Recommended:** Database-backed user settings + authentication

Requires implementing:
- User authentication system
- Per-user location storage in database
- API endpoints for user settings management
- Settings UI for location configuration

See "Option 3: Multi-Tenant / SaaS Deployment" above for implementation guidance.

## Security Considerations

### Self-Hosted Deployments

- Keep config files outside web root
- Use environment variables for sensitive data (API keys, passwords)
- Enable firewall rules to restrict access
- Use HTTPS with reverse proxy (nginx, Caddy)

### Multi-Tenant Deployments

- Implement proper authentication (OAuth 2.0, JWT)
- Validate and sanitize all user inputs
- Implement rate limiting
- Use prepared statements for database queries
- Encrypt sensitive data at rest
- Regular security audits

## Weather Data Integration

Location configuration is crucial for:
- **Nord Pool pricing:** Uses latitude/longitude to determine grid region
- **Weather forecasting:** Fetches outdoor temperature predictions for optimization
- **Timezone handling:** Ensures correct scheduling and price timing

**Note:** If location is not configured (latitude/longitude = 0), Thermi-Nator will:
- Use default timezone (UTC)
- Skip weather-based optimizations
- Show a warning in the dashboard

## Updating Location

To change location after initial setup:

1. **Config file method:** Edit `data/config.yaml` and restart backend
2. **Environment variables:** Update variables and restart container/service
3. **Multi-tenant:** Users update via Settings page (no restart needed)

## Troubleshooting

**Dashboard shows no address:**
- Check `GET /api/config/location` returns your address
- Verify config file or environment variables are set correctly
- Check backend logs for configuration errors

**Weather data not working:**
- Ensure latitude/longitude are not 0
- Verify coordinates are correct (not swapped)
- Check backend logs for weather service errors

**Timezone issues:**
- Use IANA timezone identifiers (e.g., "Europe/Tallinn", not "EEST")
- Verify timezone is correctly set in config/environment
- Check that electricity prices align with expected hours
