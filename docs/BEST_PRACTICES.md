# ThermIQ Best Practices Guide

Proven strategies for maximizing savings and system performance.

---

## Optimization Strategy

### Choosing the Right Strategy

**🟢 Balanced (Recommended for Most Users)**
```yaml
Strategy: balanced
Target Temperature: 21°C
Tolerance: 1.0°C
Comfort Hours: 07:00-22:00
```

**Best for:**
- Standard homes
- Normal insulation
- Moderate comfort needs
- 25-35% typical savings

**🔵 Conservative (Comfort Priority)**
```yaml
Strategy: conservative
Target Temperature: 21°C
Tolerance: 0.5°C
Comfort Hours: 06:00-23:00
```

**Best for:**
- Less insulated homes
- Families with children/elderly
- Strict comfort requirements
- 15-25% typical savings

**🔴 Aggressive (Maximum Savings)**
```yaml
Strategy: aggressive
Target Temperature: 20°C
Tolerance: 1.5°C
Comfort Hours: 08:00-21:00
```

**Best for:**
- Well-insulated homes
- Flexible occupants
- Maximum cost reduction
- 30-45% typical savings

---

## Temperature Settings

### Target Temperature

**General Guidelines:**
- **Living areas:** 20-22°C
- **Bedrooms:** 18-20°C
- **Elderly/young children:** 21-23°C
- **Energy saving:** 19-20°C

**Pro tip:** Every 1°C lower = ~6% energy savings

**Seasonal Adjustments:**
```
Summer: 20°C (minimal heating)
Fall:   21°C (comfortable)
Winter: 21°C (maintain comfort)
Spring: 20°C (reducing load)
```

### Temperature Tolerance

**How to Choose:**

**Tight Tolerance (0.5°C):**
- ✅ Very consistent comfort
- ✅ Good for sensitive occupants
- ❌ Limited optimization potential
- ❌ Lower savings (15-25%)

**Moderate Tolerance (1.0°C):**
- ✅ Good balance (recommended)
- ✅ Most people don't notice
- ✅ Significant savings (25-35%)
- ❌ Occasional minor fluctuation

**Wide Tolerance (1.5-2.0°C):**
- ✅ Maximum savings (35-45%)
- ✅ Best optimization potential
- ❌ Noticeable temperature swings
- ❌ May affect comfort

**Start conservative, then experiment:**
1. Week 1: 0.5°C (get baseline)
2. Week 2: 1.0°C (monitor comfort)
3. Week 3: 1.5°C (if comfortable)
4. Settle on what works for you

### Comfort Hours

**Typical Setups:**

**Family with kids:**
```yaml
Comfort Hours: 06:00-22:00
Reason: Morning routine + bedtime
Flexibility: Night (6 hours)
```

**Working couple:**
```yaml
Comfort Hours: 07:00-09:00, 17:00-23:00
Reason: Morning and evening home
Flexibility: Workday (8 hours) + Night (8 hours)
```

**Retirees/home all day:**
```yaml
Comfort Hours: 07:00-22:00
Reason: Awake and home
Flexibility: Night only (9 hours)
```

**Maximum savings:**
```yaml
Comfort Hours: 17:00-22:00
Reason: Only evening home
Flexibility: 17 hours for optimization!
```

**Pro tips:**
- More flexibility hours = more savings potential
- Most people sleep comfortably with ±2°C variation
- Building thermal mass maintains temp at night
- Can adjust seasonally (winter: longer, summer: shorter)

---

## Heat Curve Optimization

### Understanding Heat Curve

**Heat curve = supply temperature vs. outdoor temperature**

Example:
```
Outdoor   →   Supply Temp
+10°C     →   25°C
  0°C     →   35°C
-10°C     →   45°C
-20°C     →   55°C
```

**Lower curve = Better COP = Lower costs**

### Finding Your Optimal Curve

**Step-by-step tuning:**

1. **Start with manufacturer recommendation**
   - Usually marked on heat pump
   - Typical: Curve 4-6 for well-insulated
   - Typical: Curve 6-8 for older homes

2. **Test one step lower**
   - Reduce by 1-2 points
   - Monitor for 2-3 days
   - Check:
     - Indoor temp stable?
     - Comfort acceptable?
     - COP improved?

3. **Continue until hitting limits**
   - Indoor temp dropping below target?
   - Duty cycle >80%?
   - Comfort complaints?
   - → That's one step too low

