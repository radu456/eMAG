/* Service Worker pentru eMAG Calc â v1 */
const CACHE_NAME = 'emag-calc-v1';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
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

// Network-first pentru navigaČii (pagini), cu fallback la cache apoi offline.html
async function handleNavigation(request) {
  try {
    const netResponse = await fetch(request);
    // cache noua versiune in background
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, netResponse.clone());
    return netResponse;
  } catch (err) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    return cached || cache.match('./offline.html');
  }
}

// Stale-while-revalidate pentru resurse statice GET
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

  // TrateazÄ navigaČiile (document)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // AceeaČi origine: static SWR
  if (url.origin === self.location.origin) {
    event.respondWith(handleStatic(request));
    return;
  }

  // Alte origini: ĂŽncearcÄ reČea, apoi cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
