/* ResqHub – service worker (offline režim)
   Při větší změně hubu zvyš číslo verze, ať se stará cache smaže. */
const VERSION = 'resqhub-v6';
const SHELL = [
  './', './index.html', './admin.html', './style.css', './common.js', './lock.js', './qrcode.js', './apps.js',
  './manifest.json', './icons/icon-192.png', './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Síť má přednost (kvůli aktualizacím), při výpadku nebo pomalé síti se použije cache.
function networkFirst(request) {
  const url = new URL(request.url);
  const fresh = url.pathname.endsWith('/apps.js')
    ? fetch(url.href, { cache: 'no-cache' })
    : fetch(request);

  const network = fresh.then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(request, copy));
    }
    return res;
  });

  network.catch(() => {});

  const timeout = new Promise((resolve) => setTimeout(resolve, 3500));
  return Promise.race([network, timeout.then(() => caches.match(request, { ignoreSearch: true }))])
    .then((res) => res || network)
    .catch(() => caches.match(request, { ignoreSearch: true }))
    .then((res) => res || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return; // GitHub API, CDN apod. jdou mimo
  e.respondWith(networkFirst(req));
});

// Hub pošle seznam aplikací – stáhnou se dopředu, aby fungovaly offline.
self.addEventListener('message', (e) => {
  if (!e.data || e.data.type !== 'precache' || !Array.isArray(e.data.urls)) return;
  e.waitUntil(caches.open(VERSION).then((c) => Promise.all(e.data.urls.map(async (u) => {
    try {
      const url = new URL(u, self.registration.scope).href;
      if (await c.match(url)) return;
      const res = await fetch(url);
      if (res.ok) await c.put(url, res);
    } catch (_) {}
  }))));
});
