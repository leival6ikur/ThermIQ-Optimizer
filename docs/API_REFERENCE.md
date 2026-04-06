# Thermi-Nator API Reference

Complete reference for the Thermi-Nator REST API and WebSocket interface.

## Base URL

```
Local: http://localhost:8000
Production: https://thermiq.yourdomain.com
```

## Authentication

Currently no authentication required (local network deployment).

For production deployments, implement:
- API Keys
- JWT tokens  
- OAuth 2.0

## Rate Limiting

| Endpoint Type | Limit | Headers |
|--------------|-------|---------|
| Standard GET | 100/min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Data-heavy GET | 30/min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| POST/PUT | 20/min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |
| Setup/Auth | 5/min | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |

**Rate Limit Exceeded Response:**
```json
HTTP/1.1 429 Too Many Requests
{
  "error": "Rate limit exceeded: 100 per 1 minute"
}
```

## Response Format

All responses follow this structure:

**Success:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "data": { ... },
  "timestamp": "2026-04-04T10:00:00Z"
}
```

**Error:**
```json
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Error description",
  "detail": "Detailed error message",
  "code": "ERROR_CODE"
}
```

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 204 | No Content | Success, no body returned |
| 400 | Bad Request | Invalid request parameters |
| 404 | Not Found | Resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

## Endpoints

### System Status

#### GET /health

Health check endpoint (no rate limit).

**Response:**
```json
{
  "status": "healthy",
  "mqtt_connected": true,
  "last_message_age_seconds": 12.5,
  "timestamp": "2026-04-04T10:00:00Z"
}
```

**Status Codes:**
- `200` - Service healthy
- `503` - Service unhealthy

---

#### GET /api/status

Get current system status.

**Rate Limit:** 100/min

**Response:**
```json
{
  "timestamp": "2026-04-04T10:00:00Z",
  "temperatures": {
    "indoor": 21.5,
    "outdoor": 5.2,
    "supply": 35.0,
    "return": 30.0,
    "hot_water": 48.0,
    "brine_in": 2.5,
    "brine_out": -0.5
  },
  "heating_active": true,
  "target_temperature": 21.0,
  "mode": "auto",
  "power_watts": 2500,
  "cop": 3.2,
  "comfort_score": 98.5,
  "mqtt_connected": true,
  "last_update": "2026-04-04T09:59:45Z"
}
```

---

### Location & Weather

#### GET /api/config/location

Get configured location.

**Response:**
```json
{
  "address": "Tartu, Estonia",
  "latitude": 58.378025,
  "longitude": 26.728763,
  "timezone": "Europe/Tallinn"
}
```

---

#### GET /api/weather/current

Get current weather conditions.

**Rate Limit:** 100/min

**Response:**
```json
{
  "temperature": 5.2,
  "feels_like": 3.0,
  "humidity": 75,
  "wind_speed": 3.5,
  "wind_direction": 180,
  "pressure": 1013,
  "description": "Cloudy",
  "icon": "04d",
  "timestamp": "2026-04-04T10:00:00Z"
}
```

**Error Codes:**
- `SERVICE_ERROR` - Weather service unavailable
- `LOCATION_NOT_CONFIGURED` - Location not set

---

#### GET /api/weather/forecast

Get 48-hour weather forecast.

**Rate Limit:** 100/min

**Query Parameters:**
- `hours` (optional, default: 48) - Number of hours to forecast

**Response:**
```json
{
  "forecast": [
    {
      "timestamp": "2026-04-04T11:00:00Z",
      "temperature": 6.0,
      "feels_like": 4.2,
      "humidity": 72,
      "wind_speed": 4.0,
      "description": "Partly cloudy",
      "icon": "02d"
    },
    // ... more hours
  ],
  "location": "Tartu, Estonia",
  "timezone": "Europe/Tallinn"
}
```

---

### Electricity Prices

#### GET /api/prices

Get electricity prices summary.

**Rate Limit:** 100/min

**Query Parameters:**
- `date` (optional, default: today) - Date in YYYY-MM-DD format

**Response:**
```json
{
  "date": "2026-04-04",
  "currency": "EUR",
  "unit": "MWh",
  "min_price": 45.2,
  "max_price": 120.8,
  "avg_price": 75.3,
  "current_price": 82.1,
  "current_hour": 10,
  "prices": [
    {
      "hour": 0,
      "price": 65.5,
      "zone": "medium",
      "timestamp": "2026-04-04T00:00:00Z"
    },
    // ... 24 hours
  ],
  "vat_included": true,
  "vat_rate": 20.0
}
```

**Price Zones:**
- `cheap` - Below 33rd percentile
- `medium` - Between 33rd and 66th percentile
- `expensive` - Above 66th percentile

---

#### GET /api/prices/today-tomorrow

Get prices for today and tomorrow (if available).

**Response:**
```json
{
  "today": {
    "date": "2026-04-04",
    "prices": [...],
    "avg_price": 75.3
  },
  "tomorrow": {
    "date": "2026-04-05",
    "prices": [...],
    "avg_price": 68.9,
    "available": true
  }
}
```

**Note:** Tomorrow's prices typically available after 13:00 EET.

---

#### POST /api/prices/refresh

Force refresh electricity prices from Nord Pool.

**Rate Limit:** 20/min

**Response:**
```json
{
  "success": true,
  "prices_fetched": 48,
  "date_range": {
    "start": "2026-04-04",
    "end": "2026-04-05"
  },
  "message": "Prices refreshed successfully"
}
```

---

### Heating Schedule

#### GET /api/schedule

Get heating schedule for next 24 hours.

**Rate Limit:** 100/min

**Response:**
```json
{
  "schedule": [
    {
      "hour": 0,
      "heating_enabled": true,
      "temperature_target": 21.0,
      "price": 65.5,
      "reason": "cheap_price",
      "manual_override": false
    },
    // ... 24 hours
  ],
  "strategy": "balanced",
  "last_updated": "2026-04-04T10:00:00Z"
}
```

**Reasons:**
- `cheap_price` - Heating during cheap electricity
- `comfort_priority` - Heating for comfort despite price
- `manual_override` - User manually enabled
- `disabled` - Not heating (expensive or warm enough)

---

#### POST /api/schedule/toggle

Toggle heating for a specific hour.

**Rate Limit:** 20/min

**Request Body:**
```json
{
  "hour": 14
}
```

**Response:**
```json
{
  "success": true,
  "hour": 14,
  "heating_enabled": false,
  "manual_override": true,
  "message": "Heating disabled for hour 14"
}
```

---

#### POST /api/schedule/reset

Reset schedule to automatic optimization.

**Rate Limit:** 20/min

**Response:**
```json
{
  "success": true,
  "schedule_recalculated": true,
  "overrides_cleared": 3,
  "message": "Schedule reset to automatic"
}
```

---

### Temperature History

#### GET /api/temperatures/history

Get historical temperature data.

**Rate Limit:** 30/min (data-heavy)

**Query Parameters:**
- `hours` (optional, default: 24) - Hours of history
- `interval` (optional, default: 1) - Minutes between data points
- `page` (optional, default: 1) - Page number
- `page_size` (optional, default: 100) - Items per page

**Response:**
```json
{
  "data": [
    {
      "timestamp": "2026-04-04T10:00:00Z",
      "indoor": 21.5,
      "outdoor": 5.2,
      "supply": 35.0,
      "return": 30.0,
      "hot_water": 48.0,
      "brine_in": 2.5,
      "brine_out": -0.5,
      "target": 21.0,
      "heating": true,
      "power": 2500
    },
    // ... more readings
  ],
  "pagination": {
    "page": 1,
    "page_size": 100,
    "total": 1440,
    "pages": 15
  },
  "period": {
    "start": "2026-04-03T10:00:00Z",
    "end": "2026-04-04T10:00:00Z",
    "hours": 24
  }
}
```

---

### Comparisons

#### GET /api/compare/week

Compare two weeks of data.

**Rate Limit:** 30/min (data-heavy)

**Query Parameters:**
- `week1` (optional, default: current week) - Format: YYYY-WW
- `week2` (optional, default: previous week) - Format: YYYY-WW

**Response:**
```json
{
  "week1": {
    "start": "2026-03-31T00:00:00Z",
    "end": "2026-04-07T00:00:00Z",
    "label": "Mar 31 - Apr 07, 2026",
    "energy_kwh": 82.5,
    "cost": 21.50,
    "avg_indoor_temp": 21.2,
    "avg_outdoor_temp": 6.5,
    "comfort_score": 98.2,
    "duty_cycle": 45.3,
    "heating_hours": 76.3
  },
  "week2": {
    "start": "2026-03-24T00:00:00Z",
    "end": "2026-03-31T00:00:00Z",
    "label": "Mar 24 - Mar 31, 2026",
    "energy_kwh": 95.2,
    "cost": 28.30,
    "avg_indoor_temp": 21.0,
    "avg_outdoor_temp": 5.2,
    "comfort_score": 97.5,
    "duty_cycle": 52.1,
    "heating_hours": 87.5
  },
  "changes": {
    "energy_change_percent": -13.3,
    "cost_change_percent": -24.0,
    "comfort_change_points": 0.7,
    "temp_change_celsius": 0.2,
    "energy_improved": true,
    "cost_improved": true,
    "comfort_improved": true
  }
}
```

---

#### GET /api/compare/month

Compare two months of data.

**Rate Limit:** 30/min (data-heavy)

**Query Parameters:**
- `month1` (optional, default: current month) - Format: YYYY-MM
- `month2` (optional, default: previous month) - Format: YYYY-MM

**Response:** Similar to week comparison.

---

#### GET /api/compare/daily

Get daily breakdown for the last N days.

**Rate Limit:** 30/min (data-heavy)

**Query Parameters:**
- `days` (optional, default: 7, max: 30) - Number of days

**Response:**
```json
{
  "start_date": "2026-03-28T00:00:00Z",
  "end_date": "2026-04-04T00:00:00Z",
  "days_count": 7,
  "daily_data": [
    {
      "date": "2026-03-28",
      "day_name": "Thursday",
      "energy_kwh": 12.5,
      "cost": 3.20,
      "avg_indoor_temp": 21.0,
      "comfort_score": 98.0,
      "heating_hours": 10.5
    },
    // ... more days
  ]
}
```

---

### Alerts

#### GET /api/alerts

Get recent unresolved alerts.

**Rate Limit:** 100/min

**Query Parameters:**
- `limit` (optional, default: 10) - Max alerts to return

**Response:**
```json
{
  "alerts": [
    {
      "id": 123,
      "type": "efficiency",
      "severity": "warning",
      "title": "Low COP Detected",
      "message": "System COP is 2.1, below optimal range (2.5-4.5)",
      "timestamp": "2026-04-04T09:30:00Z",
      "acknowledged": false,
      "resolved": false,
      "metadata": {
        "cop": 2.1,
        "threshold": 2.5
      }
    }
  ],
  "unresolved_count": 3
}
```

**Alert Types:**
- `efficiency` - System performance issues
- `comfort` - Temperature/comfort warnings
- `price_opportunity` - Cost optimization suggestions
- `maintenance` - Maintenance required
- `system_error` - System errors

**Severity Levels:**
- `info` - Informational
- `warning` - Attention needed
- `critical` - Immediate action required

---

#### POST /api/alerts/{alert_id}/acknowledge

Acknowledge an alert.

**Rate Limit:** 20/min

**Response:**
```json
{
  "success": true,
  "alert_id": 123,
  "acknowledged": true,
  "acknowledged_at": "2026-04-04T10:15:00Z"
}
```

---

#### POST /api/alerts/{alert_id}/resolve

Resolve an alert.

**Rate Limit:** 20/min

**Response:**
```json
{
  "success": true,
  "alert_id": 123,
  "resolved": true,
  "resolved_at": "2026-04-04T10:15:00Z"
}
```

---

### Configuration

#### GET /api/config

Get optimization configuration.

**Response:**
```json
{
  "strategy": "balanced",
  "target_temperature": 21.0,
  "comfort_range": 0.5,
  "price_threshold": 80.0,
  "update_interval": 300,
  "enable_weather": true,
  "enable_optimization": true
}
```

**Strategies:**
- `aggressive` - Maximum cost savings, may sacrifice comfort
- `balanced` - Balance cost and comfort (default)
- `comfort` - Prioritize comfort over cost

---

#### PUT /api/config

Update optimization configuration.

**Rate Limit:** 20/min

**Request Body:**
```json
{
  "strategy": "balanced",
  "target_temperature": 21.5,
  "comfort_range": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "config_updated": true,
  "schedule_recalculated": true,
  "message": "Configuration updated successfully"
}
```

---

## WebSocket API

### Connection

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onopen = () => {
  console.log('Connected to Thermi-Nator');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleUpdate(data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
  // Reconnect logic
};
```

