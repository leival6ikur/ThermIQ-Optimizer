# ThermIQ Configuration Guide

Complete reference for system configuration files and settings.

---

## Configuration File Structure

ThermIQ uses a single YAML configuration file: `data/config.yaml`

**Location:** `/path/to/ThermIQ/data/config.yaml`

**Format:** YAML (human-readable, indentation-sensitive)

**Backup:** Automatically backed up before changes

---

## Complete Configuration Reference

```yaml
# ThermIQ Configuration File
# Last updated: 2026-04-03

# === General Settings ===
setup_complete: true  # First-run setup completion flag
created_at: "2026-01-15T10:30:00"
last_modified: "2026-04-03T12:00:00"

# === Location ===
location:
  name: "Sirkli 6, Lombi küla"  # Display name
  latitude: 58.3780   # For weather/solar calculations (optional)
  longitude: 26.7290  # For weather/solar calculations (optional)
  timezone: "Europe/Tallinn"  # IANA timezone

# === MQTT Broker Configuration ===
mqtt:
  host: "localhost"  # Broker hostname or IP
  port: 1883         # Standard MQTT port
  username: ""       # Leave empty if no auth
  password: ""       # Leave empty if no auth
  use_tls: false     # TLS encryption (port 8883)
  
  # Topics
  topics:
    temperature: "/thermiq/temperatures"  # Incoming temperature data
    status: "/thermiq/status"             # Heat pump status
    control: "/thermiq/control"           # Outgoing control commands
    setpoint: "/thermiq/setpoint"         # Temperature setpoint
    mode: "/thermiq/mode"                 # Heat pump mode (auto/manual)
  
  # Connection settings
  keepalive: 60      # Seconds between keepalive pings
  reconnect_delay: 5 # Seconds to wait before reconnect
  qos: 1             # Quality of Service (0, 1, or 2)

# === Nord Pool API Configuration ===
nordpool:
  enabled: true
  region: "EE"       # Estonia (FI, SE, NO, DK, LT, LV also supported)
  currency: "EUR"    # Currency code
  fetch_time: "13:00"  # UTC time to fetch prices (HH:MM)
  api_url: "https://www.nordpoolgroup.com/api/marketdata/page/10"
  timeout: 30        # API request timeout (seconds)
  retry_attempts: 3  # Number of retries on failure
  retry_delay: 10    # Seconds between retries

# === Optimization Engine ===
optimization:
  strategy: "balanced"  # aggressive | balanced | conservative
  target_temperature: 21.0  # Desired indoor temp (°C)
  temperature_tolerance: 1.0  # Allowed deviation (°C)
  
  # Comfort hours (strict temperature control)
  comfort_hours_start: "07:00"  # Start time (HH:MM)
  comfort_hours_end: "22:00"    # End time (HH:MM)
  
  # Advanced settings
  update_interval: 300  # Seconds between schedule updates
  prediction_horizon: 24  # Hours to optimize ahead
  heat_curve: 5  # Heat curve setting (1-10)
  
  # Strategy parameters
  strategies:
    aggressive:
      weight_cost: 0.7      # Prioritize cost (0-1)
      weight_comfort: 0.3   # Prioritize comfort (0-1)
      allow_temp_swing: 2.0  # Max temp deviation (°C)
    balanced:
      weight_cost: 0.5
      weight_comfort: 0.5
      allow_temp_swing: 1.5
    conservative:
      weight_cost: 0.3
      weight_comfort: 0.7
      allow_temp_swing: 0.8

# === Cost Configuration ===
costs:
  vat_enabled: true  # Show prices with VAT
  vat_rate: 24.0     # VAT percentage (Estonia: 24%)
  
  # Additional costs (optional)
  network_fee: 0.0   # EUR/kWh (network operator fee)
  retail_margin: 0.0  # EUR/kWh (electricity retailer margin)
  renewable_fee: 0.0  # EUR/kWh (renewable energy surcharge)

# === Building Properties ===
building:
  type: "single_family"  # single_family | apartment | commercial
  area: 150  # Square meters
  insulation_quality: "good"  # poor | average | good | excellent
  
  # Thermal properties
  thermal_mass: "medium"  # low | medium | high
  heat_loss_coefficient: 1.2  # W/m²K (U-value)
  air_changes_per_hour: 0.5  # ACH (ventilation + leakage)
  
  # Construction details (optional, for advanced modeling)
  construction_year: 2010
  wall_type: "brick"  # wood | brick | concrete
  window_type: "triple_glazed"  # single | double | triple_glazed
  roof_insulation: 300  # mm
  floor_insulation: 200  # mm

# === Heat Pump Configuration ===
heat_pump:
  manufacturer: "NIBE"  # Or: CTC, IVT, ThermIQ, etc.
  model: "F1255"
  type: "ground_source"  # ground_source | air_source | air_water
  
  # Capacity
  rated_power: 6.0  # kW (heating capacity at rated conditions)
  max_power: 8.0    # kW (maximum electrical input)
  min_power: 2.0    # kW (minimum electrical input)
  
  # Performance
  rated_cop: 4.0    # COP at rated conditions
  compressor_type: "inverter"  # fixed | inverter
  stages: 1         # Number of compressor stages
  
  # Brine loop (ground source only)
  brine_type: "glycol"  # glycol | alcohol
  brine_concentration: 30  # % (freeze protection)
  brine_flow: 1.8   # m³/h
  
  # Control
  integration_type: "mqtt"  # mqtt | modbus | api
  supports_modulation: true  # Can vary output
  min_cycle_time: 15  # Minutes (minimum run time)
  anti_cycle_time: 10  # Minutes (minimum off time)

# === Alert System ===
alerts:
  enabled: true
  evaluation_interval: 900  # Seconds (15 minutes)
  max_active_alerts: 20
  
  # Efficiency alerts
  efficiency_cop_threshold: 2.0  # Alert if COP below this
  efficiency_check_interval_minutes: 60
  
  # Price opportunity alerts
  price_opportunity_threshold_percent: 30  # Alert if X% below average
  
  # Comfort alerts
  comfort_deviation_threshold: 1.0  # °C deviation to trigger
  comfort_duration_minutes: 30  # How long before alerting
  
  # Maintenance alerts
  maintenance_ground_delta_min: 2.0  # Minimum acceptable ground ΔT
  maintenance_check_interval_hours: 24

# === Database Configuration ===
database:
  path: "data/thermiq.db"  # Relative to project root
  backup_enabled: true
  backup_interval_hours: 24
  backup_retention_days: 30
  
  # Data retention
  raw_data_retention_days: 30  # Delete raw minute data after
  aggregate_retention_days: -1  # Keep hourly aggregates forever (-1)
  alert_retention_days: 30  # Delete resolved alerts after

# === API Server ===
api:
  host: "0.0.0.0"  # Listen on all interfaces
  port: 8000       # API server port
  
  # CORS (Cross-Origin Resource Sharing)
  cors_origins:
    - "http://localhost:3000"  # Frontend dev server
    - "http://localhost:8000"  # Backend
    - "*"  # Allow all (production: specify exact origins)
  
  # Security (optional, recommended for production)
  api_key: ""  # Leave empty to disable
  api_key_header: "X-API-Key"
  rate_limit_enabled: false
  rate_limit_requests: 100  # Requests per minute
  
  # Logging
  log_requests: true
  log_level: "INFO"  # DEBUG | INFO | WARNING | ERROR

# === Frontend Configuration ===
frontend:
  port: 3000
  title: "ThermIQ Optimizer"
  theme: "light"  # light | dark | auto
  
  # Dashboard settings
  default_view: "dashboard"  # dashboard | insights | settings
  chart_history_hours: 24  # Default hours to show
  refresh_interval: 30  # Seconds between auto-refresh
  
  # Features
  enable_manual_override: true
  enable_schedule_editing: true
  enable_export: true

# === Logging ===
logging:
  level: "INFO"  # DEBUG | INFO | WARNING | ERROR | CRITICAL
  file: "data/logs/thermiq.log"
  max_file_size_mb: 10
  backup_count: 5  # Number of old log files to keep
  
  # Component-specific levels
  components:
    mqtt: "INFO"
    database: "INFO"
    optimization: "INFO"
    nordpool: "INFO"
    api: "INFO"
    alerts: "INFO"

# === Weather Integration (optional) ===
weather:
  enabled: false  # Coming soon (Sprint 2)
  provider: "openweather"
  api_key: ""  # Get from https://openweathermap.org/api
  update_interval: 3600  # Seconds (1 hour)
  forecast_hours: 48
  use_in_optimization: true

# === Notifications (optional, future) ===
notifications:
  enabled: false
  
  # Email
  email:
    enabled: false
    smtp_server: "smtp.gmail.com"
    smtp_port: 587
    username: ""
    password: ""
    from_address: ""
    to_addresses: []
    send_daily_summary: true
    send_alerts: true
  
  # Push notifications
  push:
    enabled: false
    service: "pushover"  # pushover | ntfy | custom
    api_key: ""
    user_key: ""

# === Advanced Features ===
advanced:
  # Developer mode
  debug_mode: false
  mock_mqtt: false  # Use simulated data
  mock_nordpool: false  # Use test prices
  
  # Performance tuning
  worker_threads: 2
  cache_enabled: true
  cache_ttl_seconds: 300
  
  # Experimental features
  experimental_features:
    ml_prediction: false  # Machine learning price prediction
    multi_zone: false     # Multiple heating zones
    solar_integration: false  # Solar panel integration
```

