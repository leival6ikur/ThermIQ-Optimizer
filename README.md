# ThermIQ Heat Pump Optimizer

Smart control system for Thermia Diplomat Optimum G3 heat pump with Nord Pool price optimization.

## 🎯 Features

- **Real-time monitoring**: Track indoor/outdoor temperatures, supply/return temps, and power consumption
- **Price optimization**: Automatically schedule heating during cheapest electricity hours
- **Nord Pool integration**: Fetches day-ahead prices for Estonia (EE) region
- **Web dashboard**: Visual interface with temperature charts, price graphs, and control panels
- **Manual override**: Take control anytime with immediate heat pump commands
- **MQTT communication**: Reliable IoT protocol for device integration

## 🏠 Installation Location

System configured for: **Sirkli 6, Lombi küla, Tartu vald, Estonia**

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Mosquitto MQTT broker

### Development Setup (macOS)

```bash
# Install Mosquitto
brew install mosquitto
brew services start mosquitto

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Run the system
# Terminal 1: Mock device
cd backend
python scripts/mock_device.py

# Terminal 2: Backend
uvicorn app.main:app --reload --port 8000

# Terminal 3: Frontend
cd frontend
npm run dev
```

Open browser to `http://localhost:5173`

## 📖 Documentation

- [MQTT Setup Guide](docs/MQTT_SETUP.md) - Complete MQTT broker installation and configuration
- [Development Guide](docs/DEVELOPMENT.md) - Development without physical device
- [Optimization Algorithm](docs/OPTIMIZATION_ALGORITHM.md) - How price-based scheduling works

## 🏗️ Architecture

```
┌─────────────┐     MQTT      ┌─────────────┐
│  ThermIQ    │◄─────────────►│  Mosquitto  │
│  ROOM2LP    │    30s pub    │   Broker    │
└─────────────┘               └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │   Backend   │
                              │  (FastAPI)  │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  Frontend   │
                              │   (React)   │
                              └─────────────┘
```

## 🔧 Configuration

Copy `config/config.yaml.example` to `config/config.yaml` and adjust settings:

```yaml
nordpool:
  region: EE  # Estonia
  
optimization:
  strategy: balanced  # aggressive | balanced | conservative
  target_temperature: 21.0
  comfort_hours_start: "06:00"
  comfort_hours_end: "23:00"
```

## 📊 Optimization Strategies

- **Aggressive**: Heat only during cheapest 30% of hours (max savings)
- **Balanced**: Heat during cheapest 50% of hours, maintain comfort (recommended)
- **Conservative**: Heat during cheapest 70% of hours (max comfort)

## 🔌 Hardware Requirements

- **Heat Pump**: Thermia Diplomat Optimum G3 (manufactured after March 2008)
- **Controller**: ThermIQ-ROOM2LP WiFi adapter
- **Connection**: EXT interface port on heat pump
- **Power**: USB power supply (2A minimum)

## 💰 Expected Savings

Smart heating control can reduce energy costs by **20-40%** by:
- Heating during off-peak hours
- Utilizing thermal mass for storage
- Avoiding expensive peak periods

## 🛠️ Technology Stack

**Backend**: Python, FastAPI, Paho MQTT, SQLite, APScheduler  
**Frontend**: React, TypeScript, Vite, Recharts, TailwindCSS  
**Infrastructure**: Mosquitto MQTT, Docker (optional)

## 📝 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

## 📧 Support

For issues and questions, please use GitHub issues.
