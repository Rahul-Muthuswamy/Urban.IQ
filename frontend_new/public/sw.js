// Service Worker for Urban.IQ PWA
const CACHE_NAME = 'urban-iq-v1';
const STATIC_CACHE = 'urban-iq-static-v1';
const DYNAMIC_CACHE = 'urban-iq-dynamic-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/assets/7_remove_bg.png',
  '/assets/5_remove_bg.png',
  '/assets/1_rem_bg.png',
  '/assets/2_remove_bg.png',
  '/assets/3_remove_bg.png',
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /^\/api\/posts\//,
  /^\/api\/threads/,
  /^\/api\/user\//,
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('SW: Error during install:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image' || request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(apiNetworkFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network first strategy (for HTML)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    if (request.destination === 'document') {
      return caches.match('/') || new Response('Offline - Please check your connection', {
        status: 503,
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    throw error;
  }
}

// Cache first strategy (for images, fonts)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('SW: Failed to fetch resource:', request.url, error);
    throw error;
  }
}

// API Network first strategy
async function apiNetworkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || Promise.reject(error);
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch(() => {});
  
  return cachedResponse || fetchPromise;
}

console.log('SW: Service Worker loaded successfully');