---

## Configuration Sections Explained

### Setup Flags

```yaml
setup_complete: true
```

**Purpose:** Tracks first-run setup completion

**Values:**
- `false`: Redirects to setup wizard
- `true`: Normal operation

**When to change:** Never manually (set by setup wizard)

---

### Location Settings

```yaml
location:
  name: "Your Address"
  latitude: 58.3780
  longitude: 26.7290
  timezone: "Europe/Tallinn"
```

**Purpose:**
- Display on dashboard
- Weather integration (future)
- Solar calculations (future)

**Timezone format:** IANA timezone database
- Estonia: `Europe/Tallinn`
- Finland: `Europe/Helsinki`
- Sweden: `Europe/Stockholm`

**Find yours:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

---

### MQTT Broker

```yaml
mqtt:
  host: "localhost"
  port: 1883
```

**Common configurations:**

**Local embedded broker:**
```yaml
host: "localhost"
port: 1883
username: ""
password: ""
```

**Remote broker:**
```yaml
host: "192.168.1.100"
port: 1883
username: "thermiq"
password: "secret123"
```

**Secure connection:**
```yaml
host: "mqtt.example.com"
port: 8883
use_tls: true
username: "thermiq"
password: "secret123"
```

**Topics customization:**
- Change if multiple ThermIQ instances
- Or if integrating with existing MQTT setup
- Must match heat pump configuration