4. **Back up one step**
   - Go back to last comfortable setting
   - That's your optimal curve
   - Can adjust seasonally

**Signs curve too low:**
- Indoor temp consistently below target
- Heat pump running continuously (>80%)
- Can't maintain temperature in cold weather
- Takes very long to warm up

**Signs curve too high:**
- Indoor temp often above target
- Frequent cycling (>4 per hour)
- High COP drop
- Floors uncomfortably warm

**Pro tips:**
- Lower curve in spring/fall (less demand)
- Slightly higher in deep winter (extreme cold)
- Document your optimal curve for each season
- Lower curve = longer run times but better efficiency

---

## Building Thermal Mass

### Understanding Thermal Mass

**Thermal mass = building's heat storage capacity**

**Good thermal mass:**
- Concrete floors
- Brick/stone walls
- Heavy furniture
- Water tanks
- → Can store heat for 4-8 hours

**Poor thermal mass:**
- Lightweight construction
- Wooden floors
- Minimal furniture
- → Heat dissipates in 1-2 hours

### Leveraging Thermal Mass

**Pre-heating strategy:**

**Before expensive hours:**
1. System heats to target + tolerance
2. Example: Target 21°C, heat to 22°C
3. Building stores thermal energy
4. Heating pauses during expensive hours
5. Building slowly releases heat
6. Temperature coasts down to 20°C
7. Resume heating when cheap again

**Visualization:**
```
Price:  LOW ────╲╲╲ HIGH ────╱╱╱ LOW
Temp:   21→22°C─────╲22→20°C───/20→21°C
Heat:   ON ─────────OFF───────/ON
```

**Maximizing effectiveness:**
- Close curtains/blinds (reduce heat loss)
- Avoid opening windows during coasting
- Pre-heat 1-2 hours before expensive period
- Monitor how long temp stays acceptable
- Adjust pre-heat timing based on results

---

## Seasonal Strategies

### Winter (December-February)

**Challenges:**
- High heating demand
- Low COP (cold outdoor temp)
- Limited flexibility

**Best practices:**
```yaml
Strategy: balanced or conservative
Target: 21°C (maintain comfort)
Tolerance: 0.5-1.0°C
Heat Curve: Higher than summer
Focus: Comfort over extreme savings
```

**Tips:**
- Accept COP 2.0-2.5 as normal when very cold
- High duty cycle (60-80%) is expected
- Pre-heat during night cheap hours
- Ensure good insulation

### Spring/Fall (March-May, September-November)

**Opportunities:**
- Moderate heating demand
- Good COP (mild outdoor temp)
- High flexibility

**Best practices:**
```yaml
Strategy: balanced or aggressive
Target: 20°C (less heating needed)
Tolerance: 1.0-1.5°C
Heat Curve: Lower than winter
Focus: Maximum optimization
```

**Tips:**
- Best time for heat curve optimization
- Can skip expensive hours entirely
- COP 3.5-4.0+ achievable
- Experiment with wide tolerance

### Summer (June-August)

**Situation:**
- Minimal heating (hot water only)
- Excellent COP
- Little optimization benefit

**Best practices:**
```yaml
Strategy: balanced
Focus: Hot water optimization
Monitor: System maintenance
Prepare: For next winter
```

**Tasks:**
- Review previous winter performance
- Plan improvements (insulation, etc.)
- Clean/service heat pump
- Update software if needed
- Check ground loop (GSHP)

---

## Hot Water Optimization

### Temperature Guidelines

**Minimum safe temperature:**
- **Storage:** 60°C (kills legionella)
- **Usage:** 45-50°C (comfortable showers)
- **Economy:** 50-55°C (good balance)

**ThermIQ strategy:**
- Heat to 60°C during cheap hours
- Maintain 55°C minimum
- Use stored hot water during expensive hours
- Reheat when price drops

### Scheduling Hot Water Heating

**Typical household:**
- Morning shower demand: 06:00-09:00
- Evening washing demand: 18:00-22:00

**Optimal schedule:**
1. Heat overnight (cheap electricity)
2. Tank at 60°C by 06:00
3. Use morning (temperature drops to ~50°C)
4. Reheat during midday cheap hour if needed
5. Evening use (temperature to ~45°C)
6. Repeat cycle

