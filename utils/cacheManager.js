/**
 * Cache Manager
 * Comprehensive caching system for data, API responses, and computed values
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.metadata = new Map();
    this.maxSize = 100;
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.storage = 'memory'; // 'memory', 'localStorage', 'sessionStorage'
    
    this.initialize();
  }

  /**
   * Initialize cache manager
   */
  initialize() {
    this.setupCleanupInterval();
    this.loadPersistedCache();
    this.setupStorageSync();
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {Object} options - Cache options
   */
  set(key, value, options = {}) {
    const {
      ttl = this.defaultTTL,
      tags = [],
      priority = 1,
      persist = false
    } = options;

    const entry = {
      key,
      value: this.serialize(value),
      timestamp: Date.now(),
      ttl,
      tags,
      priority,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Check cache size before adding
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, entry);
    this.metadata.set(key, {
      size: this.getSize(entry),
      tags,
      priority
    });

    // Persist if requested
    if (persist) {
      this.persistEntry(key, entry);
    }

    return entry;
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {any} Cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key);
      return null;
    }

    // Update access metadata
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return this.deserialize(entry.value);
  }

  /**
   * Check if key exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean} Whether key exists and is not expired
   */
  has(key) {
    const entry = this.cache.get(key);
    return entry && !this.isExpired(entry);
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.metadata.delete(key);
    this.removePersistedEntry(key);
  }

  /**
   * Clear all cache entries
   * @param {string[]} tags - Optional tags to filter by
   */
  clear(tags = []) {
    if (tags.length === 0) {
      this.cache.clear();
      this.metadata.clear();
      this.clearPersistedCache();
    } else {
      const keysToDelete = [];
      this.cache.forEach((entry, key) => {
        if (tags.some(tag => entry.tags.includes(tag))) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => this.delete(key));
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const now = Date.now();
    const stats = {
      size: this.cache.size,
      maxSize: this.maxSize,
      sizePercentage: (this.cache.size / this.maxSize) * 100,
      totalSize: 0,
      expiredEntries: 0,
      totalAccessCount: 0,
      averageAccessCount: 0,
      mostAccessed: [],
      leastAccessed: [],
      byTag: {},
      byPriority: {}
    };

    this.cache.forEach((entry, key) => {
      const metadata = this.metadata.get(key);
      
      // Size statistics
      stats.totalSize += metadata?.size || 0;
      
      // Expired entries
      if (this.isExpired(entry)) {
        stats.expiredEntries++;
      }
      
      // Access statistics
      stats.totalAccessCount += entry.accessCount;
      
      // Tag statistics
      entry.tags.forEach(tag => {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      });
      
      // Priority statistics
      const priority = entry.priority;
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
    });

    stats.averageAccessCount = stats.totalAccessCount / Math.max(this.cache.size, 1);
    
    // Get most/least accessed entries
    const sortedEntries = Array.from(this.cache.entries())
      .sort((a, b) => b[1].accessCount - a[1].accessCount);
    
    stats.mostAccessed = sortedEntries.slice(0, 5).map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed
    }));
    
    stats.leastAccessed = sortedEntries.slice(-5).reverse().map(([key, entry]) => ({
      key,
      accessCount: entry.accessCount,
      lastAccessed: entry.lastAccessed
    }));

    return stats;
  }

  /**
   * Cache function results
   * @param {Function} fn - Function to cache
   * @param {Object} options - Cache options
   * @returns {Function} Cached function
   */
  memoize(fn, options = {}) {
    const {
      ttl = this.defaultTTL,
      tags = [],
      priority = 1,
      keyGenerator = null
    } = options;

    return (...args) => {
      const key = keyGenerator ? keyGenerator(...args) : this.generateKey(fn.name, args);
      
      // Try to get from cache
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }

      // Execute function and cache result
      const result = fn(...args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.then(value => {
          this.set(key, value, { ttl, tags, priority });
          return value;
        });
      } else {
        this.set(key, result, { ttl, tags, priority });
        return result;
      }
    };
  }

  /**
   * Cache API responses
   * @param {string} url - API URL
   * @param {Object} options - Cache options
   * @returns {Promise} Cached API response
   */
  async cachedFetch(url, options = {}) {
    const {
      ttl = this.defaultTTL,
      tags = ['api'],
      priority = 1,
      forceRefresh = false
    } = options;

    const key = `api:${url}`;
    
    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
    }

    try {
      const response = await fetch(url);
      const data = await response.json();
      
      this.set(key, data, { ttl, tags, priority });
      return data;
    } catch (error) {
      // Fallback to cached data if available
      const cached = this.get(key);
      if (cached !== null) {
        return cached;
      }
      throw error;
    }
  }

  /**
   * Preload cache with data
   * @param {Object} data - Data to preload
   * @param {Object} options - Cache options
   */
  preload(data, options = {}) {
    const {
      tags = ['preloaded'],
      priority = 2,
      persist = true
    } = options;

    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value, { tags, priority, persist });
    });
  }

  /**
   * Invalidate cache entries by tags
   * @param {string[]} tags - Tags to invalidate
   */
  invalidateByTags(tags) {
    const keysToDelete = [];
    
    this.cache.forEach((entry, key) => {
      if (tags.some(tag => entry.tags.includes(tag))) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Setup cleanup interval
   */
  setupCleanupInterval() {
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 1000); // Clean up every minute
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpired() {
    const keysToDelete = [];
    
    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.delete(key));
  }

  /**
   * Evict least used entries
   */
  evictLeastUsed() {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => {
        // Sort by priority first, then by access count
        if (a[1].priority !== b[1].priority) {
          return a[1].priority - b[1].priority;
        }
        return a[1].accessCount - b[1].accessCount;
      });

    // Remove 10% of entries
    const toRemove = Math.max(1, Math.floor(this.cache.size * 0.1));
    
    for (let i = 0; i < toRemove; i++) {
      if (entries[i]) {
        this.delete(entries[i][0]);
      }
    }
  }

  /**
   * Check if entry is expired
   * @param {Object} entry - Cache entry
   * @returns {boolean} Whether entry is expired
   */
  isExpired(entry) {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {any[]} args - Arguments to hash
   * @returns {string} Generated key
   */
  generateKey(prefix, args) {
    const argsHash = JSON.stringify(args);
    return `${prefix}:${this.hashCode(argsHash)}`;
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {number} Hash code
   */
  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get size of entry
   * @param {Object} entry - Cache entry
   * @returns {number} Size in bytes
   */
  getSize(entry) {
    return new Blob([JSON.stringify(entry)]).size;
  }

  /**
   * Serialize value for storage
   * @param {any} value - Value to serialize
   * @returns {string} Serialized value
   */
  serialize(value) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.warn('Failed to serialize cache value:', error);
      return JSON.stringify(null);
    }
  }

  /**
   * Deserialize value from storage
   * @param {string} value - Serialized value
   * @returns {any} Deserialized value
   */
  deserialize(value) {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.warn('Failed to deserialize cache value:', error);
      return null;
    }
  }

  /**
   * Persist entry to storage
   * @param {string} key - Cache key
   * @param {Object} entry - Cache entry
   */
  persistEntry(key, entry) {
    try {
      const storageKey = `cache:${key}`;
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  /**
   * Remove persisted entry
   * @param {string} key - Cache key
   */
  removePersistedEntry(key) {
    try {
      const storageKey = `cache:${key}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove persisted cache entry:', error);
    }
  }

  /**
   * Load persisted cache
   */
  loadPersistedCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache:')) {
          const cacheKey = key.replace('cache:', '');
          const entryData = localStorage.getItem(key);
          
          if (entryData) {
            const entry = JSON.parse(entryData);
            
            // Check if still valid
            if (!this.isExpired(entry)) {
              this.cache.set(cacheKey, entry);
              this.metadata.set(cacheKey, {
                size: this.getSize(entry),
                tags: entry.tags,
                priority: entry.priority
              });
            } else {
              // Remove expired entry
              localStorage.removeItem(key);
            }
          }
        }
      });
    } catch (error) {
      console.warn('Failed to load persisted cache:', error);
    }
  }

  /**
   * Clear persisted cache
   */
  clearPersistedCache() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache:')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear persisted cache:', error);
    }
  }

  /**
   * Setup storage sync
   */
  setupStorageSync() {
    // Sync with other tabs/windows
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith('cache:')) {
        const cacheKey = event.key.replace('cache:', '');
        
        if (event.newValue) {
          const entry = JSON.parse(event.newValue);
          if (!this.isExpired(entry)) {
            this.cache.set(cacheKey, entry);
          }
        } else {
          this.cache.delete(cacheKey);
        }
      }
    });
  }
}

// Global cache manager instance
window.cacheManager = new CacheManager();

export default window.cacheManager;
