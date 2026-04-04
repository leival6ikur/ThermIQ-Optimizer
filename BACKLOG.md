# Thermi-Nator Feature Backlog

**Last Updated:** April 4, 2026  
**Current Version:** MVP + Sprints 1-3 Complete + Sprint 4 Partial  
**Latest:** NetAtmo Integration Infrastructure + Hot Water Intelligence Expansion ✅

This document tracks all planned features, improvements, and ideas for Thermi-Nator.

## 🎉 Recent Completions
- ✅ **Sprint 1 Complete** - Enhanced Temperature Chart with price zones and heating periods
- ✅ **Sprint 2 Complete** - Smart Alerts + Weather Integration + Documentation
- ✅ **Sprint 3 Complete** - Comparison View + Automated Testing + Deployment Scripts
- ✅ **Sprint 4 (Partial)** - Hot Water Intelligence (basic) + Dark Mode + NetAtmo Infrastructure

## 🚀 Next Up: Sprint 5
- **Hot Water Intelligence Phase 1 & 2** (34 hours approved)
  - Cost-aware scheduling with price optimization
  - Legionella prevention (safety compliance)
  - User profiles and preferences
  - Smart learning mode (pattern detection)
  - Space heating coordination
  - Usage insights dashboard

---

## 🎯 Backlog Organization

Features are organized by:
- **Priority:** High / Medium / Low
- **Effort:** Hours estimated
- **Type:** Feature / Enhancement / Analysis / Infrastructure
- **Status:** Planned / In Progress / Complete

---

## 📊 Available But Unused Datapoints

These datapoints are already available from the heat pump but not yet utilized in the UI:

### 1. Power Consumption History ⚡
**Status:** Planned  
**Priority:** High  
**Effort:** 6 hours  
**Type:** Feature

**Current State:**
- Power readings available every 60 seconds
- Only showing current power (instantaneous)

**Opportunity:**
- Historical power consumption tracking
- Daily/weekly energy totals (kWh)
- Energy cost calculation (power × price × time)
- Power efficiency metrics (COP/SCOP)

**Value:** See exactly when and how much energy you use, track savings

---

### 2. Temperature Deltas & Efficiency Metrics 📐
**Status:** Planned  
**Priority:** Medium  
**Effort:** 4 hours  
**Type:** Analysis

**Available Calculations:**
- Supply - Return temp (ΔT heating)
- Brine In - Brine Out (ΔT ground extraction)
- Indoor - Outdoor (ΔT heat loss)

**Current State:** Just showing raw temperature values

**Opportunity:**
- Heating Efficiency Card: (Supply - Return) = heat delivered to floor
- Ground Heat Extraction: (Brine In - Brine Out) = ground performance
- COP Estimation: Heat delivered / Power consumed
- Building Heat Loss: Track (Indoor - Outdoor) vs. heating needed

**Value:** Understand system performance and efficiency in real-time

---

### 3. Heating Duty Cycle Analysis ⏱️
**Status:** Planned  
**Priority:** Medium  
**Effort:** 3 hours  
**Type:** Analysis

**Available:** Heating ON/OFF status every 60 seconds

**Current State:** Just showing current state (ON/OFF)

**Opportunity:**
- Duty cycle percentage (% time heating per hour/day)
- Cycling frequency (starts per hour - too many = inefficient)
- Heating duration histogram (how long each cycle lasts)
- Optimal vs. actual comparison

**Value:** Detect short-cycling issues, optimize runtime

---

### 4. Mode Changes & Manual Override Tracking 🎛️
**Status:** Planned  
**Priority:** Low  
**Effort:** 3 hours  
**Type:** Feature

**Available:** Mode (auto/on/off), heat curve changes, manual overrides

**Current State:** Only showing current mode

**Opportunity:**
- Manual intervention log (when you override, why)
- Mode change timeline (visual history)
- Override effectiveness (did manual change help?)
- Comfort score (how often you had to intervene)

**Value:** Learn if automatic optimization is working well

---

### 5. Hot Water Pattern Analysis 🚿
**Status:** Planned  
**Priority:** Low  
**Effort:** 5 hours  
**Type:** Feature

**Available:** Hot water temp every 60 seconds

**Current State:** Just current temperature display

**Opportunity:**
- Hot water usage detection (temp drops = water used)
- DHW heating cycles (when/how often water heated)
- Legionella prevention tracking (reaching 60°C)
- Hot water cost allocation (separate from space heating)

**Value:** Optimize DHW heating schedule separately from space heating

---

### 6. Brine Temperature Analysis ❄️
**Status:** Planned  
**Priority:** Low  
**Effort:** 3 hours  
**Type:** Analysis

**Available:** Brine in/out temps from ground collector

**Current State:** Basic display on cards

**Opportunity:**
- Ground collector performance trending (ΔT over time)
- Ground freeze detection (brine temps too low)
- Seasonal ground temperature trends
- Ground recovery periods (when not heating)

**Value:** Monitor ground source health, detect issues early

---

### 7. Predictive Insights 🔮
**Status:** Planned  
**Priority:** High  
**Effort:** 8 hours  
**Type:** Feature (AI/ML)

**Available:** Historical data (temps, prices, heating status)

**Current State:** No predictive analysis

**Opportunity:**
- Predicted comfort loss ("temp will drop 2°C by 18:00")
- Optimal preheat timing ("start heating at 16:00 for comfort at 18:00")
- Cost forecast ("heating will cost €X if prices stay high")
- Weather integration (adjust for forecast)

**Value:** Proactive optimization, better planning

---

## 🚀 High-Impact Features

### A. Energy Dashboard 📊
**Status:** ✅ COMPLETE (April 3, 2026)  
**Priority:** 🥇 HIGH  
**Effort:** 6 hours (actual: ~4 hours)  
**Type:** Feature  
**Quick Win:** ✓

**Description:**
Complete energy consumption and cost tracking dashboard.

