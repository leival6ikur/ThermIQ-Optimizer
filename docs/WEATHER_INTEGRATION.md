# Weather Integration Guide

Thermi-Nator can integrate with OpenWeather API to use real-time weather forecasts for optimizing heating schedules and predicting heating loads.

## Benefits of Weather Integration

- **Predictive heating**: Pre-heat before cold fronts arrive
- **Load forecasting**: Estimate heating demand based on weather conditions
- **Smarter optimization**: Factor in wind, humidity, and temperature trends
- **Better comfort**: Anticipate temperature drops and adjust proactively

## Setup Instructions

### 1. Get an OpenWeather API Key

Thermi-Nator uses the free OpenWeather API tier which includes:
- Current weather conditions
- 5-day/3-hour forecast (40 data points)
- 1,000 API calls per day (more than enough for hourly updates)

**Get your free API key:**

1. Visit [https://openweathermap.org/api](https://openweathermap.org/api)
2. Click "Sign Up" and create a free account
3. Verify your email address
4. Go to "API keys" section in your account
5. Copy your API key (it may take a few minutes to activate)

### 2. Configure Location

Weather data requires your heat pump's location coordinates.

Edit `data/config.yaml`:

```yaml
location:
  address: "Your City, Country"  # Display name
  latitude: 51.5074              # Your location's latitude
  longitude: -0.1278              # Your location's longitude
  timezone: "Europe/London"       # IANA timezone
```

**How to find coordinates:**
- Google Maps: Right-click location → Click coordinates to copy
- [LatLong.net](https://www.latlong.net/)
- GPS from your phone

### 3. Enable Weather Service

Edit `data/config.yaml`:

```yaml
weather:
  enabled: true
  api_key: "your_openweather_api_key_here"
```

Or use environment variable:

```bash
export THERMIQ_WEATHER_ENABLED=true
export THERMIQ_WEATHER_API_KEY="your_api_key_here"
```

### 4. Restart Thermi-Nator

```bash
# If running with uvicorn
pkill -f uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 8000

# If running with Docker
docker-compose restart

# If running as systemd service
sudo systemctl restart thermiq
```

### 5. Verify Weather Integration

Check backend logs on startup:

```
INFO - Weather service initialized for location (51.5074, -0.1278)
```

Test the API endpoint:

```bash
curl http://localhost:8000/api/weather/current
```

Should return current weather data:

```json
{
  "temperature": 12.5,
  "feels_like": 10.3,
  "humidity": 75,
  "wind_speed": 4.2,
  "clouds": 40,
  "description": "light rain",
  "icon": "10d",
  "timestamp": "2026-04-03T17:00:00"
}
```

## API Endpoints

### Current Weather

`GET /api/weather/current`

Returns current weather conditions at your location.

**Response:**
```json
{
  "temperature": 12.5,
  "feels_like": 10.3,
  "humidity": 75,
  "wind_speed": 4.2,
  "clouds": 40,
  "description": "light rain",
  "icon": "10d",
  "timestamp": "2026-04-03T17:00:00"
}
```

### Weather Forecast

`GET /api/weather/forecast?hours=48`

Returns weather forecast for the next N hours (max 120).

**Parameters:**
- `hours` (optional): Number of hours to forecast (default: 48, max: 120)

**Response:**
```json
{
  "location": "Your City, Country",
  "forecast_hours": 48,
  "count": 16,
  "forecasts": [
    {
      "timestamp": "2026-04-03T18:00:00",
      "temperature": 11.2,
      "feels_like": 9.5,
      "humidity": 80,
      "wind_speed": 5.1,
      "clouds": 60,
      "description": "light rain",
      "icon": "10d"
    }
  ]
}
```

### Heating Load Forecast

`GET /api/weather/heating-load?hours=48`

Returns estimated heating load based on weather forecast.

**Parameters:**
- `hours` (optional): Number of hours to forecast (default: 48, max: 120)

**Response:**
```json
{
  "location": "Your City, Country",
  "forecast_hours": 48,
  "count": 16,
  "heating_loads": [
    {
      "timestamp": "2026-04-03T18:00:00",
      "temperature": 11.2,
      "feels_like": 9.5,
      "wind_speed": 5.1,
      "estimated_load": 12.45,
      "load_level": "medium",
      "description": "light rain"
    }
  ]
}
```

**Load levels:**
- `low`: < 5 (minimal heating needed)
- `medium`: 5-15 (moderate heating)
- `high`: > 15 (high heating demand)

## How Weather Data is Used

### 1. Heating Load Estimation

The system calculates heating load based on:

```
base_load = max(0, 20°C - outdoor_temp)
wind_factor = 1 + (wind_speed / 30)
humidity_factor = 1 + ((100 - humidity) / 200)

estimated_load = base_load × wind_factor × humidity_factor
```

This accounts for:
- **Temperature difference**: Lower outdoor temp = higher heating need
- **Wind chill**: Wind increases heat loss from building
- **Humidity**: Dry air feels colder

### 2. Optimization Engine Integration

Weather forecasts improve optimization by:

1. **Pre-heating before cold fronts**: If temperature drop predicted, heat proactively
2. **Extending heating during low prices**: If weather is good, save energy
3. **Prioritizing comfort hours**: Ensure warmth during predicted cold periods
4. **Reducing cycling**: Smooth out heating based on weather trends

### 3. Data Caching

Weather data is cached to minimize API calls:
- Cache duration: 1 hour
- Free tier limit: 1,000 calls/day
- Actual usage: ~24-48 calls/day (well within limit)

## Troubleshooting

### Weather service not configured

Error: `503 - Weather service not configured`

**Solution:**
1. Verify `weather.enabled: true` in config
2. Check API key is set and valid
3. Confirm latitude/longitude are not 0
4. Restart backend

### Invalid API key

Check backend logs for:
```
ERROR - Weather API error: 401
```

**Solution:**
1. Verify API key is correct (no extra spaces)
2. Wait 10-15 minutes if key was just created (activation delay)
3. Check your OpenWeather account is active

### No weather data returned

Check backend logs for:
```
ERROR - Error fetching weather forecast: ...
```

**Common causes:**
- Network connectivity issues
- API rate limit exceeded (unlikely with free tier)
- Invalid coordinates (e.g., out of range)
- Service temporarily unavailable

**Solution:**
1. Test API directly: `curl "https://api.openweathermap.org/data/2.5/weather?lat=51.5074&lon=-0.1278&appid=YOUR_KEY"`
2. Check your internet connection
3. Verify coordinates are valid (latitude: -90 to 90, longitude: -180 to 180)

### Weather data stale

If weather data is old:
1. Check cache is working correctly
2. Verify backend is running continuously
3. Check system time is correct (NTP sync)

## Privacy and Security

- API key is stored in config file (not version controlled)
- Location data is only sent to OpenWeather API
- No personal data is shared
- OpenWeather privacy policy: https://openweathermap.org/privacy-policy

## Future Enhancements

Planned features for weather integration:

- [ ] Display weather forecast in dashboard
- [ ] Weather-based alert notifications ("Cold front in 6 hours")
- [ ] Historical weather correlation with heating performance
- [ ] Alternative weather providers (Met.no, Weather.gov)
- [ ] Adaptive learning based on actual vs predicted heating loads

## Cost Considerations

**Free tier (recommended for home use):**
- 1,000 calls/day
- 60 calls/minute
- Current weather + 5-day forecast
- **Cost: Free forever**

**Paid tiers (only if you need more):**
- $40/month: 100,000 calls/day + hourly forecasts
- Not needed for single heat pump installation

For typical home use, free tier is more than sufficient.
