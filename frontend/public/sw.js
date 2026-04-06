// Service Worker for Thermi-Nator PWA
// Provides offline support and caching

const CACHE_NAME = 'thermi-nator-v3';
const RUNTIME_CACHE = 'thermi-nator-runtime-v3';

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/thumbnail.svg',
  '/manifest.json',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Only handle HTTP(S) requests
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Skip WebSocket connections (already handled above, but keeping for clarity)
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone).catch((err) => {
                console.warn('[SW] Failed to cache API response:', err);
              });
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone).catch((err) => {
              console.warn('[SW] Failed to cache static asset:', err);
            });
          });
        }
        return response;
      }).catch((err) => {
        console.error('[SW] Failed to fetch:', request.url, err);
        throw err;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