---

### Optimization Strategy

```yaml
optimization:
  strategy: "balanced"
  target_temperature: 21.0
  temperature_tolerance: 1.0
  comfort_hours_start: "07:00"
  comfort_hours_end: "22:00"
```

**Strategy comparison:**

| Setting | Aggressive | Balanced | Conservative |
|---------|-----------|----------|--------------|
| Cost weight | 70% | 50% | 30% |
| Comfort weight | 30% | 50% | 70% |
| Temp swing | ±2.0°C | ±1.5°C | ±0.8°C |
| Typical savings | 35-45% | 25-35% | 15-25% |

**Update interval:**
- Default: 300 seconds (5 minutes)
- Lower: More responsive (higher CPU)
- Higher: Less responsive (lower CPU)
- Recommended: 300-600 seconds

---

### Cost Configuration

```yaml
costs:
  vat_enabled: true
  vat_rate: 24.0
```

**VAT rates by country:**
- Estonia: 24%
- Finland: 25.5%
- Sweden: 25%
- Norway: 25%
- Denmark: 25%
- Lithuania: 21%
- Latvia: 21%

**Additional costs:**
```yaml
network_fee: 0.035  # €0.035/kWh
retail_margin: 0.012  # €0.012/kWh
```

**Total price displayed:**
```
Nord Pool + Network Fee + Retail Margin + VAT
```

---

### Building Properties

