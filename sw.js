const CACHE_NAME = 'reviewfilm21-v3';
const CACHE_URLS = ['/', '/index.html', '/manifest.json', '/sitemap.xml', '/robots.txt'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (event.request.method !== 'GET' ||
      url.includes('/api/') ||
      url.includes('api.themoviedb.org') ||
      url.includes('vidsrc') ||
      url.includes('mxdrop') ||
      url.includes('google.com') ||
      url.includes('docs.google.com')) return;

  event.respondWith(
    fetch(event.request).then(response => {
      if (response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
