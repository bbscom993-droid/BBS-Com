const CACHE_NAME = 'bbs-portal-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching app shell...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Cleaning old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests and cross-origin tracking or chrome extensions
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle API Requests (Network-First, Cache Fallback)
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If successful response, save to cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[Service Worker] Offline fallback for API:', requestUrl.pathname);
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // If completely offline and not in cache, return custom JSON error
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'Anda sedang offline dan data ini belum tersimpan di cache.',
                isOffline: true
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }

  // Handle Static Assets (Stale-While-Revalidate/Cache-First)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          console.warn('[Service Worker] Failed to fetch static asset from network:', err);
          // Return cached response if offline fetch fails, otherwise propagate error
          if (cachedResponse) return cachedResponse;
          throw err;
        });

      // Return cached response instantly if available, otherwise wait for network fetch
      return cachedResponse || fetchPromise;
    })
  );
});
