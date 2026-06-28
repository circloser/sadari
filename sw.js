// SADARI service worker — 설치 가능 + 오프라인 캐시
const CACHE = "sadari-v1";
const SHELL = ["/", "/index.html", "/manifest.json", "/icon-192.png", "/icon-512.png", "/og.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;                          // 외부(광고/카카오/GA)는 그대로
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/r/")) return; // 동적 경로는 항상 네트워크
  if (req.mode === "navigate") {                                       // HTML 문서: 네트워크 우선(최신 보장)
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(r => r || caches.match("/")))
    );
    return;
  }
  // 정적 자산: 캐시 우선 + 백그라운드 갱신
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; }))
  );
});