**Components:**
```
1. Daily Energy Summary Card
   - Total kWh consumed
   - Total cost (€)
   - Comparison to average
   - Savings vs. baseline

2. Power Consumption Graph
   - 24-hour line chart (kW over time)
   - Color-coded by price zones (cheap=green, expensive=red)
   - Overlay heating periods
   - Click for details

3. Weekly/Monthly Comparison
   - Energy per day (bar chart)
   - Cost per day
   - Running totals
   - Trend indicators

4. Cost Breakdown
   - Space heating cost
   - Hot water cost
   - Standby power cost
```

**Technical Requirements:**
- Store power readings in database (extend existing tables)
- Calculate kWh: integrate power over time using trapezoidal rule
- Multiply by hourly prices for cost calculation
- Implement baseline comparison logic

**Value:** Core feature for understanding energy usage and savings

---

### B. System Performance Card 🎯
**Status:** ✅ COMPLETE (April 3, 2026)  
**Priority:** 🥈 MEDIUM  
**Effort:** 4 hours (actual: ~2 hours)  
**Type:** Feature  
**Quick Win:** ✓

**Description:**
Real-time system efficiency and health metrics.

**Metrics Displayed:**
```
1. COP (Coefficient of Performance)
   - Heat delivered / Power consumed
   - Typical range: 2.5-4.5
   - Status indicator (good/warning/poor)

2. Duty Cycle
   - % time heating per hour
   - Optimal range: 30-60%
   - Too low = oversized, too high = undersized

3. Cycling Frequency
   - Heating starts per hour
   - Optimal: 1-3 cycles/hour
   - High cycling = inefficiency

4. Ground Heat Extraction
   - Brine ΔT (In - Out)
   - Typical: 2.5-3.5°C
   - Low values = ground performance issue

5. Heating Efficiency
   - Supply - Return ΔT
   - Typical: 5-10°C
   - Shows heat transfer to floors

6. Overall Status
   - ✅ Optimal / ⚠️ Attention / 🚨 Issue
```

**Calculations:**
```python
# COP (simplified - real calc needs flow rate)
heat_delivered = (supply_temp - return_temp) * assumed_flow * specific_heat
cop = heat_delivered / power_consumed

# Duty cycle (last hour)
heating_minutes = sum(heating_status == True) * 1
duty_cycle = (heating_minutes / 60) * 100

# Cycling frequency (last hour)
cycles = count_transitions(heating_status, OFF→ON)
cycles_per_hour = cycles

# Ground extraction
ground_delta = brine_in - brine_out

# Heating efficiency
heating_delta = supply_temp - return_temp
```

**Value:** Quick health check of system performance

---

### C. Smart Alerts & Notifications 🔔
**Status:** Planned  
**Priority:** 🥇 HIGH  
**Effort:** 7 hours  
**Type:** Feature

**Description:**
Intelligent monitoring and proactive notifications.

**Alert Categories:**

**1. Efficiency Alerts**
- Low COP detected (< 2.0)
- High cycling frequency (> 4 starts/hour)
- Poor ground extraction (ΔT < 2.0°C)
- Unusual power consumption patterns

**2. Price Opportunity Alerts**
- Major price drop coming (> 40% decrease)
- Expensive period ahead (avoid if possible)
- Optimal preheat window identified
- Savings opportunity missed (post-analysis)

**3. Comfort Alerts**
- Temperature trending below target
- Predicted discomfort in X hours
- Override recommended for comfort
- Manual intervention may be needed

**4. Maintenance Alerts**
- Brine temps too low (freeze risk)
- Hot water not reaching safe temp (legionella risk)
- System running continuously (investigate)
- MQTT connection unstable

**5. Savings Alerts**
- Daily savings achieved (€X saved vs. baseline)
- Weekly savings milestone (100 kWh reduction)
- Monthly report ready
- Optimization working well (positive feedback)

**Alert Delivery:**
- In-app notification banner
- Browser notifications (optional)
- Email digest (daily/weekly)
- Mobile push (future)

**Configuration:**
- Alert sensitivity levels (normal/high)
- Quiet hours (no notifications)
- Alert type selection (enable/disable)

**Value:** Proactive monitoring, early issue detection, engagement

---

### D. Enhanced Temperature Chart 📉
**Status:** ✅ COMPLETE (April 3, 2026)  
**Priority:** 🥈 MEDIUM  
**Effort:** 3 hours (actual: ~2 hours)  
**Type:** Enhancement  
**Quick Win:** ✓✓

**Description:**
Enhance existing temperature chart with contextual overlays.

**Enhancements:**

**1. Comfort Zone Band**
- Shaded area: Target ± 0.5°C
- Shows when temp in/out of comfort
- Color: Light green

**2. Price Zone Overlays**
- Background color gradient based on price
- Green = cheap (< 33rd percentile)
- Yellow = medium (33-66th percentile)
- Red = expensive (> 66th percentile)

**3. Heating Period Highlights**
- Vertical bars when heating active
- Color intensity = power level
- Show exactly when heat pump ran

**4. Interactive Features**
- Hover to see all values at that time
- Click to see detailed breakdown
- Zoom/pan for different time ranges
- Toggle series on/off

**5. Multiple View Modes**
- Last 24 hours (default)
- Last 7 days (trend view)
- Custom range picker

**Value:** Better understanding of heating patterns vs. prices

---

### E. Comparison View 📈
**Status:** ✅ COMPLETE (April 4, 2026)  
**Priority:** 🥉 LOW  
**Effort:** 4 hours (actual: ~3 hours)  
**Type:** Feature

**Description:**
Compare performance across different time periods.

**Comparison Types:**

**1. Week over Week**
```
This Week  │  Last Week  │  Change
──────────────────────────────────
Energy:  82 kWh  │  95 kWh  │ -14% ↓
Cost:    €21.50  │ €28.30   │ -24% ↓
Comfort: 98%     │  97%     │  +1% ↑
Avg Temp: 21.2°C │ 21.0°C   │ +0.2° ↑
```

**2. Month over Month**
- Energy consumption trends
- Cost trends
- Weather-adjusted comparison
- Seasonal patterns

**3. Before/After Optimization**
- Compare to baseline (first week without optimization)
- Show cumulative savings
- Comfort impact assessment

