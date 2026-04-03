export interface TemperatureReading {
  timestamp: string;
  indoor?: number;
  outdoor?: number;
  supply?: number;
  return?: number;
  target?: number;
  brine_in?: number;
  brine_out?: number;
  hot_water?: number;
}

export interface HeatPumpStatus {
  timestamp: string;
  heating: boolean;
  power?: number;
  mode: string;
}

export interface ElectricityPrice {
  timestamp: string;
  price: number;
  currency: string;
  region: string;
}

export interface HeatingSchedule {
  hour: number;
  should_heat: boolean;
  price: number;
  estimated_cost: number;
  expected_temperature?: number;
}

export interface SystemStatus {
  mqtt_connected: boolean;
  last_update?: string;
  last_device_update?: string;
  nordpool_last_fetch?: string;
  current_temperature?: TemperatureReading;
  heat_pump_status?: HeatPumpStatus;
  optimization_active?: boolean;
  // Flattened fields for convenience
  indoor_temp?: number;
  outdoor_temp?: number;
  supply_temp?: number;
  return_temp?: number;
  target_temp?: number;
  brine_in_temp?: number;
  brine_out_temp?: number;
  hot_water_temp?: number;
  heating_active?: boolean;
  power?: number;
  optimization_mode?: string;
  heat_pump_mode?: string;
  heat_curve?: number;
}

export interface DailyPriceSummary {
  date: string;
  min_price: number;
  max_price: number;
  average_price: number;
  prices: ElectricityPrice[];
}

export interface WebSocketMessage {
  type: 'temperature' | 'status' | 'keepalive';
  data?: any;
  timestamp?: string;
}

export interface VATConfig {
  vat_enabled: boolean;
  vat_rate: number;  // percentage (0-100)
}
