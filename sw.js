/**
 * Service Worker for Fuel Analytics Website
 * Provides offline functionality, caching, and performance optimization
 */

const CACHE_NAME = 'fuel-analytics-v1';
const STATIC_CACHE = 'fuel-analytics-static-v1';
const DYNAMIC_CACHE = 'fuel-analytics-dynamic-v1';

// Files to cache immediately
const STATIC_FILES = [
    '/',
    '/dashboard.html',
    '/dashboard.css',
    '/script.js',
    '/styles.css',
    '/index.html',
    '/extensions-config.js',
    '/supabase-client.js',
    '/advanced-calculations.js',
    '/visual-analytics.js',
    '/data-integration.js',
    '/renovation-client.js',
    '/utils/stateManager.js',
    '/utils/errorHandler.js',
          '/utils/logger-fixed.js',
    '/utils/validator.js',
    '/utils/analyticsEngine.js',
    '/utils/reportingEngine.js',
    '/utils/realTimeDataService.js',
    '/utils/cacheManager.js',
    '/utils/memoryManager.js',
    '/utils/databaseSchema.js',
    '/utils/dataIntegrationPlan.js',
    '/utils/sampleDataGenerator.js',
    '/utils/performanceOptimizer.js',
    '/utils/offlineManager.js',
    '/utils/accessibility.js',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('🚀 Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('📦 Caching static files...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('✅ Static files cached successfully');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('❌ Failed to cache static files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('🔄 Service Worker activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Service Worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle different types of requests
    if (isStaticFile(request.url)) {
        // Static files - cache first strategy
        event.respondWith(handleStaticFile(request));
    } else if (isAPIRequest(request.url)) {
        // API requests - network first with cache fallback
        event.respondWith(handleAPIRequest(request));
    } else {
        // Other requests - network first
        event.respondWith(handleNetworkFirst(request));
    }
});

// Check if request is for a static file
function isStaticFile(url) {
    const staticExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.woff', '.woff2'];
    return staticExtensions.some(ext => url.includes(ext)) || 
           url.includes('fonts.googleapis.com') ||
           url.includes('cdn.jsdelivr.net');
}

// Check if request is for an API
function isAPIRequest(url) {
    return url.includes('/api/') || 
           url.includes('supabase.co') ||
           url.includes('rest/v1/');
}

// Handle static files - cache first strategy
async function handleStaticFile(request) {
    try {
        // Try cache first
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        // Cache the response for future use
        if (networkResponse.ok) {
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling static file:', error);
        
        // Return offline page if available
        const offlineResponse = await caches.match('/offline.html');
        if (offlineResponse) {
            return offlineResponse;
        }
        
        // Return a simple offline message
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Handle API requests - network first with cache fallback
async function handleAPIRequest(request) {
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('Network failed, trying cache for API request:', error);
        
        // Try cache as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return error response
        return new Response('API Unavailable - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Handle other requests - network first
async function handleNetworkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        console.log('Network failed for request:', error);
        
        // Try cache as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline message
        return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
        });
    }
}

// Background sync for offline data
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(syncData());
    }
});

// Sync data when connection is restored
async function syncData() {
    try {
        // Get offline data from IndexedDB
        const offlineData = await getOfflineData();
        
        if (offlineData && offlineData.length > 0) {
            console.log('📤 Syncing offline data...');
            
            // Send data to server
            for (const data of offlineData) {
                await sendDataToServer(data);
            }
            
            // Clear offline data after successful sync
            await clearOfflineData();
            console.log('✅ Offline data synced successfully');
        }
    } catch (error) {
        console.error('❌ Failed to sync offline data:', error);
    }
}

// Get offline data from IndexedDB
async function getOfflineData() {
    // This would be implemented with your specific data structure
    return [];
}

// Send data to server
async function sendDataToServer(data) {
    // This would be implemented with your specific API endpoints
    return fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}

// Clear offline data
async function clearOfflineData() {
    // This would be implemented with your specific data structure
    return Promise.resolve();
}

// Push notifications
self.addEventListener('push', event => {
    console.log('📱 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New data available',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Dashboard',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    // Only show notification if permission is explicitly granted
    if (Notification && Notification.permission === 'granted') {
        event.waitUntil(
            self.registration.showNotification('Fuel Analytics', options)
        );
    } else {
        // Skip showing system notification to avoid prompting users unexpectedly
        console.log('🔕 Skipping push notification (permission not granted)');
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification clicked:', event.action);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/dashboard.html')
        );
    }
});

// Handle message events from main thread
self.addEventListener('message', event => {
    console.log('📨 Message received in service worker:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(STATIC_CACHE)
                .then(cache => cache.addAll(event.data.urls))
        );
    }
});

console.log('🔧 Service Worker loaded successfully');
