const CACHE_NAME = "clutchd-v1";
const STATIC_ASSETS = ["/", "/favicon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        return response;
      } catch {
        return caches.match(event.request);
      }
    })()
  );
});
