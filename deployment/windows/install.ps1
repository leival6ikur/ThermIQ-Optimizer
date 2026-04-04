# Thermi-Nator Windows Installation Script
# Run with: PowerShell -ExecutionPolicy Bypass -File install.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Thermi-Nator Installation (Windows)  " -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ Error: Please run PowerShell as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Refresh environment
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
choco install -y python311 nodejs mosquitto git

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Set installation directory
$InstallDir = "C:\Program Files\Thermi-Nator"
Write-Host "📁 Installation directory: $InstallDir" -ForegroundColor Cyan

# Create installation directory
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null

# Determine source directory (script should be run from deployment\windows\)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Copy application files
if ((Test-Path "$SourceDir\backend") -and (Test-Path "$SourceDir\frontend")) {
    Write-Host "📋 Copying application files..." -ForegroundColor Yellow
    Copy-Item -Path "$SourceDir\backend" -Destination $InstallDir -Recurse -Force
    Copy-Item -Path "$SourceDir\frontend" -Destination $InstallDir -Recurse -Force
    if (Test-Path "$SourceDir\README.md") {
        Copy-Item -Path "$SourceDir\README.md" -Destination $InstallDir -Force
    }
} else {
    Write-Host "❌ Error: Source files not found at $SourceDir" -ForegroundColor Red
    Write-Host "Please run this script from the deployment\windows directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Setup Python virtual environment
Write-Host "🐍 Setting up Python environment..." -ForegroundColor Yellow
Set-Location "$InstallDir\backend"
python -m venv venv
& "$InstallDir\backend\venv\Scripts\Activate.ps1"
python -m pip install --upgrade pip
pip install -r requirements.txt

# Setup Node.js frontend
Write-Host "⚛️  Setting up frontend..." -ForegroundColor Yellow
Set-Location "$InstallDir\frontend"
npm install
npm run build

# Create environment configuration
Write-Host "⚙️  Creating configuration..." -ForegroundColor Yellow
$envContent = @"
# Thermi-Nator Configuration
MQTT_BROKER=localhost
MQTT_PORT=1883
MQTT_USER=
MQTT_PASSWORD=
DATABASE_PATH=C:\ProgramData\Thermi-Nator\thermi_nator.db
LOG_LEVEL=INFO

# Location Configuration (update these)
THERMIQ_ADDRESS=
THERMIQ_LATITUDE=0.0
THERMIQ_LONGITUDE=0.0
THERMIQ_TIMEZONE=UTC
"@
$envContent | Out-File -FilePath "$InstallDir\backend\.env" -Encoding UTF8

# Create data directory
New-Item -ItemType Directory -Force -Path "C:\ProgramData\Thermi-Nator" | Out-Null

# Create NSSM service wrapper scripts
Write-Host "🚀 Creating Windows services..." -ForegroundColor Yellow

# Install NSSM (Non-Sucking Service Manager)
choco install -y nssm

# Create backend service
$backendExe = "$InstallDir\backend\venv\Scripts\python.exe"
$backendArgs = "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm install Thermi-Nator-Backend $backendExe $backendArgs
nssm set Thermi-Nator-Backend AppDirectory "$InstallDir\backend"
nssm set Thermi-Nator-Backend DisplayName "Thermi-Nator Backend"
nssm set Thermi-Nator-Backend Description "Thermi-Nator heat pump optimization backend service"
nssm set Thermi-Nator-Backend Start SERVICE_AUTO_START
nssm set Thermi-Nator-Backend AppStdout "C:\ProgramData\Thermi-Nator\backend.log"
nssm set Thermi-Nator-Backend AppStderr "C:\ProgramData\Thermi-Nator\backend-error.log"

# Create frontend service
$npmPath = (Get-Command npm).Source
$frontendArgs = "run preview -- --port 5173 --host 0.0.0.0"
nssm install Thermi-Nator-Frontend $npmPath $frontendArgs
nssm set Thermi-Nator-Frontend AppDirectory "$InstallDir\frontend"
nssm set Thermi-Nator-Frontend DisplayName "Thermi-Nator Frontend"
nssm set Thermi-Nator-Frontend Description "Thermi-Nator web dashboard frontend service"
nssm set Thermi-Nator-Frontend Start SERVICE_AUTO_START
nssm set Thermi-Nator-Frontend AppStdout "C:\ProgramData\Thermi-Nator\frontend.log"
nssm set Thermi-Nator-Frontend AppStderr "C:\ProgramData\Thermi-Nator\frontend-error.log"

# Start Mosquitto service
Write-Host "🦟 Starting Mosquitto MQTT broker..." -ForegroundColor Yellow
Start-Service mosquitto
Set-Service -Name mosquitto -StartupType Automatic

# Start services
Write-Host "▶️  Starting Thermi-Nator services..." -ForegroundColor Yellow
Start-Service Thermi-Nator-Backend
Start-Service Thermi-Nator-Frontend

# Wait for services to start
Start-Sleep -Seconds 5

# Get local IP
$localIP = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet*","Wi-Fi*" | Select-Object -First 1).IPAddress

Write-Host ""
Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Edit configuration: notepad `"$InstallDir\backend\.env`""
Write-Host "  2. Update your location and MQTT settings"
Write-Host "  3. Restart services from Services.msc or:"
Write-Host "     Restart-Service Thermi-Nator-Backend"
Write-Host "  4. Access dashboard: http://localhost:5173"
Write-Host ""
Write-Host "🔧 Management commands:" -ForegroundColor Cyan
Write-Host "  Check status:     Get-Service Thermi-Nator-*"
Write-Host "  View logs:        Get-Content C:\ProgramData\Thermi-Nator\backend.log -Tail 50 -Wait"
Write-Host "  Start services:   Start-Service Thermi-Nator-Backend"
Write-Host "  Stop services:    Stop-Service Thermi-Nator-Backend"
Write-Host "  Restart:          Restart-Service Thermi-Nator-Backend"
Write-Host ""
Write-Host "🌐 Network access:" -ForegroundColor Cyan
Write-Host "  Frontend: http://localhost:5173"
Write-Host "  Frontend (LAN): http://${localIP}:5173"
Write-Host "  Backend:  http://localhost:8000"
Write-Host "  Backend (LAN): http://${localIP}:8000"
Write-Host ""

# Add firewall rules
Write-Host "🔥 Adding Windows Firewall rules..." -ForegroundColor Yellow
New-NetFirewallRule -DisplayName "Thermi-Nator Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Thermi-Nator Backend" -Direction Inbound -LocalPort 8000 -Protocol TCP -Action Allow | Out-Null
New-NetFirewallRule -DisplayName "Mosquitto MQTT" -Direction Inbound -LocalPort 1883 -Protocol TCP -Action Allow | Out-Null

Write-Host "✅ Firewall rules added for ports 5173, 8000, and 1883" -ForegroundColor Green
Write-Host ""

Read-Host "Press Enter to exit"
