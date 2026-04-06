# HTTPS/TLS Setup Guide

Secure your Thermi-Nator deployment with HTTPS for production use.

## Why HTTPS?

**Required for:**
- PWA installation (service workers require HTTPS)
- Secure remote access
- API authentication
- Modern browser features

**Benefits:**
- Encrypted data transmission
- Protection against MITM attacks
- Browser trust indicators
- SEO benefits (if publicly accessible)

## Setup Options

### Option 1: Local Network Only (Easiest)

If accessing only on your home network (192.168.x.x), you can skip HTTPS:
- PWA works on localhost
- Data stays on local network
- No certificate needed
- Access via: `http://192.168.1.X:5173`

**Limitations:**
- No remote access
- Some features require HTTPS (browser APIs)
- Less secure if network is compromised

### Option 2: Self-Signed Certificate (Development)

For testing HTTPS locally or on private networks.

**Advantages:**
- Free and quick
- Works offline
- Full HTTPS features

**Disadvantages:**
- Browser warnings ("Not Secure")
- Manual certificate trust required
- Not suitable for public access

#### Generate Self-Signed Certificate

```bash
# Create certificates directory
mkdir -p /opt/thermi-nator/certs
cd /opt/thermi-nator/certs

# Generate private key
openssl genrsa -out key.pem 2048

# Generate certificate (valid 365 days)
openssl req -new -x509 -key key.pem -out cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Thermi-Nator/CN=192.168.1.X"

# Set permissions
chmod 600 key.pem
chmod 644 cert.pem
```

#### Configure Nginx

```nginx
server {
    listen 443 ssl;
    server_name 192.168.1.X;

    ssl_certificate /opt/thermi-nator/certs/cert.pem;
    ssl_certificate_key /opt/thermi-nator/certs/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### Trust Certificate

**iOS:**
1. Navigate to `https://192.168.1.X` in Safari
2. Tap "Show Details" on warning
3. Tap "visit this website"
4. Settings → General → About → Certificate Trust Settings
5. Enable trust for certificate

**Android:**
1. Download cert.pem
2. Settings → Security → Install certificate
3. Select Downloaded cert
4. Name it "Thermi-Nator"

**Desktop (Chrome/Edge):**
1. Navigate to `https://192.168.1.X`
2. Click "Advanced" → "Proceed to site"
3. Or import cert.pem to system certificate store

### Option 3: Let's Encrypt (Production - Domain Required)

Free, trusted certificates from Let's Encrypt. **Requires a domain name.**

**Advantages:**
- Trusted by all browsers
- Auto-renewal
- Free
- Professional setup

**Requirements:**
- Domain name (e.g., `thermiq.yourdomain.com`)
- Public IP address or DynDNS
- Port 80/443 accessible from internet

#### Prerequisites

**1. Get a Domain Name:**
- Register domain (Namecheap, GoDaddy, etc.)
- Or use free subdomain (DuckDNS, No-IP)

**2. Point Domain to Your IP:**

```bash
# Get your public IP
curl ifconfig.me

# Configure DNS:
# A Record: thermiq.yourdomain.com → YOUR_PUBLIC_IP
```

**3. Port Forwarding (Router):**
- Forward port 80 → Raspberry Pi port 80
- Forward port 443 → Raspberry Pi port 443

#### Install Certbot

```bash
# Raspberry Pi / Debian / Ubuntu
sudo apt update
sudo apt install certbot python3-certbot-nginx

# macOS
brew install certbot
```

#### Obtain Certificate

```bash
# Stop any services using port 80/443
sudo systemctl stop thermi-nator-frontend
sudo systemctl stop nginx

# Get certificate
sudo certbot certonly --standalone \
  -d thermiq.yourdomain.com \
  --email your@email.com \
  --agree-tos

# Certificates installed to:
# /etc/letsencrypt/live/thermiq.yourdomain.com/
```

#### Configure Nginx with Let's Encrypt

```nginx
# /etc/nginx/sites-available/thermiq

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name thermiq.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    server_name thermiq.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/thermiq.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/thermiq.yourdomain.com/privkey.pem;

    # Strong SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' 'https://thermiq.yourdomain.com' always;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check (for monitoring)
    location /health {
        proxy_pass http://localhost:8000/health;
        access_log off;
    }
}
```

#### Enable and Test

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/thermiq /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Start services
sudo systemctl start thermi-nator-frontend
sudo systemctl start thermi-nator-backend

# Test HTTPS
curl https://thermiq.yourdomain.com
```

#### Auto-Renewal

Certbot automatically sets up renewal. Verify:

```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer

# Manual renewal (if needed)
sudo certbot renew
sudo systemctl reload nginx
```

### Option 4: Cloudflare Tunnel (Zero-Touch HTTPS)

Easiest way to get HTTPS without port forwarding or certificates.

**Advantages:**
- No port forwarding needed
- Free HTTPS
- DDoS protection
- No certificate management
- Works behind CGNAT

**Requirements:**
- Cloudflare account (free)
- Domain managed by Cloudflare

#### Setup

```bash
# Install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create thermiq

# Route domain to tunnel
cloudflared tunnel route dns thermiq thermiq.yourdomain.com

