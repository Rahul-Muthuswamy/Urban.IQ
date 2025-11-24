const CACHE_NAME = "urban-iq-v2";
const urlsToCache = [
  "/",
  "/login",
  "/signup",
  "/home",
  "/assets/5_remove_bg.png",
  "/assets/1_rem_bg.png",
  "/assets/2_remove_bg.png",
  "/assets/3_remove_bg.png",
  "/index.html",
  "/manifest.json",
];

// Install event - cache resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching files");
        return cache.addAll(urlsToCache).catch((err) => {
          console.log("Service Worker: Cache addAll failed", err);
          // Cache what we can, don't fail installation
          return Promise.allSettled(
            urlsToCache.map((url) =>
              cache.add(url).catch((e) => console.log(`Failed to cache ${url}`, e))
            )
          );
        });
      })
      .then(() => {
        // Force activation of new service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          // Clone the response for caching
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // If network fails and it's a navigation request, return offline page
          if (event.request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});


