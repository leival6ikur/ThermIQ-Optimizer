#!/bin/bash
set -e

echo "================================================"
echo "  Thermi-Nator Installation (Raspberry Pi OS)  "
echo "================================================"
echo ""

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo "❌ Error: This installer is for Linux (Raspberry Pi) only"
    exit 1
fi

# Check for root/sudo
if [ "$EUID" -ne 0 ]; then
    echo "❌ Error: Please run with sudo"
    echo "Usage: sudo bash install.sh"
    exit 1
fi

# Get the actual user (not root when using sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"
ACTUAL_HOME=$(eval echo "~${ACTUAL_USER}")

echo "📦 Updating package lists..."
apt-get update

echo "📦 Installing dependencies..."
apt-get install -y \
    python3.11 \
    python3.11-venv \
    python3-pip \
    nodejs \
    npm \
    mosquitto \
    mosquitto-clients \
    git \
    curl

# Set installation directory
INSTALL_DIR="/opt/thermi-nator"
echo "📁 Installation directory: ${INSTALL_DIR}"

# Create installation directory
mkdir -p "${INSTALL_DIR}"
cd "${INSTALL_DIR}"

# Determine source directory (script should be run from deployment/raspberry-pi/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Copy application files
if [ -d "${SOURCE_DIR}/backend" ] && [ -d "${SOURCE_DIR}/frontend" ]; then
    echo "📋 Copying application files..."
    cp -r "${SOURCE_DIR}/backend" "${INSTALL_DIR}/"
    cp -r "${SOURCE_DIR}/frontend" "${INSTALL_DIR}/"
    if [ -f "${SOURCE_DIR}/README.md" ]; then
        cp "${SOURCE_DIR}/README.md" "${INSTALL_DIR}/"
    fi
else
    echo "❌ Error: Source files not found at ${SOURCE_DIR}"
    echo "Please run this script from the deployment/raspberry-pi directory"
    exit 1
fi

# Setup Python virtual environment
echo "🐍 Setting up Python environment..."
cd "${INSTALL_DIR}/backend"
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Setup Node.js frontend
echo "⚛️  Setting up frontend..."
cd "${INSTALL_DIR}/frontend"
npm install
npm run build

# Create environment configuration
echo "⚙️  Creating configuration..."
cat > "${INSTALL_DIR}/backend/.env" << 'EOF'
# Thermi-Nator Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=
DATABASE_PATH=/var/lib/thermi-nator/thermi_nator.db
LOG_LEVEL=INFO

# Location Configuration (update these)
THERMIQ_ADDRESS=
THERMIQ_LATITUDE=0.0
THERMIQ_LONGITUDE=0.0
THERMIQ_TIMEZONE=UTC
EOF

# Create data directory
mkdir -p /var/lib/thermi-nator
chown -R "${ACTUAL_USER}:${ACTUAL_USER}" /var/lib/thermi-nator

# Create systemd service for backend
echo "🚀 Creating systemd services..."
cat > /etc/systemd/system/thermi-nator-backend.service << EOF
[Unit]
Description=Thermi-Nator Backend Service
After=network.target mosquitto.service
Wants=mosquitto.service

[Service]
Type=simple
User=${ACTUAL_USER}
WorkingDirectory=${INSTALL_DIR}/backend
Environment="PATH=${INSTALL_DIR}/backend/venv/bin"
ExecStart=${INSTALL_DIR}/backend/venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
cat > /etc/systemd/system/thermi-nator-frontend.service << EOF
[Unit]
Description=Thermi-Nator Frontend Service
After=network.target thermi-nator-backend.service
Wants=thermi-nator-backend.service

[Service]
Type=simple
User=${ACTUAL_USER}
WorkingDirectory=${INSTALL_DIR}/frontend
ExecStart=/usr/bin/npx vite preview --port 5173 --host 0.0.0.0
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chown -R "${ACTUAL_USER}:${ACTUAL_USER}" "${INSTALL_DIR}"

# Enable and start Mosquitto
echo "🦟 Starting Mosquitto MQTT broker..."
systemctl enable mosquitto
systemctl start mosquitto

# Reload systemd and enable services
echo "🔄 Enabling services..."
systemctl daemon-reload
systemctl enable thermi-nator-backend
systemctl enable thermi-nator-frontend

# Start services
echo "▶️  Starting services..."
systemctl start thermi-nator-backend
systemctl start thermi-nator-frontend

# Show status
sleep 3
systemctl status thermi-nator-backend --no-pager
systemctl status thermi-nator-frontend --no-pager

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Edit configuration: sudo nano ${INSTALL_DIR}/backend/.env"
echo "  2. Update your location and MQTT settings"
echo "  3. Restart services: sudo systemctl restart thermi-nator-backend"
echo "  4. Access dashboard: http://$(hostname -I | awk '{print $1}'):5173"
echo ""
echo "🔧 Management commands:"
echo "  Check status:     sudo systemctl status thermi-nator-backend"
echo "  View logs:        sudo journalctl -u thermi-nator-backend -f"
echo "  Start/Stop:       sudo systemctl start|stop thermi-nator-backend"
echo "  Enable on boot:   sudo systemctl enable thermi-nator-backend"
echo ""
echo "🌐 Local network access:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):5173"
echo "  Backend:  http://$(hostname -I | awk '{print $1}'):8000"
echo ""