### Message Types

#### temperature_update

Real-time temperature readings.

```json
{
  "type": "temperature_update",
  "data": {
    "timestamp": "2026-04-04T10:00:00Z",
    "indoor": 21.5,
    "outdoor": 5.2,
    "supply": 35.0,
    "return": 30.0,
    "hot_water": 48.0,
    "brine_in": 2.5,
    "brine_out": -0.5
  }
}
```

#### status_update

System status changes.

```json
{
  "type": "status_update",
  "data": {
    "heating_active": true,
    "mode": "auto",
    "power_watts": 2500,
    "timestamp": "2026-04-04T10:00:00Z"
  }
}
```

#### alert

New alert generated.

```json
{
  "type": "alert",
  "data": {
    "id": 124,
    "type": "efficiency",
    "severity": "warning",
    "title": "High Cycling Detected",
    "message": "Heat pump is cycling 6 times per hour"
  }
}
```

#### schedule_updated

Heating schedule recalculated.

```json
{
  "type": "schedule_updated",
  "data": {
    "timestamp": "2026-04-04T10:00:00Z",
    "reason": "price_update"
  }
}
```

---

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `MQTT_NOT_CONNECTED` | MQTT connection lost | Check ThermIQ device connection |
| `DATABASE_ERROR` | Database operation failed | Check database file permissions |
| `NORDPOOL_API_ERROR` | Nord Pool API unavailable | Wait and retry, API may be down |
| `WEATHER_API_ERROR` | Weather service error | Check API key and configuration |
| `LOCATION_NOT_CONFIGURED` | Location not set | Configure location in setup |
| `INVALID_PARAMETERS` | Invalid request parameters | Check request format |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait before retrying |
| `OPTIMIZATION_ERROR` | Schedule calculation failed | Check configuration and data |

