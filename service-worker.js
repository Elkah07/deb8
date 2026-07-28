const CACHE_NAME = 'deb8-solo-launch-v13';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo-deb8-v3.png',
  './assets/icons/icon-v2-192.png',
  './assets/icons/icon-v2-512.png',
  './assets/icons/icon-maskable-v2-512.png',
  './assets/icons/apple-touch-icon-v2.png',
  './assets/icons/favicon-v2-32.png'
  ,'./css/screens.css'
  ,'./js/00-question-bases.js'
  ,'./js/02-core-state-navigation.js'
  ,'./js/04-game-debate-duel-tf.js'
  ,'./js/06-multiplayer-debate-duel-tf.js'
  ,'./js/07-vocal-proximity-teams.js'
  ,'./js/09-firebase-online.js'
  ,'./js/11-audio-ambience.js'
  ,'./js/12-android-back-navigation.js'
  ,'./assets/sounds/tap.ogg'
  ,'./assets/sounds/start.ogg'
  ,'./assets/sounds/next.ogg'
  ,'./assets/sounds/vote.ogg'
  ,'./assets/sounds/countdown.ogg'
  ,'./assets/sounds/reveal.ogg'
  ,'./assets/sounds/win.ogg'
  ,'./assets/sounds/lose.ogg'
  ,'./data/true_false/questions.json'
  ,'./data/imposteur/pairs.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const requestUrl = new URL(event.request.url);
  const isFreshFirst =
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('/index.html') ||
    requestUrl.pathname.endsWith('/manifest.webmanifest') ||
    requestUrl.pathname.endsWith('/service-worker.js');

  if (isFreshFirst) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached =>
      cached || fetch(event.request).then(response => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
    )
  );
});
