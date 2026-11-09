/**
 * ====================================================================
 * SERVICE WORKER (PWA) - SISTEM KLINIK AISYIYAH
 * Menjamin aplikasi dapat diinstal ke layar utama ponsel (A2HS)
 * dan memuat aset statis secara instan.
 * ====================================================================
 */

const CACHE_NAME = 'klinik-aisyiyah-v2';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).catch((err) => {
      console.warn('PWA cache prefetch notice:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya tangani GET request untuk aset statis. Request API selalu langsung ke server
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});

