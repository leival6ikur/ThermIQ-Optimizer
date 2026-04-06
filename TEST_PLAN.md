# Thermi-Nator Test Plan

**Date:** April 3, 2026  
**Focus:** Comparison View Feature + General System Testing  
**Tester:** Manual + Automated

---

## 🎯 Testing Objectives

1. Verify comparison endpoints return correct data
2. Validate frontend displays week/month comparisons correctly
3. Ensure data accuracy and calculations
4. Test edge cases and error handling
5. Verify UI/UX across different scenarios

---

## ✅ Pre-Test Checklist

- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173
- [ ] Database has at least 30 days of seeded data
- [ ] Browser developer console open (F12)
- [ ] Network tab monitoring API calls

---

## 🧪 Test Suite 1: Backend API

### Test 1.1: Week Comparison Endpoint

**Endpoint:** `GET /api/compare/week`

**Steps:**
```bash
curl -s http://localhost:8000/api/compare/week | jq
```

**Expected Result:**
- HTTP 200 status
- JSON response with `week1`, `week2`, `changes` objects
- All metrics present: energy_kwh, cost, comfort_score, avg_indoor_temp, duty_cycle, heating_hours
- Change percentages calculated correctly
- Improvement flags (true/false) correct

**Pass Criteria:**
- [ ] Status 200
- [ ] Response time < 200ms
- [ ] All fields populated
- [ ] Changes match manual calculation
- [ ] Labels show date ranges

---

### Test 1.2: Month Comparison Endpoint

**Endpoint:** `GET /api/compare/month`

**Steps:**
```bash
curl -s http://localhost:8000/api/compare/month | jq
```

**Expected Result:**
- HTTP 200 status
- JSON response with current month vs previous month
- Month labels (e.g., "April 2026", "March 2026")
- All metrics present and reasonable

**Pass Criteria:**
- [ ] Status 200
- [ ] Response time < 200ms
- [ ] Month labels correct
- [ ] Data covers full month period
- [ ] Changes calculated correctly

---

### Test 1.3: Daily Breakdown Endpoint

**Endpoint:** `GET /api/compare/daily?days=14`

**Steps:**
```bash
curl -s "http://localhost:8000/api/compare/daily?days=14" | jq
```

**Expected Result:**
- HTTP 200 status
- Array of 14 daily entries
- Each entry has: date, day_name, energy_kwh, cost, comfort_score

**Pass Criteria:**
- [ ] Status 200
- [ ] Exactly 14 entries returned
- [ ] Dates in descending order
- [ ] Day names match dates
- [ ] Energy values > 0

---

### Test 1.4: Edge Cases

**Test 1.4a: Invalid days parameter**
```bash
curl -s "http://localhost:8000/api/compare/daily?days=50" -w "\n%{http_code}"
```
Expected: HTTP 400 (exceeds max 30 days)

**Test 1.4b: Zero days**
```bash
curl -s "http://localhost:8000/api/compare/daily?days=0" -w "\n%{http_code}"
```
Expected: Returns empty array or error

**Test 1.4c: Custom week dates**
```bash
curl -s "http://localhost:8000/api/compare/week?week1=2026-W14&week2=2026-W13" | jq
```
Expected: Specific weeks compared

**Pass Criteria:**
- [ ] Invalid inputs return 400
- [ ] Error messages are clear
- [ ] No server crashes

---

## 🖥️ Test Suite 2: Frontend UI

### Test 2.1: Page Load

**Steps:**
1. Navigate to http://localhost:5173/comparison
2. Observe loading state
3. Wait for data to load

**Expected Result:**
- Loading spinner appears briefly
- Data loads within 2 seconds
- No console errors

**Pass Criteria:**
- [ ] Page loads successfully
- [ ] No 404 or routing errors
- [ ] Loading state visible
- [ ] Console clean (no errors)

---

### Test 2.2: Week View (Default)

**Steps:**
1. Open comparison page
2. Verify "Week Comparison" button is highlighted
3. Check that week data is displayed

**Expected Result:**
- Week button has blue background (active)
- Two cards show "Current Week" and "Previous Week"
- Dates displayed (e.g., "Mar 30 - Apr 06, 2026")
- All metrics visible (Energy, Cost, Comfort, Temperature, Heating Hours)
- Changes section shows % improvements

**Pass Criteria:**
- [ ] Week view active by default
- [ ] Two period cards visible
- [ ] Dates correct and readable
- [ ] Metrics formatted correctly (kWh, €, %, °C)
- [ ] Change indicators colored (green=good, red=bad)

---

### Test 2.3: Month View Toggle

**Steps:**
1. Click "Month Comparison" button
2. Observe data change
3. Verify month labels

**Expected Result:**
- Month button becomes active (blue background)
- Week button becomes inactive (gray background)
- Data updates to show month comparison
- Labels change to month names (e.g., "April 2026")

**Pass Criteria:**
- [ ] Toggle switches view
- [ ] Month labels correct
- [ ] Data updates immediately
- [ ] No loading delay
- [ ] Console clean

