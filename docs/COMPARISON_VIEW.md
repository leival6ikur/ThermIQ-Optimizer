# Comparison View Feature

Comprehensive week-over-week and month-over-month performance comparison.

## Overview

The Comparison View allows users to:
- Compare current week vs previous week
- Compare current month vs previous month
- View daily breakdown for the last 14 days
- Track improvements in energy, cost, and comfort

## Features

### Week-over-Week Comparison

**Metrics Tracked:**
- Energy consumption (kWh)
- Total cost (€)
- Comfort score (%)
- Average indoor temperature (°C)
- Duty cycle (%)
- Heating hours

**Change Indicators:**
- Energy change: Shows % reduction/increase
- Cost savings: Highlights cost improvements
- Comfort change: Tracks comfort score delta
- Temperature change: Shows average temp difference

### Month-over-Month Comparison

Same metrics as weekly, but aggregated monthly for long-term trends.

### Daily Breakdown

- Last 14 days of data
- Dual-axis bar chart:
  - Blue bars: Energy (kWh)
  - Green bars: Cost (€)
- Interactive tooltips
- Day-of-week labels

## API Endpoints

### GET /api/compare/week

Compare two weeks of data.

**Query Parameters:**
- `week1` (optional): ISO week format `YYYY-WW` (e.g., `2026-W14`)
- `week2` (optional): ISO week format, defaults to previous week

**Response:**
```json
{
  "week1": {
    "start": "2026-03-31T00:00:00",
    "end": "2026-04-07T00:00:00",
    "label": "Mar 31 - Apr 07, 2026",
    "energy_kwh": 145.5,
    "cost": 38.20,
    "comfort_score": 96.5,
    "avg_indoor_temp": 21.2,
    "duty_cycle": 55.0,
    "heating_hours": 92.4
  },
  "week2": {
    "start": "2026-03-24T00:00:00",
    "end": "2026-03-31T00:00:00",
    "label": "Mar 24 - Mar 31, 2026",
    "energy_kwh": 168.3,
    "cost": 45.80,
    "comfort_score": 95.0,
    "avg_indoor_temp": 21.0,
    "duty_cycle": 62.0,
    "heating_hours": 103.7
  },
  "changes": {
    "energy_change_percent": -13.6,
    "cost_change_percent": -16.6,
    "comfort_change_points": 1.5,
    "temp_change_celsius": 0.2,
    "energy_improved": true,
    "cost_improved": true,
    "comfort_improved": true
  }
}
```

### GET /api/compare/month

Compare two months of data.

**Query Parameters:**
- `month1` (optional): Format `YYYY-MM` (e.g., `2026-04`)
- `month2` (optional): Defaults to previous month

**Response:** Same structure as week comparison

### GET /api/compare/daily?days=7

Get daily breakdown for charting.

**Query Parameters:**
- `days` (optional): Number of days (default 7, max 30)

**Response:**
```json
{
  "start_date": "2026-03-27T00:00:00",
  "end_date": "2026-04-03T23:59:59",
  "days_count": 7,
  "daily_data": [
    {
      "date": "2026-03-27",
      "day_name": "Thursday",
      "energy_kwh": 20.5,
      "cost": 5.40,
      "comfort_score": 97.0,
      "avg_indoor_temp": 21.1,
      "duty_cycle": 54.0,
      "heating_hours": 13.0
    }
    // ... more days
  ]
}
```

## Database Queries

The comparison endpoints use efficient SQL aggregation:

```sql
-- Calculate period statistics
SELECT
    COUNT(*) as readings_count,
    AVG(indoor) as avg_indoor,
    AVG(outdoor) as avg_outdoor,
    AVG(power) as avg_power,
    SUM(CASE WHEN heating = 1 THEN 1 ELSE 0 END) as heating_minutes
FROM temperature_readings
WHERE timestamp >= ? AND timestamp < ?
```

Energy calculation:
```python
# Power is in watts, readings every minute
energy_kwh = (avg_power * readings_count / 60) / 1000
```

Comfort score:
```python
# % time within ±1°C of target
comfort_score = (comfort_readings / total_readings) * 100
```

## Frontend Component

### ComparisonPage.tsx

**Location:** `/Users/hvissel/Documents/Thermi-Nator/frontend/src/pages/ComparisonPage.tsx`

**Features:**
- Toggle between week/month view
- Side-by-side period comparison
- Visual change indicators (green=improved, red=worse)
- Responsive dual-axis bar chart
- Dark mode support

**Usage:**
```typescript
// Navigate to comparison page
<a href="/comparison">View Comparison</a>

// Component renders automatically via App.tsx routing
```

## Calculations

### Energy Change
```
change_percent = ((current - previous) / previous) * 100
improved = change_percent < 0  // Less energy = better
```

### Cost Change
```
change_percent = ((current_cost - previous_cost) / previous_cost) * 100
improved = change_percent < 0  // Lower cost = better
```

### Comfort Change
```
change_points = current_comfort - previous_comfort
improved = change_points > 0  // Higher comfort = better
```

## Use Cases

### 1. Validate Optimization
Compare weeks before and after enabling optimization to see:
- Energy reduction
- Cost savings
- Comfort impact

### 2. Weather-Adjusted Comparison
Compare similar outdoor temperature periods:
- Same months year-over-year
- Similar weather conditions

### 3. Seasonal Trends
Track monthly changes:
- Winter to spring transition
- Heating efficiency improvements

### 4. Strategy Comparison
Test different optimization strategies:
- Week 1: Aggressive strategy
- Week 2: Conservative strategy
- Compare results

## Performance Considerations

**Query Optimization:**
- Indexes on `timestamp` column
- Aggregation at database level
- Minimal data transfer

**Caching:**
- Daily stats calculated once
- Results cached for 1 hour
- Background recalculation

**Response Size:**
- Week comparison: ~500 bytes
- Daily breakdown (14 days): ~2 KB
- Fast page load

## Future Enhancements

- [ ] Export comparison as PDF/CSV
- [ ] Custom date range selection
- [ ] Comparison against baseline (no optimization)
- [ ] Weather data overlay
- [ ] Multi-week trending
- [ ] Savings projections
- [ ] Share comparison reports

## Testing

### Backend Tests
```bash
cd backend
pytest tests/test_api.py::TestAPIEndpoints::test_comparison_week_endpoint
pytest tests/test_api.py::TestAPIEndpoints::test_comparison_month_endpoint
pytest tests/test_api.py::TestAPIEndpoints::test_daily_breakdown_endpoint
```

### Frontend Tests
```bash
cd frontend
npm test -- ComparisonPage
```

### Manual Testing
```bash
# Test week comparison
curl http://localhost:8000/api/compare/week

# Test month comparison
curl http://localhost:8000/api/compare/month

# Test daily breakdown
curl http://localhost:8000/api/compare/daily?days=14
```

## Troubleshooting

**No comparison data:**
- Ensure database has at least 2 weeks of data
- Run seed script: `python scripts/seed_database.py --force`

**Incorrect calculations:**
- Check power data is being recorded
- Verify electricity prices are fetched
- Review database schema for missing columns

**Charts not rendering:**
- Check browser console for errors
- Verify Recharts is installed
- Test API endpoints return valid data

## Integration

The comparison view integrates with:
- **Database**: temperature_readings, electricity_prices tables
- **Dashboard**: Link to comparison from main page
- **Alerts**: Can trigger alerts on large changes
- **Reports**: Used in weekly/monthly reports

---

**Status:** ✅ Complete and tested
**Version:** 1.0
**Last Updated:** April 3, 2026
