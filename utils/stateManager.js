/**
 * State Management Utility
 * Centralized state management with reactivity and persistence
 */

class StateManager {
  constructor() {
    this.state = {
      // Dashboard state
      currentSection: 'overview',
      isLoading: false,
      loadingOperations: new Set(),
      
      // Data state
      fuelData: {},
      reports: [],
      monthlyData: {},
      personnelData: {},
      
      // UI state
      modals: {
        manualEntry: false,
        upload: false,
        settings: false
      },
      
      // User state
      user: {
        email: null,
        isAuthenticated: false,
        preferences: {}
      },
      
      // Error state
      errors: [],
      warnings: [],
      
      // Performance state
      lastUpdate: null,
      dataVersion: 0
    };
    
    this.subscribers = new Map();
    this.middleware = [];
    this.history = [];
    this.maxHistorySize = 50;
    
    // Initialize from localStorage
    this.loadPersistedState();
    
    // Set up state change tracking
    this.setupStateTracking();
  }

  /**
   * Subscribe to state changes
   * @param {string} path - State path to subscribe to (e.g., 'fuelData', 'isLoading')
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(path, callback) {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, new Set());
    }
    
    this.subscribers.get(path).add(callback);
    
    // Return unsubscribe function
    return () => {
      const pathSubscribers = this.subscribers.get(path);
      if (pathSubscribers) {
        pathSubscribers.delete(callback);
        if (pathSubscribers.size === 0) {
          this.subscribers.delete(path);
        }
      }
    };
  }

  /**
   * Get state value
   * @param {string} path - State path (e.g., 'fuelData.dieselSell')
   * @returns {any} State value
   */
  get(path) {
    return this.getNestedValue(this.state, path);
  }

  /**
   * Set state value
   * @param {string} path - State path
   * @param {any} value - New value
   * @param {Object} options - Options
   */
  set(path, value, options = {}) {
    const { persist = false, notify = true } = options;
    
    // Create state snapshot for history
    const snapshot = JSON.parse(JSON.stringify(this.state));
    
    // Update state
    this.setNestedValue(this.state, path, value);
    
    // Add to history
    this.addToHistory(path, snapshot, this.state);
    
    // Persist if requested
    if (persist) {
      this.persistState();
    }
    
    // Notify subscribers
    if (notify) {
      this.notifySubscribers(path, value);
    }
    
    // Run middleware
    this.runMiddleware(path, value);
  }

  /**
   * Update multiple state values
   * @param {Object} updates - Object with path-value pairs
   * @param {Object} options - Options
   */
  batchUpdate(updates, options = {}) {
    const { persist = false, notify = true } = options;
    
    // Create state snapshot
    const snapshot = JSON.parse(JSON.stringify(this.state));
    
    // Apply all updates
    Object.entries(updates).forEach(([path, value]) => {
      this.setNestedValue(this.state, path, value);
    });
    
    // Add to history
    this.addToHistory('batch', snapshot, this.state);
    
    // Persist if requested
    if (persist) {
      this.persistState();
    }
    
    // Notify subscribers for each change
    if (notify) {
      Object.entries(updates).forEach(([path, value]) => {
        this.notifySubscribers(path, value);
      });
    }
  }

  /**
   * Start loading operation
   * @param {string} operation - Operation name
   */
  startLoading(operation) {
    this.state.loadingOperations.add(operation);
    this.state.isLoading = true;
    this.notifySubscribers('isLoading', true);
    this.notifySubscribers('loadingOperations', this.state.loadingOperations);
  }

  /**
   * Stop loading operation
   * @param {string} operation - Operation name
   */
  stopLoading(operation) {
    this.state.loadingOperations.delete(operation);
    this.state.isLoading = this.state.loadingOperations.size > 0;
    this.notifySubscribers('isLoading', this.state.isLoading);
    this.notifySubscribers('loadingOperations', this.state.loadingOperations);
  }

  /**
   * Add error to state
   * @param {Error|string} error - Error to add
   * @param {string} context - Error context
   */
  addError(error, context = '') {
    const errorObj = {
      id: Date.now(),
      message: error instanceof Error ? error.message : error,
      context,
      timestamp: new Date().toISOString(),
      stack: error instanceof Error ? error.stack : null
    };
    
    this.state.errors.push(errorObj);
    
    // Keep only last 10 errors
    if (this.state.errors.length > 10) {
      this.state.errors = this.state.errors.slice(-10);
    }
    
    this.notifySubscribers('errors', this.state.errors);
  }

