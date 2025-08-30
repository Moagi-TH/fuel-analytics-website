/**
 * Performance Optimizer
 * Comprehensive performance optimization and monitoring
 */

class PerformanceOptimizer {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      renderTime: 16, // 60fps
      memoryUsage: 50 * 1024 * 1024, // 50MB
      networkLatency: 1000, // 1 second
      bundleSize: 500 * 1024 // 500KB
    };
    
    this.initialize();
  }

  /**
   * Initialize performance optimizer
   */
  initialize() {
    this.setupPerformanceMonitoring();
    this.setupResourceHints();
    this.setupLazyLoading();
    this.setupImageOptimization();
    this.setupCodeSplitting();
    this.setupCachingStrategies();
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Monitor Core Web Vitals
    this.observeLCP();
    this.observeFID();
    this.observeCLS();

    // Monitor memory usage
    this.monitorMemoryUsage();

    // Monitor network performance
    this.monitorNetworkPerformance();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor layout shifts
    this.observeLayoutShifts();
  }

  /**
   * Observe Largest Contentful Paint (LCP)
   */
  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        const lcp = lastEntry.startTime;
        this.metrics.set('lcp', lcp);
        
        if (window.logger) {
          window.logger.performance('LCP measured', lcp, { url: window.location.href });
        }

        if (lcp > 2500) {
          this.handlePerformanceIssue('LCP too high', { lcp });
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', observer);
    }
  }

  /**
   * Observe First Input Delay (FID)
   */
  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.set('fid', fid);
          
          if (window.logger) {
            window.logger.performance('FID measured', fid, { 
              url: window.location.href,
              interactionType: entry.interactionType
            });
          }

          if (fid > 100) {
            this.handlePerformanceIssue('FID too high', { fid });
          }
        });
      });

      observer.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', observer);
    }
  }

  /**
   * Observe Cumulative Layout Shift (CLS)
   */
  observeCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.set('cls', clsValue);
            
            if (window.logger) {
              window.logger.performance('CLS measured', clsValue, { 
                url: window.location.href 
              });
            }

            if (clsValue > 0.1) {
              this.handlePerformanceIssue('CLS too high', { cls: clsValue });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('cls', observer);
    }
  }

  /**
   * Monitor memory usage
   */
  monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory;
        const usedMB = memoryInfo.usedJSHeapSize / 1024 / 1024;
        const totalMB = memoryInfo.totalJSHeapSize / 1024 / 1024;
        const limitMB = memoryInfo.jsHeapSizeLimit / 1024 / 1024;

        this.metrics.set('memory', {
          used: usedMB,
          total: totalMB,
          limit: limitMB,
          percentage: (usedMB / limitMB) * 100
        });

        if (window.logger) {
          window.logger.performance('Memory usage', usedMB, {
            total: totalMB,
            limit: limitMB,
            percentage: (usedMB / limitMB) * 100
          });
        }

        // Warn if memory usage is high
        if (usedMB > this.thresholds.memoryUsage / 1024 / 1024) {
          this.handlePerformanceIssue('High memory usage', { 
            used: usedMB, 
            limit: limitMB 
          });
        }

        // Force garbage collection if memory is critical
        if ((usedMB / limitMB) > 0.8) {
          this.forceGarbageCollection();
        }
      }, 10000); // Check every 10 seconds
    }
  }

  /**
   * Monitor network performance
   */
  monitorNetworkPerformance() {
    // Monitor resource loading times
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            const loadTime = entry.loadEventEnd - entry.startTime;
            
            if (loadTime > this.thresholds.networkLatency) {
              this.handlePerformanceIssue('Slow network request', {
                url: entry.name,
                duration: loadTime
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.set('network', observer);
    }
  }

  /**
   * Observe long tasks
   */
  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          const duration = entry.duration;
          
          if (duration > 50) { // 50ms threshold
            if (window.logger) {
              window.logger.warn('Long task detected', {
                duration,
                startTime: entry.startTime,
                name: entry.name
              });
            }

            this.handlePerformanceIssue('Long task detected', {
              duration,
              name: entry.name
            });
          }
        });
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  /**
   * Observe layout shifts
   */
  observeLayoutShifts() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach(entry => {
          if (entry.value > 0.1) {
            if (window.logger) {
              window.logger.warn('Layout shift detected', {
                value: entry.value,
                sources: entry.sources
              });
            }
          }
        });
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.set('layoutShift', observer);
    }
  }

  /**
   * Setup resource hints
   */
  setupResourceHints() {
    // Preconnect to external domains
    const domains = [
      'https://cdn.jsdelivr.net',
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });

    // DNS prefetch for additional domains
    const dnsPrefetchDomains = [
      'https://api.supabase.co'
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = domain;
      document.head.appendChild(link);
    });
  }

  /**
   * Setup lazy loading
   */
  setupLazyLoading() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }

    // Lazy load components
    this.setupComponentLazyLoading();
  }

  /**
   * Setup component lazy loading
   */
  setupComponentLazyLoading() {
    const componentObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const component = entry.target;
          const componentName = component.dataset.component;
          
          if (componentName && !component.classList.contains('loaded')) {
            this.loadComponent(componentName, component);
            component.classList.add('loaded');
            observer.unobserve(component);
          }
        }
      });
    });

    document.querySelectorAll('[data-component]').forEach(component => {
      componentObserver.observe(component);
    });
  }

  /**
   * Load component dynamically
   * @param {string} componentName - Component name
   * @param {HTMLElement} container - Container element
   */
  async loadComponent(componentName, container) {
    try {
      // Dynamic import
      const module = await import(`./components/${componentName}.js`);
      
      if (module.default) {
        const instance = new module.default(container);
        instance.init();
      }
    } catch (error) {
      console.error(`Failed to load component: ${componentName}`, error);
    }
  }

  /**
   * Setup image optimization
   */
  setupImageOptimization() {
    // Responsive images
    document.querySelectorAll('img').forEach(img => {
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });

    // WebP support detection
    this.detectWebPSupport();
  }

  /**
   * Detect WebP support
   */
  detectWebPSupport() {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      const isSupported = webP.height === 2;
      document.documentElement.classList.toggle('webp', isSupported);
      
      if (isSupported) {
        // Convert images to WebP
        this.convertImagesToWebP();
      }
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }

  /**
   * Convert images to WebP
   */
  convertImagesToWebP() {
    document.querySelectorAll('img[data-webp]').forEach(img => {
      const webpSrc = img.dataset.webp;
      if (webpSrc) {
        img.src = webpSrc;
      }
    });
  }

  /**
   * Setup code splitting
   */
  setupCodeSplitting() {
    // Split large functions
    this.splitLargeFunctions();
    
    // Bundle analysis
    this.analyzeBundle();
  }

  /**
   * Split large functions
   */
  splitLargeFunctions() {
    // Monitor function execution time
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (fn, delay, ...args) => {
      if (typeof fn === 'function') {
        const wrappedFn = async () => {
          const start = performance.now();
          try {
            await fn(...args);
          } finally {
            const duration = performance.now() - start;
            if (duration > 16) { // 16ms threshold
              if (window.logger) {
                window.logger.warn('Slow function execution', {
                  duration,
                  functionName: fn.name || 'anonymous'
                });
              }
            }
          }
        };
        return originalSetTimeout(wrappedFn, delay);
      }
      return originalSetTimeout(fn, delay, ...args);
    };
  }

  /**
   * Analyze bundle size
   */
  analyzeBundle() {
    const scripts = document.querySelectorAll('script[src]');
    let totalSize = 0;

    scripts.forEach(script => {
      const url = script.src;
      fetch(url, { method: 'HEAD' })
        .then(response => {
          const size = response.headers.get('content-length');
          if (size) {
            totalSize += parseInt(size);
            
            if (parseInt(size) > this.thresholds.bundleSize) {
              this.handlePerformanceIssue('Large script file', {
                url,
                size: parseInt(size)
              });
            }
          }
        })
        .catch(error => {
          console.warn('Failed to analyze script size:', error);
        });
    });
  }

  /**
   * Setup caching strategies
   */
  setupCachingStrategies() {
    // Cache frequently used data
    if (window.cacheManager) {
      // Cache user preferences
      const userPrefs = {
        theme: localStorage.getItem('theme') || 'light',
        language: localStorage.getItem('language') || 'en',
        currency: localStorage.getItem('currency') || 'USD'
      };

      window.cacheManager.set('user_preferences', userPrefs, {
        ttl: 24 * 60 * 60 * 1000, // 24 hours
        tags: ['user', 'preferences'],
        persist: true
      });

      // Cache static data
      const staticData = {
        fuelTypes: ['Petrol', 'Diesel'],
        months: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      };

      window.cacheManager.set('static_data', staticData, {
        ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
        tags: ['static'],
        persist: true
      });
    }
  }

  /**
   * Handle performance issues
   * @param {string} issue - Issue description
   * @param {Object} data - Additional data
   */
  handlePerformanceIssue(issue, data) {
    if (window.errorHandler) {
      window.errorHandler.showNotification(
        `Performance issue detected: ${issue}`,
        'warning',
        'Performance'
      );
    }

    if (window.logger) {
      window.logger.warn(`Performance issue: ${issue}`, data);
    }

    // Store issue for analytics
    this.metrics.set(`issue_${Date.now()}`, {
      issue,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Force garbage collection
   */
  forceGarbageCollection() {
    if (window.gc) {
      window.gc();
    }
    
    if (window.logger) {
      window.logger.info('Forced garbage collection');
    }
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    const metrics = {};
    
    this.metrics.forEach((value, key) => {
      metrics[key] = value;
    });

    // Add navigation timing
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        metrics.navigation = {
          loadTime: navigation.loadEventEnd - navigation.loadEventStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          firstPaint: navigation.responseEnd - navigation.requestStart
        };
      }
    }

    return metrics;
  }

  /**
   * Optimize images
   * @param {HTMLImageElement} img - Image element
   */
  optimizeImage(img) {
    // Add loading="lazy" if not present
    if (!img.hasAttribute('loading')) {
      img.setAttribute('loading', 'lazy');
    }

    // Add decoding="async" if not present
    if (!img.hasAttribute('decoding')) {
      img.setAttribute('decoding', 'async');
    }

    // Set appropriate sizes
    if (!img.hasAttribute('sizes')) {
      img.setAttribute('sizes', '(max-width: 768px) 100vw, 50vw');
    }
  }

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle function
   * @param {Function} func - Function to throttle
   * @param {number} limit - Limit in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Disconnect all observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });

    this.observers.clear();
    this.metrics.clear();
  }
}

// Global performance optimizer instance
window.performanceOptimizer = new PerformanceOptimizer();

// Export for module systems (if needed)
// export default window.performanceOptimizer;
