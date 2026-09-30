/* Sahakar Setu service worker: app-shell precache, runtime page cache (network-first), static cache-first,
   lesson media cache, offline fallback, and Background Sync hand-off to the page's Dexie outbox. */
const VERSION = "v1";
const STATIC = `ss-static-${VERSION}`;
const PAGES = "ss-pages-v1";
const MEDIA = `ss-media-${VERSION}`;
const PRECACHE = ["/offline.html", "/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];
const CACHED_AREAS = /^\/(en|hi|mr)(\/(learn|faculty|programmes|verify|jobs)(\/.*)?)?\/?$/;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![STATIC, PAGES, MEDIA].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** Pages are stored under their path (search stripped); RSC payloads under path + "?__rsc". */
function pageKey(url, isRsc) {
  return new Request(`${url.origin}${url.pathname}${isRsc ? "?__rsc" : ""}`);
}

async function networkFirstPage(req, url, isRsc) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok && res.status === 200 && !res.redirected) cache.put(pageKey(url, isRsc), res.clone());
    return res;
  } catch {
    const hit = await cache.match(pageKey(url, isRsc), { ignoreVary: true });
    if (hit) return hit;
    if (isRsc) return Response.error();
    return (await caches.match("/offline.html")) || Response.error();
  }
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/image")) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) caches.open(STATIC).then((c) => c.put(req, res.clone()));
            return res;
          }),
      ),
    );
    return;
  }

  if (/^\/api\/v1\/lessons\/[^/]+\/file/.test(url.pathname) || /^\/api\/v1\/learn\/courses\/[^/]+\/offline-bundle/.test(url.pathname)) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) caches.open(MEDIA).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || Response.error())),
    );
    return;
  }
  if (url.pathname.startsWith("/api/")) return;

  const isRsc = req.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (req.mode === "navigate" || isRsc) {
    if (CACHED_AREAS.test(url.pathname)) e.respondWith(networkFirstPage(req, url, isRsc));
    else if (req.mode === "navigate") e.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
  }
});

/* Background Sync: wake a client so it replays the Dexie outbox (records carry clientIds, so replays are safe). */
self.addEventListener("sync", (e) => {
  if (e.tag !== "outbox") return;
  e.waitUntil(
    self.clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clients) => {
      clients.forEach((c) => c.postMessage({ type: "flush-outbox" }));
    }),
  );
});
