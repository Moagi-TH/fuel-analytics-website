/**
 * Accessibility Utility
 * Comprehensive accessibility features for keyboard navigation, screen readers, and focus management
 */

class AccessibilityManager {
  constructor() {
    this.focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    this.focusHistory = [];
    this.maxFocusHistory = 10;
    this.skipLinks = [];
    this.liveRegions = new Map();
    this.announcements = [];
    
    this.initialize();
  }

  /**
   * Initialize accessibility features
   */
  initialize() {
    this.setupSkipLinks();
    this.setupFocusManagement();
    this.setupKeyboardNavigation();
    this.setupLiveRegions();
    this.setupAnnouncements();
    this.setupAriaLabels();
    this.setupColorContrast();
    this.setupReducedMotion();
  }

  /**
   * Setup skip links for keyboard navigation
   */
  setupSkipLinks() {
    // Create skip links container
    const skipContainer = document.createElement('div');
    skipContainer.className = 'skip-links';
    skipContainer.setAttribute('role', 'navigation');
    skipContainer.setAttribute('aria-label', 'Skip navigation');
    
    skipContainer.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <a href="#navigation" class="skip-link">Skip to navigation</a>
      <a href="#footer" class="skip-link">Skip to footer</a>
    `;
    
    // Add styles
    const skipStyle = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 10000;
      }
      
      .skip-link {
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        border-radius: 4px;
        font-size: 14px;
        transition: top 0.3s;
      }
      
      .skip-link:focus {
        top: 6px;
        outline: 2px solid #fff;
        outline-offset: 2px;
      }
      
      .skip-link:hover {
        background: #333;
      }
    `;
    
    document.head.appendChild(skipStyle);
    document.body.insertBefore(skipContainer, document.body.firstChild);
    
    // Add IDs to main sections
    const main = document.querySelector('main');
    if (main) main.id = 'main-content';
    
    const nav = document.querySelector('nav');
    if (nav) nav.id = 'navigation';
    
    const footer = document.querySelector('footer');
    if (footer) footer.id = 'footer';
  }

