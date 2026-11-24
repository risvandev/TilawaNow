const CACHE_NAME = "tilawanow-static-v2";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) =>
      name === "tilawanow-v1" || (name.startsWith("tilawanow-static-") && name !== CACHE_NAME)
    ).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => new Response(
      "You’re offline. Reconnect to continue reading on TilawaNow.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    )));
    return;
  }

  // Only content-addressed public assets are safe to reuse across sessions.
  if (!url.pathname.startsWith("/_next/static/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      await cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  })());
});
