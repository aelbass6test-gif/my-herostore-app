// public/serviceWorker.js

const CACHE_NAME = 'v1';
const assets = [
  '/',
  '/index.html',
  // Other assets like CSS, JS, images should be added here.
  // Since Vite produces hashed assets, this is difficult to do manually.
  // A better approach is to use a build tool plugin (like vite-plugin-pwa)
  // that automatically generates this list.
  // For this manual implementation, we'll rely on caching during the 'fetch' event.
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(assets);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  // Remove old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cache => cache !== CACHE_NAME).map(cache => caches.delete(cache))
      );
    })
  );
});

// Fetch event (cache-first strategy)
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy to get the latest page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // If the resource is in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }

        // If it's not in the cache, fetch it from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            
            // Clone the response and add it to the cache.
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          }
        ).catch(error => {
          // If the network fails, you could return a fallback page here.
          console.error('Fetch failed; returning offline page instead.', error);
          // e.g., return caches.match('/offline.html');
        });
      })
  );
});