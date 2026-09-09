\const CACHE_NAME = 'reviewfilm21-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sitemap.xml',
  '/robots.txt'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate - Bersihkan cache lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - Strategi Network First, Cache Fallback
self.addEventListener('fetch', (event) => {
  // Jangan cache API calls
  if (event.request.url.includes('api.themoviedb.org') ||
      event.request.url.includes('vidsrc') ||
      event.request.url.includes('google.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache response jika valid
        if (event.request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