**KNOWN ISSUE TO TEST:**
User reports monthly comparison not opening - verify this works correctly.

---

### Test 2.4: Daily Breakdown Chart

**Steps:**
1. Scroll down to "Daily Energy & Cost Breakdown" chart
2. Verify chart renders
3. Hover over bars

**Expected Result:**
- Bar chart displays 14 days of data
- Blue bars = Energy (left axis)
- Green bars = Cost (right axis)
- Day names on X-axis
- Tooltips on hover

**Pass Criteria:**
- [ ] Chart renders without errors
- [ ] Both bar series visible
- [ ] Axes labeled correctly
- [ ] Tooltips show data
- [ ] Responsive (resize window)

---

### Test 2.5: Change Indicators

**Steps:**
1. Look at "Performance Change" section
2. Verify all 4 metrics (Energy, Cost, Comfort, Temperature)
3. Check colors and symbols

**Expected Result:**
- Energy change: % with ✓ or ⚠️
- Cost change: % with ✓ or ⚠️
- Comfort change: points with status
- Temperature change: °C difference

**Pass Criteria:**
- [ ] All 4 metrics visible
- [ ] Green text for improvements
- [ ] Red text for regressions
- [ ] Correct symbols (✓/⚠️)
- [ ] Percentages match API data

---

### Test 2.6: Dark Mode

**Steps:**
1. Toggle dark mode (sun/moon icon)
2. Check comparison page appearance
3. Verify chart colors

**Expected Result:**
- Background changes to dark
- Text readable (light gray)
- Cards have dark background
- Chart adjusts to dark theme
- No readability issues

**Pass Criteria:**
- [ ] Dark mode applies to all elements
- [ ] Text contrast sufficient (WCAG AA)
- [ ] Chart visible in dark mode
- [ ] Buttons styled correctly

---

### Test 2.7: Navigation

**Steps:**
1. Click "← Dashboard" button
2. Navigate back to comparison from dashboard
3. Use browser back button

**Expected Result:**
- Dashboard button returns to home
- "📈 Compare" button on dashboard works
- Browser navigation works correctly
- State preserved (week/month selection)

**Pass Criteria:**
- [ ] All navigation works
- [ ] No broken links
- [ ] State preserved appropriately

---

## 📊 Test Suite 3: Data Accuracy

### Test 3.1: Energy Calculation Verification

**Steps:**
1. Note API energy values
2. Calculate manually: (avg_power * readings / 60) / 1000
3. Compare with displayed value

**Pass Criteria:**
- [ ] API value matches manual calculation (±2%)
- [ ] Frontend displays API value correctly

---

### Test 3.2: Change Percentage Verification

**Steps:**
1. Note week1 and week2 energy values
2. Calculate: ((week1 - week2) / week2) * 100
3. Compare with "changes.energy_change_percent"

**Example:**
```
Week1: 154.01 kWh
Week2: 168.3 kWh
Change: ((154.01 - 168.3) / 168.3) * 100 = -8.5%
```

**Pass Criteria:**
- [ ] Manual calculation matches API
- [ ] Improved flag correct (true if negative change for energy/cost)

---

### Test 3.3: Comfort Score Verification

**Steps:**
1. Check comfort_score in API response
2. Verify it's between 0-100
3. Understand calculation: % time within ±1°C of target

**Pass Criteria:**
- [ ] Comfort score 0-100 range
- [ ] Value reasonable (e.g., 95% is good)

---

## 🐛 Test Suite 4: Error Handling

### Test 4.1: No Data Scenario

**Steps:**
1. Test with empty database or very recent data
2. Check how page handles missing data

**Expected Result:**
- Graceful error message
- No crashes
- Clear user feedback

**Pass Criteria:**
- [ ] No console errors
- [ ] User-friendly message
- [ ] Page doesn't break

---

### Test 4.2: API Timeout

**Steps:**
1. Stop backend server
2. Open comparison page
3. Observe behavior

**Expected Result:**
- Loading state continues
- Eventually shows error or "No data"
- Doesn't crash

**Pass Criteria:**
- [ ] Handles offline gracefully
- [ ] Error message displayed
- [ ] Retry possible (refresh)

---

### Test 4.3: Malformed Data

**Steps:**
1. Temporarily modify API to return invalid data
2. Check frontend handling

**Pass Criteria:**
- [ ] No crashes
- [ ] Error logged to console
- [ ] User notified

---

## 📱 Test Suite 5: Responsive Design

### Test 5.1: Mobile View (375px width)

**Steps:**
1. Open DevTools (F12)
2. Toggle device emulation
3. Select iPhone SE (375px)
4. Navigate comparison page

**Expected Result:**
- Cards stack vertically
- Chart responsive
- Buttons remain clickable
- Text readable

**Pass Criteria:**
- [ ] Layout doesn't break
- [ ] No horizontal scroll
- [ ] All content accessible
- [ ] Touch-friendly buttons

---

### Test 5.2: Tablet View (768px)

**Steps:**
1. Resize to tablet size
2. Check layout

**Pass Criteria:**
- [ ] Optimal use of space
- [ ] Chart visible
- [ ] Navigation accessible

