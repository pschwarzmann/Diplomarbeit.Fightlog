// frontend/sw.js
// Service Worker für PWA Offline-Fähigkeit

const CACHE_NAME = 'fightlog-v2';
const OFFLINE_PAGE = './offline.html';

// Assets relativ zu sw.js (frontend-Ordner)
const STATIC_ASSETS = [
    './',
    './index.html',
    './main.js',
    './styles/main.css',
    './offline.html'
];

// Install Event - Cache statische Assets (einzelne Fehler brechen Install nicht ab)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(STATIC_ASSETS.map((url) => cache.add(url))).then(() => cache);
        })
    );
    self.skipWaiting();
});

// Activate Event - Alte Caches löschen
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

// Fetch Event - Network First, dann Cache
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // API-Calls immer online
    if (url.pathname.includes('/api/') || url.pathname.includes('/backend/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ success: false, error: 'Offline - Bitte verbinden Sie sich mit dem Internet' }),
                    { headers: { 'Content-Type': 'application/json' } }
                );
            })
        );
        return;
    }
    
    // HTML-Seiten: Network First, dann Cache
    if (request.headers.get('accept').includes('text/html')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache erfolgreiche Responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: Versuche Cache, sonst Offline-Page
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match(OFFLINE_PAGE);
                    });
                })
        );
        return;
    }
    
    // Statische Assets: Cache First, dann Network
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(request).then((response) => {
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            });
        })
    );
});
