// Service Worker for GMM 001 PWA
const CACHE_NAME = 'gmm-001-v1';
const urlsToCache = [
    '/',
    '/manifest.json',
];

// Install event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - Optimized Strategy
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. API Requests -> Network First (Fresh data)
    // Jangan cache endpoint /api/ kecuali di-handle spesifik logic lain
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Optional: return cached API response if available offline
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 2. Static Assets (JS, CSS, Images, Fonts) & Pages -> Stale-While-Revalidate (FAST)
    // Serve from cache immediately, then update cache in background
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Fetch from network to update cache (in background)
                const fetchPromise = fetch(event.request).then((networkResponse) => {
                    // Clone and update cache
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                    return networkResponse;
                }).catch((err) => {
                    // Network failed? It's fine, we served cached content
                    console.log('Background fetch failed:', err);
                });

                // Return cached response immediately if available, otherwise wait for network
                return cachedResponse || fetchPromise;
            })
    );
});

// Push notification event
self.addEventListener('push', (event) => {
    let data = {};

    if (event.data) {
        data = event.data.json();
    }

    const title = data.title || 'GMM 001';
    const options = {
        body: data.body || 'Anda memiliki notifikasi baru',
        icon: '/images/icons/icon-192.png',
        badge: '/images/icons/icon-192.png',
        vibrate: [200, 100, 200],
        tag: data.tag || 'default',
        data: {
            url: data.url || '/',
            ...data
        },
        actions: data.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((windowClients) => {
                // Check if there's already a window open
                for (let client of windowClients) {
                    if (client.url === urlToOpen && 'focus' in client) {
                        return client.focus();
                    }
                }
                // If no window is open, open a new one
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
    );
});