---

### Test 5.3: Desktop (1920px)

**Steps:**
1. View on large screen
2. Check for wasted space

**Pass Criteria:**
- [ ] Max-width container
- [ ] Content centered
- [ ] Readable spacing

---

## ⚡ Test Suite 6: Performance

### Test 6.1: Page Load Time

**Steps:**
1. Open DevTools Network tab
2. Hard refresh (Cmd+Shift+R)
3. Measure time to interactive

**Pass Criteria:**
- [ ] First paint < 1s
- [ ] Time to interactive < 2s
- [ ] API calls complete < 500ms

---

### Test 6.2: Chart Render Performance

**Steps:**
1. Open Performance tab
2. Record while loading page
3. Check for frame drops

**Pass Criteria:**
- [ ] No blocking operations > 50ms
- [ ] Chart renders smoothly
- [ ] No memory leaks

---

## 🔄 Test Suite 7: Integration Tests

### Test 7.1: End-to-End Flow

**Steps:**
1. Start from dashboard
2. Click "📈 Compare"
3. Toggle week/month
4. Return to dashboard
5. Navigate to insights
6. Back to comparison

**Pass Criteria:**
- [ ] All transitions smooth
- [ ] Data persists correctly
- [ ] No navigation errors

---

### Test 7.2: Cross-Feature Compatibility

**Steps:**
1. Check if comparison data matches insights page
2. Verify alerts show comparison-related items
3. Settings changes reflect in comparison

**Pass Criteria:**
- [ ] Data consistency across pages
- [ ] Features don't conflict

---

## 🎨 Test Suite 8: Visual/UX

### Test 8.1: Typography

**Pass Criteria:**
- [ ] Font sizes readable
- [ ] Hierarchy clear (h1 > h2 > p)
- [ ] No text overflow

---

### Test 8.2: Colors

**Pass Criteria:**
- [ ] Green = positive/improvement
- [ ] Red = negative/regression
- [ ] Blue = neutral/information
- [ ] Consistent with theme

---

### Test 8.3: Spacing

**Pass Criteria:**
- [ ] Adequate white space
- [ ] Elements not cramped
- [ ] Padding consistent

---

## 📝 Test Execution Log

### Quick Manual Test (5 minutes)

Execute these critical tests first:

```bash
# Terminal 1: Test APIs
curl http://localhost:8000/api/compare/week | jq .week1.energy_kwh
curl http://localhost:8000/api/compare/month | jq .month1.energy_kwh

# Terminal 2: Check logs
tail -f /tmp/backend.log

# Browser:
# 1. Open http://localhost:5173/comparison
# 2. Toggle week/month
# 3. Check console for errors
# 4. Verify chart displays
# 5. Toggle dark mode
```

**Quick Check Results:**
- [ ] Week endpoint: ___kWh
- [ ] Month endpoint: ___kWh
- [ ] Frontend loads: Yes/No
- [ ] Month toggle works: Yes/No ⚠️
- [ ] Chart displays: Yes/No
- [ ] Console errors: Yes/No

---

## 🐞 Known Issues to Verify

1. **Monthly comparison not opening** (reported by user)
   - Check if data loads
   - Check if UI updates
   - Check console for errors
   - Check network tab for API call

---

## 📊 Test Results Template

### Test Session: ___________

**Tester:** __________  
**Date:** __________  
**Duration:** __________

**Environment:**
- Backend: Running/Stopped
- Frontend: Running/Stopped
- Database: Seeded/Empty
- Browser: Chrome/Firefox/Safari

**Results:**
- Tests Passed: __ / __
- Tests Failed: __ / __
- Bugs Found: __
- Critical Issues: __

**Summary:**
[Write 2-3 sentences about overall findings]

**Recommendations:**
[What needs to be fixed or improved]

---

## 🚀 Automated Test Execution

### Run All Backend Tests
```bash
cd backend
source venv/bin/activate
pytest tests/ -v --tb=short
```

### Run All Frontend Tests
```bash
cd frontend
npm test -- --run
```

### Run Comparison-Specific Tests
```bash
# Backend
pytest tests/test_api.py::TestAPIEndpoints::test_comparison_week_endpoint -v
pytest tests/test_api.py::TestAPIEndpoints::test_comparison_month_endpoint -v

# Frontend (when created)
npm test -- ComparisonPage
```

---

## 🎯 Test Coverage Goals

- **API Endpoints:** 100% (3/3 tested)
- **UI Components:** 100% (all views/toggles)
- **Edge Cases:** 80%+
- **Error Handling:** 100%
- **Responsive:** 100% (mobile/tablet/desktop)

---

## ✅ Definition of Done

Feature is **DONE** when:
- [ ] All test suites pass
- [ ] No critical bugs
- [ ] Known issue (monthly comparison) resolved
- [ ] Performance targets met
- [ ] Responsive on all devices
- [ ] Dark mode works
- [ ] Documentation updated
- [ ] User can complete core flows without issues

---

**Next Step:** Execute quick manual test and report findings!