```yaml
building:
  area: 150
  insulation_quality: "good"
  thermal_mass: "medium"
```

**Insulation quality guide:**

**Excellent:**
- New construction (2015+)
- Passive house standard
- U-value < 0.15 W/m²K

**Good:**
- Modern construction (2000-2015)
- Energy-efficient renovation
- U-value 0.15-0.30 W/m²K

**Average:**
- Standard construction (1980-2000)
- Basic insulation
- U-value 0.30-0.50 W/m²K

**Poor:**
- Old construction (<1980)
- Minimal insulation
- U-value > 0.50 W/m²K

**Thermal mass guide:**

**High:**
- Concrete/brick construction
- Heavy floors
- Large thermal storage

**Medium:**
- Mixed construction
- Standard floors
- Typical thermal storage

**Low:**
- Lightweight construction
- Wooden floors
- Minimal thermal storage

---

### Heat Pump Settings

```yaml
heat_pump:
  type: "ground_source"
  rated_power: 6.0
  rated_cop: 4.0
```

**Type options:**
- `ground_source`: Brine-to-water (geothermal)
- `air_source`: Air-to-water (outdoor unit)
- `air_water`: Split system

**Power values:**
- `rated_power`: Heating capacity (kW output)
- `max_power`: Maximum electrical input
- `min_power`: Minimum electrical input (inverter)

**Find your values:**
- Check heat pump nameplate
- Or manufacturer datasheet
- Or installer documentation

---

### Alert Configuration

```yaml
alerts:
  efficiency_cop_threshold: 2.0
  price_opportunity_threshold_percent: 30
  comfort_deviation_threshold: 1.0
```

**Tuning alerts:**

**Too many alerts:**
- Increase thresholds
- Increase check intervals
- Increase max_active_alerts

**Missing important alerts:**
- Decrease thresholds
- Decrease check intervals
- Review evaluation logs

**Disable specific types:**
```yaml
efficiency_cop_threshold: 0.1  # Effectively disabled
price_opportunity_threshold_percent: 100  # Never triggers
```

---

### Database Settings

```yaml
database:
  raw_data_retention_days: 30
  backup_enabled: true
```

**Retention strategy:**

**Minimal storage:**
```yaml
raw_data_retention_days: 7
aggregate_retention_days: 365
```

**Balanced (recommended):**
```yaml
raw_data_retention_days: 30
aggregate_retention_days: -1  # Forever
```

**Maximum history:**
```yaml
raw_data_retention_days: 90
aggregate_retention_days: -1
```

**Storage estimates:**
- Raw data: ~1.5 MB/day
- Hourly aggregates: ~50 KB/day
- 30 days raw + forever hourly: ~200 MB/year

---

### API & Frontend

```yaml
api:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "*"
```

**Production security:**
```yaml
api:
  host: "0.0.0.0"
  port: 8000
  cors_origins:
    - "https://thermiq.yourdomain.com"
  api_key: "your-secret-key-here"
  api_key_header: "X-API-Key"
  rate_limit_enabled: true
  rate_limit_requests: 100
```

**Port changes:**
- If port 8000 conflicts, change to 8080, 8888, etc.
- Update frontend API_URL in environment
- Update firewall rules if needed

---

## Environment Variables

Some settings can be overridden with environment variables:

```bash
# MQTT settings
export THERMIQ_MQTT_HOST="192.168.1.100"
export THERMIQ_MQTT_PORT="1883"

# API settings
export THERMIQ_API_PORT="8080"
export THERMIQ_API_KEY="secret123"

# Debug mode
export THERMIQ_DEBUG="true"

# Config file location
export THERMIQ_CONFIG="/custom/path/config.yaml"
```

**Precedence:**
1. Environment variables (highest)
2. config.yaml
3. Default values (lowest)

---

## Configuration Best Practices

### Security

**Production checklist:**
- ✅ Set specific CORS origins (not `*`)
- ✅ Enable API key authentication
- ✅ Use TLS for MQTT if exposed
- ✅ Set strong MQTT passwords
- ✅ Restrict network access (firewall)
- ✅ Regular config backups
- ✅ Don't commit secrets to git

