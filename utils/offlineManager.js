/**
 * Offline Manager
 * Comprehensive offline support with service worker and data synchronization
 */

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.offlineQueue = [];
    this.syncQueue = [];
    this.offlineData = new Map();
    this.serviceWorker = null;
    this.registration = null;
    
    this.initialize();
  }

  /**
   * Initialize offline manager
   */
  async initialize() {
    this.setupEventListeners();
    await this.registerServiceWorker();
    this.setupOfflineStorage();
    this.loadOfflineData();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Online/offline events
    window.addEventListener('online', () => {
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.handleOffline();
    });

    // Before unload - save current state
    window.addEventListener('beforeunload', () => {
      this.saveOfflineData();
    });

    // Visibility change - sync when page becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        this.serviceWorker = this.registration.active;
        
        // Listen for service worker updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.showUpdateNotification();
            }
          });
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          this.serviceWorker = navigator.serviceWorker.controller;
        });

        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    if (window.errorHandler) {
      window.errorHandler.showNotification(
        'New version available. Click to update.',
        'info',
        'Update Available'
      );
    }

    // Add update button to page
    const updateBtn = document.createElement('button');
    updateBtn.textContent = 'Update Available';
    updateBtn.className = 'update-notification';
    updateBtn.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      background: #20B2AA;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      z-index: 10000;
    `;
    
    updateBtn.addEventListener('click', () => {
      window.location.reload();
    });

    document.body.appendChild(updateBtn);
  }

  /**
   * Setup offline storage
   */
  setupOfflineStorage() {
    // Create offline storage in IndexedDB
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB
   */
  initIndexedDB() {
    const request = indexedDB.open('FuelFluxOffline', 1);

    request.onerror = () => {
      console.error('Failed to open IndexedDB');
    };

    request.onsuccess = (event) => {
      this.db = event.target.result;
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores
      if (!db.objectStoreNames.contains('offlineData')) {
        const store = db.createObjectStore('offlineData', { keyPath: 'id' });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('syncQueue')) {
        const store = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
      }
    };
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    
    if (window.logger) {
      window.logger.info('Connection restored');
    }

    if (window.errorHandler) {
      window.errorHandler.showNotification(
        'Connection restored. Syncing offline data...',
        'success',
        'Online'
      );
    }

    // Clear offline indicator
    this.hideOfflineIndicator();

    // Sync offline data
    this.syncOfflineData();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    
    if (window.logger) {
      window.logger.warn('Connection lost - entering offline mode');
    }

    if (window.errorHandler) {
      window.errorHandler.showNotification(
        'Connection lost. Working in offline mode.',
        'warning',
        'Offline'
      );
    }

    // Show offline indicator
    this.showOfflineIndicator();
  }

  /**
   * Show offline indicator
   */
  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = `
        <div class="offline-content">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          <span>Offline Mode</span>
        </div>
      `;
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff9800;
        color: white;
        padding: 8px;
        text-align: center;
        z-index: 10000;
        font-size: 14px;
      `;
      
      const content = indicator.querySelector('.offline-content');
      content.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      `;
      
      document.body.appendChild(indicator);
    }
    
    indicator.style.display = 'block';
  }

  /**
   * Hide offline indicator
   */
  hideOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }

  /**
   * Store data for offline use
   * @param {string} key - Data key
   * @param {any} data - Data to store
   * @param {string} type - Data type
   */
  storeOfflineData(key, data, type = 'general') {
    if (!this.isOnline) {
      const offlineItem = {
        id: key,
        type,
        data,
        timestamp: Date.now(),
        version: Date.now()
      };

      this.offlineData.set(key, offlineItem);

      // Store in IndexedDB
      if (this.db) {
        const transaction = this.db.transaction(['offlineData'], 'readwrite');
        const store = transaction.objectStore('offlineData');
        store.put(offlineItem);
      }

      if (window.logger) {
        window.logger.info('Data stored for offline use', { key, type });
      }
    }
  }

  /**
   * Get offline data
   * @param {string} key - Data key
   * @returns {any} Offline data
   */
  getOfflineData(key) {
    const item = this.offlineData.get(key);
    return item ? item.data : null;
  }

  /**
   * Load offline data from storage
   */
  loadOfflineData() {
    if (this.db) {
      const transaction = this.db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.getAll();

      request.onsuccess = () => {
        request.result.forEach(item => {
          this.offlineData.set(item.id, item);
        });

        if (window.logger) {
          window.logger.info('Offline data loaded', { count: request.result.length });
        }
      };
    }
  }

  /**
   * Save offline data to storage
   */
  saveOfflineData() {
    if (this.db && this.offlineData.size > 0) {
      const transaction = this.db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');

      this.offlineData.forEach((item, key) => {
        store.put(item);
      });
    }
  }

  /**
   * Queue operation for offline sync
   * @param {string} type - Operation type
   * @param {any} data - Operation data
   * @param {number} priority - Sync priority
   */
  queueForSync(type, data, priority = 1) {
    const syncItem = {
      type,
      data,
      priority,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3
    };

    this.syncQueue.push(syncItem);

    // Store in IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.add(syncItem);
    }

    if (window.logger) {
      window.logger.info('Operation queued for sync', { type, priority });
    }
  }

  /**
   * Sync offline data when connection is restored
   */
  async syncOfflineData() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    if (window.logger) {
      window.logger.info('Starting offline data sync', { queueLength: this.syncQueue.length });
    }

    // Sort queue by priority
    this.syncQueue.sort((a, b) => b.priority - a.priority);

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const item of this.syncQueue) {
      try {
        await this.performSync(item);
        successfulSyncs.push(item);
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount >= item.maxRetries) {
          failedSyncs.push(item);
        }
        
        if (window.logger) {
          window.logger.error('Sync failed', { type: item.type, retryCount: item.retryCount }, error);
        }
      }
    }

    // Remove successful syncs from queue
    successfulSyncs.forEach(item => {
      const index = this.syncQueue.indexOf(item);
      if (index > -1) {
        this.syncQueue.splice(index, 1);
      }
    });

    // Remove failed syncs that exceeded retry limit
    failedSyncs.forEach(item => {
      const index = this.syncQueue.indexOf(item);
      if (index > -1) {
        this.syncQueue.splice(index, 1);
      }
    });

    if (window.logger) {
      window.logger.info('Offline sync completed', {
        successful: successfulSyncs.length,
        failed: failedSyncs.length,
        remaining: this.syncQueue.length
      });
    }

    // Update sync queue in IndexedDB
    this.updateSyncQueue();
  }

  /**
   * Perform individual sync operation
   * @param {Object} item - Sync item
   */
  async performSync(item) {
    switch (item.type) {
      case 'form_submit':
        await this.syncFormSubmit(item.data);
        break;
      case 'data_update':
        await this.syncDataUpdate(item.data);
        break;
      case 'file_upload':
        await this.syncFileUpload(item.data);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  /**
   * Sync form submission
   * @param {Object} data - Form data
   */
  async syncFormSubmit(data) {
    // Implement form sync logic
    console.log('Syncing form submission:', data);
  }

  /**
   * Sync data update
   * @param {Object} data - Data update
   */
  async syncDataUpdate(data) {
    // Implement data sync logic
    console.log('Syncing data update:', data);
  }

  /**
   * Sync file upload
   * @param {Object} data - File upload data
   */
  async syncFileUpload(data) {
    // Implement file upload sync logic
    console.log('Syncing file upload:', data);
  }

  /**
   * Update sync queue in IndexedDB
   */
  updateSyncQueue() {
    if (this.db) {
      // Clear existing queue
      const transaction = this.db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      store.clear();

      // Add remaining items
      this.syncQueue.forEach(item => {
        store.add(item);
      });
    }
  }

  /**
   * Create offline-capable fetch
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @returns {Promise} Fetch response
   */
  async offlineFetch(url, options = {}) {
    try {
      // Try online fetch first
      if (this.isOnline) {
        return await fetch(url, options);
      }
    } catch (error) {
      // Fall through to offline handling
    }

    // Handle offline scenario
    return this.handleOfflineFetch(url, options);
  }

  /**
   * Handle offline fetch
   * @param {string} url - URL
   * @param {Object} options - Fetch options
   * @returns {Promise} Mock response or error
   */
  async handleOfflineFetch(url, options) {
    // Check if we have cached data
    const cachedData = this.getOfflineData(url);
    
    if (cachedData) {
      return new Response(JSON.stringify(cachedData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Queue for sync if it's a write operation
    if (options.method && options.method !== 'GET') {
      this.queueForSync('api_call', {
        url,
        options,
        timestamp: Date.now()
      });

      return new Response(JSON.stringify({
        message: 'Operation queued for sync when online'
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return error for GET requests without cached data
    throw new Error('No cached data available offline');
  }

  /**
   * Get offline status
   * @returns {Object} Offline status information
   */
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      offlineDataCount: this.offlineData.size,
      syncQueueLength: this.syncQueue.length,
      lastSync: this.lastSyncTimestamp
    };
  }

  /**
   * Clear offline data
   * @param {string} type - Optional data type to clear
   */
  clearOfflineData(type = null) {
    if (type) {
      // Clear specific type
      const keysToDelete = [];
      this.offlineData.forEach((item, key) => {
        if (item.type === type) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.offlineData.delete(key));
    } else {
      // Clear all data
      this.offlineData.clear();
    }

    // Clear from IndexedDB
    if (this.db) {
      const transaction = this.db.transaction(['offlineData', 'syncQueue'], 'readwrite');
      
      if (type) {
        const store = transaction.objectStore('offlineData');
        const index = store.index('type');
        const request = index.getAll(type);
        request.onsuccess = () => {
          request.result.forEach(item => {
            store.delete(item.id);
          });
        };
      } else {
        transaction.objectStore('offlineData').clear();
        transaction.objectStore('syncQueue').clear();
      }
    }

    if (window.logger) {
      window.logger.info('Offline data cleared', { type: type || 'all' });
    }
  }
}

// Global offline manager instance
window.offlineManager = new OfflineManager();

// Export for module systems (if needed)
// export default window.offlineManager;
