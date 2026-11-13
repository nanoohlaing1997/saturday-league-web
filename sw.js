var CACHE = "saturday-league-v35";
var SHELL = [
  "./",
  "./index.html",
  "./firebase-config.js",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* The app itself is network-first, so a new build always wins when there is a
 * connection and the cache is only a fallback for the pitch. Everything else
 * (icons, fonts, the Firebase SDK) is cache-first, since those rarely change. */
self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  var url = new URL(event.request.url);
  var isApp = event.request.mode === "navigate" ||
              url.pathname.endsWith("/") ||
              url.pathname.endsWith("/index.html") ||
              url.pathname.endsWith("/firebase-config.js");

  if (isApp) {
    event.respondWith(
      fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(event.request, copy); });
        return response;
      }).catch(function () {
        return caches.match(event.request).then(function (hit) {
          return hit || caches.match("./index.html");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (hit) {
      if (hit) return hit;
      return fetch(event.request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          try { cache.put(event.request, copy); } catch (e) { /* opaque or unsupported */ }
        });
        return response;
      });
    })
  );
});

/* Full time, pushed from the server. The referee's phone books the moment the
 * clock starts, so this arrives even with every phone locked. */
self.addEventListener("push", function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { /* not ours */ }
  var payload = data.data || data;        // FCM nests a data-only message

  event.waitUntil(self.registration.showNotification(payload.title || "Full time", {
    body: payload.body || "The match has finished.",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: "full-time-" + (payload.matchId || ""),   // one notification per match, not a pile
    renotify: true,
    vibrate: [120, 60, 120, 60, 240],
    data: payload
  }));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windows) {
      for (var i = 0; i < windows.length; i++) {
        if (windows[i].url.indexOf(self.registration.scope) === 0) return windows[i].focus();
      }
      return self.clients.openWindow("./index.html");
    })
  );
});