**Secure storage:**
```yaml
# DON'T:
mqtt:
  password: "mypassword123"  # Visible in git

# DO:
mqtt:
  password: "${MQTT_PASSWORD}"  # From environment
```

### Validation

**After editing config.yaml:**

1. **Check syntax:**
   ```bash
   python -c "import yaml; yaml.safe_load(open('data/config.yaml'))"
   ```

2. **Restart backend:**
   ```bash
   sudo systemctl restart thermiq-backend
   ```

3. **Check logs:**
   ```bash
   tail -f data/logs/thermiq.log
   ```

4. **Verify dashboard:**
   - Open http://localhost:3000
   - Check all values loaded correctly

### Backup

**Before major changes:**
```bash
cp data/config.yaml data/config.yaml.backup
```

**Automatic backups:**
- ThermIQ backs up config before overwriting
- Located in: `data/backups/`
- Format: `config_YYYYMMDD_HHMMSS.yaml`

**Restore from backup:**
```bash
cp data/backups/config_20260403_120000.yaml data/config.yaml
sudo systemctl restart thermiq-backend
```

---

## Troubleshooting Configuration

### Config not loading

**Error:** `FileNotFoundError: config.yaml`

**Solution:**
```bash
# Check file exists
ls -l data/config.yaml

# Check permissions
chmod 644 data/config.yaml
```

---

### YAML syntax errors

**Error:** `YAMLError: while parsing...`

**Common mistakes:**
```yaml
# WRONG - inconsistent indentation
optimization:
    target: 21.0
  tolerance: 1.0  # Should align with target

# CORRECT
optimization:
  target: 21.0
  tolerance: 1.0
```

```yaml
# WRONG - missing quotes for special characters
password: my:pass@word

# CORRECT
password: "my:pass@word"
```

**Validation tool:**
```bash
python -m yaml data/config.yaml
```

---

### Values not applying

**Possible causes:**

1. **Environment variable override:**
   ```bash
   # Check for overrides
   env | grep THERMIQ
   ```

2. **Old process still running:**
   ```bash
   # Kill and restart
   pkill -f "python -m app.main"
   python -m app.main
   ```

3. **Cached values:**
   - Restart backend
   - Clear browser cache (Ctrl+F5)

4. **Invalid value:**
   - Check logs for validation errors
   - Values out of range ignored

---

## Advanced Configuration

### Custom Price Sources

**Replace Nord Pool with custom source:**

1. **Disable Nord Pool:**
   ```yaml
   nordpool:
     enabled: false
   ```

2. **Create custom price provider:**
   - Implement in `backend/app/services/custom_price_provider.py`
   - Return list of ElectricityPrice objects
   - Hook into optimization engine

3. **Update scheduler:**
   - Modify `backend/app/main.py`
   - Call custom provider instead of Nord Pool

### Multi-Zone Configuration (Future)

```yaml
zones:
  - name: "Ground Floor"
    target_temperature: 21.0
    tolerance: 1.0
    mqtt_topics:
      temperature: "/thermiq/zone1/temp"
      control: "/thermiq/zone1/control"
  
  - name: "Upper Floor"
    target_temperature: 20.0
    tolerance: 1.5
    mqtt_topics:
      temperature: "/thermiq/zone2/temp"
      control: "/thermiq/zone2/control"
```

**Status:** Not yet implemented (planned)

---

## Configuration Templates

### Minimal (Quick Start)

```yaml
setup_complete: true
mqtt:
  host: "localhost"
  port: 1883
nordpool:
  region: "EE"
optimization:
  strategy: "balanced"
  target_temperature: 21.0
  tolerance: 1.0
```

### Production (Full Featured)

```yaml
# See complete example at top of document
# Customize all sections
# Enable security features
# Set proper backups
```

### Development/Testing

```yaml
setup_complete: true
mqtt:
  host: "localhost"
  port: 1883
advanced:
  debug_mode: true
  mock_mqtt: true
  mock_nordpool: true
logging:
  level: "DEBUG"
```

---

**Last Updated:** April 3, 2026  
**Configuration Version:** 1.0  
**Next Review:** When new features added requiring configuration
