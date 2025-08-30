/**
 * Input Validation and Sanitization Utility
 * Provides comprehensive validation and sanitization for all user inputs
 */

class InputValidator {
  constructor() {
    this.errorHandler = window.errorHandler;
  }

  /**
   * Sanitize HTML content to prevent XSS
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized string
   */
  sanitizeHTML(input) {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate and sanitize email
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  validateEmail(email) {
    const sanitized = this.sanitizeHTML(email.trim());
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!sanitized) {
      return { valid: false, error: 'Email is required', sanitized: '' };
    }
    
    if (!emailRegex.test(sanitized)) {
      return { valid: false, error: 'Invalid email format', sanitized };
    }
    
    return { valid: true, sanitized };
  }

  /**
   * Validate and sanitize numeric input
   * @param {string|number} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateNumber(input, options = {}) {
    const { min, max, required = true, allowNegative = false } = options;
    
    if (required && (input === '' || input === null || input === undefined)) {
      return { valid: false, error: 'This field is required', sanitized: '' };
    }
    
    if (!required && (input === '' || input === null || input === undefined)) {
      return { valid: true, sanitized: '' };
    }
    
    const sanitized = String(input).trim();
    const numValue = parseFloat(sanitized);
    
    if (isNaN(numValue)) {
      return { valid: false, error: 'Must be a valid number', sanitized };
    }
    
    if (!allowNegative && numValue < 0) {
      return { valid: false, error: 'Must be a positive number', sanitized };
    }
    
    if (min !== undefined && numValue < min) {
      return { valid: false, error: `Must be at least ${min}`, sanitized };
    }
    
    if (max !== undefined && numValue > max) {
      return { valid: false, error: `Must be no more than ${max}`, sanitized };
    }
    
    return { valid: true, sanitized: numValue };
  }

  /**
   * Validate and sanitize text input
   * @param {string} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateText(input, options = {}) {
    const { minLength, maxLength, required = true, pattern } = options;
    
    if (required && (!input || input.trim() === '')) {
      return { valid: false, error: 'This field is required', sanitized: '' };
    }
    
    if (!required && (!input || input.trim() === '')) {
      return { valid: true, sanitized: '' };
    }
    
    const sanitized = this.sanitizeHTML(input.trim());
    
    if (minLength && sanitized.length < minLength) {
      return { valid: false, error: `Must be at least ${minLength} characters`, sanitized };
    }
    
    if (maxLength && sanitized.length > maxLength) {
      return { valid: false, error: `Must be no more than ${maxLength} characters`, sanitized };
    }
    
    if (pattern && !pattern.test(sanitized)) {
      return { valid: false, error: 'Invalid format', sanitized };
    }
    
    return { valid: true, sanitized };
  }

  /**
   * Validate file input
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validateFile(file, options = {}) {
    const { maxSize = 10 * 1024 * 1024, allowedTypes = ['.pdf'], required = true } = options;
    
    if (required && !file) {
      return { valid: false, error: 'File is required' };
    }
    
    if (!required && !file) {
      return { valid: true };
    }
    
    if (file.size > maxSize) {
      return { valid: false, error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` };
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      return { valid: false, error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}` };
    }
    
    return { valid: true };
  }

  /**
   * Validate fuel data input
   * @param {Object} data - Fuel data object
   * @returns {Object} Validation result
   */
  validateFuelData(data) {
    const errors = [];
    const sanitized = {};
    
    // Validate fuel selling prices
    const dieselSell = this.validateNumber(data.dieselSell, { min: 0, required: true });
    if (!dieselSell.valid) errors.push(`Diesel selling price: ${dieselSell.error}`);
    else sanitized.dieselSell = dieselSell.sanitized;
    
    const petrolSell = this.validateNumber(data.petrolSell, { min: 0, required: true });
    if (!petrolSell.valid) errors.push(`Petrol selling price: ${petrolSell.error}`);
    else sanitized.petrolSell = petrolSell.sanitized;
    
    // Validate fuel costs
    const dieselCost = this.validateNumber(data.dieselCost, { min: 0, required: true });
    if (!dieselCost.valid) errors.push(`Diesel cost: ${dieselCost.error}`);
    else sanitized.dieselCost = dieselCost.sanitized;
    
    const petrolCost = this.validateNumber(data.petrolCost, { min: 0, required: true });
    if (!petrolCost.valid) errors.push(`Petrol cost: ${petrolCost.error}`);
    else sanitized.petrolCost = petrolCost.sanitized;
    
    // Validate volumes
    const dieselVolume = this.validateNumber(data.dieselVolume, { min: 0, required: true });
    if (!dieselVolume.valid) errors.push(`Diesel volume: ${dieselVolume.error}`);
    else sanitized.dieselVolume = dieselVolume.sanitized;
    
    const petrolVolume = this.validateNumber(data.petrolVolume, { min: 0, required: true });
    if (!petrolVolume.valid) errors.push(`Petrol volume: ${petrolVolume.error}`);
    else sanitized.petrolVolume = petrolVolume.sanitized;
    
    // Validate shop data
    const shopRevenue = this.validateNumber(data.shopRevenue, { min: 0, required: true });
    if (!shopRevenue.valid) errors.push(`Shop revenue: ${shopRevenue.error}`);
    else sanitized.shopRevenue = shopRevenue.sanitized;
    
    return {
      valid: errors.length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Validate form data
   * @param {Object} formData - Form data object
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  validateForm(formData, schema) {
    const errors = {};
    const sanitized = {};
    
    for (const [field, rules] of Object.entries(schema)) {
      const value = formData[field];
      let result;
      
      switch (rules.type) {
        case 'email':
          result = this.validateEmail(value);
          break;
        case 'number':
          result = this.validateNumber(value, rules.options);
          break;
        case 'text':
          result = this.validateText(value, rules.options);
          break;
        case 'file':
          result = this.validateFile(value, rules.options);
          break;
        default:
          result = this.validateText(value, rules.options);
      }
      
      if (!result.valid) {
        errors[field] = result.error;
      } else {
        sanitized[field] = result.sanitized;
      }
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }

  /**
   * Safe DOM manipulation
   * @param {HTMLElement} element - Element to update
   * @param {string} content - Content to set
   * @param {string} property - Property to set ('textContent' or 'innerHTML')
   */
  safeSetContent(element, content, property = 'textContent') {
    if (!element) return;
    
    const sanitized = property === 'innerHTML' ? this.sanitizeHTML(content) : content;
    element[property] = sanitized;
  }

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate
   * @returns {Object} Validation result
   */
  validateURL(url) {
    const sanitized = this.sanitizeHTML(url.trim());
    
    if (!sanitized) {
      return { valid: false, error: 'URL is required', sanitized: '' };
    }
    
    try {
      new URL(sanitized);
      return { valid: true, sanitized };
    } catch {
      return { valid: false, error: 'Invalid URL format', sanitized };
    }
  }
}

// Global validator instance
window.validator = new InputValidator();

// Export for module systems (if needed)
// export default window.validator;
