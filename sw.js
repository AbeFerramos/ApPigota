// Service worker para La Pigota PWA.
// Cambia la versión al publicar cambios en los recursos precargados.
const CACHE_NAME = 'lapigota-v12';
const APP_ROOT = '/ApPigota/';
const urlsToCache = [
    APP_ROOT,
    `${APP_ROOT}index.html`,
    `${APP_ROOT}css/style.css`,
    `${APP_ROOT}manifest.json`,
    `${APP_ROOT}img/logoPi.jpeg`,
    `${APP_ROOT}img/app-icon-10anys-180.png`,
    `${APP_ROOT}img/app-icon-10anys-192.png`,
    `${APP_ROOT}img/app-icon-10anys-512.png`,
    `${APP_ROOT}img/app-icon-10anys-maskable-512.png`,
    `${APP_ROOT}img/fondo-pigota.jpeg`,
    `${APP_ROOT}js/script.js`
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => Promise.all(
                cacheNames
                    .filter(cacheName => cacheName.startsWith('lapigota-') && cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // No interceptar APIs, recursos externos ni peticiones que no sean GET.
    if (request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(APP_ROOT)) {
        return;
    }

    // Consultar la versión publicada en cada navegación y recurso de la app.
    // Si no hay conexión, servir la última copia guardada.
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseCopy));
                }
                return response;
            })
            .catch(async () => {
                const cached = await caches.match(request);
                if (cached) return cached;

                if (request.mode === 'navigate') {
                    return (await caches.match(`${APP_ROOT}index.html`)) || Response.error();
                }

                return Response.error();
            })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    if (event.action === 'close') return;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                for (const client of clientList) {
                    if ('focus' in client) return client.focus();
                }
                if (self.clients.openWindow) return self.clients.openWindow(APP_ROOT);
                return undefined;
            })
    );
});
