"""
Pydantic models for ThermIQ Heat Pump Optimizer
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TemperatureReading(BaseModel):
    """Temperature sensor reading"""
    timestamp: datetime
    indoor: Optional[float] = None
    outdoor: Optional[float] = None
    supply: Optional[float] = None
    return_temp: Optional[float] = Field(None, alias="return")
    target: Optional[float] = None
    brine_in: Optional[float] = None
    brine_out: Optional[float] = None
    hot_water: Optional[float] = None

    class Config:
        populate_by_name = True


class HeatPumpStatus(BaseModel):
    """Heat pump operational status"""
    timestamp: datetime
    heating: bool
    power: Optional[float] = None  # Watts
    mode: str = "auto"  # auto, warm_water, heating, etc.
    heat_curve: Optional[float] = None  # Heat curve setting


class ElectricityPrice(BaseModel):
    """Electricity price for a specific hour"""
    timestamp: datetime
    price: float  # EUR/MWh
    currency: str = "EUR"
    region: str = "EE"


class HeatingSchedule(BaseModel):
    """24-hour heating schedule"""
    hour: int = Field(..., ge=0, lt=24)
    should_heat: bool
    price: float
    estimated_cost: float
    expected_temperature: Optional[float] = None


class SystemStatus(BaseModel):
    """Overall system status"""
    mqtt_connected: bool
    last_device_update: Optional[datetime] = None
    nordpool_last_fetch: Optional[datetime] = None
    current_temperature: Optional[TemperatureReading] = None
    heat_pump_status: Optional[HeatPumpStatus] = None
    optimization_active: bool = True


class ManualOverride(BaseModel):
    """Manual temperature override request"""
    target_temperature: float = Field(..., ge=10, le=30)
    duration_minutes: Optional[int] = Field(None, ge=0, le=1440)  # Max 24 hours


class OptimizationConfig(BaseModel):
    """Optimization configuration"""
    strategy: str = Field(..., pattern="^(aggressive|balanced|conservative)$")
    target_temperature: float = Field(..., ge=10, le=30)
    temperature_tolerance: float = Field(1.0, ge=0.1, le=5.0)
    comfort_hours_start: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    comfort_hours_end: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")


class DailyPriceSummary(BaseModel):
    """Summary of daily electricity prices"""
    date: str
    min_price: float
    max_price: float
    average_price: float
    prices: List[ElectricityPrice]


class Alert(BaseModel):
    """System alert/notification"""
    id: Optional[int] = None
    alert_type: str = Field(..., pattern="^(efficiency|price_opportunity|comfort|maintenance|savings|system_error)$")
    severity: str = Field(..., pattern="^(info|warning|critical)$")
    title: str
    message: str
    data: Optional[dict] = None  # Additional context data
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    is_active: bool = True


class AlertConfig(BaseModel):
    """Alert system configuration"""
    enabled: bool = True
    efficiency_cop_threshold: float = Field(2.0, ge=1.0, le=5.0)  # Alert if COP below this
    efficiency_check_interval_minutes: int = Field(60, ge=15, le=1440)
    price_opportunity_threshold_percent: int = Field(30, ge=10, le=50)  # Alert if price X% below avg
    comfort_deviation_threshold: float = Field(1.0, ge=0.5, le=3.0)  # Alert if temp off by X degrees
    comfort_duration_minutes: int = Field(30, ge=10, le=120)  # Alert if deviation lasts X minutes
    max_active_alerts: int = Field(20, ge=5, le=100)  # Max alerts to keep active


class PerformanceMetrics(BaseModel):
    """Calculated performance metrics for a time period"""
    timestamp: datetime
    period_start: datetime
    period_end: datetime

    # Efficiency metrics
    cop: Optional[float] = None  # Coefficient of performance
    duty_cycle: Optional[float] = None  # % time heating
    cycles_per_hour: Optional[float] = None  # Heating start frequency

    # Temperature deltas
    ground_delta: Optional[float] = None  # Brine in - out
    heating_delta: Optional[float] = None  # Supply - return

    # Energy & cost
    total_kwh: Optional[float] = None
    total_cost: Optional[float] = None
    avg_power: Optional[float] = None  # Watts

    # Statistics
    avg_indoor_temp: Optional[float] = None
    avg_outdoor_temp: Optional[float] = None
    heating_minutes: Optional[int] = None
    samples_count: int = 0
