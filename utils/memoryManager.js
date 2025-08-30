/**
 * Memory Management Utility
 * Prevents memory leaks by managing timers, intervals, and event listeners
 */

class MemoryManager {
  constructor() {
    this.timers = new Set();
    this.intervals = new Set();
    this.eventListeners = new Map();
    this.cleanupCallbacks = new Set();
    
    // Auto-cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
    
    // Cleanup on visibility change to save resources
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseNonCritical();
      } else {
        this.resumeNonCritical();
      }
    });
  }

  /**
   * Set timeout with automatic cleanup
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @param {boolean} critical - Whether this timer is critical (won't be paused)
   * @returns {number} Timer ID
   */
  setTimeout(callback, delay, critical = false) {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId);
      callback();
    }, delay);
    
    this.timers.add(timerId);
    return timerId;
  }

  /**
   * Set interval with automatic cleanup
   * @param {Function} callback - Function to execute
   * @param {number} delay - Delay in milliseconds
   * @param {boolean} critical - Whether this interval is critical (won't be paused)
   * @returns {number} Interval ID
   */
  setInterval(callback, delay, critical = false) {
    const intervalId = window.setInterval(callback, delay);
    this.intervals.add({ id: intervalId, callback, critical });
    return intervalId;
  }

  /**
   * Clear timeout
   * @param {number} timerId - Timer ID to clear
   */
  clearTimeout(timerId) {
    if (this.timers.has(timerId)) {
      window.clearTimeout(timerId);
      this.timers.delete(timerId);
    }
  }

  /**
   * Clear interval
   * @param {number} intervalId - Interval ID to clear
   */
  clearInterval(intervalId) {
    for (const interval of this.intervals) {
      if (interval.id === intervalId) {
        window.clearInterval(intervalId);
        this.intervals.delete(interval);
        break;
      }
    }
  }

  /**
   * Add event listener with automatic cleanup
   * @param {HTMLElement} element - Element to attach listener to
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event listener options
   */
  addEventListener(element, event, handler, options = {}) {
    if (!element) return;
    
    element.addEventListener(event, handler, options);
    
    const key = `${element.id || 'unknown'}-${event}`;
    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, []);
    }
    this.eventListeners.get(key).push({ element, event, handler, options });
  }

  /**
   * Remove event listener
   * @param {HTMLElement} element - Element to remove listener from
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  removeEventListener(element, event, handler) {
    if (!element) return;
    
    element.removeEventListener(event, handler);
    
    const key = `${element.id || 'unknown'}-${event}`;
    const listeners = this.eventListeners.get(key);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index > -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.eventListeners.delete(key);
      }
    }
  }

  /**
   * Add cleanup callback
   * @param {Function} callback - Cleanup function
   */
  addCleanupCallback(callback) {
    this.cleanupCallbacks.add(callback);
  }

  /**
   * Remove cleanup callback
   * @param {Function} callback - Cleanup function to remove
   */
  removeCleanupCallback(callback) {
    this.cleanupCallbacks.delete(callback);
  }

  /**
   * Pause non-critical timers and intervals
   */
  pauseNonCritical() {
    this.pausedIntervals = new Set();
    
    for (const interval of this.intervals) {
      if (!interval.critical) {
        window.clearInterval(interval.id);
        this.pausedIntervals.add(interval);
      }
    }
  }

  /**
   * Resume non-critical timers and intervals
   */
  resumeNonCritical() {
    if (this.pausedIntervals) {
      for (const interval of this.pausedIntervals) {
        interval.id = window.setInterval(interval.callback, 1000); // Default 1 second
      }
      this.pausedIntervals.clear();
    }
  }

  /**
   * Cleanup all resources
   */
  cleanup() {
    // Clear all timers
    for (const timerId of this.timers) {
      window.clearTimeout(timerId);
    }
    this.timers.clear();

    // Clear all intervals
    for (const interval of this.intervals) {
      window.clearInterval(interval.id);
    }
    this.intervals.clear();

    // Remove all event listeners
    for (const [key, listeners] of this.eventListeners) {
      for (const { element, event, handler, options } of listeners) {
        element.removeEventListener(event, handler, options);
      }
    }
    this.eventListeners.clear();

    // Execute cleanup callbacks
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Cleanup callback error:', error);
      }
    }
    this.cleanupCallbacks.clear();

    console.log('Memory cleanup completed');
  }

  /**
   * Get memory usage statistics
   * @returns {Object} Memory statistics
   */
  getStats() {
    return {
      activeTimers: this.timers.size,
      activeIntervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      cleanupCallbacks: this.cleanupCallbacks.size
    };
  }

  /**
   * Monitor memory usage
   * @param {number} interval - Monitoring interval in milliseconds
   */
  startMonitoring(interval = 30000) {
    this.monitoringInterval = this.setInterval(() => {
      const stats = this.getStats();
      console.log('Memory Manager Stats:', stats);
      
      // Warn if too many resources are active
      if (stats.activeTimers > 50 || stats.activeIntervals > 20) {
        console.warn('High number of active timers/intervals detected');
      }
    }, interval, true);
  }

  /**
   * Stop memory monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      this.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }
}

// Global memory manager instance
window.memoryManager = new MemoryManager();

// Start monitoring in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.memoryManager.startMonitoring();
}

// Export for module systems (if needed)
// export default window.memoryManager;