  /**
   * Setup focus management
   */
  setupFocusManagement() {
    // Track focus changes
    document.addEventListener('focusin', (event) => {
      this.addToFocusHistory(event.target);
    });

    // Handle focus trapping in modals
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        this.handleTabNavigation(event);
      }
    });

    // Restore focus when modal closes
    this.setupModalFocusManagement();
  }

  /**
   * Add element to focus history
   * @param {HTMLElement} element - Element that received focus
   */
  addToFocusHistory(element) {
    this.focusHistory.push(element);
    if (this.focusHistory.length > this.maxFocusHistory) {
      this.focusHistory.shift();
    }
  }

  /**
   * Handle tab navigation in modals
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleTabNavigation(event) {
    const modal = event.target.closest('.modal');
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (event.target === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (event.target === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  /**
   * Setup modal focus management
   */
  setupModalFocusManagement() {
    // Store focus when modal opens
    const originalFocus = document.activeElement;
    
    // Restore focus when modal closes
    document.addEventListener('click', (event) => {
      if (event.target.classList.contains('modal') || 
          event.target.classList.contains('close-btn')) {
        setTimeout(() => {
          if (originalFocus && originalFocus.focus) {
            originalFocus.focus();
          }
        }, 100);
      }
    });
  }

  /**
   * Setup keyboard navigation
   */
  setupKeyboardNavigation() {
    // Arrow key navigation for lists
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      
      if (target.matches('li, .list-item, .card')) {
        this.handleArrowNavigation(event, target);
      }
      
      // Enter key activation
      if (event.key === 'Enter' && target.matches('[role="button"], .clickable')) {
        event.preventDefault();
        target.click();
      }
      
      // Space key activation
      if (event.key === ' ' && target.matches('[role="button"], .clickable')) {
        event.preventDefault();
        target.click();
      }
    });
  }

  /**
   * Handle arrow key navigation
   * @param {KeyboardEvent} event - Keyboard event
   * @param {HTMLElement} target - Target element
   */
  handleArrowNavigation(event, target) {
    const parent = target.parentElement;
    const items = Array.from(parent.children);
    const currentIndex = items.indexOf(target);
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
        break;
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
    }
    
    if (nextIndex !== currentIndex) {
      items[nextIndex].focus();
    }
  }

  /**
   * Setup live regions for screen readers
   */
  setupLiveRegions() {
    // Create live regions for different types of announcements
    const regions = [
      { id: 'status', type: 'status', label: 'Status updates' },
      { id: 'alert', type: 'alert', label: 'Important alerts' },
      { id: 'log', type: 'log', label: 'Activity log' },
      { id: 'polite', type: 'polite', label: 'General information' }
    ];
    
    regions.forEach(region => {
      const element = document.createElement('div');
      element.id = `live-${region.id}`;
      element.setAttribute('aria-live', region.type);
      element.setAttribute('aria-label', region.label);
      element.className = 'sr-only';
      element.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      
      if (document.body) {
        document.body.appendChild(element);
        this.liveRegions.set(region.id, element);
      } else {
        console.warn('Document body not available for accessibility setup');
      }
    });
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} type - Announcement type ('status', 'alert', 'log', 'polite')
   */
  announce(message, type = 'polite') {
    const region = this.liveRegions.get(type);
    if (region) {
      region.textContent = message;
      
      // Clear after a short delay
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }

  /**
   * Setup announcements system
   */
  setupAnnouncements() {
    // Announce page changes
    this.announcePageChanges();
    
    // Announce form validation
    this.announceFormValidation();
    
    // Announce loading states
    this.announceLoadingStates();
  }

  /**
   * Announce page changes
   */
  announcePageChanges() {
    // Monitor URL changes
    let currentUrl = window.location.href;
    
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        this.announce('Page changed', 'status');
      }
    }, 100);
  }

  /**
   * Announce form validation
   */
  announceFormValidation() {
    document.addEventListener('invalid', (event) => {
      const field = event.target;
      const message = field.validationMessage || 'This field is required';
      this.announce(`${field.name || 'Field'}: ${message}`, 'alert');
    });
    
    document.addEventListener('input', (event) => {
      const field = event.target;
      if (field.validity.valid && field.dataset.wasInvalid) {
        delete field.dataset.wasInvalid;
        this.announce(`${field.name || 'Field'} is now valid`, 'status');
      } else if (!field.validity.valid) {
        field.dataset.wasInvalid = 'true';
      }
    });
  }

  /**
   * Announce loading states
   */
  announceLoadingStates() {
    // Monitor loading indicators
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('loading') || 
                node.getAttribute('aria-busy') === 'true') {
              this.announce('Loading...', 'status');
            }
          }
        });
        
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('loading') || 
                node.getAttribute('aria-busy') === 'true') {
              this.announce('Loading complete', 'status');
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'class']
    });
  }

  /**
   * Setup ARIA labels
   */
  setupAriaLabels() {
    // Add missing ARIA labels
    this.addMissingAriaLabels();
    
    // Setup button descriptions
    this.setupButtonDescriptions();
    
    // Setup form labels
    this.setupFormLabels();
  }

  /**
   * Add missing ARIA labels
   */
  addMissingAriaLabels() {
    // Buttons without text
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(button => {
      if (!button.textContent.trim()) {
        const icon = button.querySelector('svg, img');
        if (icon) {
          const alt = icon.getAttribute('alt') || icon.getAttribute('aria-label');
          if (alt) {
            button.setAttribute('aria-label', alt);
          }
        }
      }
    });
    
    // Images without alt text
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', '');
      img.setAttribute('role', 'presentation');
    });
  }

  /**
   * Setup button descriptions
   */
  setupButtonDescriptions() {
    // Add descriptions for complex buttons
    const buttonDescriptions = {
      'refresh-data-btn': 'Refresh dashboard data',
      'manual-entry-btn': 'Enter fuel data manually',
      'upload-btn': 'Upload PDF report',
      'overview-over-time-btn': 'View performance over time'
    };
    
    Object.entries(buttonDescriptions).forEach(([id, description]) => {
      const button = document.getElementById(id);
      if (button && !button.getAttribute('aria-describedby')) {
        const descId = `${id}-desc`;
        const descElement = document.createElement('span');
        descElement.id = descId;
        descElement.className = 'sr-only';
        descElement.textContent = description;
        
        button.parentNode.insertBefore(descElement, button.nextSibling);
        button.setAttribute('aria-describedby', descId);
      }
    });
  }

  /**
   * Setup form labels
   */
  setupFormLabels() {
    // Ensure all form controls have labels
    document.querySelectorAll('input, select, textarea').forEach(control => {
      if (!control.id || !document.querySelector(`label[for="${control.id}"]`)) {
        const label = control.closest('label');
        if (!label) {
          const wrapper = document.createElement('label');
          wrapper.textContent = control.placeholder || control.name || 'Input field';
          control.parentNode.insertBefore(wrapper, control);
          wrapper.appendChild(control);
        }
      }
    });
  }

  /**
   * Setup color contrast monitoring
   */
  setupColorContrast() {
    // Check color contrast ratios
    this.checkColorContrast();
    
    // Monitor for dynamic color changes
    const observer = new MutationObserver(() => {
      this.checkColorContrast();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  /**
   * Check color contrast ratios
   */
  checkColorContrast() {
    // This is a simplified version - in a real implementation,
    // you would use a library like color-contrast-checker
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      const backgroundColor = style.backgroundColor;
      const color = style.color;
      
      // Add warning for potentially low contrast
      if (backgroundColor === 'transparent' && color === '#000000') {
        element.setAttribute('data-contrast-warning', 'true');
      }
    });
  }

  /**
   * Setup reduced motion support
   */
  setupReducedMotion() {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      // Disable animations
      const motionStyle = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `;
      document.head.appendChild(motionStyle);
    }
  }

  /**
   * Focus management utilities
   */
  
  /**
   * Focus first focusable element in container
   * @param {HTMLElement} container - Container element
   */
  focusFirst(container) {
    const firstElement = container.querySelector(this.focusableElements);
    if (firstElement) {
      firstElement.focus();
    }
  }

  /**
   * Focus last focusable element in container
   * @param {HTMLElement} container - Container element
   */
  focusLast(container) {
    const elements = container.querySelectorAll(this.focusableElements);
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
    }
  }

  /**
   * Restore previous focus
   */
  restoreFocus() {
    if (this.focusHistory.length > 0) {
      const previousElement = this.focusHistory[this.focusHistory.length - 2];
      if (previousElement && previousElement.focus) {
        previousElement.focus();
      }
    }
  }

  /**
   * Trap focus in container
   * @param {HTMLElement} container - Container element
   */
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(this.focusableElements);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }
    
    // Handle tab navigation
    const handleTab = (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (event.target === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (event.target === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleTab);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }

  /**
   * Get accessibility report
   * @returns {Object} Accessibility report
   */
  getAccessibilityReport() {
    const report = {
      issues: [],
      warnings: [],
      score: 100
    };
    
    // Check for missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      report.issues.push(`${imagesWithoutAlt.length} images missing alt text`);
      report.score -= imagesWithoutAlt.length * 5;
    }
    
    // Check for missing labels
    const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    if (inputsWithoutLabels.length > 0) {
      report.issues.push(`${inputsWithoutLabels.length} inputs missing labels`);
      report.score -= inputsWithoutLabels.length * 5;
    }
    
    // Check for missing ARIA labels on buttons
    const buttonsWithoutLabels = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    if (buttonsWithoutLabels.length > 0) {
      report.warnings.push(`${buttonsWithoutLabels.length} buttons missing ARIA labels`);
      report.score -= buttonsWithoutLabels.length * 2;
    }
    
    // Check for proper heading structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level > previousLevel + 1) {
        report.warnings.push('Heading structure may be incorrect');
        report.score -= 5;
      }
      previousLevel = level;
    });
    
    report.score = Math.max(0, report.score);
    
    return report;
  }
}

// Global accessibility manager instance
window.accessibility = new AccessibilityManager();

// Export for module systems (if needed)
// export default window.accessibility;