**4. Strategy Comparison**
- Aggressive vs. Balanced vs. Conservative
- Energy/cost/comfort trade-offs
- Recommendation based on preferences

**Metrics Tracked:**
- Total energy (kWh)
- Total cost (€)
- Average temperature
- Comfort score (% time in range)
- COP average
- Duty cycle average

**Value:** Quantify improvements, validate optimization

---

### F. Hot Water Intelligence 🚿
**Status:** Planned (Phase 1 & 2 Approved)  
**Priority:** 🥇 HIGH  
**Effort:** Phase 1: 16 hours | Phase 2: 18 hours | Total: 34 hours  
**Type:** Feature (Major)

**Description:**
Intelligent hot water heating management with cost optimization, safety compliance, learning capability, and holistic system coordination.

---

#### **Phase 1: Must Have (MVP) - 16 hours**

##### **F1. Cost-Aware Scheduling** (5 hours)
**Priority:** 🥇 HIGH

**Problem:** Heating water during expensive electricity hours wastes money.

**Features:**
- Price-optimized heating schedule
- Integration with Nord Pool hourly prices
- Multi-strategy support:
  - "Maximum Savings" - Heat only when cheap, risk occasional shortfall
  - "Balanced" (default) - Optimize cost but guarantee availability
  - "Comfort First" - Always ready, cost secondary
- Price threshold configuration (only heat when < X ¢/kWh unless urgent)
- Minimum ready time before peak usage
- Temperature reserve for unexpected usage (+5°C buffer)

**Technical Implementation:**
```python
# backend/app/services/dhw_optimizer.py
def optimize_dhw_heating(usage_forecast, price_forecast, constraints):
    # Find cheapest heating windows before each usage event
    # Ensure constraints met (min temp, ready time)
    # Return optimized schedule
```

**Database:**
```sql
CREATE TABLE dhw_schedules (
    timestamp DATETIME,
    action TEXT,  -- heat/maintain/idle
    target_temp REAL,
    reason TEXT,
    estimated_cost REAL
);
```

**Settings UI:**
- Strategy selector (radio buttons)
- Price threshold slider (¢/kWh)
- Minimum ready time (hours before peak)
- Temperature reserve toggle

**Value:** 30-50% reduction in DHW heating cost

---

##### **F2. Safety Compliance (Legionella Prevention)** (4 hours)
**Priority:** 🥇 HIGH (Legal requirement)

**Problem:** Legionella bacteria grows in water 20-45°C. Legal requirement to heat to 60°C weekly.

