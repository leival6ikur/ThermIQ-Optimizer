# ThermIQ Frontend Mockups

## Design System

### Color Palette
```
Primary:   #667eea (Purple-blue)
Secondary: #764ba2 (Deep purple)
Success:   #10b981 (Green)
Warning:   #f59e0b (Amber)
Danger:    #ef4444 (Red)
Gray:      #6b7280 (Neutral gray)
Background:#f9fafb (Light gray)
```

### Typography
- **Font**: System fonts (-apple-system, SF Pro, Segoe UI)
- **Headings**: Bold, 24-32px
- **Body**: Regular, 14-16px
- **Small**: 12-14px

---

## 1. Dashboard Page (Main View)

```
┌────────────────────────────────────────────────────────────────┐
│  🏠 ThermIQ                   [⚙️ Settings]  [👤 Menu]         │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────┐                 │
│  │  Indoor Temperature │  │  Outdoor Temp   │                 │
│  │                     │  │                 │                 │
│  │      21.5°C        │  │     5.2°C      │                 │
│  │   ────────────     │  │   ────────     │                 │
│  │   Target: 21.0°C   │  │   ❄️ Cold      │                 │
│  └─────────────────────┘  └─────────────────┘                 │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────┐                 │
│  │  Heating Status     │  │  Today's Cost   │                 │
│  │                     │  │                 │                 │
│  │  🔥 ON             │  │   €2.34        │                 │
│  │  Power: 1,250W     │  │   ↓ 23% saved  │                 │
│  └─────────────────────┘  └─────────────────┘                 │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Temperature Chart (24h)                                  │ │
│  │                                                           │ │
│  │  25°C ─                                                   │ │
│  │       │    ╱──╲                                           │ │
│  │  21°C ─   ╱    ╲────                                      │ │
│  │       │  ╱          ╲                                     │ │
│  │  15°C ─                                                   │ │
│  │       └──┬────┬────┬────┬────┬────┬────┬────┬────┬───    │ │
│  │         0h   4h   8h  12h  16h  20h  24h                  │ │
│  │                                                           │ │
│  │  Legend: ── Indoor  ── Outdoor  ── Target               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Electricity Prices (Today)                               │ │
│  │                                                           │ │
│  │  120 €/MWh                                                │ │
│  │   │     █                                                 │ │
│  │  80 │     █  █                                            │ │
│  │   │  █  █  █  █  █                                        │ │
│  │  40 │  █  █  █  █  █  █  █  █  █                          │ │
│  │   │  █  █  █  █  █  █  █  █  █  █  █  █                  │ │
│  │   └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──                  │ │
│  │     0  2  4  6  8 10 12 14 16 18 20 22  Hour            │ │
│  │                                                           │ │
│  │  Colors: Green (cheap) Yellow (med) Red (expensive)      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Heating Schedule (Next 24h)                              │ │
│  │                                                           │ │
│  │  Now                                                      │ │
│  │   ↓                                                       │ │
│  │  ░░██░░░░██████░░░░████░░░░░░ (00:00 - 24:00)           │ │
│  │                                                           │ │
│  │  ██ Heating ON    ░░ Heating OFF                         │ │
│  │  Current hour: ON  |  Next change: 14:00 → OFF           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  Quick Actions                                            │ │
│  │                                                           │ │
│  │  [🔥 Manual Override]  [📊 View History]  [⚙️ Settings]  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Dashboard Components:

1. **Header Bar**
   - Logo/title on left
   - Settings button on right
   - Clean, minimal

2. **Status Cards** (2x2 grid at top)
   - Indoor temperature (large, prominent)
   - Outdoor temperature
   - Heating status (ON/OFF with icon)
   - Today's cost + savings

3. **Temperature Chart** (Full width)
   - Line chart with 3 lines (indoor, outdoor, target)
   - Last 24 hours
   - Recharts library
   - Auto-updates via WebSocket

4. **Price Chart** (Full width)
   - Bar chart showing hourly prices
   - Color-coded (green/yellow/red)
   - Current hour highlighted
   - Shows today + tomorrow if available

5. **Schedule Timeline** (Full width)
   - Visual timeline showing ON/OFF periods
   - Current time indicator
   - Next state change shown

6. **Quick Actions** (Bottom)
   - Manual override button
   - View history
   - Settings link

---

## 2. Settings Page

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard              Settings                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🎯 Optimization Strategy                                 │ │
│  │                                                           │ │
│  │  ○ Aggressive - Maximum savings                          │ │
│  │     Heat only during cheapest 30% of hours               │ │
│  │                                                           │ │
│  │  ● Balanced - Good comfort & savings (Recommended)       │ │
│  │     Heat during cheapest 50% of hours                    │ │
│  │                                                           │ │
│  │  ○ Conservative - Maximum comfort                        │ │
│  │     Heat during cheapest 70% of hours                    │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🌡️ Temperature Settings                                  │ │
│  │                                                           │ │
│  │  Target Temperature                                       │ │
│  │  ├─────────●──────┤  21.0°C                              │ │
│  │  15°C          25°C                                       │ │
│  │                                                           │ │
│  │  Temperature Tolerance                                    │ │
│  │  ├────●─────────┤  ±1.0°C                                │ │
│  │  0.5°C        3.0°C                                       │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  ⏰ Comfort Hours                                          │ │
│  │                                                           │ │
│  │  Always maintain temperature during these hours:          │ │
│  │                                                           │ │
│  │  Start Time  [06:00 ▼]    End Time  [23:00 ▼]           │ │
│  │                                                           │ │
│  │  Outside these hours, heating may be reduced to save     │ │
│  │  costs while utilizing thermal storage.                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🏠 Building Characteristics                              │ │
│  │                                                           │ │
│  │  Insulation Quality    [Good ▼]                          │ │
│  │  (Poor, Average, Good, Excellent)                        │ │
│  │                                                           │ │
│  │  Thermal Mass          [Medium ▼]                        │ │
│  │  (Low, Medium, High)                                     │ │
│  │                                                           │ │
│  │  These settings affect how the optimizer predicts        │ │
│  │  temperature changes and plans heating cycles.           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  📍 Location & Region                                     │ │
│  │                                                           │ │
│  │  Nord Pool Region      [Estonia (EE) ▼]                  │ │
│  │                                                           │ │
│  │  Location              [Tartu, Estonia          ]        │ │
│  │  (For weather integration)                               │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  🔧 Advanced Settings                                     │ │
│  │                                                           │ │
│  │  [> Show Advanced Settings]                              │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │  [Cancel]                              [Save Settings]   │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

### Settings Components:

1. **Strategy Selector**
   - Radio buttons
   - Clear descriptions
   - Visual indicator of current selection

2. **Temperature Sliders**
   - Range sliders with live value display
   - Visual min/max
   - Immediate feedback

3. **Time Pickers**
   - Dropdown selectors
   - 24-hour format
   - Clear labels

4. **Building Settings**
   - Dropdown menus
   - Helpful descriptions

5. **Advanced Section**
   - Collapsible panel
   - MQTT settings
   - Update intervals
   - Debug options

---

## 3. Manual Override Modal

```
┌─────────────────────────────────────────┐
│  Manual Temperature Override         ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Set a temporary target temperature    │
│  that overrides the optimization.      │
│                                         │
│  Target Temperature                     │
│  ├─────────●──────┤  23.0°C            │
│  15°C          30°C                     │
│                                         │
│  Duration                               │
│  ○ 1 hour                               │
│  ○ 2 hours                              │
│  ● 4 hours                              │
│  ○ Until next day                       │
│  ○ Permanent (until changed)            │
│                                         │
│  ⚠️  This will increase costs but      │
│     ensure immediate comfort.          │
│                                         │
│  [Cancel]              [Apply Override] │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. Mobile Responsive Layout