**Pro tip:** Insulate hot water tank well
- Good insulation: Loses 1-2°C per hour
- Poor insulation: Loses 3-5°C per hour
- Better insulation = less reheating needed

---

## Maintenance Best Practices

### Daily

**Check dashboard (30 seconds):**
- Any critical alerts?
- MQTT connected?
- Temperature within range?

**If something looks wrong:**
- Check TROUBLESHOOTING.md
- Don't ignore alerts
- Address issues promptly

### Weekly

**Review Insights page (5 minutes):**
- Average COP: Within expected range?
- Duty cycle: Reasonable for weather?
- Energy cost: As expected?
- Alerts: Any recurring patterns?

**Action items:**
- Acknowledge/dismiss resolved alerts
- Note any anomalies
- Adjust settings if needed

### Monthly

**Full performance review (30 minutes):**
- Compare total cost to previous month
- Review COP trends
- Check for efficiency improvements
- Calculate actual savings

**System maintenance:**
- Vacuum filter: Check/clean
- Brine pressure (GSHP): Check gauge
- Software updates: Check for new version
- Database: Verify maintenance ran

### Seasonally

**Major review (1-2 hours):**
- Heat curve adjustment
- Insulation inspection
- Ground loop check (GSHP)
- Professional service (if due)
- Software configuration update

### Annually

**Full system evaluation:**
- Compare year-over-year costs
- Calculate annual savings
- Plan improvements
- Service heat pump
- Replace filters
- Check refrigerant (professional)

---

## Data Interpretation

### Understanding Your Metrics

**COP (Coefficient of Performance):**
```
Excellent:  >3.5 (optimal conditions)
Good:       2.8-3.5 (normal operation)
Fair:       2.0-2.8 (cold weather)
Poor:       <2.0 (investigate)
```

**Duty Cycle:**
```
Low:       <30% (oversized or mild weather)
Optimal:   30-60% (right-sized)
High:      60-80% (cold weather or undersized)
Very High: >80% (investigate)
```

**Ground ΔT (for GSHP):**
```
Good:   2.5-3.5°C (healthy extraction)
Fair:   2.0-2.5°C (acceptable)
Low:    <2.0°C (poor extraction, investigate)
```

**Cycling Frequency:**
```
Optimal:   1-3 per hour (long run times)
Moderate:  3-4 per hour (acceptable)
High:      >4 per hour (short cycling, investigate)
```

### Benchmarking Your Performance

**Monthly kWh (heating):**
```
Well-insulated 150m²:     300-500 kWh/month (winter)
Average insulation 150m²:  500-800 kWh/month (winter)
Poor insulation 150m²:     800-1200 kWh/month (winter)
```

**Monthly costs (winter, Estonia):**
```
Excellent optimization:  €30-50
Good optimization:       €50-80
Average:                 €80-120
Poor/no optimization:    €120-180
```

**Savings vs. baseline:**
```
Conservative strategy:  15-25% savings
Balanced strategy:      25-35% savings
Aggressive strategy:    35-45% savings
```

---

## Advanced Optimization

### Multi-Day Weather Patterns

**Cold snap approaching:**
1. Pre-heat building 1-2 days before
2. Increase target temp +0.5-1°C
3. Heat extra during cheap hours
4. Let temperature coast during cold snap
5. Resume normal after weather improves

**Warm spell coming:**
1. Reduce target temp -0.5-1°C
2. Allow wider tolerance
3. Skip expensive heating hours entirely
4. Can let temp drop below target briefly

### Price Pattern Learning

**Monitor your electricity market:**
- Cheapest hours typically: 02:00-05:00
- Most expensive: 08:00-09:00, 18:00-20:00
- Weekend vs. weekday patterns
- Seasonal variations

**Adjust comfort hours:**
- If always cheap 02:00-06:00: No comfort restriction needed
- If expensive 07:00-09:00: Consider pre-heating 06:00-07:00

### Ground Source Optimization (GSHP)

**Maximize ground loop efficiency:**
1. **Monitor brine temps:**
   - In: Should stay >0°C
   - Out: Should stay >-3°C
   - Delta: 2.5-3.5°C optimal

2. **If temps dropping over season:**
   - Normal in first year (ground stabilizing)
   - Check brine concentration (freeze protection)
   - Consider ground loop size (may be undersized)

3. **Recovery strategies:**
   - Allow ground recovery periods (less heating)
   - Summer: Ground naturally recharges
   - May need supplemental ground heat source (solar)

