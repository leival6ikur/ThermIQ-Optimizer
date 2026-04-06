# Thermi-Nator PWA (Progressive Web App) Guide

## What is a PWA?

A Progressive Web App (PWA) is a web application that can be installed on your device and works like a native app. Benefits include:

- **Install to Home Screen**: Add to your phone/tablet home screen like a regular app
- **Offline Support**: View cached data even without internet
- **Fast Loading**: Cached assets load instantly
- **Native Feel**: Runs in standalone mode without browser UI
- **Automatic Updates**: Always gets the latest version when online

## Installation

### On Mobile (iOS/Android)

**iOS (Safari):**
1. Open Thermi-Nator in Safari
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Name it "Thermi-Nator" and tap "Add"
5. The app icon will appear on your home screen

**Android (Chrome):**
1. Open Thermi-Nator in Chrome
2. You'll see an "Install" banner at the bottom (or click "Install" in the prompt)
3. Tap "Install" 
4. The app will be added to your home screen and app drawer

Alternatively:
1. Tap the three-dot menu (⋮)
2. Select "Install app" or "Add to Home Screen"
3. Confirm the installation

### On Desktop (Windows/Mac/Linux)

**Chrome/Edge:**
1. Open Thermi-Nator
2. Look for the install icon (⊕) in the address bar
3. Click "Install"
4. The app will open in its own window

Alternatively:
1. Click the three-dot menu (⋮)
2. Select "Install Thermi-Nator..." or "Install app"
3. Confirm the installation

**The installed app will:**
- Open in its own window (no browser tabs/address bar)
- Appear in your Applications/Start Menu
- Have its own icon in the taskbar/dock

## Features

### Offline Support

When offline, Thermi-Nator will:
- ✅ Show the last loaded page
- ✅ Display cached temperature data
- ✅ Show previously loaded charts
- ✅ Allow navigation between pages
- ❌ Not fetch new data (API calls will use cache)
- ❌ Not update real-time information

### App Shortcuts (Android/Windows)

Long-press the app icon to access quick shortcuts:
- **Dashboard**: Go to main page
- **Prices**: View electricity prices
- **Schedule**: View heating schedule

### Update Behavior

The PWA automatically updates when:
- You reload the app while online
- You restart the installed app
- An update is detected (check hourly in background)

You don't need to manually update from an app store!

## Caching Strategy

Thermi-Nator uses a smart caching strategy:

**Static Assets (HTML, CSS, JS, Icons):**
- Cache first, fallback to network
- Updates automatically on reload

**API Data (Temperatures, Prices, Schedule):**
- Network first, fallback to cache
- Always shows fresh data when online
- Shows cached data when offline

**WebSocket (Real-time updates):**
- Not cached (requires connection)
- Falls back to polling cached API data

## Uninstalling

### iOS
1. Long-press the Thermi-Nator icon
2. Tap "Remove App"
3. Confirm removal

### Android
1. Long-press the app icon
2. Drag to "Uninstall" or tap "App info" → "Uninstall"

### Desktop
**Windows:**
- Settings → Apps → Thermi-Nator → Uninstall

**Mac:**
- Chrome → Settings → Apps → Thermi-Nator → Uninstall

**Linux:**
- Similar to Windows through browser settings

## Troubleshooting

### Install button not appearing

**Check:**
- Using HTTPS (required for PWA, except localhost)
- Browser supports PWA (Chrome, Edge, Safari 11.3+)
- Not already installed
- manifest.json is accessible

### App not updating

**Solution:**
1. Close the installed app completely
2. Reopen it (forces update check)
3. Or: Uninstall and reinstall

### Offline features not working

**Check:**
- Service worker registered successfully
- Open DevTools → Application → Service Workers
- Check for errors in Console
- Try clearing browser cache and reloading

### Icons not showing correctly

**Check:**
- Icon files exist: `/pwa-icon-192.png` and `/pwa-icon-512.png`
- See `frontend/public/PWA_ICONS_README.md` for icon generation
- Clear cache and reinstall app

## Development Notes

### Service Worker Location

`frontend/public/sw.js` - The service worker script

Key features:
- Precaches critical assets on install
- Runtime caching for API responses
- Network-first strategy for API calls
- Cache-first strategy for static assets

### Manifest Location

`frontend/public/manifest.json` - PWA manifest

Defines:
- App name and description
- Icons and theme colors
- Display mode (standalone)
- Start URL
- App shortcuts

### Testing PWA Features

**Chrome DevTools:**
1. Open DevTools (F12)
2. Go to "Application" tab
3. Check:
   - Manifest: Verify icons and settings
   - Service Workers: Check registration status
   - Cache Storage: View cached files

**Lighthouse Audit:**
1. Open DevTools
2. Go to "Lighthouse" tab
3. Run "Progressive Web App" audit
4. Fix any issues reported

### HTTPS Requirement

PWAs require HTTPS in production (service workers won't register on HTTP).

**Exceptions:**
- `localhost` (for development)
- `127.0.0.1` (for development)

For production deployment, see `docs/HTTPS_SETUP.md` (coming soon).

## Browser Support

| Browser | PWA Support | Install | Offline |
|---------|-------------|---------|---------|
| Chrome 67+ | ✅ Full | ✅ | ✅ |
| Edge 79+ | ✅ Full | ✅ | ✅ |
| Safari 11.3+ | ⚠️ Limited | ✅ | ✅ |
| Firefox 97+ | ⚠️ Limited | ❌ | ✅ |
| Samsung Internet | ✅ Full | ✅ | ✅ |

**Notes:**
- Safari: No install prompt, must add manually via Share menu
- Firefox: Service workers work, but no install prompt
- All browsers: Offline features work once service worker is registered

## Additional Resources

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [PWA Builder](https://www.pwabuilder.com/)
