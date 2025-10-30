/**
 * Loading States Manager
 * Comprehensive loading state management for all async operations
 */

class LoadingManager {
  constructor() {
    this.loadingStates = new Map();
    this.loadingIndicators = new Map();
    this.spinners = new Map();
    this.skeletons = new Map();
    
    this.initialize();
  }

  /**
   * Initialize loading manager
   */
  initialize() {
    this.setupGlobalLoadingIndicator();
    this.setupLoadingStyles();
    this.setupLoadingObservers();
    this.createLoadingComponents();
  }

  /**
   * Setup global loading indicator
   */
  setupGlobalLoadingIndicator() {
    // Create global loading indicator
    const globalIndicator = document.createElement('div');
    globalIndicator.id = 'global-loading-indicator';
    globalIndicator.className = 'global-loading-indicator';
    globalIndicator.setAttribute('aria-hidden', 'true');
    globalIndicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #20B2AA, #1e3a8a);
      z-index: 10000;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(globalIndicator);
    this.loadingIndicators.set('global', globalIndicator);
  }

  /**
   * Setup loading styles
   */
  setupLoadingStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .loading {
        position: relative;
        pointer-events: none;
        opacity: 0.7;
      }
      
      .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #20B2AA;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        z-index: 1000;
      }
      
      .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #20B2AA;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton-loading 1.5s infinite;
        border-radius: 4px;
      }
      
      .loading-text {
        color: #666;
        font-style: italic;
      }
      
      .loading-disabled {
        pointer-events: none;
        opacity: 0.5;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      @keyframes skeleton-loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      .loading-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
        background: #f0f0f0;
        z-index: 10000;
      }
      
      .loading-progress-bar {
        height: 100%;
        background: linear-gradient(90deg, #20B2AA, #1e3a8a);
        width: 0%;
        transition: width 0.3s ease;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Setup loading observers
   */
  setupLoadingObservers() {
    // Observe loading state changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-loading') {
          const element = mutation.target;
          const isLoading = element.getAttribute('data-loading') === 'true';
          this.handleLoadingStateChange(element, isLoading);
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-loading']
    });
  }

  /**
   * Create loading components
   */
  createLoadingComponents() {
    // Create spinner component
    this.createSpinnerComponent();
    
    // Create skeleton component
    this.createSkeletonComponent();
    
    // Create progress bar component
    this.createProgressBarComponent();
  }

  /**
   * Create spinner component
   */
  createSpinnerComponent() {
    const spinnerTemplate = document.createElement('template');
    spinnerTemplate.innerHTML = `
      <div class="loading-spinner" role="status" aria-label="Loading">
        <span class="sr-only">Loading...</span>
      </div>
    `;
    
    this.spinners.set('default', spinnerTemplate.content.cloneNode(true));
  }

  /**
   * Create skeleton component
   */
  createSkeletonComponent() {
    const skeletonTemplate = document.createElement('template');
    skeletonTemplate.innerHTML = `
      <div class="loading-skeleton" aria-hidden="true"></div>
    `;
    
    this.skeletons.set('default', skeletonTemplate.content.cloneNode(true));
  }

  /**
   * Create progress bar component
   */
  createProgressBarComponent() {
    const progressTemplate = document.createElement('template');
    progressTemplate.innerHTML = `
      <div class="loading-progress">
        <div class="loading-progress-bar"></div>
      </div>
    `;
    
    this.skeletons.set('progress', progressTemplate.content.cloneNode(true));
  }

  /**
   * Start loading for an operation
   * @param {string} operation - Operation name
   * @param {Object} options - Loading options
   */
  startLoading(operation, options = {}) {
    const {
      element = null,
      type = 'spinner',
      message = 'Loading...',
      progress = false,
      global = false
    } = options;

    // Create loading state
    const loadingState = {
      operation,
      element,
      type,
      message,
      progress,
      global,
      startTime: Date.now(),
      progressValue: 0
    };

    this.loadingStates.set(operation, loadingState);

    // Show loading indicator
    if (global) {
      this.showGlobalLoading();
    }

    if (element) {
      this.showElementLoading(element, loadingState);
    }

    // Announce to screen readers
    if (window.accessibility) {
      window.accessibility.announce(message, 'status');
    }

    // Log loading start
    if (window.logger) {
      window.logger.info(`Loading started: ${operation}`, { type, message });
    }

    return loadingState;
  }

  /**
   * Stop loading for an operation
   * @param {string} operation - Operation name
   * @param {Object} options - Stop options
   */
  stopLoading(operation, options = {}) {
    const { success = true, message = null } = options;
    
    const loadingState = this.loadingStates.get(operation);
    if (!loadingState) return;

    // Calculate duration
    const duration = Date.now() - loadingState.startTime;

    // Hide loading indicators
    if (loadingState.global) {
      this.hideGlobalLoading();
    }

    if (loadingState.element) {
      this.hideElementLoading(loadingState.element);
    }

    // Remove loading state
    this.loadingStates.delete(operation);

    // Announce completion
    const completionMessage = message || (success ? 'Loading complete' : 'Loading failed');
    if (window.accessibility) {
      window.accessibility.announce(completionMessage, success ? 'status' : 'alert');
    }

    // Log loading completion
    if (window.logger) {
      window.logger.performance(operation, duration, { success, message: completionMessage });
    }

    return { duration, success };
  }

  /**
   * Update loading progress
   * @param {string} operation - Operation name
   * @param {number} progress - Progress value (0-100)
   */
  updateProgress(operation, progress) {
    const loadingState = this.loadingStates.get(operation);
    if (!loadingState || !loadingState.progress) return;

    loadingState.progressValue = Math.max(0, Math.min(100, progress));

    // Update progress bar
    const progressBar = loadingState.element?.querySelector('.loading-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${loadingState.progressValue}%`;
    }

    // Update global progress
    if (loadingState.global) {
      this.updateGlobalProgress(loadingState.progressValue);
    }
  }

  /**
   * Show global loading indicator
   */
  showGlobalLoading() {
    const indicator = this.loadingIndicators.get('global');
    if (indicator) {
      indicator.style.transform = 'translateX(0)';
      indicator.setAttribute('aria-hidden', 'false');
    }
  }

  /**
   * Hide global loading indicator
   */
  hideGlobalLoading() {
    const indicator = this.loadingIndicators.get('global');
    if (indicator) {
      indicator.style.transform = 'translateX(-100%)';
      indicator.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Update global progress
   * @param {number} progress - Progress value (0-100)
   */
  updateGlobalProgress(progress) {
    const indicator = this.loadingIndicators.get('global');
    if (indicator) {
      indicator.style.width = `${progress}%`;
    }
  }

  /**
   * Show loading for specific element
   * @param {HTMLElement} element - Element to show loading for
   * @param {Object} loadingState - Loading state
   */
  showElementLoading(element, loadingState) {
    // Add loading class
    element.classList.add('loading');
    element.setAttribute('data-loading', 'true');
    element.setAttribute('aria-busy', 'true');

    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.setAttribute('aria-label', loadingState.message);

    // Add appropriate loading indicator
    switch (loadingState.type) {
      case 'spinner':
        const spinner = this.spinners.get('default').cloneNode(true);
        overlay.appendChild(spinner);
        break;
      case 'skeleton':
        const skeleton = this.skeletons.get('default').cloneNode(true);
        overlay.appendChild(skeleton);
        break;
      case 'progress':
        const progress = this.skeletons.get('progress').cloneNode(true);
        overlay.appendChild(progress);
        break;
      default:
        const defaultSpinner = this.spinners.get('default').cloneNode(true);
        overlay.appendChild(defaultSpinner);
    }

    // Add loading message
    if (loadingState.message) {
      const messageElement = document.createElement('div');
      messageElement.className = 'loading-text';
      messageElement.textContent = loadingState.message;
      overlay.appendChild(messageElement);
    }

    element.appendChild(overlay);
    element.loadingOverlay = overlay;
  }

  /**
   * Hide loading for specific element
   * @param {HTMLElement} element - Element to hide loading for
   */
  hideElementLoading(element) {
    // Remove loading class
    element.classList.remove('loading');
    element.removeAttribute('data-loading');
    element.removeAttribute('aria-busy');

    // Remove loading overlay
    if (element.loadingOverlay) {
      element.loadingOverlay.remove();
      delete element.loadingOverlay;
    }
  }

  /**
   * Handle loading state change
   * @param {HTMLElement} element - Element with loading state
   * @param {boolean} isLoading - Whether element is loading
   */
  handleLoadingStateChange(element, isLoading) {
    if (isLoading) {
      element.classList.add('loading');
      element.setAttribute('aria-busy', 'true');
    } else {
      element.classList.remove('loading');
      element.removeAttribute('aria-busy');
    }
  }

  /**
   * Create loading wrapper for async operations
   * @param {string} operation - Operation name
   * @param {Function} asyncFunction - Async function to wrap
   * @param {Object} options - Loading options
   * @returns {Function} Wrapped function
   */
  wrapAsync(operation, asyncFunction, options = {}) {
    return async (...args) => {
      const loadingState = this.startLoading(operation, options);
      
      try {
        const result = await asyncFunction(...args);
        this.stopLoading(operation, { success: true });
        return result;
      } catch (error) {
        this.stopLoading(operation, { 
          success: false, 
          message: error.message || 'Operation failed' 
        });
        throw error;
      }
    };
  }

  /**
   * Create loading button
   * @param {HTMLElement} button - Button element
   * @param {Function} onClick - Click handler
   * @param {Object} options - Loading options
   */
  createLoadingButton(button, onClick, options = {}) {
    const { message = 'Processing...' } = options;
    
    button.addEventListener('click', async (event) => {
      event.preventDefault();
      
      const originalText = button.textContent;
      const originalDisabled = button.disabled;
      
      // Start loading
      button.disabled = true;
      button.textContent = message;
      button.classList.add('loading');
      
      try {
        await onClick(event);
      } finally {
        // Restore button state
        button.disabled = originalDisabled;
        button.textContent = originalText;
        button.classList.remove('loading');
      }
    });
  }

  /**
   * Get loading state
   * @param {string} operation - Operation name
   * @returns {Object|null} Loading state
   */
  getLoadingState(operation) {
    return this.loadingStates.get(operation) || null;
  }

  /**
   * Check if operation is loading
   * @param {string} operation - Operation name
   * @returns {boolean} Whether operation is loading
   */
  isLoading(operation) {
    return this.loadingStates.has(operation);
  }

  /**
   * Get all loading states
   * @returns {Array} Array of loading states
   */
  getAllLoadingStates() {
    return Array.from(this.loadingStates.values());
  }

  /**
   * Stop all loading operations
   */
  stopAllLoading() {
    const operations = Array.from(this.loadingStates.keys());
    operations.forEach(operation => {
      this.stopLoading(operation, { success: false, message: 'Operation cancelled' });
    });
  }

  /**
   * Get loading statistics
   * @returns {Object} Loading statistics
   */
  getStats() {
    const states = this.getAllLoadingStates();
    const now = Date.now();
    
    return {
      activeOperations: states.length,
      operations: states.map(state => ({
        operation: state.operation,
        duration: now - state.startTime,
        type: state.type,
        progress: state.progressValue
      }))
    };
  }
}

// Global loading manager instance
window.loadingManager = new LoadingManager();

export default window.loadingManager;
