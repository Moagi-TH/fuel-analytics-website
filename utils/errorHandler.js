/**
 * Error Handling and User Feedback Utility
 * Provides centralized error handling with user-friendly feedback
 */

class ErrorHandler {
  constructor() {
    this.errorContainer = null;
    this.successContainer = null;
    this.initializeContainers();
  }

  initializeContainers() {
    // Create error notification container
    this.errorContainer = document.createElement('div');
    this.errorContainer.id = 'error-notifications';
    this.errorContainer.className = 'notification-container error-container';
    this.errorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;

    // Create success notification container
    this.successContainer = document.createElement('div');
    this.successContainer.id = 'success-notifications';
    this.successContainer.className = 'notification-container success-container';
    this.successContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 400px;
    `;

    document.body.appendChild(this.errorContainer);
    document.body.appendChild(this.successContainer);
  }

  /**
   * Handle errors with user feedback
   * @param {Error|string} error - Error object or message
   * @param {string} context - Context where error occurred
   * @param {boolean} showUser - Whether to show user notification
   */
  handleError(error, context = 'Unknown', showUser = true) {
    const errorMessage = error instanceof Error ? error.message : error;
    const timestamp = new Date().toISOString();
    
    // Log error for debugging (use original console to avoid recursion)
    if (window.originalConsole) {
      window.originalConsole.error(`[${timestamp}] Error in ${context}:`, error);
    } else {
      console.error(`[${timestamp}] Error in ${context}:`, error);
    }
    
    if (showUser) {
      this.showNotification(errorMessage, 'error', context);
    }

    // Track error for analytics (if needed)
    this.trackError(errorMessage, context);
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {string} context - Context of success
   */
  showSuccess(message, context = '') {
    this.showNotification(message, 'success', context);
  }

  /**
   * Show notification to user
   * @param {string} message - Message to display
   * @param {string} type - 'error' or 'success'
   * @param {string} context - Additional context
   */
  showNotification(message, type = 'error', context = '') {
    const container = type === 'error' ? this.errorContainer : this.successContainer;
    const notification = document.createElement('div');
    
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      background: ${type === 'error' ? '#ef4444' : '#10b981'};
      color: white;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
      position: relative;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: 600; margin-bottom: 4px;';
    title.textContent = type === 'error' ? 'Error' : 'Success';
    
    const content = document.createElement('div');
    content.textContent = message;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    closeBtn.onclick = () => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    };

    notification.appendChild(title);
    notification.appendChild(content);
    notification.appendChild(closeBtn);
    
    if (context) {
      const contextEl = document.createElement('div');
      contextEl.style.cssText = 'font-size: 12px; opacity: 0.8; margin-top: 4px;';
      contextEl.textContent = context;
      notification.appendChild(contextEl);
    }

    container.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        closeBtn.click();
      }
    }, 5000);
  }

  /**
   * Track errors for analytics
   * @param {string} message - Error message
   * @param {string} context - Error context
   */
  trackError(message, context) {
    // In a real app, you'd send this to your analytics service
    if (window.gtag) {
      window.gtag('event', 'error', {
        error_message: message,
        error_context: context,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Wrap async functions with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context for error handling
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, context = 'Async Operation') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, context);
        throw error;
      }
    };
  }

  /**
   * Validate required parameters
   * @param {Object} params - Parameters to validate
   * @param {Array} required - Required parameter names
   * @returns {boolean} True if valid
   */
  validateParams(params, required) {
    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        this.handleError(`Missing required parameter: ${param}`, 'Validation');
        return false;
      }
    }
    return true;
  }
}

// Global error handler instance
window.errorHandler = new ErrorHandler();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Export for module systems (if needed)
// export default window.errorHandler;
