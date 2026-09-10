/**
 * Service Worker — Hesham Fouad King of Crepe
 * Provides caching and fast loading for offline/repeat visits.
 */
const CACHE_NAME = 'hesham-fouad-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/cart.html',
  '/orders.html',
  '/auth.html',
  '/css/style.css',
  '/css/auth.css',
  '/css/admin.css',
  '/js/menuData.js',
  '/js/cart.js',
  '/js/api.js',
  '/js/app.js',
  '/assets/images/logo.png',
  '/assets/images/hesham-holding-crepe.png',
  '/assets/images/crispy-chicken-crepe.png',
  '/assets/images/trio-crepe.png',
  '/assets/images/crunchy-chicken-cheese.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Caching failed for some static assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache API requests
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network-first for HTML pages to ensure fresh updates
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request) || caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for images and styles
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