  /**
   * Add warning to state
   * @param {string} message - Warning message
   * @param {string} context - Warning context
   */
  addWarning(message, context = '') {
    const warningObj = {
      id: Date.now(),
      message,
      context,
      timestamp: new Date().toISOString()
    };
    
    this.state.warnings.push(warningObj);
    
    // Keep only last 10 warnings
    if (this.state.warnings.length > 10) {
      this.state.warnings = this.state.warnings.slice(-10);
    }
    
    this.notifySubscribers('warnings', this.state.warnings);
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.state.errors = [];
    this.notifySubscribers('errors', []);
  }

  /**
   * Clear warnings
   */
  clearWarnings() {
    this.state.warnings = [];
    this.notifySubscribers('warnings', []);
  }

  /**
   * Get nested value from object
   * @param {Object} obj - Object to search
   * @param {string} path - Path to value
   * @returns {any} Value
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object
   * @param {Object} obj - Object to update
   * @param {string} path - Path to set
   * @param {any} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);
    
    target[lastKey] = value;
  }

  /**
   * Notify subscribers of state change
   * @param {string} path - Changed path
   * @param {any} value - New value
   */
  notifySubscribers(path, value) {
    // Notify exact path subscribers
    if (this.subscribers.has(path)) {
      this.subscribers.get(path).forEach(callback => {
        try {
          callback(value, path);
        } catch (error) {
          console.error('Subscriber error:', error);
        }
      });
    }
    
    // Notify parent path subscribers
    const pathParts = path.split('.');
    while (pathParts.length > 1) {
      pathParts.pop();
      const parentPath = pathParts.join('.');
      if (this.subscribers.has(parentPath)) {
        this.subscribers.get(parentPath).forEach(callback => {
          try {
            callback(this.get(parentPath), parentPath);
          } catch (error) {
            console.error('Subscriber error:', error);
          }
        });
      }
    }
  }

  /**
   * Add middleware
   * @param {Function} middleware - Middleware function
   */
  addMiddleware(middleware) {
    this.middleware.push(middleware);
  }

  /**
   * Run middleware
   * @param {string} path - Changed path
   * @param {any} value - New value
   */
  runMiddleware(path, value) {
    this.middleware.forEach(middleware => {
      try {
        middleware(path, value, this.state);
      } catch (error) {
        console.error('Middleware error:', error);
      }
    });
  }

  /**
   * Add to history
   * @param {string} path - Changed path
   * @param {Object} oldState - Previous state
   * @param {Object} newState - New state
   */
  addToHistory(path, oldState, newState) {
    this.history.push({
      timestamp: Date.now(),
      path,
      oldValue: this.getNestedValue(oldState, path),
      newValue: this.getNestedValue(newState, path)
    });
    
    // Keep history size manageable
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  /**
   * Undo last state change
   * @returns {boolean} Success
   */
  undo() {
    if (this.history.length === 0) return false;
    
    const lastChange = this.history.pop();
    this.set(lastChange.path, lastChange.oldValue, { notify: true, persist: false });
    return true;
  }

  /**
   * Get state history
   * @returns {Array} History array
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Persist state to localStorage
   */
  persistState() {
    try {
      const persistableState = {
        fuelData: this.state.fuelData,
        user: this.state.user,
        modals: this.state.modals
      };
      localStorage.setItem('fuelFluxState', JSON.stringify(persistableState));
    } catch (error) {
      console.error('Failed to persist state:', error);
    }
  }

  /**
   * Load persisted state from localStorage
   */
  loadPersistedState() {
    try {
      const persisted = localStorage.getItem('fuelFluxState');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        Object.assign(this.state, parsed);
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error);
    }
  }

  /**
   * Setup state tracking
   */
  setupStateTracking() {
    // Track state changes for debugging
    if (localStorage.getItem('debug') === 'true') {
      this.addMiddleware((path, value) => {
        console.log(`State change: ${path} =`, value);
      });
    }
    
    // Auto-persist on window unload
    window.addEventListener('beforeunload', () => {
      this.persistState();
    });
  }

  /**
   * Get state snapshot
   * @returns {Object} State snapshot
   */
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = {
      currentSection: 'overview',
      isLoading: false,
      loadingOperations: new Set(),
      fuelData: {},
      reports: [],
      monthlyData: {},
      personnelData: {},
      modals: {
        manualEntry: false,
        upload: false,
        settings: false
      },
      user: {
        email: null,
        isAuthenticated: false,
        preferences: {}
      },
      errors: [],
      warnings: [],
      lastUpdate: null,
      dataVersion: 0
    };
    
    this.history = [];
    this.notifySubscribers('*', this.state);
  }
}

// Global state manager instance
window.stateManager = new StateManager();

export default window.stateManager;
