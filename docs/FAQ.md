# ThermIQ - Frequently Asked Questions (FAQ)

Quick answers to common questions about ThermIQ Heat Pump Optimizer.

---

## General Questions

### What is ThermIQ?

ThermIQ is a smart control system for ground source heat pumps that automatically optimizes heating schedules based on electricity prices from Nord Pool. It continuously monitors your system and adjusts heating to minimize costs while maintaining comfort.

### How much money can I save?

Most users see **20-40% reduction** in heating costs. Actual savings depend on:
- Your electricity price variation (higher variation = more opportunity)
- Building thermal mass (better insulation = more flexibility)
- Your comfort requirements (more flexibility = more savings)
- Current heating efficiency

### Is ThermIQ compatible with my heat pump?

ThermIQ works with any heat pump that:
- Supports MQTT communication, OR
- Can be controlled via a compatible interface (e.g., Nibe, ThermIQ)

Currently tested with:
- NIBE heat pumps (via ThermIQ)
- CTC heat pumps
- IVT heat pumps

Contact us if you're unsure about compatibility.

### Do I need a Raspberry Pi?

**For production use:** Yes, recommended.
- Raspberry Pi 3B+ or newer
- Runs 24/7
- Low power consumption (~2-5W)
- Cost: €35-75 depending on model

**For testing:** Can run on any computer with Python 3.9+

---

## Installation & Setup

### How long does installation take?

**First-time setup:** 2-4 hours
- Install software: 30 minutes
- Configure MQTT: 30 minutes
- Set preferences: 15 minutes
- Testing & calibration: 1-2 hours

**Ongoing:** Zero maintenance needed

### Do I need programming knowledge?

**No!** The system is designed for non-technical users:
- Web-based interface
- Point-and-click configuration
- Visual dashboards
- Automatic updates

**However:** Basic command-line skills helpful for:
- Initial Raspberry Pi setup
- Troubleshooting
- Optional advanced features

### Can I install this myself?

**Yes!** If you're comfortable with:
- Setting up a Raspberry Pi
- Running terminal commands
- Configuring your heat pump's MQTT settings

**Or:** Hire a smart home installer familiar with heat pumps and Raspberry Pi.

### What if I mess up the configuration?

**Don't worry:**
- System won't damage your heat pump
- Worst case: Heating less optimized temporarily
- All settings can be reset
- Manual mode always available
- Default safe values built in

---

## Operation & Control

### Will the system make my house too cold?

**No:**
- You set minimum acceptable temperature
- System respects comfort hours strictly
- Temperature stays within your tolerance (±0.5-1.5°C)
- Manual override always available
- Conservative mode prioritizes comfort

### What happens if electricity is cheap all day?

- System heats normally
- No special optimization needed
- Your costs are already low
- System just maintains comfort

### What happens if electricity is expensive all day?

- System still heats to maintain minimum comfort
- Thermal mass utilized (pre-heating beforehand)
- May slightly exceed target tolerance
- Safety never compromised
- You can manually override if needed

### Can I manually control the temperature?

**Yes!**
1. Click "Mode: 🤖 Optimized"
2. Switches to "Mode: 🔧 Manual"
3. Set temperature and duration
4. System follows your command
5. Auto-returns to optimized mode after duration

### What if I go on vacation?

**Option 1: Lower Target**
- Reduce target temperature (e.g., to 15°C)
- System maintains freeze protection
- Saves significant energy

**Option 2: Manual Override**
- Set low temperature for vacation duration
- System resumes normal operation when expires

