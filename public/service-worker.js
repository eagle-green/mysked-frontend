/* eslint-disable no-restricted-globals */
// Increment this version number whenever you deploy updates
const APP_VERSION = '1.0.13';
const CACHE_NAME = `mysked-${APP_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/logo/mysked-logo-pwa.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
  // Don't skip waiting - let user choose when to update
  // self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      )
    )
  );
  // Don't claim clients immediately - let user choose when to update
  // self.clients.claim();
});

// Fetch event - simple cache-first strategy for everything
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Simple cache-first strategy for all requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'MySked Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo/m-logo-rounded.svg',
    badge: '/logo/m-logo-rounded.svg',
    data: data.url || '/',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});

// Handle messages from clients (for SKIP_WAITING)
self.addEventListener('message', (event) => {
  console.log('📨 Service worker received message:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('🚀 Skipping waiting and activating new service worker...');
    self.skipWaiting();
  }
});

