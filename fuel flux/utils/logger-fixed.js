/**
 * Fixed Logger Utility
 * Centralized logging with proper error handling and no recursive console overrides
 */

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.sessionId = null;
    this.isEnabled = true;
    
    // Load existing logs
    this.loadLogs();
    
    // Setup log rotation
    this.setupLogRotation();
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  info(message, context = {}) {
    this.log('INFO', message, context);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  warn(message, context = {}) {
    this.log('WARN', message, context);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  error(message, context = {}, error = null) {
    this.log('ERROR', message, context, error);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  debug(message, context = {}) {
    this.log('DEBUG', message, context);
  }

  /**
   * Log trace message
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   */
  trace(message, context = {}) {
    this.log('TRACE', message, context);
  }

  /**
   * Log performance metric
   * @param {string} metric - Metric name
   * @param {number} value - Metric value
   * @param {Object} context - Additional context
   */
  performance(metric, value, context = {}) {
    this.log('PERFORMANCE', `${metric}: ${value}ms`, context);
  }

  /**
   * Core logging method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  log(level, message, context = {}, error = null) {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: this.sanitizeContext(context),
      sessionId: this.getSessionId(),
      error: error ? this.sanitizeError(error) : null
    };

    // Add to logs array
    this.logs.push(logEntry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Output to console (using original console methods)
    this.outputToConsole(level, message, context, error);

    // Persist logs periodically
    if (this.logs.length % 10 === 0) {
      this.persistLogs();
    }

    // Send to analytics for errors
    if (level === 'ERROR') {
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
   * Output to console (using original console methods to avoid recursion)
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} context - Additional context
   * @param {Error} error - Error object
   */
  outputToConsole(level, message, context, error) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${level}]`;
    
    // Use original console methods to avoid recursion
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

// Store original console methods for other utilities to use
window.originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

// NO CONSOLE METHOD OVERRIDES - This prevents recursive loops
