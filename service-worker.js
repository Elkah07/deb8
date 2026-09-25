const CACHE_NAME = 'deb8-v33-click-bridge';

const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo-deb8-v3.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(async cache => {
        for (const url of CORE) {
          try {
            const response = await fetch(url, {cache:'reload'});
            if (response.ok && response.status !== 206) {
              await cache.put(url, response);
            }
          } catch (_) {}
        }
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Range requests. Cache API cannot store partial 206 responses.
  if (event.request.headers.has('range')) return;

  const dynamic =
    event.request.mode === 'navigate' ||
    /\.(?:js|css|json|webmanifest)$/i.test(url.pathname);

  if (dynamic) {
    event.respondWith(
      fetch(event.request).then(async response => {
        if (response.ok && response.status !== 206) {
          try {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request, response.clone());
          } catch (_) {}
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
