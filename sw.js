const CACHE_NAME = 'saelogy-cache-v1';
// List of all local assets that should be cached.
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/renderers.js',
  '/domElements.js',
  '/state.js',
  '/webhooks.js',
  '/data.js',
  '/toasts.js',
  '/constants.js',
  '/modals.js',
  '/utils.js'
];

// Install event: Caches all the core assets of the application.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching assets');
        // Add assets, but ignore failures for individual assets if any occur.
        return Promise.all(
          ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          }))
        );
      })
  );
});

// Activate event: Cleans up old caches to save space.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event: Intercepts network requests and serves from cache if available.
self.addEventListener('fetch', event => {
  // We only want to cache GET requests for our own assets.
  if (event.request.method !== 'GET') {
    return;
  }
  
  const url = new URL(event.request.url);

  // Do not cache external resources (e.g., Google Fonts, Discord images, CDNs).
  // Only cache requests for our own origin.
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Use a stale-while-revalidate strategy for our assets.
  // This serves content from cache immediately for speed, then updates the cache
  // in the background with a fresh version from the network for the next visit.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Check if we received a valid response
          if (networkResponse && networkResponse.status === 200) {
             cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });

        // Return the cached response if it exists, otherwise wait for the network response.
        return response || fetchPromise;
      });
    })
  );
});