**Option 3: Adjust Schedule**
- Can create custom schedule
- Or just let it run (doesn't cost much when unoccupied)

---

## Performance & Efficiency

### Why is COP important?

**COP (Coefficient of Performance)** = Heat output ÷ Electrical input

- COP of 3.0 = 3kW heat from 1kW electricity
- Higher COP = more efficient = lower costs
- Typical range: 2.0-4.5 depending on conditions

ThermIQ optimizes to improve COP:
- Lower supply temperatures when possible
- Longer run times (less cycling)
- Heating during optimal conditions

### What's a good COP value?

**Depends on season:**
- Summer: 3.5-4.5 (excellent)
- Spring/Fall: 2.8-3.8 (good)
- Winter: 2.2-3.2 (normal)
- Very cold (<-15°C): 1.8-2.5 (acceptable)

**If COP <2.0 when outdoor >-5°C:** Check system, may need service.

### Why is my heat pump cycling frequently?

**Possible causes:**
1. **Oversized system** (heat pump too powerful)
2. **Heat curve too high** (reaching temp too quickly)
3. **Good insulation** (building heats up fast)

**Solutions:**
- Lower heat curve 1-2 points
- Increase temperature tolerance
- Consider buffer tank
- Use multi-stage compression (if available)

### Can ThermIQ improve my COP?

**Yes, indirectly:**
- Longer run times → better efficiency
- Lower supply temps when possible → better COP
- Reduced cycling → less compressor stress
- Optimal defrost timing

**Typical COP improvement:** 5-15% better average COP

---

## Pricing & Optimization

### When are electricity prices updated?

**Nord Pool schedule:**
- **Next-day prices:** Published ~13:00-14:00 CET
- **ThermIQ fetches:** Automatically at 13:00 UTC
- **Tomorrow's schedule:** Calculated within minutes
- **Today's schedule:** Updated if needed

### What if tomorrow's prices aren't available?

**ThermIQ handles this:**
- Uses today's prices as estimate
- Updates when real prices available
- Doesn't wait for tomorrow's data
- You're still optimized for today

### Why is system heating during expensive hours?

**Possible reasons:**
1. **Temperature too low** (safety/comfort priority)
2. **Limited cheap hours** (must heat sometime)
3. **Comfort hours** (restricted optimization window)
4. **Pre-heating for very expensive period** (thermal mass)
5. **Conservative strategy** (prioritizing comfort)

**Check:**
- Is indoor temp below minimum?
- Are comfort hours set appropriately?
- Is strategy too conservative?

### Does VAT setting affect optimization?

**No!**
- VAT setting is display-only
- Affects what you see in charts
- Optimization uses base prices
- Your savings calculations unaffected

### Can I see historical price trends?

**Currently:**
- Today and tomorrow's prices shown
- Historical prices in database
- Can export via API

**Future feature:**
- Week/month price comparison views
- Seasonal trend analysis
- Predictions based on history

---

## Technical Questions

### What data is collected?

**Stored locally only:**
- Temperature readings (every minute)
- Heat pump status (heating on/off, power)
- Electricity prices (hourly)
- Heating schedules (24-hour plans)
- Performance metrics (COP, duty cycle, etc.)
- System alerts

**NOT collected:**
- Personal information
- Location (beyond what you configure)
- Usage patterns sent externally
- Payment information

**Privacy:** All data stays on your device.

### How much disk space does it use?

**Typical usage:**
- Initial: ~50MB (software)
- Per month: ~30-50MB (data)
- After 30 days: Old raw data auto-deleted
- Hourly aggregates kept forever (~5MB/month)

**Total after 1 year:** ~200-300MB

### What happens if power goes out?

**When power returns:**
1. Raspberry Pi reboots automatically
2. ThermIQ starts automatically (if configured)
3. MQTT reconnects
4. Heat pump resumes last state
5. System catches up within minutes

**During outage:**
- Heat pump controller continues with last settings
- Typically maintains temperature using built-in controls
- No optimization happens (but that's okay)

### Can I access ThermIQ remotely?

**Local network:** Yes, automatically
- Any device on same WiFi
- Use: `http://[raspberry-pi-ip]:3000`

**Internet access:** Requires setup
- **Option 1:** Port forwarding (security risk)
- **Option 2:** VPN to home network (recommended)
- **Option 3:** Reverse proxy (e.g., ngrok, Tailscale)

**Security:** Never expose directly to internet without authentication!

### Can I run this alongside other software?

**Yes!** Raspberry Pi can run multiple applications:
- Home Assistant
- OpenClaw (family AI assistant)
- Pi-hole
- Plex media server
- etc.

**Requirements:**
- Sufficient RAM (recommend 2GB+ if running multiple)
- CPU capacity (ThermIQ is lightweight)
- No port conflicts (default: 3000, 8000, 1883)

---

## Troubleshooting

### System not responding, what should I do?

**Quick fixes:**
1. **Refresh browser** (Ctrl+F5)
2. **Check status lights** (MQTT, WS should be green)
3. **Restart backend:**
   ```bash
   # SSH to Raspberry Pi
   sudo systemctl restart thermiq-backend
   ```
4. **Check logs:**
   ```bash
   tail -f /path/to/thermiq/data/logs/thermiq.log
   ```

**Still stuck?** See TROUBLESHOOTING.md

### Why is temperature not updating?

**Most common causes:**
1. **MQTT disconnected** (check status light)
2. **Heat pump not publishing** (check pump display)
3. **Wrong MQTT topic** (verify configuration)

**Test MQTT:**
```bash
mosquitto_sub -h localhost -t "#" -v
```
Should see messages if working.

### I'm getting too many alerts, how do I reduce them?

**Settings → Alerts → Configuration:**
- Increase COP threshold (fewer efficiency alerts)
- Increase price opportunity threshold (fewer price alerts)
- Increase comfort deviation threshold (fewer temp alerts)
- Reduce evaluation frequency (less often checking)

**Or:** Dismiss alerts individually as they appear.

### Can I disable alerts entirely?

**Yes:**
- Settings → Alerts → Enable/Disable toggle
- Turns off alert evaluation
- Existing alerts remain until dismissed
- Can re-enable anytime

**Note:** Alerts help catch problems early, disabling not recommended.

---

## Future Features

### Will there be a mobile app?

**Planned:**
- Progressive Web App (PWA) first
- Install on phone home screen
- Push notifications
- Offline capability

**Timeline:** Sprint 4 (few weeks)

**Native apps:** Not currently planned (PWA sufficient)

### Can ThermIQ control multiple heat pumps?

**Current:** Single heat pump only

**Future:**
- Multi-zone support planned
- Different schedules per zone
- Aggregate statistics
- Coordinated control

**Timeline:** Not yet scheduled

### Will weather forecast integration be added?

**Yes! Sprint 2 (coming soon):**
- OpenWeather API integration
- Adjust heating based on forecast
- Pre-heat before cold snaps
- Display forecast vs. actual

**Expected completion:** 1-2 weeks

### Can I export data to Excel/CSV?

**Currently:** Via API only
- `GET /api/temperatures/history?hours=168`
- Returns JSON
- Can parse and import to Excel

**Planned:** Direct export button
- CSV download
- Excel format
- Date range selection

**Timeline:** Not yet scheduled (low priority)

### Will there be voice control (Alexa, Google)?

**Not currently planned:**
- Integration complexity high
- Limited use case (manual override easier via phone)
- API available for custom integrations

**If demand grows:** May reconsider

---

## Contributing & Support

### How can I contribute?

**Ways to help:**
1. **Report bugs** via GitHub Issues
2. **Suggest features** (be specific!)
3. **Improve documentation** (PRs welcome)
4. **Test new features** (beta program)
5. **Share success stories** (helps others)

**Code contributions:**
- Fork repository
- Make changes
- Submit Pull Request
- Follow existing code style

### Where do I report bugs?

**GitHub Issues:**
https://github.com/leival6ikur/ThermIQ-Optimizer/issues

**Please include:**
- Clear description
- Steps to reproduce
- Expected vs. actual behavior
- Screenshots (if applicable)
- System info (OS, versions)
- Relevant logs

### Is commercial use allowed?

**Current license:** Check LICENSE file

**Typical:**
- Personal use: ✅ Free
- Commercial use: Check license terms
- Modifications: Check license terms
- Redistribution: Check license terms

### Can I hire someone to help with setup?

**Yes!**
- Local HVAC technicians familiar with smart homes
- Raspberry Pi enthusiasts
- Smart home installers
- Electricians with IoT experience

**Contact maintainer** for recommended installers in your area (if available).

---

## Comparison with Alternatives

### vs. Heat Pump Built-in Optimization

**ThermIQ advantages:**
- Real-time electricity pricing
- Custom schedules per day
- Advanced analytics
- Open source & customizable
- No monthly fees

**Built-in advantages:**
- No additional hardware
- Already installed
- Manufacturer support

**Best approach:** Use both together!

### vs. Home Assistant Integration

**ThermIQ advantages:**
- Purpose-built for heat pumps
- Simpler setup
- Built-in Nord Pool integration
- Optimization algorithms included
- Focused interface

**Home Assistant advantages:**
- Controls everything (lights, locks, etc.)
- Larger community
- More integrations
- Advanced automations

**Can use together:** ThermIQ via MQTT to Home Assistant

### vs. Manual Price Monitoring

**ThermIQ advantages:**
- Automatic 24/7 operation
- Never miss cheap hours
- Complex calculations done for you
- Historical tracking
- Performance insights

**Manual advantages:**
- Full control
- No software needed
- Zero cost

**Reality:** Manual monitoring is tedious and easy to forget.

---

## Fun Facts

### How much time does ThermIQ save me?

**Daily:** ~5-10 minutes you'd spend checking prices and adjusting
**Yearly:** ~30-60 hours of your time saved
**Value:** Priceless! 😊

### What's the "greenest" setting?

**Lowest carbon footprint:**
- Use "Balanced" strategy (encourages renewable energy hours)
- Maximize COP (use less electricity per kWh of heat)
- Pre-heat during low-demand hours (typically more renewable)
- Improve insulation (less heating needed overall)

### Can ThermIQ make my house warmer faster?

**No, but:**
- Can pre-heat before you arrive home
- Manual override for instant boost
- Optimizes for consistent temperature (no cold spots)

**Reality:** Heat pump output is fixed. ThermIQ optimizes timing, not power.

### Does ThermIQ work during summer?

**Yes:**
- Minimal heating needed = minimal benefit
- Hot water heating still optimized
- Good time for system maintenance
- Data collection continues (useful for annual analysis)

### How accurate are the savings estimates?

**Pretty accurate:**
- Based on real power consumption
- Uses actual electricity prices
- Compares to baseline (continuous heating)

**Margin of error:** ±5%

**Note:** Baseline estimate, not utility bill comparison (which includes other consumption).

---

**Still have questions?**
- Check USER_GUIDE.md for detailed instructions
- Check TROUBLESHOOTING.md for problem-solving
- Ask on GitHub Discussions
- Open an issue on GitHub

---

**Last Updated:** April 3, 2026  
**Questions Answered:** 50+  
**Next Review:** When new features released or common questions emerge
