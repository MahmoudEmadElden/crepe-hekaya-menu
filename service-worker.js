/**
 * Crepe Hekaya — PWA Service Worker
 * Version: 2.1.0
 * Provides offline caching, lightning-fast loads, and standalone app capabilities
 */

const CACHE_NAME = 'crepe-hekaya-v2.1.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/menu.html',
  '/cart.html',
  '/orders.html',
  '/auth.html',
  '/css/style.css',
  '/css/cart.css',
  '/css/auth.css',
  '/js/api.js',
  '/js/app.js',
  '/js/cart.js',
  '/js/menuData.js',
  '/manifest.json',
  '/assets/icons/icon-192.png',
  '/assets/icons/icon-512.png',
  '/assets/images/logo.jpeg'
];

// Install Event — Precaching static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Pre-cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event — Cleaning up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event — Stale-While-Revalidate for pages & assets, Network-Only for APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do NOT cache API calls (orders, auth, real-time data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ success: false, message: 'أنت في وضع عدم الاتصال حالياً' }),
          { headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
    return;
  }

  // Stale-While-Revalidate Strategy for HTML, CSS, JS, Images
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is navigation, serve cached index
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Push Notifications Event (Ready for order status updates)
self.addEventListener('push', (event) => {
  let data = { title: 'كريب حكاية', body: 'تحديث جديد بشأن طلبك!' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/assets/icons/icon-192.png',
    badge: '/assets/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/orders.html'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data ? event.notification.data.url : '/orders.html';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
