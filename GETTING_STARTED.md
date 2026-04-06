# Getting Started with Thermi-Nator

Simple step-by-step guide for setting up your heat pump optimizer when your ThermIQ device and Raspberry Pi arrive.

## 📦 What You Need

- **ThermIQ device** (MQTT-enabled heat pump controller)
- **Raspberry Pi** (3B+ or newer recommended)
- **MicroSD card** (16GB+ with Raspberry Pi OS installed)
- **Power supply** for Raspberry Pi
- **Ethernet cable** (or WiFi configured)
- **Your home network** router access

## 💿 Step 0: Prepare Raspberry Pi OS (15 minutes)

**Important:** Raspberry Pis do **not** come with an OS pre-installed. You need to install it on a microSD card first.

### Option A: Buy a Starter Kit (Easiest)

Some retailers sell "Raspberry Pi Starter Kits" that include:
- Raspberry Pi board
- MicroSD card with Raspberry Pi OS **pre-installed**
- Power supply, case, HDMI cable

✅ **If you have a kit with pre-installed OS, skip to Step 1!**

### Option B: Install OS Yourself

**What you need:**
- MicroSD card (16GB minimum, 32GB+ recommended)
- Computer with SD card reader
- 15 minutes

**Steps:**

1. **Download Raspberry Pi Imager** on your computer:
   - Visit: https://www.raspberrypi.com/software/
   - Download and install for your OS (Windows/Mac/Linux)

2. **Flash the OS to microSD card:**
   - Insert microSD card into your computer
   - Open Raspberry Pi Imager
   - Click **"CHOOSE OS"** → Select **"Raspberry Pi OS (64-bit)"** (recommended)
   - Click **"CHOOSE STORAGE"** → Select your microSD card
   - Click the **gear icon ⚙️** (Settings) to configure:
     ```
     ☑️ Set hostname: therminator
     ☑️ Enable SSH (Use password authentication)
     ☑️ Set username: pi
     ☑️ Set password: [choose a password]
     ☑️ Configure wireless LAN (optional but convenient)
        - SSID: [your WiFi name]
        - Password: [your WiFi password]
        - Country: [your country]
     ☑️ Set locale settings (timezone and keyboard)
     ```
   - Click **"SAVE"**
   - Click **"WRITE"** and confirm
   - Wait 5-10 minutes for the process to complete

3. **Safely eject the card** when done

4. **Insert the microSD card into your Raspberry Pi**

💡 **Tip:** Pre-configuring SSH and WiFi saves time - your Pi will be ready to connect immediately when powered on!

## 🔌 Step 1: Physical Setup (5 minutes)

1. **Install ThermIQ on your heat pump**
   - Follow the ThermIQ installation manual
   - Connect to your heat pump's control board
   - Power on the device

2. **Connect Raspberry Pi to your network**
   - Insert microSD card with Raspberry Pi OS
   - Connect ethernet cable to your router (or configure WiFi)
   - Connect power supply

3. **Find device IP addresses**
   - ThermIQ: Check your router's connected devices (usually named "thermiq-...")
   - Raspberry Pi: Check router for "raspberrypi" device
   - Write these down:
     ```
     ThermIQ IP: _________________
     Raspberry Pi IP: _________________
     ```

## 💻 Step 2: Access Raspberry Pi (2 minutes)

**From your computer:**

```bash
# Replace with your Raspberry Pi's actual IP address
ssh pi@192.168.1.XXX
```

Default password is usually `raspberry` (change this later for security!)

## 📥 Step 3: Install Thermi-Nator (10 minutes)

**On Raspberry Pi terminal:**

```bash
# Download the software
cd ~
git clone https://github.com/yourusername/thermi-nator.git
cd thermi-nator

# Run the installer
cd deployment/raspberry-pi
chmod +x install.sh
sudo bash install.sh
```

Wait for installation to complete. It will:
- Install Python, Node.js, and Mosquitto
- Set up the Thermi-Nator software
- Create auto-start services
- Start everything automatically

## ⚙️ Step 4: Configure (5 minutes)

**Still on Raspberry Pi:**

