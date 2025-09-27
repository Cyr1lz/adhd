const CACHE_NAME = "adhd-helper-v3"; // bump version when you update
const urlsToCache = [
  "./", // root
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// Install + cache
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // activate immediately
});

// Activate + clear old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim(); // control open tabs
});

// Fetch
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    // HTML navigation → network first, fallback to cached index.html
    event.respondWith(
      fetch(event.request).catch(() => caches.match("./index.html"))
    );
  } else {
    // Static assets → cache first
    event.respondWith(
      caches.match(event.request).then(res => res || fetch(event.request))
    );
  }
});