---

## SDKs & Examples

### JavaScript/TypeScript

```typescript
class ThermiqAPI {
  constructor(baseUrl = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async getStatus() {
    const response = await fetch(`${this.baseUrl}/api/status`);
    if (!response.ok) throw new Error('Failed to fetch status');
    return response.json();
  }

  async getPrices(date?: string) {
    const url = new URL(`${this.baseUrl}/api/prices`);
    if (date) url.searchParams.set('date', date);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch prices');
    return response.json();
  }

  async toggleHour(hour: number) {
    const response = await fetch(`${this.baseUrl}/api/schedule/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hour })
    });
    if (!response.ok) throw new Error('Failed to toggle hour');
    return response.json();
  }

  connectWebSocket(callbacks: {
    onTemperature?: (data: any) => void;
    onStatus?: (data: any) => void;
    onAlert?: (data: any) => void;
  }) {
    const ws = new WebSocket(`${this.baseUrl.replace('http', 'ws')}/ws`);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'temperature_update':
          callbacks.onTemperature?.(message.data);
          break;
        case 'status_update':
          callbacks.onStatus?.(message.data);
          break;
        case 'alert':
          callbacks.onAlert?.(message.data);
          break;
      }
    };

    return ws;
  }
}

// Usage
const api = new ThermiqAPI();

