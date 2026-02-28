const CACHE_NAME = "bookmarks-suite-v3";
const ASSETS = [
  "./",
  "./index.html",
  "./css/common.css",
  "./css/components.css",
  "./css/bookmarks.css",
  "./css/efficiency.css",
  "./data/bookmarks-data.js",
  "./dist/bookmarks.js",
  "./dist/efficiency.js",
  "./Efficiency%20Analysis/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