```bash
# Open configuration file
sudo nano /opt/thermi-nator/backend/.env
```

**Update these settings:**

```env
# MQTT connection to your ThermIQ device
MQTT_BROKER=192.168.1.XXX    # Your ThermIQ IP address
MQTT_PORT=1883
MQTT_USER=                    # Leave blank if no username
MQTT_PASSWORD=                # Leave blank if no password

# Your location (for weather and electricity prices)
THERMIQ_ADDRESS=Your Address, City
THERMIQ_LATITUDE=58.378025    # Get from Google Maps
THERMIQ_LONGITUDE=26.728763   # Right-click location -> coordinates
THERMIQ_TIMEZONE=Europe/Tallinn  # Your timezone
```

**Save the file:**
- Press `Ctrl + X`
- Press `Y` to confirm
- Press `Enter` to save

**Restart the services:**

```bash
sudo systemctl restart thermi-nator-backend
sudo systemctl restart thermi-nator-frontend
```

## 🌐 Step 5: Access Dashboard (1 minute)

**From any device on your network:**

Open a web browser and go to:
```
http://192.168.1.XXX:5173
```
(Replace XXX with your Raspberry Pi IP)

You should see the **Thermi-Nator Dashboard**!

## ✅ What You Should See

1. **Dashboard Page:**
   - Temperature readings from your heat pump
   - Current electricity price
   - Heating schedule for next 24 hours
   - Daily statistics

2. **Electricity Prices:**
   - Today's hourly prices
   - Tomorrow's prices (after 13:00)
   - Color-coded: Green (cheap), Yellow (normal), Red (expensive)

3. **Heating Schedule:**
   - Optimized schedule based on prices
   - Toggle any hour manually if needed
   - "Reset Schedule" to recalculate

## 🔧 Troubleshooting

### "Can't connect to heat pump"
- Check ThermIQ IP address is correct in `.env` file
- Verify ThermIQ device is powered on and connected to network
- Test connection: `ping <thermiq-ip>` from Raspberry Pi

### "Dashboard won't load"
- Check services are running:
  ```bash
  sudo systemctl status thermi-nator-backend
  sudo systemctl status thermi-nator-frontend
  ```
- Check logs:
  ```bash
  sudo journalctl -u thermi-nator-backend -n 50
  ```

### "No temperature data"
- Wait 5-10 minutes for first readings
- Verify MQTT credentials in `.env` are correct
- Check ThermIQ documentation for MQTT topic format

### "No electricity prices"
- Verify your location coordinates in `.env`
- Check internet connection on Raspberry Pi: `ping google.com`
- Wait up to 30 minutes for initial data fetch

## 🔐 Security Recommendations

1. **Change Raspberry Pi password:**
   ```bash
   passwd
   ```

2. **Update system regularly:**
   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. **Don't expose to internet** without proper security (VPN recommended)

## 📱 Access from Phone/Tablet

1. Connect device to same WiFi network
2. Open browser
3. Go to `http://192.168.1.XXX:5173`
4. Bookmark for easy access

You can also add to home screen:
- **iOS:** Tap Share → Add to Home Screen
- **Android:** Tap Menu (⋮) → Add to Home Screen

## 📊 What Happens Next

The system will:
- ✅ Collect temperature data every minute
- ✅ Fetch electricity prices daily (around 13:00)
- ✅ Calculate optimal heating schedule automatically
- ✅ Update recommendations every hour
- ✅ Track savings compared to constant heating

## 🆘 Need Help?

- **Documentation:** See `deployment/DEPLOYMENT_GUIDE.md` for detailed info
- **Check logs:** `sudo journalctl -u thermi-nator-backend -f`
- **Restart everything:**
  ```bash
  sudo systemctl restart thermi-nator-backend
  sudo systemctl restart thermi-nator-frontend
  sudo systemctl restart mosquitto
  ```

## 🎉 You're All Set!

Your heat pump is now optimized for minimum electricity costs while maintaining comfort. The system learns your patterns and adjusts automatically.

**Typical savings:** 15-30% on heating costs compared to constant operation.

Enjoy your optimized heating! 🌡️💰
