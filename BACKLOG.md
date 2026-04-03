# ThermIQ Feature Backlog

**Last Updated:** April 3, 2026  
**Current Version:** MVP Complete (Backend + Frontend)

This document tracks all planned features, improvements, and ideas for ThermIQ.

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
**Status:** Planned  
**Priority:** 🥇 HIGH  
**Effort:** 6 hours  
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
**Status:** Planned  
**Priority:** 🥈 MEDIUM  
**Effort:** 4 hours  
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
**Status:** Planned  
**Priority:** 🥈 MEDIUM  
**Effort:** 3 hours  
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
**Status:** Planned  
**Priority:** 🥉 LOW  
**Effort:** 4 hours  
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
**Status:** Planned  
**Priority:** 🥉 LOW  
**Effort:** 5 hours  
**Type:** Feature

**Description:**
Dedicated hot water heating management and optimization.

**Features:**

**1. DHW Status Dashboard**
```
Current Temperature: 48°C
Target: 50°C
Status: Heating required soon

Last Heated: 2 hours ago
Next Heating: When price < 4¢/kWh
Cost Today: €0.85
```

**2. Usage Detection**
- Detect temperature drops (usage events)
- Track usage frequency and volume
- Daily/weekly usage patterns
- Peak usage times

**3. Legionella Prevention**
- Schedule weekly 60°C cycle
- Track compliance
- Auto-schedule during cheap hours
- Safety notifications

**4. Cost Allocation**
- Separate DHW cost from space heating
- Show DHW as % of total energy
- Optimize DHW heating schedule
- Use cheapest electricity hours

**5. Smart Scheduling**
- Heat during off-peak hours
- Maintain minimum safe temp (40°C)
- Boost before high-usage times
- Coordinate with space heating

**Value:** Safety compliance, cost optimization, usage insights

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
Family AI assistant running alongside ThermIQ on Raspberry Pi.

**Features:**
- Google Calendar integration
- Grocery list management
- Task tracking
- Family schedule coordination
- Integration with ThermIQ status

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
1. Connect ThermIQ-ROOM2LP to heat pump EXT interface
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
**Status:** Ready to Deploy  
**Priority:** High  
**Effort:** 4 hours (one-time setup)  
**Type:** Infrastructure

**Tasks:**
1. Order Raspberry Pi 4/5 (4GB) + accessories
2. Install Raspberry Pi OS Lite
3. Create automated installation script
4. Deploy ThermIQ stack
5. Configure systemd services
6. Setup Nginx reverse proxy
7. Test 24/7 operation
8. Configure automatic backups
9. Document deployment process

**Status:** Analysis complete, ready to execute

---

## 🧪 Testing & Quality

### R. Automated Testing
**Status:** Planned  
**Priority:** Medium  
**Effort:** 10 hours  
**Type:** Infrastructure

**Test Coverage:**
- Unit tests for optimization engine
- API endpoint tests
- Database query tests
- MQTT communication tests
- Frontend component tests
- E2E tests for critical paths

**Target:** 80% code coverage

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
**Status:** Planned  
**Priority:** High (for production)  
**Effort:** 2 hours  
**Type:** Security

**Implementation:**
- Enable Mosquitto authentication
- Create device credentials
- Update backend config
- Test authentication flow

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

### High Priority (Do First)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| Energy Dashboard | 6h | ✓ | None |
| Smart Alerts | 7h | | None |
| Enhanced Temp Chart | 3h | ✓✓ | None |
| Weather Integration | 5h | | None |
| Real Device Connection | 8h | | Hardware delivery |
| Raspberry Pi Deployment | 4h | | Pi hardware |

### Medium Priority (Do Next)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| Performance Card | 4h | ✓ | None |
| Comparison View | 4h | | Energy Dashboard |
| Database Enhancements | 2h | | None |
| API Endpoints | 3h | | Database |
| Background Jobs | 3h | | Database |
| User Documentation | 8h | | None |

### Low Priority (Nice to Have)
| Feature | Effort | Quick Win | Blocked By |
|---------|--------|-----------|------------|
| Hot Water Intelligence | 5h | | None |
| Dark Mode | 4h | | None |
| Mobile PWA | 8h | | None |
| OpenClaw Integration | 15h | | None |
| Automated Testing | 10h | | None |

---

## 🎯 Recommended Roadmap

### Sprint 1: Quick Wins (1 week)
- [x] Frontend MVP complete
- [x] Timezone fixes
- [x] GitHub setup
- [ ] Enhanced temperature chart (3h)
- [ ] Performance card (4h)
- [ ] Energy dashboard (6h)

**Total:** 13 hours  
**Value:** Significant UI improvements, energy tracking

### Sprint 2: Intelligence (1 week)
- [ ] Smart alerts system (7h)
- [ ] Weather integration (5h)
- [ ] Database enhancements (2h)
- [ ] Background jobs (3h)

**Total:** 17 hours  
**Value:** Proactive monitoring, better predictions

### Sprint 3: Polish & Deploy (1 week)
- [ ] Raspberry Pi deployment (4h)
- [ ] User documentation (8h)
- [ ] Comparison view (4h)
- [ ] Security hardening (4h)

**Total:** 20 hours  
**Value:** Production-ready system

### Sprint 4: Advanced Features (2 weeks)
- [ ] Hot water intelligence (5h)
- [ ] Dark mode (4h)
- [ ] Mobile PWA (8h)
- [ ] Automated testing (10h)
- [ ] OpenClaw planning (3h)

**Total:** 30 hours  
**Value:** Complete feature set

### Sprint 5: Real Hardware (when device arrives)
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

**Last Updated:** April 3, 2026  
**Status:** Backlog created, ready for prioritization  
**Next Review:** After Sprint 1 completion