# Configure tunnel
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <TUNNEL-ID>
credentials-file: /home/pi/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: thermiq.yourdomain.com
    service: http://localhost:5173
  - hostname: thermiq.yourdomain.com
    path: /api/*
    service: http://localhost:8000
  - hostname: thermiq.yourdomain.com
    path: /ws
    service: ws://localhost:8000
  - service: http_status:404
EOF

# Run tunnel
cloudflared tunnel run thermiq

# Or install as service
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

Access at: `https://thermiq.yourdomain.com` (automatic HTTPS!)

### Option 5: Tailscale (VPN - Most Secure)

Access Thermi-Nator securely from anywhere without exposing to internet.

**Advantages:**
- Zero configuration
- Automatic HTTPS
- No port forwarding
- Works anywhere
- End-to-end encrypted

**Setup:**

```bash
# Install Tailscale on Raspberry Pi
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up

# Install Tailscale on your devices (phone/laptop)
# Download from: https://tailscale.com/download

# Access via Tailscale IP
https://100.x.y.z:5173
```

## Comparison Table

| Method | Setup Time | Cost | Security | Remote Access | Maintenance |
|--------|------------|------|----------|---------------|-------------|
| **Local Only** | 0 min | Free | Medium | ❌ | None |
| **Self-Signed** | 15 min | Free | Good | ⚠️ Warnings | Yearly renewal |
| **Let's Encrypt** | 30 min | Free | Excellent | ✅ | Auto-renewal |
| **Cloudflare** | 20 min | Free | Excellent | ✅ | Zero |
| **Tailscale** | 10 min | Free | Excellent | ✅ | Zero |

**Recommendation:**
- **Home use only**: Local HTTP (no HTTPS needed)
- **Testing PWA**: Self-signed certificate
- **Public access**: Let's Encrypt or Cloudflare
- **Private remote access**: Tailscale (most secure)

## Security Best Practices

### 1. Firewall Configuration

```bash
# Allow only HTTPS
sudo ufw allow 443/tcp
sudo ufw deny 80/tcp  # Or redirect to 443

# Block other ports
sudo ufw enable
```

### 2. Update Backend for HTTPS

```python
# In backend .env or config
FRONTEND_URL=https://thermiq.yourdomain.com
CORS_ORIGINS=["https://thermiq.yourdomain.com"]
```

### 3. Force HTTPS in Frontend

```typescript
// In frontend/src/config.ts
const API_BASE_URL = import.meta.env.PROD
  ? 'https://thermiq.yourdomain.com/api'
  : 'http://localhost:8000/api';
```

### 4. Enable HSTS

```nginx
# In nginx config
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

### 5. Regular Updates

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update certificates (if Let's Encrypt)
sudo certbot renew
```

## Troubleshooting

### Certificate Not Trusted

**Check:**
- Certificate is not expired: `openssl x509 -in cert.pem -noout -dates`
- Domain matches certificate: `openssl x509 -in cert.pem -noout -subject`
- Correct certificate chain (Let's Encrypt): use `fullchain.pem` not `cert.pem`

### Cannot Connect via HTTPS

**Check:**
- Port 443 is open: `sudo netstat -tlnp | grep 443`
- Nginx is running: `sudo systemctl status nginx`
- Firewall allows 443: `sudo ufw status`
- DNS resolves correctly: `nslookup thermiq.yourdomain.com`

### Mixed Content Errors

**Problem**: Page loaded via HTTPS but loads HTTP resources

**Solution**: Update all URLs to HTTPS:
```typescript
// Change:
const WS_URL = 'ws://localhost:8000/ws';
// To:
const WS_URL = 'wss://thermiq.yourdomain.com/ws';
```

### Let's Encrypt Rate Limits

**Problem**: "too many certificates already issued"

**Solution**:
- Wait 1 week (rate limit resets)
- Use staging environment for testing:
  ```bash
  certbot --staging -d thermiq.yourdomain.com
  ```

### PWA Not Installing

**Check:**
- HTTPS is working (not self-signed with warnings)
- Service worker registered: DevTools → Application → Service Workers
- Manifest is valid: DevTools → Application → Manifest

## Testing HTTPS

```bash
# Test SSL configuration
openssl s_client -connect thermiq.yourdomain.com:443 -servername thermiq.yourdomain.com

# Check certificate expiry
echo | openssl s_client -connect thermiq.yourdomain.com:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL strength
curl https://www.ssllabs.com/ssltest/analyze.html?d=thermiq.yourdomain.com
```

## Monitoring

### Certificate Expiry Monitoring

```bash
# Check expiry
sudo certbot certificates

# Or
openssl x509 -enddate -noout -in /etc/letsencrypt/live/thermiq.yourdomain.com/cert.pem
```

### Nginx Access Logs

```bash
# Monitor HTTPS access
sudo tail -f /var/log/nginx/access.log

# Check for SSL errors
sudo tail -f /var/log/nginx/error.log
```

## Resources

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Cloudflare Tunnel Guide](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Tailscale Setup](https://tailscale.com/kb/start/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [SSL Labs Server Test](https://www.ssllabs.com/ssltest/)

---

**Recommendation for Thermi-Nator:**
- **Local access**: No HTTPS needed (use HTTP)
- **Remote access**: Tailscale (easiest + most secure)
- **Public hosting**: Cloudflare Tunnel (easiest setup)

