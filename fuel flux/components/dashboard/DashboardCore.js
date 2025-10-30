/**
 * Dashboard Core Component
 * Main dashboard functionality with proper error handling and validation
 */

class DashboardCore {
  constructor() {
    this.errorHandler = window.errorHandler;
    this.validator = window.validator;
    this.memoryManager = window.memoryManager;
    this.stateManager = window.stateManager;
    this.logger = window.logger;
    this.loadingManager = window.loadingManager;
    this.accessibility = window.accessibility;
    
    this.initialize();
  }

  /**
   * Initialize dashboard
   */
  async initialize() {
    try {
      this.logger.info('Dashboard initialization started');
      
      // Start loading
      this.loadingManager.startLoading('dashboard-init', {
        global: true,
        message: 'Initializing dashboard...'
      });
      
      // Initialize components
      await this.initializeComponents();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadInitialData();
      
      // Stop loading
      this.loadingManager.stopLoading('dashboard-init', {
        success: true,
        message: 'Dashboard initialized successfully'
      });
      
      this.errorHandler.showSuccess('Dashboard initialized successfully');
      this.logger.info('Dashboard initialization completed');
      
    } catch (error) {
      this.loadingManager.stopLoading('dashboard-init', {
        success: false,
        message: 'Dashboard initialization failed'
      });
      this.errorHandler.handleError(error, 'Dashboard Initialization');
      this.logger.error('Dashboard initialization failed', {}, error);
    }
  }

  /**
   * Initialize dashboard components
   */
  async initializeComponents() {
    const components = [
      'navigation',
      'metrics',
      'charts',
      'forms'
    ];

    for (const component of components) {
      try {
        await this.initializeComponent(component);
      } catch (error) {
        this.errorHandler.handleError(error, `Component Initialization: ${component}`);
      }
    }
  }

  /**
   * Initialize specific component
   * @param {string} componentName - Name of component to initialize
   */
  async initializeComponent(componentName) {
    switch (componentName) {
      case 'navigation':
        this.initializeNavigation();
        break;
      case 'metrics':
        this.initializeMetrics();
        break;
      case 'charts':
        this.initializeCharts();
        break;
      case 'forms':
        this.initializeForms();
        break;
      default:
        throw new Error(`Unknown component: ${componentName}`);
    }
  }