---

## Troubleshooting Optimization

### Not Seeing Expected Savings

**Diagnostic checklist:**

1. **Verify optimization is active:**
   - Mode: 🤖 Optimized (not manual)?
   - Schedule being followed?
   - MQTT connected?

2. **Check configuration:**
   - Strategy appropriate for your home?
   - Tolerance allowing flexibility?
   - Comfort hours not too restrictive?

3. **Review heating schedule:**
   - Is heating shifting to cheap hours?
   - Or heating all the time regardless of price?
   - Check logs for optimization calculations

4. **Compare baselines fairly:**
   - Same weather conditions?
   - Same target temperature?
   - Same occupancy patterns?

5. **Check external factors:**
   - Unusually cold weather?
   - New air leaks?
   - Changed hot water usage?
   - Heat pump needs service?

### Temperature Control Issues

**Swings too large:**
- Reduce tolerance
- Increase comfort hours
- Switch to conservative strategy
- Check heat curve (may be too low)

**Temperature drifting down:**
- Heat curve too low
- System undersized for conditions
- Insulation problems
- Check heat pump operation

**Temperature too steady (not optimizing):**
- Tolerance too tight
- Comfort hours too long
- Strategy too conservative
- Price variation low

---

## Long-Term Success

### First Month

**Goals:**
- Understand your baseline
- Get comfortable with system
- Start with conservative settings
- Monitor daily

**Expectations:**
- Some trial and error
- Learning curve normal
- Modest savings (15-20%)
- Building confidence

### Months 2-3

**Goals:**
- Optimize settings
- Experiment with tolerance
- Find optimal heat curve
- Less frequent monitoring

**Expectations:**
- Savings increasing (25-30%)
- More comfortable with automation
- Fewer manual adjustments
- System learning patterns

### Long-Term (6+ months)

**Goals:**
- Fine-tune seasonally
- Maximize savings
- Minimal intervention
- Trust automation

**Expectations:**
- Savings maximized (30-40%)
- Rare manual overrides
- Continuous monitoring automatic
- System becomes invisible

### Continuous Improvement

**Always:**
- Monitor alerts promptly
- Review monthly performance
- Adjust for seasonal changes
- Keep system maintained

**Sometimes:**
- Experiment with new settings
- Compare to neighbors/benchmarks
- Consider insulation upgrades
- Upgrade heat pump (when due)

**Never:**
- Ignore critical alerts
- Disable optimization long-term
- Forget about system entirely
- Skip heat pump maintenance

---

## Success Metrics

### How to Measure Success

**Energy Savings:**
```
Monthly kWh reduction vs. baseline
Target: 20-40% reduction
```

**Cost Savings:**
```
Monthly EUR reduction
Target: €20-80/month (winter)
```

**Comfort Maintained:**
```
Temperature within ±1°C of target >95% of time
No comfort complaints from occupants
```

**System Efficiency:**
```
COP maintained or improved
Cycling frequency optimal (1-3/hour)
No recurring maintenance alerts
```

**Automation Success:**
```
Manual overrides <2 per month
Uptime >99.5%
Alerts addressed <24 hours
```

---

## Community Tips

### User-Submitted Strategies

**From user "EestiSauna":**
> "I heat extra before expensive evening hours, then enjoy lower temp while relaxing.Temperature drops from 22°C to 20°C during 18:00-21:00expensive period. Saves €30/month!"

**From user "RaspiOptimizer":**
> "Set aggressive strategy during day (at work), conservative in evening/morning (home). Use time-based rules."

**From user "GroundSourcePro":**
> "Monitor your ground loop temps. Mine dropped 2°C over first winter. Second winter stable. Ground needs 1-2 years to equilibrate."

### Expert Recommendations

**HVAC Professionals:**
- Lower heat curve always better if comfort maintained
- Long run times (>20 min) more efficient than short cycling
- Well-insulated buildings can tolerate wider temp swings
- Ground source: Size loop for long-term average, not peak

**Energy Consultants:**
- Thermal mass is free energy storage
- Pre-heating strategy can cut peak demand costs
- Every °C lower target = ~6% savings
- Best ROI: Insulation first, then smart controls

---

**Last Updated:** April 3, 2026  
**Contributors:** ThermIQ team + community feedback  
**Next Review:** Quarterly or when new strategies emerge
