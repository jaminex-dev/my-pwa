const CACHE_NAME = 'pwa-offline-v2.5';
const urlsToCache = [
  './',
  './index.html',
  './panel.html',
  './test-sync.html',
  './test-conectividad.html',
  './diagnostico.html',
  './css/style.css',
  './js/config.js',
  './js/database.js',
  './js/ui.js',
  './js/app.js',
  './js/debug.js',
  './manifest.json',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/pouchdb@8.0.1/dist/pouchdb.min.js'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cachando archivos:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker instalado correctamente');
        return self.skipWaiting(); // Activar inmediatamente
      })
      .catch((error) => {
        console.error('❌ Error instalando Service Worker:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Eliminando cache viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado');
      return self.clients.claim(); // Controlar páginas inmediatamente
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Si está en cache, devolverlo
        if (cachedResponse) {
          console.log('📦 Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }

        // Si no está en cache, intentar fetch
        console.log('🌐 Fetch desde red:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // No cachear si la respuesta no es válida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonar respuesta para cachear
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Si falla el fetch y es una página, devolver index.html
            if (event.request.destination === 'document') {
              console.log('📱 Sirviendo index.html para navegación offline');
              return caches.match('./index.html');
            }
            
            // Para otros recursos, devolver respuesta vacía
            return new Response('', {
              status: 200,
              statusText: 'OK'
            });
          });
      })
  );
});
