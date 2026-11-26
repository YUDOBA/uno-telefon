// Dapai service worker
// Uygulama açılırken önbellekteki bekleme ekranını gösterir; sunucu uyanınca asıl sayfaya geçer.
// Oyun dosyaları önbelleğe alınmaz, böylece her güncelleme hemen gelir.
var CACHE = "yd-boot-v93";
var BOOT = ["/boot.html", "/icon.svg"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BOOT); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { if (k !== CACHE) return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === "navigate" && url.search.indexOf("live=") < 0) {
    e.respondWith(caches.match("/boot.html").then(function (c) { return c || fetch(e.request); }));
  }
});
