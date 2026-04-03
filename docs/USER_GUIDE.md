# ThermIQ Heat Pump Optimizer - User Guide

**Version:** 1.0  
**Last Updated:** April 3, 2026

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Understanding the Dashboard](#understanding-the-dashboard)
4. [Insights Page](#insights-page)
5. [Smart Alerts](#smart-alerts)
6. [Settings & Configuration](#settings--configuration)
7. [Daily Operation](#daily-operation)
8. [Understanding the Data](#understanding-the-data)
9. [Tips for Optimization](#tips-for-optimization)

---

## Introduction

### What is ThermIQ?

ThermIQ is an intelligent heat pump control system that automatically optimizes your heating schedule based on electricity prices from Nord Pool. The system:

- ✅ Monitors your heat pump in real-time via MQTT
- ✅ Fetches hourly electricity prices from Nord Pool
- ✅ Creates optimal 24-hour heating schedules
- ✅ Maintains comfort while minimizing costs
- ✅ Provides detailed analytics and insights
- ✅ Sends smart alerts about system performance

### How It Works

1. **Price Monitoring**: Every day at 13:00 UTC, ThermIQ fetches the latest electricity prices
2. **Schedule Optimization**: The system calculates when to heat based on:
   - Current electricity prices
   - Building thermal properties
   - Current indoor temperature
   - Your comfort preferences
3. **Automatic Control**: The heat pump automatically follows the optimized schedule
4. **Continuous Learning**: The system tracks performance and adjusts over time

### Expected Savings

Typical users can expect:
- **20-40% reduction** in heating costs
- **Better comfort** with consistent temperatures
- **Reduced cycling** = longer heat pump lifespan
- **Visibility** into energy consumption patterns

---

## Getting Started

### First-Time Setup

1. **Access the Dashboard**
   - Open web browser: `http://localhost:3000` (local)
   - Or: `http://[raspberry-pi-ip]:3000` (network)

2. **Verify MQTT Connection**
   - Top-right corner shows "MQTT: OK" (green)
   - If red, check MQTT broker is running

3. **Check Price Data**
   - Blue info message shows hours of price data
   - First fetch happens at 13:00 UTC
   - Manual refresh: Click "Refresh Prices" in settings

4. **Review Heating Schedule**
   - Scroll down to "Today's Heating Schedule"
   - Green hours = heating enabled
   - Gray hours = heating paused or reduced

### Initial Configuration

Go to **Settings** page:

1. **Optimization Strategy**
   - `aggressive`: Maximum savings, higher temp swings
   - `balanced`: Good savings, moderate comfort (recommended)
   - `conservative`: Minimal savings, best comfort

2. **Target Temperature**
   - Set your desired indoor temperature (18-24°C)
   - Default: 21°C

3. **Temperature Tolerance**
   - How far temperature can deviate from target
   - Default: 1.0°C (21°C ± 1°C = 20-22°C range)

4. **Comfort Hours**
   - Hours when temperature must be exact
   - Example: 07:00 to 22:00 (awake hours)
   - Outside these hours, more flexibility allowed

5. **VAT Configuration**
   - Enable if you want prices shown with VAT
   - Estonia: 24% VAT
   - Affects display only, not optimization

---

## Understanding the Dashboard

### Header Section

**Left Side:**
- **Title**: ThermIQ Optimizer
- **Location**: Your address (configured in settings)

**Right Side:**
- **System Status**:
  - `MQTT: OK/Down` - Connection to heat pump
  - `WS: OK/Down` - Real-time updates status
  - `Heater: 🔥 HEATING / ❄️ IDLE` - Current state

- **Mode Toggle**:
  - `🤖 Optimized` - Automatic optimization (default)
  - `🔧 Manual` - Manual control mode

- **Navigation**:
  - `📊 Insights` - Advanced analytics
  - `Settings` - Configuration

### System Alerts Panel

Displays important notifications:

**Alert Types:**
- 📉 **Efficiency** - Low COP or high duty cycle
- 💰 **Price Opportunity** - Upcoming cheap electricity
- 🌡️ **Comfort** - Temperature deviation
- 🔧 **Maintenance** - System health issues
- 💚 **Savings** - Positive achievements

**Actions:**
- `✓ Ack` - Mark as acknowledged (read)
- `✕ Dismiss` - Resolve and remove alert

### Temperature Cards

**Indoor Temperature** 🏠
- Current room temperature
- Target temperature shown below
- Mini-graph shows last 24 hours
- Green = within comfort zone
- Yellow/Orange = deviation

**Outdoor Temperature** 🌡️
- Outside air temperature
- Affects heating load calculations
- Useful for comparing indoor stability

**Floor Heating Supply** ♨️
- Hot water temperature going to floors
- Typically 25-45°C depending on outdoor temp
- Higher = more heat delivery

**Floor Heating Return** 🔄
- Water temperature coming back from floors
- Should be 5-10°C lower than supply
- Delta indicates heat transfer

**Hot Water Tank** 🚿
- Household hot water temperature
- Green: ≥45°C (comfortable)
- Yellow: 40-45°C (adequate)
- Red: <40°C (needs heating)

**Ground Source Temps** (if ground source heat pump)
- **Brine In**: Temperature entering heat pump from ground
- **Brine Out**: Temperature returning to ground
- Delta (In - Out) should be 2.5-3.5°C

### Price Chart

**Day View:**
- Shows 24 hours of electricity prices
- Current hour highlighted
- Color coding:
  - Green: Cheapest third of day
  - Yellow: Middle third
  - Red: Most expensive third

**Rolling View:**
- Shows today + tomorrow (if available)
- Useful for planning ahead
- Gray area = no data yet (tomorrow prices)

**Statistics:**
- Average price today
- Current price
- Savings % vs average

### Heating Schedule Timeline

**Visual Timeline:**
- 24 horizontal bars (one per hour)
- Green bar = heating enabled
- Height = price (taller = more expensive)
- Current hour marked with indicator

**Details:**
- Hover over hour for:
  - Price
  - Estimated cost
  - Expected temperature
- Click to toggle hour on/off (manual mode)

---

## Insights Page

Advanced analytics and performance metrics.

### System Performance Card

**COP (Coefficient of Performance)**
- Ratio of heat delivered to energy consumed
- Good: >3.0
- Fair: 2.0-3.0
- Low: <2.0 (investigate)

**Duty Cycle**
- % of time heat pump is running
- Optimal: 30-60%
- Too low (<30%): System oversized
- Too high (>80%): System undersized or very cold

**Cycles per Hour**
- Number of on/off cycles
- Optimal: 1-3 per hour
- High (>4): Reduces efficiency and lifespan

**Ground ΔT**
- Temperature drop across ground loop
- Good: ≥2.5°C
- Low: <2.0°C (poor extraction)

**Heating ΔT**
- Temperature drop from supply to return
- Good: ≥5°C
- Low: <5°C (check flow rate or system)

**Avg Power**
- Average power consumption last hour
- Typical: 1.5-3.5 kW for residential

### Enhanced Temperature Chart

**Features:**
- Comfort zone shading (target ±0.5°C)
- Price zone backgrounds:
  - Green = cheap hours
  - Yellow = medium
  - Red = expensive
- Orange bars = heating periods

**What to Look For:**
- Indoor temp staying within comfort zone
- Temperature rising during cheap hours
- Stable temp during expensive hours (thermal mass)

### Energy Dashboard

**Daily Summary Cards:**
- **Total Energy**: kWh consumed today
- **Total Cost**: EUR spent (with VAT if enabled)
- **Avg Power**: Average consumption
- **Savings**: % vs continuous heating baseline

**Power Consumption Graph:**
- Blue area = power usage over 24h
- Peaks should align with cheap prices

**Energy & Cost Chart:**
- Blue bars = kWh per hour
- Green line = cost per hour
- Dual Y-axes (kWh left, EUR right)

---

## Smart Alerts

ThermIQ continuously monitors system performance and generates alerts when attention is needed.

### Alert Severities

**🔵 Info (Blue)**
- Informational notifications
- Price opportunities
- System achievements
- No action required (but may save money)

**🟡 Warning (Yellow)**
- Performance concerns
- Temperature deviations
- Efficiency below optimal
- Review recommended

**🔴 Critical (Red)**
- Urgent issues
- MQTT disconnection
- Extreme temperature deviation
- Immediate attention needed

### Common Alerts

**"Low Heat Pump Efficiency"** ⚠️
- COP below threshold
- Check:
  - Ground loop circulation
  - Supply/return temps
  - Power consumption
  - Consider service call

**"Temperature Deviation"** ⚠️
- Indoor temp off target >30 minutes
- Causes:
  - Extreme outdoor temperature
  - Wrong heat curve setting
  - Building heat loss
- Action: Review heating schedule

**"Cheap Electricity Coming Up"** 💰
- Price will be 30%+ below average
- Opportunity to:
  - Pre-heat building
  - Heat hot water tank
  - Store thermal energy

**"High Duty Cycle"** ℹ️
- Heat pump running >80% of time
- Indicates:
  - Very cold weather (normal)
  - Undersized system (if persistent)
  - Consider insulation improvements

**"Low Ground Heat Extraction"** 🔧
- Brine ΔT < 2.0°C
- Possible causes:
  - Low brine flow
  - Ground loop circulation issue
  - Frozen ground (winter)
- Check: Brine pump operation

### Managing Alerts

**Acknowledge (✓ Ack)**
- Marks alert as "seen"
- Alert remains visible but dimmed
- Useful for tracking what you've reviewed

**Dismiss (✕)**
- Resolves and removes alert
- Use when:
  - Issue fixed
  - False alarm
  - Not actionable

**Alert Refresh**
- Alerts automatically refresh every 30 seconds
- System evaluates conditions every 15 minutes
- Old resolved alerts auto-deleted after 30 days

---

## Settings & Configuration

### Optimization Settings

**Strategy**
- How aggressive to optimize:
  - `aggressive`: Maximize savings, may have temp swings
  - `balanced`: Good compromise (recommended)
  - `conservative`: Prioritize comfort, fewer savings

**Target Temperature**
- Your desired indoor temperature
- Affects heating calculations
- Range: 10-30°C (typical: 20-22°C)

**Temperature Tolerance**
- Allowed deviation from target
- Lower = tighter control = less savings
- Higher = more flexibility = more savings
- Range: 0.1-5.0°C (recommended: 0.5-1.5°C)

**Comfort Hours**
- Time period requiring strict temperature control
- Format: HH:MM (24-hour)
- Example: 07:00 to 22:00
- Outside these hours, more optimization allowed

### System Settings

**MQTT Broker**
- Host: Usually `localhost` or internal IP
- Port: Default `1883`
- Topics: `/thermiq/temperatures`, `/thermiq/control`

**Nord Pool**
- Region: EE (Estonia), FI, SE, NO, DK, etc.
- Currency: EUR, SEK, NOK, DKK
- Fetch Time: 13:00 UTC (when tomorrow prices publish)

**Database**
- Raw data retention: 30 days
- Hourly aggregates: Kept forever
- Alerts: Resolved after 30 days

### Alert Configuration

Access via Settings → Alerts:

**Enable Alerts**
- Turn alert system on/off globally

**Efficiency COP Threshold**
- Alert if COP falls below this value
- Default: 2.0
- Range: 1.0-5.0

**Efficiency Check Interval**
- How often to check COP
- Default: 60 minutes
- Range: 15-1440 minutes

**Price Opportunity Threshold**
- Alert if price is X% below average
- Default: 30%
- Range: 10-50%

**Comfort Deviation Threshold**
- Alert if temp off by X degrees
- Default: 1.0°C
- Range: 0.5-3.0°C

**Comfort Duration**
- Alert only if deviation lasts X minutes
- Default: 30 minutes
- Range: 10-120 minutes

**Max Active Alerts**
- Maximum alerts to keep active
- Old info alerts auto-resolved
- Default: 20
- Range: 5-100

---

## Daily Operation

### Normal Day

**Morning (6:00-9:00)**
- Check dashboard for any alerts
- Indoor temp should be at target
- Review yesterday's cost in Insights

**Afternoon (13:00-14:00)**
- System fetches new prices (automatic)
- Tomorrow's schedule calculated
- No action needed

**Evening (18:00-22:00)**
- Optimal time to check insights
- Review power consumption graph
- Check if heating during cheap hours

**Night**
- System may reduce heating if:
  - Outside comfort hours
  - Expensive electricity
  - Building well insulated
- Temperature stays within tolerance

### Weekly Tasks

**Sunday Evening**
- Review weekly summary (if enabled)
- Check total kWh and cost
- Compare to previous week
- Note any anomalies

**Check Alerts**
- Review and acknowledge alerts
- Dismiss resolved issues
- Note recurring problems

### Monthly Tasks

**Performance Review**
- Check average COP (Insights page)
- Review duty cycle trends
- Compare costs month-over-month
- Verify savings vs baseline

**System Health**
- Ground ΔT should be consistent
- No recurring maintenance alerts
- MQTT uptime >99%
- Database maintenance runs automatically

---

## Understanding the Data

### Temperature Patterns

**Good Pattern:**
```
Indoor: ～～～～～～～～ (gentle waves within ±0.5°C)
Outdoor: ∿∿∿∿∿∿∿∿∿ (varies with weather)
```

**Problem Pattern:**
```
Indoor: ∧∨∧∨∧∨∧∨ (frequent spikes = poor control)
Indoor: ────╲╲╲╲ (steady drop = not heating enough)
Indoor: ╱╱╱╱──── (steady rise = overheating)
```

### Power Consumption

**Typical Daily Pattern:**
- Low: 0.5-1.5 kW (mild days)
- Medium: 1.5-2.5 kW (cold days)
- High: 2.5-4.0 kW (very cold days)

**Optimization Success:**
```
Price: HIGH ────────╲╲╲╲ LOW ╱╱╱╱ HIGH
Power: LOW  ────────────╲╲╲ HIGH ╱ LOW
```
↑ Power consumption shifted to cheap hours

**Poor Optimization:**
```
Price: HIGH ────────╲╲╲╲ LOW ╱╱╱╱ HIGH
Power: HIGH ────────╱╱╱╱ HIGH ╲╲╲╲ HIGH
```
↑ Power consumption ignores prices

### COP Trends

**COP varies by:**
- Outdoor temperature (lower = worse COP)
- Supply temperature (higher = worse COP)
- Ground source temp (colder ground = worse COP)

**Normal COP Range:**
- Summer: 3.5-4.5
- Spring/Fall: 2.8-3.8
- Winter: 2.0-3.2
- Very cold (<-15°C): 1.8-2.5

**When to Worry:**
- COP <2.0 when outdoor >-5°C
- COP steadily declining over weeks
- COP <1.5 ever (electric heater would be better!)

---

## Tips for Optimization

### Maximize Savings

1. **Use Balanced Strategy**
   - Good compromise between comfort and cost
   - Most users achieve 25-35% savings

2. **Set Realistic Tolerance**
   - 1.0°C tolerance is comfortable
   - 1.5°C tolerance saves more but noticeable
   - 0.5°C tolerance very comfortable but less savings

3. **Configure Comfort Hours**
   - Only cover waking hours (e.g., 7am-11pm)
   - Allow flexibility at night
   - Thermal mass keeps temp stable

4. **Pre-heat During Cheap Hours**
   - System automatically does this
   - You can manually boost if needed
   - Especially useful before expensive periods

5. **Monitor Hot Water**
   - Heat during cheap hours
   - 45-50°C is sufficient
   - Don't overheat (wastes energy)

### Improve Efficiency

1. **Optimize Heat Curve**
   - Lower curve = lower supply temp = better COP
   - Test: Reduce by 1-2 points, monitor comfort
   - Adjust seasonally

2. **Improve Insulation**
   - Reduces heating load
   - Allows lower supply temperatures
   - Improves building thermal mass

3. **Regular Maintenance**
   - Clean filters monthly
   - Check brine pressure annually
   - Service heat pump per manufacturer schedule

4. **Fix Air Leaks**
   - Reduces uncontrolled heat loss
   - Improves optimization effectiveness
   - Check windows, doors, penetrations

### Troubleshooting Poor Performance

**High Electricity Bills:**
- Check: Are we heating during expensive hours?
- Check: Is outdoor temp unusually cold?
- Check: Is insulation adequate?
- Check: Is COP in normal range?

**Temperature Swings:**
- Reduce tolerance setting
- Increase comfort hours window
- Switch to conservative strategy
- Check heat curve setting

**Frequent Cycling:**
- May indicate oversized system
- Check heat curve (might be too high)
- Review optimization strategy
- Consider buffer tank

**System Not Following Schedule:**
- Check MQTT connection
- Verify heat pump mode is "auto"
- Check for manual overrides
- Review logs for errors

---

## Advanced Features

### Manual Override

**When to Use:**
- Guests arriving (need extra warmth)
- Away from home (reduce heating)
- Special event (ensure comfort)
- System acting unusual

**How to Override:**
1. Click "Mode: 🤖 Optimized"
2. Switches to "Mode: 🔧 Manual"
3. Set temperature and duration
4. System returns to auto after duration

### Schedule Customization

**Toggle Individual Hours:**
1. Go to heating schedule
2. Click on hour bar
3. Toggles heating on/off for that hour
4. Useful for one-off adjustments

**Note:** Changes apply to current day only. Schedule recalculates tomorrow.

### Data Export

**Access Historical Data:**
- API endpoint: `GET /api/temperatures/history?hours=168`
- Returns JSON with all readings
- Use for custom analysis

**Performance Metrics:**
- API endpoint: `GET /api/metrics`
- Includes COP, duty cycle, energy, cost
- Can be imported to spreadsheet

---

## Appendix

### Glossary

**COP**: Coefficient of Performance - ratio of heat output to electrical input

**Duty Cycle**: Percentage of time heat pump actively heating

**Brine**: Heat transfer fluid in ground source loops

**Supply Temperature**: Hot water going to floor heating

**Return Temperature**: Cooled water returning from floors

**Heat Curve**: Relationship between outdoor temp and supply temp

**Thermal Mass**: Building's ability to store heat

**Nord Pool**: Nordic electricity spot market

**MQTT**: Message protocol for IoT device communication

**WebSocket**: Real-time bidirectional communication protocol

### Technical Specifications

**System Requirements:**
- Raspberry Pi 3B+ or newer (recommended: Pi 4)
- 1GB+ RAM
- 8GB+ SD card
- Ethernet or WiFi connection

**Software Stack:**
- Backend: Python 3.9+, FastAPI
- Frontend: React 19, TypeScript
- Database: SQLite
- MQTT: Mosquitto broker
- Charts: Recharts

**Network Ports:**
- 3000: Frontend (HTTP)
- 8000: Backend API (HTTP)
- 1883: MQTT broker
- 8080: WebSocket (optional)

**Data Storage:**
- Raw readings: 60-second intervals
- Retention: 30 days raw, forever hourly aggregates
- Database size: ~50MB/month (typical)

### Support

**Getting Help:**
- GitHub Issues: https://github.com/leival6ikur/ThermIQ-Optimizer/issues
- Documentation: `/docs` folder in repository
- Troubleshooting Guide: `TROUBLESHOOTING.md`
- FAQ: `FAQ.md`

**Contributing:**
- Report bugs via GitHub Issues
- Feature requests welcome
- Code contributions: Fork & Pull Request

---

**Document Version:** 1.0  
**Last Reviewed:** April 3, 2026  
**Next Review:** Monthly or when features updated
