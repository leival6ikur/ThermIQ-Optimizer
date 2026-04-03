#!/bin/bash
# ThermIQ Startup Script
# Starts the backend API and mock device

set -e

echo "🚀 Starting ThermIQ Heat Pump Optimizer..."
echo ""

# Check if in correct directory
if [ ! -f "config/config.yaml" ]; then
    echo "❌ Error: Must run from ThermIQ root directory"
    exit 1
fi

# Check if venv exists
if [ ! -d "backend/venv" ]; then
    echo "❌ Error: Virtual environment not found. Run:"
    echo "   cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Check if Mosquitto is running
if ! pgrep -x "mosquitto" > /dev/null; then
    echo "⚠️  Mosquitto not running. Starting..."
    brew services start mosquitto
    sleep 2
fi

echo "✓ Mosquitto MQTT broker running"
echo ""

# Activate venv
cd backend
source venv/bin/activate

echo "📊 Starting components..."
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    kill $MOCK_PID 2>/dev/null || true
    kill $API_PID 2>/dev/null || true
    echo "✓ Stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start mock device in background
echo "1️⃣  Starting mock device..."
python scripts/mock_device.py > ../data/logs/mock_device.log 2>&1 &
MOCK_PID=$!
sleep 2

if ps -p $MOCK_PID > /dev/null; then
    echo "   ✓ Mock device running (PID: $MOCK_PID)"
else
    echo "   ❌ Mock device failed to start"
    exit 1
fi

# Start API server
echo "2️⃣  Starting API server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../data/logs/api.log 2>&1 &
API_PID=$!
sleep 3

if ps -p $API_PID > /dev/null; then
    echo "   ✓ API server running (PID: $API_PID)"
else
    echo "   ❌ API server failed to start"
    kill $MOCK_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 ThermIQ is running!"
echo ""
echo "📍 Access points:"
echo "   • API:        http://localhost:8000"
echo "   • Health:     http://localhost:8000/health"
echo "   • Docs:       http://localhost:8000/docs"
echo "   • WebSocket:  ws://localhost:8000/ws"
echo ""
echo "📝 Logs:"
echo "   • Mock device: data/logs/mock_device.log"
echo "   • API server:  data/logs/api.log"
echo "   • System:      data/logs/thermiq.log"
echo ""
echo "💡 Quick test:"
echo "   curl http://localhost:8000/health"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for interrupt
wait
