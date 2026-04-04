#!/bin/bash
set -e

echo "======================================"
echo "  Thermi-Nator Installation (macOS)  "
echo "======================================"
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ Error: This installer is for macOS only"
    exit 1
fi

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
brew install python@3.11 node@20 mosquitto

# Set installation directory
INSTALL_DIR="${HOME}/.thermi-nator"
echo "📁 Installation directory: ${INSTALL_DIR}"

# Create installation directory
mkdir -p "${INSTALL_DIR}"
cd "${INSTALL_DIR}"

# Determine source directory (script should be run from deployment/macos/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Clone or copy application files
if [ -d "${SOURCE_DIR}/backend" ] && [ -d "${SOURCE_DIR}/frontend" ]; then
    echo "📋 Copying application files..."
    cp -r "${SOURCE_DIR}/backend" "${INSTALL_DIR}/"
    cp -r "${SOURCE_DIR}/frontend" "${INSTALL_DIR}/"
    if [ -f "${SOURCE_DIR}/README.md" ]; then
        cp "${SOURCE_DIR}/README.md" "${INSTALL_DIR}/"
    fi
else
    echo "❌ Error: Source files not found at ${SOURCE_DIR}"
    echo "Please run this script from the deployment/macos directory"
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
DATABASE_PATH=thermi_nator.db
LOG_LEVEL=INFO

# Location Configuration (update these)
THERMIQ_ADDRESS=
THERMIQ_LATITUDE=0.0
THERMIQ_LONGITUDE=0.0
THERMIQ_TIMEZONE=UTC
EOF

# Create LaunchAgent for automatic startup
echo "🚀 Creating launch agent..."
mkdir -p "${HOME}/Library/LaunchAgents"

cat > "${HOME}/Library/LaunchAgents/com.thermi-nator.backend.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thermi-nator.backend</string>
    <key>ProgramArguments</key>
    <array>
        <string>${INSTALL_DIR}/backend/venv/bin/python</string>
        <string>-m</string>
        <string>uvicorn</string>
        <string>app.main:app</string>
        <string>--host</string>
        <string>0.0.0.0</string>
        <string>--port</string>
        <string>8000</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${INSTALL_DIR}/backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/thermi-nator-backend.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/thermi-nator-backend-error.log</string>
</dict>
</plist>
EOF

cat > "${HOME}/Library/LaunchAgents/com.thermi-nator.frontend.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.thermi-nator.frontend</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npx</string>
        <string>vite</string>
        <string>preview</string>
        <string>--port</string>
        <string>5173</string>
        <string>--host</string>
        <string>0.0.0.0</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${INSTALL_DIR}/frontend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${HOME}/Library/Logs/thermi-nator-frontend.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/Library/Logs/thermi-nator-frontend-error.log</string>
</dict>
</plist>
EOF

# Start Mosquitto
echo "🦟 Starting Mosquitto MQTT broker..."
brew services start mosquitto

# Load services
echo "🔄 Loading services..."
launchctl load "${HOME}/Library/LaunchAgents/com.thermi-nator.backend.plist"
launchctl load "${HOME}/Library/LaunchAgents/com.thermi-nator.frontend.plist"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Edit configuration: ${INSTALL_DIR}/backend/.env"
echo "  2. Update your location and MQTT settings"
echo "  3. Access dashboard: http://localhost:5173"
echo ""
echo "🔧 Management commands:"
echo "  Start services:   launchctl start com.thermi-nator.backend"
echo "  Stop services:    launchctl stop com.thermi-nator.backend"
echo "  View logs:        tail -f ~/Library/Logs/thermi-nator-backend.log"
echo ""
