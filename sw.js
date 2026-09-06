// Service Worker untuk ReviewFilm21
const CACHE_NAME = 'reviewfilm21-v1.0.1';
const RUNTIME_CACHE = 'reviewfilm21-runtime';
const API_CACHE = 'reviewfilm21-api';

// Aset yang di-cache saat install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/404.html'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Caching aset statis');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => {
              return name.startsWith('reviewfilm21-') && 
                     name !== CACHE_NAME &&
                     name !== RUNTIME_CACHE &&
                     name !== API_CACHE;
            })
            .map(name => {
              console.log('🗑️ Menghapus cache lama:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch Handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle image requests
  if (request.destination === 'image') {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

// Handler untuk API requests
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request, { 
      timeout: 10000 
    }).catch(() => null);
    
    if (response && response.ok) {
      cache.put(request, response.clone());
      return response;
    }
    
    throw new Error('Network failed');
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('📦 Menggunakan cache untuk:', request.url);
      return cachedResponse;
    }
    
    // If no cache, return offline response
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Anda sedang offline. Data tidak tersedia.' 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handler untuk gambar
async function handleImageRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fetch from network
    const response = await fetch(request);
    
    // Cache the response
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Return placeholder image if offline
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
        <rect width="100%" height="100%" fill="#18181b"/>
        <text x="50%" y="50%" fill="#ff5c00" font-size="20" text-anchor="middle">📱 Offline</text>
      </svg>`,
      {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// Handler untuk static assets
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // For navigation requests, try network first
  if (request.mode === 'navigate') {
    try {
      const response = await fetch(request);
      cache.put(request, response.clone());
      return response;
    } catch (error) {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      // Fallback to index.html for SPA
      return cache.match('/');
    }
  }
  
  // For other requests, try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Fetch from network and cache
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

// Background sync untuk offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-watchlist') {
    event.waitUntil(syncWatchlist());
  } else if (event.tag === 'sync-comments') {
    event.waitUntil(syncComments());
  }
});

async function syncWatchlist() {
  console.log('🔄 Syncing watchlist...');
  // Implementasi sync disini
}

async function syncComments() {
  console.log('🔄 Syncing comments...');
  // Implementasi sync disini
}

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'Ada film baru!',
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🎬</text></svg>',
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="80" font-size="80">🎬</text></svg>',
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'ReviewFilm21', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});

console.log('🚀 Service Worker ReviewFilm21 loaded');
