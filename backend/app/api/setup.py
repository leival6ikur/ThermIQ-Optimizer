"""
First-Run Setup Wizard

Provides web-based configuration for initial setup with moderate/advanced modes.
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.config import get_config


logger = logging.getLogger(__name__)
router = APIRouter(prefix="/setup", tags=["setup"])


class ModerateSetup(BaseModel):
    """Moderate setup configuration (simplified)"""
    region: str = Field(..., description="Nord Pool region (EE, FI, SE1-4, NO1-5, DK1-2, LT, LV)")
    location_name: str = Field(..., description="Location description", max_length=200)
    target_temperature: float = Field(21.0, ge=15.0, le=30.0)
    strategy: str = Field("balanced", pattern="^(aggressive|balanced|conservative)$")


class AdvancedSetup(BaseModel):
    """Advanced setup configuration (full control)"""
    # Nord Pool
    region: str
    currency: str = "EUR"
    fetch_time: str = Field("13:00", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")

    # Location
    location_address: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    timezone: str = "Europe/Tallinn"

    # Optimization
    strategy: str = Field("balanced", pattern="^(aggressive|balanced|conservative)$")
    target_temperature: float = Field(21.0, ge=10.0, le=30.0)
    temperature_tolerance: float = Field(1.0, ge=0.1, le=5.0)
    comfort_hours_start: str = Field("06:00", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    comfort_hours_end: str = Field("23:00", pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")

    # Building
    insulation_quality: str = Field("good", pattern="^(poor|average|good|excellent)$")
    thermal_mass: str = Field("medium", pattern="^(low|medium|high)$")

    # MQTT
    device_id: str = "thermiq_room2lp"
    mqtt_username: Optional[str] = None
    mqtt_password: Optional[str] = None


@router.get("/", response_class=HTMLResponse)
async def show_setup_wizard(request: Request):
    """Display setup wizard HTML"""
    config = get_config()

    if config.is_setup_complete():
        return RedirectResponse(url="/")

    # Read HTML template
    html_content = get_setup_html()
    return HTMLResponse(content=html_content)


@router.post("/moderate")
async def save_moderate_setup(setup: ModerateSetup):
    """Save moderate setup configuration"""
    try:
        config = get_config()

        # Map region to location coordinates (approximate)
        region_coords = {
            'EE': (58.5953, 25.0136, "Estonia"),
            'FI': (61.9241, 25.7482, "Finland"),
            'LT': (55.1694, 23.8813, "Lithuania"),
            'LV': (56.8796, 24.6032, "Latvia"),
            'SE1': (65.5848, 22.1547, "Northern Sweden"),
            'SE2': (62.3908, 17.3069, "Central Sweden"),
            'SE3': (60.1282, 18.6435, "Southern Sweden"),
            'SE4': (55.6059, 13.0007, "Malmö Sweden"),
            'NO1': (59.9139, 10.7522, "Oslo Norway"),
            'NO2': (60.3913, 5.3221, "Bergen Norway"),
            'NO3': (63.4305, 10.3951, "Trondheim Norway"),
            'NO4': (69.6492, 18.9553, "Tromsø Norway"),
            'NO5': (66.3137, 14.1489, "Northern Norway"),
            'DK1': (56.2639, 9.5018, "Western Denmark"),
            'DK2': (55.6761, 12.5683, "Eastern Denmark"),
        }

        lat, lon, region_name = region_coords.get(setup.region, (0, 0, "Unknown"))

        # Update configuration
        config.set('nordpool.region', setup.region)
        config.set('location.address', setup.location_name or region_name)
        config.set('location.latitude', lat)
        config.set('location.longitude', lon)
        config.set('optimization.strategy', setup.strategy)
        config.set('optimization.target_temperature', setup.target_temperature)

        # Mark setup complete
        config.mark_setup_complete()

        logger.info(f"Moderate setup completed: region={setup.region}, strategy={setup.strategy}")

        return {
            "success": True,
            "message": "Setup completed successfully",
            "redirect": "/"
        }

    except Exception as e:
        logger.error(f"Error saving moderate setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/advanced")
async def save_advanced_setup(setup: AdvancedSetup):
    """Save advanced setup configuration"""
    try:
        config = get_config()

        # Update Nord Pool settings
        config.set('nordpool.region', setup.region)
        config.set('nordpool.currency', setup.currency)
        config.set('nordpool.fetch_time', setup.fetch_time)

        # Update location
        config.set('location.address', setup.location_address)
        config.set('location.latitude', setup.latitude)
        config.set('location.longitude', setup.longitude)
        config.set('location.timezone', setup.timezone)

        # Update optimization
        config.set('optimization.strategy', setup.strategy)
        config.set('optimization.target_temperature', setup.target_temperature)
        config.set('optimization.temperature_tolerance', setup.temperature_tolerance)
        config.set('optimization.comfort_hours_start', setup.comfort_hours_start)
        config.set('optimization.comfort_hours_end', setup.comfort_hours_end)

        # Update building
        config.set('building.insulation_quality', setup.insulation_quality)
        config.set('building.thermal_mass', setup.thermal_mass)

        # Update MQTT
        config.set('mqtt.device_id', setup.device_id)
        if setup.mqtt_username:
            config.set('mqtt.username', setup.mqtt_username)
        if setup.mqtt_password:
            config.set('mqtt.password', setup.mqtt_password)

        # Mark setup complete
        config.mark_setup_complete()

        logger.info(f"Advanced setup completed: region={setup.region}, strategy={setup.strategy}")

        return {
            "success": True,
            "message": "Setup completed successfully",
            "redirect": "/"
        }

    except Exception as e:
        logger.error(f"Error saving advanced setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/skip")
async def skip_setup():
    """Skip setup wizard and use defaults"""
    try:
        config = get_config()
        config.mark_setup_complete()

        logger.info("Setup wizard skipped, using default configuration")

        return {
            "success": True,
            "message": "Using default configuration",
            "redirect": "/"
        }

    except Exception as e:
        logger.error(f"Error skipping setup: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def get_setup_html() -> str:
    """Generate setup wizard HTML"""
    return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ThermIQ Setup Wizard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 32px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .mode-selector {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
        }
        .mode-btn {
            flex: 1;
            padding: 20px;
            border: 2px solid #e0e0e0;
            border-radius: 10px;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
        }
        .mode-btn:hover {
            border-color: #667eea;
            transform: translateY(-2px);
        }
        .mode-btn.active {
            border-color: #667eea;
            background: #f0f4ff;
        }
        .mode-btn h3 {
            color: #333;
            margin-bottom: 5px;
        }
        .mode-btn p {
            color: #666;
            font-size: 14px;
        }
        .form-section {
            display: none;
        }
        .form-section.active {
            display: block;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            color: #333;
            font-weight: 500;
            margin-bottom: 8px;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
        }
        .btn {
            width: 100%;
            padding: 15px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #e0e0e0;
            color: #666;
            margin-top: 10px;
        }
        .btn-secondary:hover {
            background: #d0d0d0;
        }
        .help-text {
            color: #666;
            font-size: 14px;
            margin-top: 5px;
        }
        .success-message {
            background: #4caf50;
            color: white;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Welcome to ThermIQ</h1>
        <p class="subtitle">Let's set up your smart heat pump optimizer</p>

        <div class="mode-selector">
            <div class="mode-btn active" onclick="selectMode('moderate')">
                <h3>⚡ Quick Setup</h3>
                <p>Essential settings only</p>
            </div>
            <div class="mode-btn" onclick="selectMode('advanced')">
                <h3>🔧 Advanced</h3>
                <p>Full configuration</p>
            </div>
        </div>

        <!-- Moderate Setup Form -->
        <div id="moderate-form" class="form-section active">
            <form onsubmit="submitModerate(event)">
                <div class="form-group">
                    <label for="region">Your Region</label>
                    <select id="region" required>
                        <option value="EE">Estonia</option>
                        <option value="FI">Finland</option>
                        <option value="LT">Lithuania</option>
                        <option value="LV">Latvia</option>
                        <option value="SE1">Sweden - North</option>
                        <option value="SE2">Sweden - Central</option>
                        <option value="SE3">Sweden - South</option>
                        <option value="SE4">Sweden - Malmö</option>
                        <option value="NO1">Norway - Oslo</option>
                        <option value="NO2">Norway - Bergen</option>
                        <option value="NO3">Norway - Trondheim</option>
                        <option value="NO4">Norway - Tromsø</option>
                        <option value="NO5">Norway - North</option>
                        <option value="DK1">Denmark - West</option>
                        <option value="DK2">Denmark - East</option>
                    </select>
                    <p class="help-text">Select your electricity pricing region</p>
                </div>

                <div class="form-group">
                    <label for="location">Location (Optional)</label>
                    <input type="text" id="location" placeholder="e.g., Tallinn, Estonia">
                    <p class="help-text">For future weather integration</p>
                </div>

                <div class="form-group">
                    <label for="target-temp">Target Temperature (°C)</label>
                    <input type="number" id="target-temp" value="21" min="15" max="30" step="0.5" required>
                </div>

                <div class="form-group">
                    <label for="strategy">Optimization Strategy</label>
                    <select id="strategy" required>
                        <option value="conservative">Conservative - Maximum comfort</option>
                        <option value="balanced" selected>Balanced - Good comfort & savings</option>
                        <option value="aggressive">Aggressive - Maximum savings</option>
                    </select>
                </div>

                <button type="submit" class="btn btn-primary">Start Optimizing 🚀</button>
                <button type="button" class="btn btn-secondary" onclick="skipSetup()">Skip & Use Defaults</button>
            </form>
        </div>

        <!-- Advanced Setup Form -->
        <div id="advanced-form" class="form-section">
            <p style="color: #666; margin-bottom: 20px;">Advanced configuration for power users</p>
            <form onsubmit="submitAdvanced(event)">
                <!-- Add all advanced fields here -->
                <p style="text-align: center; padding: 40px; color: #999;">
                    Advanced form coming soon...<br>
                    For now, use Quick Setup or edit config.yaml manually.
                </p>
                <button type="button" class="btn btn-secondary" onclick="selectMode('moderate')">Back to Quick Setup</button>
            </form>
        </div>

        <div id="success" class="success-message">
            ✅ Setup complete! Redirecting to dashboard...
        </div>
    </div>

    <script>
        function selectMode(mode) {
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.form-section').forEach(section => section.classList.remove('active'));

            if (mode === 'moderate') {
                document.querySelector('.mode-btn:first-child').classList.add('active');
                document.getElementById('moderate-form').classList.add('active');
            } else {
                document.querySelector('.mode-btn:last-child').classList.add('active');
                document.getElementById('advanced-form').classList.add('active');
            }
        }

        async function submitModerate(event) {
            event.preventDefault();

            const data = {
                region: document.getElementById('region').value,
                location_name: document.getElementById('location').value,
                target_temperature: parseFloat(document.getElementById('target-temp').value),
                strategy: document.getElementById('strategy').value
            };

            try {
                const response = await fetch('/setup/moderate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    document.getElementById('success').style.display = 'block';
                    setTimeout(() => window.location.href = '/', 2000);
                }
            } catch (error) {
                alert('Setup failed: ' + error.message);
            }
        }

        async function skipSetup() {
            if (confirm('Skip setup and use default configuration?')) {
                try {
                    const response = await fetch('/setup/skip', { method: 'POST' });
                    const result = await response.json();

                    if (result.success) {
                        window.location.href = '/';
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        }
    </script>
</body>
</html>
    """
