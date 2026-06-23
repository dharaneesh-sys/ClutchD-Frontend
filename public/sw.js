const CACHE_NAME = "clutchd-v1";
const STATIC_ASSETS = ["/", "/favicon.svg"];

// Only cache same-origin GET requests, skip third-party (tiles, APIs, etc.)
function shouldCache(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  return url.origin === self.location.origin;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  if (!shouldCache(event.request)) return;

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
        const cached = await caches.match(event.request);
        return cached ?? new Response("", { status: 504 });
      }
    })()
  );
});