const status = await api.getStatus();
console.log(`Indoor: ${status.temperatures.indoor}°C`);

const ws = api.connectWebSocket({
  onTemperature: (data) => console.log('Temperature:', data.indoor),
  onAlert: (data) => console.log('Alert:', data.title)
});
```

### Python

```python
import requests

class ThermiqAPI:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
    
    def get_status(self):
        response = requests.get(f"{self.base_url}/api/status")
        response.raise_for_status()
        return response.json()
    
    def get_prices(self, date=None):
        params = {"date": date} if date else {}
        response = requests.get(f"{self.base_url}/api/prices", params=params)
        response.raise_for_status()
        return response.json()
    
    def toggle_hour(self, hour):
        response = requests.post(
            f"{self.base_url}/api/schedule/toggle",
            json={"hour": hour}
        )
        response.raise_for_status()
        return response.json()

# Usage
api = ThermiqAPI()

status = api.get_status()
print(f"Indoor: {status['temperatures']['indoor']}°C")

prices = api.get_prices()
print(f"Average price: {prices['avg_price']} EUR/MWh")
```

---

## Interactive API Explorer

Visit `/docs` in your browser for Swagger UI interactive documentation:

```
http://localhost:8000/docs
```

Features:
- Try API endpoints directly
- View request/response schemas
- See example values
- Test authentication

---

## Changelog

### v1.0.0 (2026-04-04)
- Initial API release
- All core endpoints
- WebSocket support
- Rate limiting
- Comprehensive documentation

---

## Support

- **Documentation**: https://github.com/yourusername/therminator/docs
- **Issues**: https://github.com/yourusername/therminator/issues
- **Email**: support@therminator.example.com

