/**
 * Comprehensive Logging Utility
 * Structured logging with different levels, persistence, and analytics
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };
    
    this.currentLevel = this.levels.INFO;
    this.enabled = true;
    this.persistLogs = true;
    this.analyticsEnabled = true;
    
    // Load saved logs
    this.loadLogs();
    
    // Setup log rotation
    this.setupLogRotation();
    
    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Set log level
   * @param {string} level - Log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
      this.info(`Log level set to: ${level}`);
    }
  }

  /**
   * Enable/disable logging
   * @param {boolean} enabled - Whether logging is enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.info(`Logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  error(message, context = {}, error = null) {
    this.log('ERROR', message, context, error);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    this.log('WARN', message, context);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    this.log('INFO', message, context);
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    this.log('DEBUG', message, context);
  }

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {Object} context - Additional context
   */
  trace(message, context = {}) {
    this.log('TRACE', message, context);
  }

  /**
   * Log performance metric
   * @param {string} operation - Operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} context - Additional context
   */
  performance(operation, duration, context = {}) {
    this.log('INFO', `Performance: ${operation} took ${duration}ms`, {
      ...context,
      type: 'performance',
      operation,
      duration
    });
  }

  /**
   * Log user action
   * @param {string} action - User action
   * @param {Object} context - Additional context
   */
  userAction(action, context = {}) {
    this.log('INFO', `User action: ${action}`, {
      ...context,
      type: 'user_action',
      action
    });
  }

  /**
   * Log API call
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {number} status - Response status
   * @param {number} duration - Duration in milliseconds
   * @param {Object} context - Additional context
   */
  apiCall(endpoint, method, status, duration, context = {}) {
    const level = status >= 400 ? 'ERROR' : 'INFO';
    this.log(level, `API ${method} ${endpoint} - ${status} (${duration}ms)`, {
      ...context,
      type: 'api_call',
      endpoint,
      method,
      status,
      duration
    });
  }

  /**
   * Log state change
   * @param {string} path - State path
   * @param {any} oldValue - Previous value
   * @param {any} newValue - New value
   * @param {Object} context - Additional context
   */
  stateChange(path, oldValue, newValue, context = {}) {
    this.log('DEBUG', `State change: ${path}`, {
      ...context,
      type: 'state_change',
      path,
      oldValue,
      newValue
    });
  }

  /**
   * Core logging function
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  log(level, message, context = {}, error = null) {
    if (!this.enabled || this.levels[level] > this.currentLevel) {
      return;
    }

    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      error: error ? this.sanitizeError(error) : null,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Keep logs array manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    this.outputToConsole(level, message, context, error);

    // Persist logs
    if (this.persistLogs) {
      this.persistLogs();
    }

    // Send to analytics
    if (this.analyticsEnabled) {
      this.sendToAnalytics(logEntry);
    }
  }

  /**
   * Sanitize context object
   * @param {Object} context - Context to sanitize
   * @returns {Object} Sanitized context
   */
  sanitizeContext(context) {
    if (!context || typeof context !== 'object') {
      return context;
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(context)) {
      // Remove sensitive data
      if (['password', 'token', 'key', 'secret'].some(sensitive => 
        key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Handle different value types
      if (value === null || value === undefined) {
        sanitized[key] = value;
      } else if (typeof value === 'object') {
        // Limit object depth
        sanitized[key] = this.sanitizeContext(value);
      } else if (typeof value === 'function') {
        sanitized[key] = '[FUNCTION]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize error object
   * @param {Error} error - Error to sanitize
   * @returns {Object} Sanitized error
   */
  sanitizeError(error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : null
    };
  }

  /**
   * Output to console
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  outputToConsole(level, message, context, error) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${level}]`;
    
    switch (level) {
      case 'ERROR':
        console.error(prefix, message, context, error);
        break;
      case 'WARN':
        console.warn(prefix, message, context);
        break;
      case 'INFO':
        console.info(prefix, message, context);
        break;
      case 'DEBUG':
        console.debug(prefix, message, context);
        break;
      case 'TRACE':
        console.trace(prefix, message, context);
        break;
      default:
        console.log(prefix, message, context);
    }
  }

  /**
   * Get session ID
   * @returns {string} Session ID
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  /**
   * Persist logs to localStorage
   */
  persistLogs() {
    try {
      const logsToPersist = this.logs.slice(-100); // Keep last 100 logs
      localStorage.setItem('fuelFluxLogs', JSON.stringify(logsToPersist));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  /**
   * Load logs from localStorage
   */
  loadLogs() {
    try {
      const savedLogs = localStorage.getItem('fuelFluxLogs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  }

  /**
   * Send log to analytics
   * @param {Object} logEntry - Log entry
   */
  sendToAnalytics(logEntry) {
    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', 'log', {
        event_category: 'logging',
        event_label: logEntry.level,
        value: logEntry.level === 'ERROR' ? 1 : 0,
        custom_parameters: {
          message: logEntry.message,
          context: JSON.stringify(logEntry.context)
        }
      });
    }
  }

  /**
   * Setup log rotation
   */
  setupLogRotation() {
    // Rotate logs every hour
    setInterval(() => {
      if (this.logs.length > this.maxLogs * 0.8) {
        this.logs = this.logs.slice(-this.maxLogs / 2);
        this.persistLogs();
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        this.performance('page_load', perfData.loadEventEnd - perfData.loadEventStart, {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
        });
      }
    });

    // Monitor memory usage
    if (performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        this.performance('memory_usage', 0, {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }
  }

  /**
   * Get logs by level
   * @param {string} level - Log level
   * @returns {Array} Filtered logs
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get logs by time range
   * @param {Date} start - Start time
   * @param {Date} end - End time
   * @returns {Array} Filtered logs
   */
  getLogsByTimeRange(start, end) {
    return this.logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= start && logTime <= end;
    });
  }

  /**
   * Get logs by search term
   * @param {string} searchTerm - Search term
   * @returns {Array} Filtered logs
   */
  getLogsBySearch(searchTerm) {
    const term = searchTerm.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(term) ||
      JSON.stringify(log.context).toLowerCase().includes(term)
    );
  }

  /**
   * Export logs
   * @param {string} format - Export format ('json', 'csv')
   * @returns {string} Exported logs
   */
  exportLogs(format = 'json') {
    switch (format) {
      case 'json':
        return JSON.stringify(this.logs, null, 2);
      case 'csv':
        const headers = ['timestamp', 'level', 'message', 'context'];
        const csv = [headers.join(',')];
        this.logs.forEach(log => {
          csv.push([
            log.timestamp,
            log.level,
            `"${log.message.replace(/"/g, '""')}"`,
            `"${JSON.stringify(log.context).replace(/"/g, '""')}"`
          ].join(','));
        });
        return csv.join('\n');
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    localStorage.removeItem('fuelFluxLogs');
  }

  /**
   * Get log statistics
   * @returns {Object} Log statistics
   */
  getStats() {
    const stats = {
      total: this.logs.length,
      byLevel: {},
      byHour: {},
      errors: 0,
      warnings: 0
    };

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Count errors and warnings
      if (log.level === 'ERROR') stats.errors++;
      if (log.level === 'WARN') stats.warnings++;
      
      // Count by hour
      const hour = new Date(log.timestamp).getHours();
      stats.byHour[hour] = (stats.byHour[hour] || 0) + 1;
    });

    return stats;
  }
}

// Global logger instance
window.logger = new Logger();

// Override console methods to capture all console output
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

console.log = (...args) => {
  window.logger.info(args.join(' '));
  originalConsole.log(...args);
};

console.info = (...args) => {
  window.logger.info(args.join(' '));
  originalConsole.info(...args);
};

console.warn = (...args) => {
  window.logger.warn(args.join(' '));
  originalConsole.warn(...args);
};

console.error = (...args) => {
  window.logger.error(args.join(' '));
  originalConsole.error(...args);
};

console.debug = (...args) => {
  window.logger.debug(args.join(' '));
  originalConsole.debug(...args);
};

export default window.logger;
