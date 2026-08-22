// Asif Rana Library — service worker
// Caches the app shell so it opens even with a spotty connection.
// Note: service workers only activate when served over HTTPS (or localhost) —
// opening the HTML file directly (file://) will skip this silently, which is
// expected and handled by the registration code in the app itself.

const CACHE_NAME = 'arl-cache-v1';
const APP_SHELL = [
  './asif-rana-library-connected-demo.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for Supabase API calls (always want fresh data when online),
// cache-first for the app shell itself (fast load, works offline).
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('supabase.co')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