### Dashboard (Mobile)

```
┌──────────────────────┐
│  🏠 ThermIQ      ≡   │
├──────────────────────┤
│                      │
│  ┌────────────────┐  │
│  │  21.5°C       │  │
│  │  Indoor       │  │
│  │  Target: 21°C │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  5.2°C        │  │
│  │  Outdoor      │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  🔥 Heating ON │  │
│  │  1,250W       │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  [Temp Chart] │  │
│  │  (Scrollable) │  │
│  └────────────────┘  │
│                      │
│  ┌────────────────┐  │
│  │  [Price Chart]│  │
│  └────────────────┘  │
│                      │
│  [Manual Override]   │
│                      │
└──────────────────────┘
```

---

## 5. Component Library

### React Components to Build:

```typescript
// Layout
<DashboardLayout />
<SettingsLayout />

// Cards
<StatusCard icon={} title={} value={} subtitle={} />
<MetricCard label={} value={} unit={} trend={} />

// Charts
<TemperatureChart data={} />
<PriceChart prices={} />
<ScheduleTimeline schedule={} currentHour={} />

// Forms
<StrategySelector value={} onChange={} />
<TemperatureSlider value={} onChange={} min={} max={} />
<TimePicker value={} onChange={} />

// Modals
<ManualOverrideModal isOpen={} onClose={} onSave={} />

// Misc
<Header />
<QuickActions />
<LoadingSpinner />
<ErrorBoundary />
```

