const CACHE_NAME = 'emag-calc-v1';
const APP_SHELL = [
  '/eMAG/index.html',
  '/eMAG/manifest.json',
  '/eMAG/offline.html',
  '/eMAG/icons/icon-192.png',
  '/eMAG/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

async function handleNavigation(request) {
  try {
    const netResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, netResponse.clone());
    return netResponse;
  } catch (err) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    return cached || cache.match('/eMAG/offline.html');
  }
}

async function handleStatic(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((netResponse) => {
      cache.put(request, netResponse.clone());
      return netResponse;
    })
    .catch(() => null);
  return cached || fetchPromise || fetch(request);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(handleStatic(request));
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