**Features:**
- Automatic weekly 60°C heating cycle
- Smart scheduling (pick cheapest 3-hour window each week)
- Compliance logging (for health inspections)
- Temperature danger zone monitoring (20-45°C >24h = alert)
- Mandatory cycle (cannot be disabled)
- Failure detection (alert if doesn't reach 60°C)
- Time-at-temperature histogram tracking

**Technical Implementation:**
```python
# backend/app/services/legionella_service.py
legionella_cycle = {
    'frequency': 'weekly',
    'day': auto_select_cheapest_day(),
    'target': 60,  # °C
    'hold_time': 60,  # minutes
    'mandatory': True
}
```

**Database:**
```sql
CREATE TABLE legionella_cycles (
    id INTEGER PRIMARY KEY,
    scheduled_at DATETIME,
    executed_at DATETIME,
    peak_temp REAL,
    hold_duration_minutes INTEGER,
    success BOOLEAN,
    notes TEXT
);
```

**Settings UI:**
- Cycle day selector (Auto/Monday/.../Sunday)
- Preferred time window (Night/Morning/Auto)
- Compliance log display (last 12 cycles)
- "Test Cycle Now" button

**Alerts:**
- "Legionella cycle missed" (critical)
- "Temperature didn't reach 60°C" (critical)
- "Water in danger zone >24h" (warning)

**Value:** Legal compliance + health safety + peace of mind

---

##### **F3. Basic User Profiles** (4 hours)
**Priority:** 🥇 HIGH

**Problem:** Everyone's hot water needs are different - families vs singles, morning vs evening usage.

**Features:**
- Pre-made profile templates:
  - Family (4+ people) - High morning/evening demand
  - Couple - Medium morning/evening demand
  - Single - Low morning OR evening demand
  - Work from Home - Distributed usage
  - Seniors - Lower temperature, frequent small usage
  - Custom - Fully configurable
- Peak usage time configuration
- Target temperature preferences
- Weekend schedule override

**Technical Implementation:**
```python
# Profiles stored in config
hot_water_profile = {
    'type': 'family_4',
    'morning_peak': {
        'time_start': '06:00',
        'time_end': '08:00',
        'target_temp': 55,
        'priority': 'high'
    },
    'evening_peak': {
        'time_start': '18:00',
        'time_end': '21:00',
        'target_temp': 55,
        'priority': 'high'
    },
    'midday': {
        'time_start': '08:00',
        'time_end': '18:00',
        'target_temp': 45,
        'priority': 'low'
    },
    'night': {
        'time_start': '21:00',
        'time_end': '06:00',
        'target_temp': 40,
        'priority': 'economy'
    },
    'weekend_schedule': 'different'  # or 'same'
}
```

**Settings UI:**
- Profile selector (dropdown with descriptions)
- Peak time sliders (morning: 06:00-08:00, evening: 18:00-21:00)
- Temperature preferences (comfort vs economy)
- "Different weekend schedule" toggle
- Visual timeline showing configured schedule

**Value:** Personalized comfort + maximum savings

---

##### **F4. Failure Detection & Alerts** (3 hours)
**Priority:** 🥇 HIGH

**Problem:** Hot water system failing silently = cold showers = angry family.

**Features:**
- Critical alerts:
  - Heating not working (active 2h but temp <5°C rise)
  - Rapid cooling (15°C drop in 30min, no usage detected)
  - Legionella risk (temp in 20-45°C for >24h)
  - Excessive heating (>6h/day vs typical 2-3h)
- Warning alerts:
  - Missed usage prediction (usage occurred, no hot water)
  - Recovery time longer than expected
  - Temperature fluctuations (possible sensor issue)
- Alert history log
- Diagnostic recommendations

**Technical Implementation:**
```python
# backend/app/services/dhw_alerts.py
alert_rules = [
    {
        'name': 'heating_failure',
        'condition': 'heating_active_for_2h_and_temp_rise_lt_5',
        'severity': 'critical',
        'message': 'Hot water heater may be failing - heating but not rising',
        'action': 'recommend_service_call'
    },
    {
        'name': 'rapid_cooling',
        'condition': 'temp_drop_15c_in_30min_no_usage',
        'severity': 'warning',
        'message': 'Possible hot water leak or insulation issue',
        'action': 'recommend_inspection'
    },
    # ... more rules
]
```

**Database:**
```sql
CREATE TABLE dhw_alerts (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    alert_type TEXT,
    severity TEXT,  -- critical/warning/info
    message TEXT,
    acknowledged BOOLEAN DEFAULT 0,
    resolved_at DATETIME
);
```

**Settings UI:**
- Alert sensitivity customization
- Notification preferences
- Alert history (sortable, filterable)
- "Dismiss All" / "Acknowledge" buttons

**Value:** Catch problems early, prevent user dissatisfaction

---

#### **Phase 2: Should Have - 18 hours**

##### **F5. Smart Learning Mode** (8 hours)
**Priority:** 🥈 MEDIUM

**Problem:** You don't know your actual hot water usage patterns - they change over time.

**Features:**
- Automatic usage detection (temperature drops = water drawn)
- Volume estimation (temp drop × recovery time)
- Pattern recognition:
  - Peak usage times (morning/evening shifts)
  - Typical consumption per event
  - Weekly patterns (weekday vs weekend)
  - Seasonal variations
- 2-week learning period (minimum data requirement)
- Confidence scoring for predictions
- Auto-adjustment of heating schedule based on learned patterns

**Technical Implementation:**
```python
# backend/app/services/dhw_learning.py
class UsageLearningEngine:
    def detect_usage_event(self, temp_readings):
        # Detect significant temp drops
        # Calculate volume: ΔT × recovery_time × efficiency
        # Store event with metadata
        
    def learn_patterns(self, usage_history):
        # Group by time-of-day, day-of-week
        # Find recurring patterns
        # Calculate confidence scores
        # Return learned_schedule
        
    def predict_next_usage(self, current_datetime, learned_patterns):
        # Based on patterns, predict next usage
        # Return: time, volume, confidence
```

**Database:**
```sql
CREATE TABLE dhw_usage_events (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    temp_before REAL,
    temp_after REAL,
    estimated_volume_liters REAL,
    duration_minutes INTEGER,
    event_type TEXT,  -- shower/dishes/laundry/other
    detected_pattern TEXT  -- morning_shower/evening_dishes/etc
);

CREATE TABLE dhw_learned_patterns (
    id INTEGER PRIMARY KEY,
    pattern_name TEXT,
    time_range_start TIME,
    time_range_end TIME,
    days_of_week TEXT,  -- JSON array
    avg_volume_liters REAL,
    required_temp REAL,
    confidence_score REAL,
    last_updated DATETIME
);
```

**Settings UI:**
- "Learning Mode" toggle (on by default for first 2 weeks)
- "Pattern Insights" page:
  - Detected usage patterns (cards)
  - Confidence levels (progress bars)
  - Usage timeline visualization
- "Trust Learning" slider (0-100%, how much to rely on patterns)
- "Reset Learning" button (start from scratch)
- "Manual Override Today" for exceptions

**Insights Page Example:**
```
Detected Patterns (last 2 weeks):

📊 Morning Shower
   Time: 07:15 ± 20min
   Volume: ~120L
   Frequency: Weekdays (95% confident)
   Action: Preheat to 50°C by 06:45

📊 Evening Dishes
   Time: 19:30 ± 30min
   Volume: ~40L
   Frequency: Daily (88% confident)
   Action: Maintain 45°C after dinner
```

**Value:** Zero-effort optimization, adapts to lifestyle changes automatically

---

##### **F6. Integration with Space Heating** (6 hours)
**Priority:** 🥈 MEDIUM

**Problem:** Heat pump can't do both efficiently. Competition for compressor time.

**Features:**
- Coordinated scheduling (avoid conflicts)
- Priority matrix (space vs DHW based on urgency & cost)
- Opportunistic DHW heating during cheap hours
- COP optimization (prefer DHW when outdoor temp is mild)
- Sequential heating logic (DHW first, then space - or vice versa)
- System-wide efficiency tracking

**Technical Implementation:**
```python
# backend/app/services/system_coordinator.py
class HeatingCoordinator:
    def coordinate_schedules(self, space_schedule, dhw_schedule, prices):
        """
        Objective: Maximize system-wide efficiency and minimize cost
        
        Decision matrix:
        - If both critical: DHW first (faster recovery)
        - If cheap hour: Opportunistic DHW preheat
        - If space has priority: Defer DHW unless critical
        - If outdoor temp mild: Prefer DHW (better COP)
        """
        combined = []
        
        for hour in next_24_hours:
            space_priority = space_schedule[hour]['priority']
            dhw_priority = dhw_schedule[hour]['priority']
            price = prices[hour]
            outdoor_temp = forecast[hour]['temp']
            
            decision = self._decide_action(
                space_priority, 
                dhw_priority, 
                price, 
                outdoor_temp
            )
            
            combined.append({
                'hour': hour,
                'action': decision['action'],
                'reason': decision['reason'],
                'estimated_cop': decision['cop']
            })
        
        return combined
```

**Database:**
```sql
CREATE TABLE system_coordination_log (
    timestamp DATETIME,
    decision TEXT,  -- space_only/dhw_only/sequential/both
    space_priority TEXT,
    dhw_priority TEXT,
    price REAL,
    outdoor_temp REAL,
    reason TEXT,
    actual_cop REAL
);
```

**Settings UI:**
- "DHW Priority" slider: Low → High (vs space heating)
- "Opportunistic Heating" toggle (use cheap hours proactively)
- "Minimum Space Comfort" threshold (never compromise below X°C)
- "Coordination Strategy":
  - Sequential (do one at a time - better COP)
  - Parallel (faster but lower efficiency)
  - Auto (system decides)

**Dashboard Display:**
- Combined schedule visualization (space + DHW timeline)
- Conflict detection indicators
- Efficiency metrics (system-wide COP)

**Value:** System-wide optimization, avoid conflicts, maximize efficiency

---

##### **F7. Usage Insights Dashboard** (4 hours)
**Priority:** 🥈 MEDIUM

**Problem:** No visibility into DHW costs, usage patterns, or savings potential.

**Features:**
- Daily/weekly/monthly DHW metrics
- Cost breakdown (heating vs legionella vs standby loss)
- Usage pattern visualization
- Efficiency tracking (COP average, recovery time)
- Savings comparison (optimized vs baseline)
- Export data (CSV)

**Metrics Displayed:**
```yaml
daily_summary:
  total_usage_liters: 180
  events_count: 4
  avg_temp_celsius: 48
  energy_used_kwh: 3.2
  cost_eur: 0.68
  cost_breakdown:
    heating: 0.55  # Regular heating
    legionella: 0.13  # Weekly cycle
    standby: 0.00  # Tank heat loss (minimal)
  
  efficiency:
    cop_avg: 2.8
    standby_loss_kwh: 0.4
    recovery_time_minutes: 45
    
weekly_comparison:
  this_week: 4.76
  last_week: 5.20
  savings_eur: -0.44
  savings_percent: -8.5
  
usage_breakdown:
  morning_showers: "60%"
  evening_dishes: "25%"
  laundry: "10%"
  other: "5%"
```

**Visualizations:**
1. **Usage Timeline** - When water was drawn (bar chart by hour)
2. **Cost Attribution** - Space heating vs DHW (pie chart)
3. **Temperature History** - 48h line chart with heating periods highlighted
4. **Savings Tracker** - Cumulative savings vs baseline (line chart)
5. **Weekly Comparison** - Bar chart (this week vs last week)

**Technical Implementation:**
```python
# backend/app/api/dhw_analytics.py
@router.get("/api/dhw/analytics/daily")
async def get_daily_dhw_analytics(date: str):
    # Query usage events, costs, temperatures
    # Calculate metrics
    # Return formatted data
    
@router.get("/api/dhw/analytics/weekly")
async def get_weekly_dhw_analytics(week: str):
    # Aggregate daily data
    # Compare to previous week
    # Calculate savings
```

**Settings UI:**
- New "Hot Water Analytics" page
- Time range selector (Day/Week/Month)
- Compare to: Last period / Baseline / Target
- Export button (download CSV)
- Share button (generate report)

**Value:** Visibility drives behavior change + validates optimization effectiveness

---

#### **Database Schema Summary**

New tables required:
```sql
-- Scheduling
CREATE TABLE dhw_schedules (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    action TEXT,
    target_temp REAL,
    reason TEXT,
    estimated_cost REAL
);

-- Compliance
CREATE TABLE legionella_cycles (
    id INTEGER PRIMARY KEY,
    scheduled_at DATETIME,
    executed_at DATETIME,
    peak_temp REAL,
    hold_duration_minutes INTEGER,
    success BOOLEAN,
    notes TEXT
);

-- Learning
CREATE TABLE dhw_usage_events (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    temp_before REAL,
    temp_after REAL,
    estimated_volume_liters REAL,
    duration_minutes INTEGER,
    event_type TEXT,
    detected_pattern TEXT
);

CREATE TABLE dhw_learned_patterns (
    id INTEGER PRIMARY KEY,
    pattern_name TEXT,
    time_range_start TIME,
    time_range_end TIME,
    days_of_week TEXT,
    avg_volume_liters REAL,
    required_temp REAL,
    confidence_score REAL,
    last_updated DATETIME
);

-- Alerts
CREATE TABLE dhw_alerts (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    alert_type TEXT,
    severity TEXT,
    message TEXT,
    acknowledged BOOLEAN DEFAULT 0,
    resolved_at DATETIME
);

-- Coordination
CREATE TABLE system_coordination_log (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    decision TEXT,
    space_priority TEXT,
    dhw_priority TEXT,
    price REAL,
    outdoor_temp REAL,
    reason TEXT,
    actual_cop REAL
);
```

---

#### **API Endpoints Summary**

```python
# Configuration
GET  /api/dhw/config
PUT  /api/dhw/config
GET  /api/dhw/profiles  # List available profiles

# Scheduling
GET  /api/dhw/schedule/next-24h
GET  /api/dhw/schedule/history?days=7

# Monitoring
GET  /api/dhw/status  # Current temp, next heating, cost today
GET  /api/dhw/temperature/history?hours=48

# Learning
GET  /api/dhw/patterns/learned
GET  /api/dhw/patterns/confidence
POST /api/dhw/patterns/reset

# Analytics
GET  /api/dhw/analytics/daily?date=YYYY-MM-DD
GET  /api/dhw/analytics/weekly?week=YYYY-WW
GET  /api/dhw/analytics/monthly?month=YYYY-MM
GET  /api/dhw/usage/events?days=7

# Compliance
GET  /api/dhw/legionella/history
POST /api/dhw/legionella/test-cycle
GET  /api/dhw/legionella/next-scheduled

# Alerts
GET  /api/dhw/alerts
POST /api/dhw/alerts/{id}/acknowledge
GET  /api/dhw/alerts/config
PUT  /api/dhw/alerts/config

# Coordination
GET  /api/system/coordination/schedule
GET  /api/system/coordination/status
```

---

#### **Success Metrics**

**Primary KPIs:**
- DHW cost reduction: 30-40% vs baseline
- Zero cold water events (user satisfaction)
- 100% legionella cycle compliance
- DHW COP average >2.5

**Secondary KPIs:**
- Pattern learning accuracy: 90%+ usage events predicted
- User customization rate: >50% change defaults
- Override frequency: <5% (automation works well)
- Alert response time: Issues caught within 24h
- System-wide efficiency: Combined COP improvement 5-10%

**Value:** Safety compliance + significant cost savings + user satisfaction + zero-effort operation

---

## 🔧 Technical Improvements

### G. Database Schema Enhancements
**Status:** Planned  
**Priority:** Medium  
**Effort:** 2 hours  
**Type:** Infrastructure

**Changes Needed:**
```sql
-- Add power consumption history
CREATE TABLE power_readings (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    power_watts REAL,
    heating_active BOOLEAN,
    cost_cents REAL  -- power * price
);

-- Add system performance metrics
CREATE TABLE performance_metrics (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    cop REAL,
    duty_cycle_percent REAL,
    cycles_per_hour REAL,
    ground_delta_temp REAL,
    heating_delta_temp REAL
);

-- Add alerts log
CREATE TABLE alerts (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    type TEXT,  -- efficiency/price/comfort/maintenance/savings
    severity TEXT,  -- info/warning/critical
    message TEXT,
    acknowledged BOOLEAN DEFAULT 0
);

-- Add hot water events
CREATE TABLE hot_water_events (
    id INTEGER PRIMARY KEY,
    timestamp DATETIME,
    event_type TEXT,  -- usage/heating/legionella
    temp_before REAL,
    temp_after REAL,
    duration_minutes INTEGER
);
```

---

### H. API Endpoints Needed
**Status:** Planned  
**Priority:** Medium  
**Effort:** 3 hours  
**Type:** Infrastructure

**New Endpoints:**
```python
# Energy dashboard
GET  /api/energy/daily?date=YYYY-MM-DD
GET  /api/energy/weekly?start=YYYY-MM-DD
GET  /api/energy/monthly?month=YYYY-MM

# Performance metrics
GET  /api/performance/current
GET  /api/performance/history?hours=24

# Alerts
GET  /api/alerts
POST /api/alerts/{id}/acknowledge
GET  /api/alerts/config
PUT  /api/alerts/config

# Comparisons
GET  /api/compare/week?week1=YYYY-WW&week2=YYYY-WW
GET  /api/compare/month?month1=YYYY-MM&month2=YYYY-MM
GET  /api/compare/baseline

# Hot water
GET  /api/hotwater/status
GET  /api/hotwater/schedule
PUT  /api/hotwater/schedule
GET  /api/hotwater/usage?days=7
```

---

### I. Background Jobs & Schedulers
**Status:** Planned  
**Priority:** Medium  
**Effort:** 3 hours  
**Type:** Infrastructure

**Jobs Needed:**

**1. Metrics Calculator** (runs every 5 minutes)
- Calculate COP, duty cycle, cycling frequency
- Store in performance_metrics table
- Update real-time dashboard

**2. Alert Evaluator** (runs every 5 minutes)
- Check all alert conditions
- Generate new alerts
- Send notifications

**3. Energy Aggregator** (runs hourly)
- Calculate hourly kWh totals
- Calculate hourly costs
- Store aggregated data

**4. Daily Report Generator** (runs at 00:05)
- Generate daily summary
- Calculate savings vs. baseline
- Send summary notification

**5. Weekly Report Generator** (runs Sunday 00:10)
- Generate weekly summary
- Comparison to previous week
- Send email digest (if configured)

---

## 🎨 UI/UX Improvements

### J. Dark Mode
**Status:** Planned  
**Priority:** Low  
**Effort:** 4 hours  
**Type:** Enhancement

**Implementation:**
- TailwindCSS dark mode classes
- Toggle button in header
- Persist preference (localStorage)
- Smooth transitions

---

### K. Mobile App (PWA)
**Status:** Planned  
**Priority:** Low  
**Effort:** 8 hours  
**Type:** Feature

**Convert to PWA:**
- Service worker for offline
- App manifest
- Install prompt
- Push notifications
- Home screen icon

---

### L. Responsive Improvements
**Status:** Planned  
**Priority:** Medium  
**Effort:** 3 hours  
**Type:** Enhancement

**Focus Areas:**
- Better tablet layout (3-column)
- Improved phone navigation
- Collapsible cards
- Touch-friendly controls

---

## 🌐 Integration Features

### M. Weather Integration
**Status:** Planned  
**Priority:** High  
**Effort:** 5 hours  
**Type:** Feature

**Provider:** OpenWeather API or similar

**Features:**
- Fetch local weather forecast
- Adjust heating predictions based on forecast
- Display outdoor temp forecast vs. actual
- Factor weather into optimization algorithm

**Value:** Better predictive optimization

---

### N. Calendar Integration (OpenClaw)
**Status:** Planned  
**Priority:** Medium  
**Effort:** 15 hours  
**Type:** Feature (Major)

**Description:**
Family AI assistant running alongside Thermi-Nator on Raspberry Pi.

**Features:**
- Google Calendar integration
- Grocery list management
- Task tracking
- Family schedule coordination
- Integration with Thermi-Nator status

**See:** Separate planning document needed

---

### O. Nord Pool Historical Data Import
**Status:** Planned  
**Priority:** Low  
**Effort:** 2 hours  
**Type:** Feature

**Purpose:**
- Import historical price data
- Better baseline comparisons
- Seasonal pattern analysis
- Price forecasting improvement

---

## 📱 Hardware Integration

### P. Real Device Connection
**Status:** Waiting for Hardware  
**Priority:** 🔥 CRITICAL (when device arrives)  
**Effort:** 8 hours  
**Type:** Infrastructure

**Tasks:**
1. Connect Thermi-Nator-ROOM2LP to heat pump EXT interface
2. Configure device WiFi
3. Update MQTT topics to match real device
4. Test all sensor readings
5. Verify command/control works
6. Calibration and tuning (24-48 hours monitoring)
7. Update building parameters based on real data
8. Replace mock device with real in production

**Blockers:** 
- Device not yet delivered
- Cannot test without physical hardware

---

### Q. Raspberry Pi Deployment
**Status:** ✅ COMPLETE (April 4, 2026)  
**Priority:** High  
**Effort:** 4 hours (actual: ~4 hours)  
**Type:** Infrastructure

**Tasks Completed:**
1. ✅ Created automated installation script (`deployment/raspberry-pi/install.sh`)
2. ✅ systemd service configuration included
3. ✅ Mosquitto MQTT broker setup
4. ✅ Python/Node.js environment setup
5. ✅ Database initialization
6. ✅ Auto-start on boot configuration
7. ✅ Cross-platform support (also macOS and Windows install scripts)
8. ✅ Comprehensive deployment documentation (`docs/DEPLOYMENT.md`)
9. ✅ Getting started guide (`GETTING_STARTED.md`)

**Status:** Ready for production deployment when hardware arrives

---

## 🧪 Testing & Quality

### R. Automated Testing
**Status:** ✅ COMPLETE (April 4, 2026)  
**Priority:** Medium  
**Effort:** 10 hours (actual: ~6 hours)  
**Type:** Infrastructure

**Test Coverage Implemented:**
- ✅ Unit tests for optimization engine (`backend/tests/test_optimization_engine.py`)
- ✅ API endpoint tests (`backend/tests/test_api.py`)
- ✅ Alert service tests (`backend/tests/test_alert_service.py`)
- ✅ Frontend component tests (vitest setup with ThemeToggle, ComparisonPage tests)
- ✅ pytest.ini configuration
- ✅ vitest.config.ts configuration

**Current Coverage:** Core functionality tested, expandable as needed

---

### S. Performance Optimization
**Status:** Planned  
**Priority:** Low  
**Effort:** 4 hours  
**Type:** Enhancement

**Focus Areas:**
- Database query optimization
- Reduce API response times
- Frontend bundle size reduction
- WebSocket message efficiency
- Memory usage optimization

---

## 📚 Documentation

### T. User Documentation
**Status:** Planned  
**Priority:** Medium  
**Effort:** 8 hours  
**Type:** Documentation

**Documents Needed:**
- Complete user guide (PDF)
- Video walkthrough
- Troubleshooting guide
- FAQ
- Best practices
- Configuration guide

---

### U. API Documentation
**Status:** Partially Complete  
**Priority:** Low  
**Effort:** 3 hours  
**Type:** Documentation

**Improvements:**
- More examples in Swagger
- Webhook documentation
- Rate limiting info
- Error code reference

---

## 🔐 Security

### V. MQTT Authentication
**Status:** ✅ IMPLEMENTED (April 4, 2026)  
**Priority:** High (for production)  
**Effort:** 2 hours (actual: already done)  
**Type:** Security

**Implementation Complete:**
- ✅ Backend supports username/password authentication (`mqtt_manager.py:38-50`)
- ✅ Configuration via `config.yaml` or environment variables
- ✅ Setup wizard includes auth configuration (`backend/app/api/setup.py`)
- ✅ Documentation includes auth setup (`docs/MQTT_SETUP.md`)

**To Enable in Production:**
1. Set `allow_anonymous false` in `mosquitto.conf`
2. Create password file: `mosquitto_passwd -c /etc/mosquitto/passwd thermiq`
3. Add `password_file /etc/mosquitto/passwd` to mosquitto.conf
4. Configure `MQTT_USER` and `MQTT_PASSWORD` environment variables
5. Restart Mosquitto service

---

### W. HTTPS/TLS
**Status:** Planned  
**Priority:** High (if remote access)  
**Effort:** 2 hours  
**Type:** Security

**Implementation:**
- Generate SSL certificates (Let's Encrypt)
- Configure Nginx for HTTPS
- Redirect HTTP to HTTPS
- Update frontend config

---

### X. Rate Limiting & Input Validation
**Status:** Planned  
**Priority:** Medium  
**Effort:** 3 hours  
**Type:** Security

**Implementation:**
- Rate limit API endpoints
- Stricter input validation
- SQL injection prevention (already using ORM)
- XSS prevention in frontend

---

## 📊 Priority Matrix

### ✅ Completed
| Feature | Effort | Actual | Completed |
|---------|--------|--------|-----------|
| Energy Dashboard | 6h | 4h | April 3, 2026 |
| Enhanced Temp Chart | 3h | 2h | April 3, 2026 |
| Performance Card | 4h | 2h | April 3, 2026 |
| Smart Alerts | 7h | 4h | April 3, 2026 |
| Weather Integration | 5h | 3h | April 3, 2026 |
| User Documentation | 8h | 6h | April 3, 2026 |
| Comparison View | 4h | 3h | April 4, 2026 |
| Automated Testing | 10h | 6h | April 4, 2026 |
| Raspberry Pi Deployment | 4h | 4h | April 4, 2026 |
| MQTT Authentication | 2h | 0h | Already implemented |
| Hot Water Intelligence | 5h | 5h | Sprint 4 |
| Dark Mode | 4h | 4h | Sprint 4 |

### 🔥 High Priority (Do First)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| **DHW Phase 1 (MVP)** | **16h** | | None |
| - Cost-Aware Scheduling | 5h | ✓ | None |
| - Safety Compliance (Legionella) | 4h | ✓ | None |
| - Basic User Profiles | 4h | ✓ | None |
| - Failure Detection & Alerts | 3h | ✓ | None |
| **DHW Phase 2 (Learning)** | **18h** | | Phase 1 |
| - Smart Learning Mode | 8h | | Phase 1 |
| - Space Heating Integration | 6h | | Phase 1 |
| - Usage Insights Dashboard | 4h | | Phase 1 |
| Real Device Connection | 8h | | Hardware delivery |
| Mobile PWA | 8h | | None |

### Medium Priority (Do Next)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| HTTPS/TLS Setup Guide | 2h | | None |
| API Rate Limiting | 3h | | None |
| Database Enhancements | 2h | | None |
| API Endpoints | 3h | | Database |
| Background Jobs | 3h | | Database |
| Responsive Improvements | 3h | | None |
| Performance Optimization | 4h | | None |

### Low Priority (Nice to Have)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| OpenClaw Integration | 15h | | None |
| Nord Pool Historical Import | 2h | | None |
| API Documentation Improvements | 3h | | None |

---

## 🎯 Recommended Roadmap

### ✅ Sprint 1: Quick Wins (COMPLETE - April 3, 2026)
- [x] Frontend MVP complete
- [x] Timezone fixes  
- [x] GitHub setup
- [x] Enhanced temperature chart (3h → 2h actual)
- [x] Performance card (4h → 2h actual)
- [x] Energy dashboard (6h → 4h actual)

**Total:** 13 hours estimated, 8 hours actual  
**Status:** ✅ COMPLETE  
**Value Delivered:** Significant UI improvements, energy tracking, real-time analytics

### ✅ Sprint 2: Intelligence & Documentation (COMPLETE - April 3, 2026)
- [x] Smart alerts system (7h → 4h actual)
  - [x] Database schema (alerts, performance_metrics tables)
  - [x] Alert evaluation service (5 alert types: efficiency, comfort, price_opportunity, maintenance, system_error)
  - [x] API endpoints (GET/POST alerts, acknowledge, resolve, config)
  - [x] Background job scheduler (runs every 15 minutes)
  - [x] Frontend AlertsPanel component
  - [x] Integration with DashboardPage
- [x] Weather integration (5h → 3h actual)
  - [x] WeatherService with OpenWeather API
  - [x] Current weather endpoint
  - [x] 48-hour forecast endpoint
  - [x] Heating load prediction based on weather
  - [x] Temperature trend analysis
  - [x] WeatherWidget component with forecast display
  - [x] Integration with InsightsPage
- [x] Database enhancements (included in alerts system)
- [x] Background jobs (included in alerts system)
- [x] User documentation (8h → 6h actual)
  - [x] USER_GUIDE.md (20+ pages)
  - [x] TROUBLESHOOTING.md (15+ pages)
  - [x] FAQ.md (50+ questions)
  - [x] BEST_PRACTICES.md (15+ pages)
  - [x] CONFIGURATION.md (20+ pages)

**Total:** 25 hours estimated, 13 hours actual  
**Status:** ✅ COMPLETE  
**Value Delivered:** Proactive monitoring, weather-aware optimization potential, comprehensive documentation

### ✅ Sprint 3: Testing & Deployment (COMPLETE - April 4, 2026)
- [x] Comparison view (4h → 3h actual)
  - [x] Backend API (`/api/compare/week`, `/api/compare/month`, `/api/compare/daily`)
  - [x] Frontend ComparisonPage with charts
  - [x] Week-over-week and month-over-month comparisons
  - [x] Test coverage for comparison functionality
- [x] Automated testing (10h → 6h actual)
  - [x] pytest setup with backend tests
  - [x] vitest setup with frontend tests
  - [x] Test coverage for core features
- [x] Raspberry Pi deployment (4h → 4h actual)
  - [x] Automated install script
  - [x] systemd services configuration
  - [x] Cross-platform deployment (Pi/macOS/Windows)
- [x] MQTT authentication (2h → already implemented)
  - [x] Support built into backend
  - [x] Configuration via setup wizard
  - [x] Documentation complete

**Total:** 20 hours estimated, 13 hours actual  
**Status:** ✅ COMPLETE  
**Value Delivered:** Production-ready system with testing, deployment automation, and security

### Sprint 4: User Experience (PARTIAL - April 4, 2026)
- [x] Hot water intelligence (5h - basic implementation) ✅
- [x] Dark mode (4h) ✅
- [x] NetAtmo integration infrastructure (8h) ✅ - OAuth2 pending
- [ ] Mobile PWA (8h)
- [ ] OpenClaw planning (3h)
- [ ] Additional HTTPS/TLS setup guide (2h) - optional for remote access
- [ ] API rate limiting (3h) - optional enhancement

**Total:** 33 hours (17h completed, 16h remaining)
**Value:** Enhanced user experience and production hardening

### ⭐ Sprint 5: Hot Water Intelligence (APPROVED - 34 hours)

#### Phase 1: Must Have (MVP) - 16 hours
- [ ] Cost-aware scheduling with Nord Pool integration (5h)
- [ ] Safety compliance & legionella prevention (4h)
- [ ] Basic user profiles (Family/Couple/Single/Custom) (4h)
- [ ] Failure detection & critical alerts (3h)

**Value:** 30-50% DHW cost reduction + legal compliance + safety

#### Phase 2: Should Have - 18 hours
- [ ] Smart learning mode (pattern detection) (8h)
- [ ] Space heating coordination (avoid conflicts) (6h)
- [ ] Usage insights dashboard (analytics) (4h)

**Value:** Zero-effort optimization + system-wide efficiency + visibility

**Status:** Ready to start  
**Dependencies:** None (builds on existing infrastructure)  
**Expected Completion:** 1 week (full-time) or 2 weeks (part-time)

### Sprint 6: Real Hardware (when device arrives)
- [ ] Physical device setup (8h)
- [ ] Calibration and tuning (ongoing)
- [ ] Optimization refinement (4h)
- [ ] Performance validation (ongoing)

**Total:** 12+ hours  
**Value:** Real-world optimization

---

## 📝 Notes

### Out of Scope (for now)
- Multi-device support (multiple heat pumps)
- Multi-user/multi-location
- Machine learning price prediction
- Voice control integration
- Integration with other home automation systems
- Commercial/enterprise features

### Future Considerations
- API for third-party integrations
- Plugin architecture
- Community contributions
- Mobile native apps (iOS/Android)
- Advanced analytics dashboard
- Expert mode for HVAC professionals

---

## 🎉 Success Metrics

**When is each feature "done"?**
- Implemented and tested
- Documented (user-facing features)
- No known bugs
- Performance acceptable
- Code reviewed
- Merged to main branch

**Overall project success:**
- 20-40% energy cost reduction achieved
- System runs 24/7 without intervention
- User satisfaction (comfort maintained)
- No critical bugs in production
- Documentation complete and helpful

---

**Last Updated:** April 4, 2026  
**Status:** Sprints 1-3 complete! Sprint 4 partial (17/33h). Sprint 5 (DHW Intelligence Phase 1 & 2) ready to start - 34 hours approved.  
**Next:** Hot Water Intelligence expansion (cost optimization, learning, coordination) OR Real hardware connection when device arrives.  
**Ready for:** Production deployment with enhanced DHW features