---

## 6. Color Usage Guide

### Status Indicators
- 🔥 **Heating ON**: `#ef4444` (red/orange)
- ❄️ **Heating OFF**: `#3b82f6` (blue)
- ✅ **Connected**: `#10b981` (green)
- ⚠️ **Warning**: `#f59e0b` (amber)
- ❌ **Error**: `#ef4444` (red)

### Price Colors
- **Cheap** (< 30th percentile): `#10b981` (green)
- **Medium** (30-70th): `#f59e0b` (amber)
- **Expensive** (> 70th): `#ef4444` (red)

### Chart Lines
- **Indoor**: `#667eea` (primary purple)
- **Outdoor**: `#3b82f6` (blue)
- **Target**: `#10b981` (green, dashed)

---

## 7. Interactions & Animations

### Hover States
- Cards: Slight shadow increase
- Buttons: Darken by 10%
- Charts: Show tooltip with exact values

### Loading States
- Cards: Pulse animation
- Charts: Skeleton loader
- Data refresh: Subtle spinner in corner

### Real-time Updates
- Temperature: Fade transition on change
- Status: Color transition (300ms)
- Charts: Smooth line animation

---

## 8. Data Update Strategy

### WebSocket Updates (Real-time)
- Temperature readings (every 30s)
- Heating status changes
- Power consumption

### API Polling (Periodic)
- Prices: Check every hour
- Schedule: Recalculate every 5 min
- System status: Every 30s

### Manual Refresh
- Pull-to-refresh on mobile
- Refresh button in header

---

## Questions for Review:

1. **Dashboard Layout**
   - Too much information? Too little?
   - Order of components make sense?
   - Any missing vital info?

2. **Settings Page**
   - Clear enough for non-technical users?
   - Too many options visible by default?
   - Should advanced be more hidden?

3. **Color Scheme**
   - Purple/blue theme OK?
   - Status colors intuitive?
   - Too colorful or too bland?

4. **Mobile Layout**
   - Stacked cards make sense?
   - Need a hamburger menu?
   - Charts readable on small screens?

5. **Priority**
   - Build dashboard first, settings later?
   - Or build both layouts simultaneously?
   - Skip mobile responsive initially?

---

## Approval Needed:

Please review and let me know:
- ✅ Approve as-is → I'll start building
- 🔧 Request changes → Tell me what to adjust
- 💡 Alternative ideas → Share your vision

This will save us tokens by getting the design right before coding! 🎯