  /**
   * Initialize navigation
   */
  initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      this.memoryManager.addEventListener(link, 'click', (e) => {
        e.preventDefault();
        const section = link.getAttribute('href').substring(1);
        this.navigateToSection(section);
      });
    });
  }

  /**
   * Initialize metrics display
   */
  initializeMetrics() {
    // Initialize metric cards with proper validation
    const metricCards = document.querySelectorAll('.metric-card');
    
    metricCards.forEach(card => {
      const valueElement = card.querySelector('.metric-value');
      if (valueElement) {
        // Use safe content setting
        this.validator.safeSetContent(valueElement, '0', 'textContent');
      }
    });
  }

  /**
   * Initialize charts
   */
  initializeCharts() {
    // Initialize Chart.js instances with error handling
    if (typeof Chart === 'undefined') {
      this.errorHandler.handleError('Chart.js not loaded', 'Chart Initialization');
      return;
    }

    // Set up chart configurations
    this.setupChartConfigurations();
  }

  /**
   * Initialize forms
   */
  initializeForms() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      this.memoryManager.addEventListener(form, 'submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(form);
      });
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      this.memoryManager.addEventListener(refreshBtn, 'click', () => {
        this.refreshData();
      });
    }

    // Manual entry button
    const manualEntryBtn = document.getElementById('manual-entry-btn');
    if (manualEntryBtn) {
      this.memoryManager.addEventListener(manualEntryBtn, 'click', () => {
        this.showManualEntryForm();
      });
    }

    // Upload button
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
      this.memoryManager.addEventListener(uploadBtn, 'click', () => {
        this.showUploadForm();
      });
    }
  }

  /**
   * Navigate to section
   * @param {string} section - Section to navigate to
   */
  async navigateToSection(section) {
    try {
      this.logger.userAction('navigate_to_section', { section });
      
      // Validate section name
      const validSections = ['overview', 'reports', 'analytics', 'insights', 'personnel', 'users', 'renovation', 'expansion'];
      
      if (!validSections.includes(section)) {
        throw new Error(`Invalid section: ${section}`);
      }

      // Start loading
      this.loadingManager.startLoading(`section-${section}`, {
        message: `Loading ${section} section...`
      });

      // Update state
      this.stateManager.set('currentSection', section);
      
      // Update navigation state
      this.updateNavigationState(section);
      
      // Load section data
      await this.loadSectionData(section);
      
      // Update URL
      window.location.hash = `#${section}`;
      
      // Stop loading
      this.loadingManager.stopLoading(`section-${section}`, {
        success: true,
        message: `${section} section loaded`
      });
      
      // Announce to screen readers
      this.accessibility.announce(`${section} section loaded`, 'status');
      
    } catch (error) {
      this.loadingManager.stopLoading(`section-${section}`, {
        success: false,
        message: `Failed to load ${section} section`
      });
      this.errorHandler.handleError(error, 'Navigation');
      this.logger.error(`Navigation to ${section} failed`, { section }, error);
    }
  }

  /**
   * Update navigation state
   * @param {string} activeSection - Active section
   */
  updateNavigationState(activeSection) {
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      link.setAttribute('aria-current', 'false');
    });

    // Add active class to current section
    const activeLink = document.querySelector(`[href="#${activeSection}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
      activeLink.setAttribute('aria-current', 'page');
    }

    // Hide all sections
    document.querySelectorAll('main > div[id]').forEach(section => {
      section.style.display = 'none';
      section.setAttribute('aria-hidden', 'true');
    });

    // Show active section
    const activeSectionElement = document.getElementById(activeSection);
    if (activeSectionElement) {
      activeSectionElement.style.display = 'block';
      activeSectionElement.setAttribute('aria-hidden', 'false');
      
      // Focus first focusable element in the section
      this.accessibility.focusFirst(activeSectionElement);
    }
  }

  /**
   * Load section data
   * @param {string} section - Section to load data for
   */
  async loadSectionData(section) {
    try {
      this.logger.info(`Loading section data: ${section}`);
      
      switch (section) {
        case 'overview':
          await this.loadOverviewData();
          break;
        case 'reports':
          await this.loadReportsData();
          break;
        case 'analytics':
          await this.loadAnalyticsData();
          break;
        case 'personnel':
          await this.loadPersonnelData();
          break;
        default:
          // Load basic section data
          await this.loadBasicSectionData(section);
      }
      
      this.logger.info(`Section data loaded: ${section}`);
      
    } catch (error) {
      this.errorHandler.handleError(error, `Section Data Loading: ${section}`);
      this.logger.error(`Failed to load section data: ${section}`, { section }, error);
    }
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoadingState(isLoading) {
    this.stateManager.set('isLoading', isLoading);
    
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'block' : 'none';
      loadingIndicator.setAttribute('aria-busy', isLoading.toString());
    }
  }

  /**
   * Handle form submission
   * @param {HTMLFormElement} form - Form element
   */
  async handleFormSubmit(form) {
    try {
      this.logger.userAction('form_submit', { 
        formId: form.id,
        action: form.dataset.action 
      });
      
      // Start loading
      this.loadingManager.startLoading(`form-${form.id}`, {
        element: form,
        message: 'Processing form...'
      });
      
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      
      // Validate form data
      const validation = this.validateFormData(data, form.dataset.schema);
      
      if (!validation.valid) {
        const errorMessage = `Form validation failed: ${Object.values(validation.errors).join(', ')}`;
        this.errorHandler.handleError(errorMessage, 'Form Submission');
        this.logger.warn('Form validation failed', { 
          formId: form.id,
          errors: validation.errors 
        });
        return;
      }
      
      // Process form data
      await this.processFormData(validation.sanitized, form.dataset.action);
      
      // Stop loading
      this.loadingManager.stopLoading(`form-${form.id}`, {
        success: true,
        message: 'Form submitted successfully'
      });
      
      this.errorHandler.showSuccess('Form submitted successfully');
      this.logger.info('Form submitted successfully', { 
        formId: form.id,
        action: form.dataset.action 
      });
      
    } catch (error) {
      this.loadingManager.stopLoading(`form-${form.id}`, {
        success: false,
        message: 'Form submission failed'
      });
      this.errorHandler.handleError(error, 'Form Submission');
      this.logger.error('Form submission failed', { 
        formId: form.id,
        action: form.dataset.action 
      }, error);
    }
  }

  /**
   * Validate form data
   * @param {Object} data - Form data
   * @param {string} schema - Validation schema
   * @returns {Object} Validation result
   */
  validateFormData(data, schema) {
    try {
      const schemaObj = schema ? JSON.parse(schema) : {};
      return this.validator.validateForm(data, schemaObj);
    } catch (error) {
      this.errorHandler.handleError(error, 'Form Validation');
      return { valid: false, errors: { general: 'Validation schema error' } };
    }
  }

  /**
   * Process form data
   * @param {Object} data - Sanitized form data
   * @param {string} action - Form action
   */
  async processFormData(data, action) {
    switch (action) {
      case 'fuel-data':
        await this.processFuelData(data);
        break;
      case 'report-upload':
        await this.processReportUpload(data);
        break;
      default:
        throw new Error(`Unknown form action: ${action}`);
    }
  }

  /**
   * Process fuel data
   * @param {Object} data - Fuel data
   */
  async processFuelData(data) {
    this.logger.info('Processing fuel data', { dataKeys: Object.keys(data) });
    
    const validation = this.validator.validateFuelData(data);
    
    if (!validation.valid) {
      throw new Error(`Fuel data validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Process validated data
    this.stateManager.set('fuelData', validation.sanitized, { persist: true });
    await this.updateMetrics();
    
    this.logger.info('Fuel data processed successfully');
  }

  /**
   * Process report upload
   * @param {Object} data - Upload data
   */
  async processReportUpload(data) {
    // Handle file upload with validation
    const file = data.file;
    const validation = this.validator.validateFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['.pdf']
    });
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    // Process file upload
    await this.uploadReport(file);
  }

  /**
   * Update metrics display
   */
  async updateMetrics() {
    try {
      this.logger.info('Updating metrics display');
      
      const metrics = this.calculateMetrics();
      
      // Update state
      this.stateManager.set('metrics', metrics);
      
      // Update metric displays with safe content setting
      Object.entries(metrics).forEach(([key, value]) => {
        const element = document.getElementById(`${key}-metric`);
        if (element) {
          this.validator.safeSetContent(element, this.formatMetricValue(value), 'textContent');
        }
      });
      
      this.logger.info('Metrics updated successfully', { metricCount: Object.keys(metrics).length });
      
    } catch (error) {
      this.errorHandler.handleError(error, 'Metrics Update');
      this.logger.error('Failed to update metrics', {}, error);
    }
  }

  /**
   * Calculate metrics from data
   * @returns {Object} Calculated metrics
   */
  calculateMetrics() {
    const fuel = this.stateManager.get('fuelData') || {};
    
    return {
      totalRevenue: (fuel.dieselSell * fuel.dieselVolume) + (fuel.petrolSell * fuel.petrolVolume) + (fuel.shopRevenue || 0),
      totalProfit: this.calculateProfit(fuel),
      fuelVolume: (fuel.dieselVolume || 0) + (fuel.petrolVolume || 0),
      shopRevenuePerLiter: fuel.shopRevenue / ((fuel.dieselVolume || 0) + (fuel.petrolVolume || 0)) || 0
    };
  }

  /**
   * Calculate profit
   * @param {Object} fuel - Fuel data
   * @returns {number} Calculated profit
   */
  calculateProfit(fuel) {
    const dieselProfit = (fuel.dieselSell - fuel.dieselCost) * fuel.dieselVolume;
    const petrolProfit = (fuel.petrolSell - fuel.petrolCost) * fuel.petrolVolume;
    const shopProfit = fuel.shopRevenue * 0.3; // Assume 30% profit margin
    
    return dieselProfit + petrolProfit + shopProfit;
  }

  /**
   * Format metric value
   * @param {number} value - Value to format
   * @returns {string} Formatted value
   */
  formatMetricValue(value) {
    if (typeof value !== 'number') return '0';
    
    if (value >= 1000000) {
      return `R ${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `R ${(value / 1000).toFixed(1)}K`;
    } else {
      return `R ${value.toFixed(0)}`;
    }
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      this.logger.info('Loading initial data');
      
      // Load data from state manager (which handles localStorage)
      const fuelData = this.stateManager.get('fuelData');
      if (fuelData && Object.keys(fuelData).length > 0) {
        await this.updateMetrics();
        this.logger.info('Initial data loaded from state');
      } else {
        this.logger.info('No initial data found, starting with empty state');
      }
      
    } catch (error) {
      this.errorHandler.handleError(error, 'Initial Data Loading');
      this.logger.error('Failed to load initial data', {}, error);
    }
  }

  /**
   * Refresh data
   */
  async refreshData() {
    try {
      this.logger.userAction('refresh_data', { 
        section: this.stateManager.get('currentSection') 
      });
      
      // Start loading
      this.loadingManager.startLoading('data-refresh', {
        global: true,
        message: 'Refreshing data...'
      });
      
      // Reload current section data
      const currentSection = this.stateManager.get('currentSection');
      await this.loadSectionData(currentSection);
      
      // Stop loading
      this.loadingManager.stopLoading('data-refresh', {
        success: true,
        message: 'Data refreshed successfully'
      });
      
      this.errorHandler.showSuccess('Data refreshed successfully');
      this.logger.info('Data refreshed successfully', { section: currentSection });
      
    } catch (error) {
      this.loadingManager.stopLoading('data-refresh', {
        success: false,
        message: 'Data refresh failed'
      });
      this.errorHandler.handleError(error, 'Data Refresh');
      this.logger.error('Data refresh failed', {}, error);
    }
  }

  /**
   * Cleanup dashboard
   */
  cleanup() {
    this.logger.info('Cleaning up dashboard');
    
    // Cleanup charts
    const charts = this.stateManager.get('charts') || new Map();
    charts.forEach(chart => {
      if (chart && typeof chart.destroy === 'function') {
        chart.destroy();
      }
    });
    
    // Stop all loading operations
    this.loadingManager.stopAllLoading();
    
    // Log cleanup completion
    this.logger.info('Dashboard cleanup completed');
  }
}

// Export dashboard core
export default DashboardCore;
