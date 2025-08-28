/**
 * Fuel Analytics Website - Extensions Configuration
 * This file connects all utilities, components, and extensions for optimal functionality
 */

// Extension Manager - Main configuration
class ExtensionManager {
    constructor() {
        this.extensions = new Map();
        this.initialized = false;
        this.config = {
            debug: false,
            autoRefresh: true,
            cacheEnabled: true,
            realTimeUpdates: true,
            offlineSupport: true
        };
    }

    // Initialize all extensions
    async initialize() {
        if (this.initialized) return;
        
        console.log('🚀 Initializing Fuel Analytics Extensions...');
        
        try {
            // Core utilities
            await this.loadCoreExtensions();
            
            // Analytics extensions
            await this.loadAnalyticsExtensions();
            
            // Data management extensions
            await this.loadDataExtensions();
            
            // Performance extensions
            await this.loadPerformanceExtensions();
            
            // Accessibility extensions
            await this.loadAccessibilityExtensions();
            
            this.initialized = true;
            console.log('✅ All extensions initialized successfully');
            
            // Trigger initial data load
            this.triggerDataRefresh();
            
        } catch (error) {
            console.error('❌ Extension initialization failed:', error);
            this.handleExtensionError(error);
        }
    }

    // Load core utility extensions
    async loadCoreExtensions() {
        console.log('📦 Loading core extensions...');
        
        // State management
        if (typeof StateManager !== 'undefined') {
            this.extensions.set('stateManager', new StateManager());
            console.log('✅ State Manager loaded');
        }
        
        // Error handling
        if (typeof ErrorHandler !== 'undefined') {
            this.extensions.set('errorHandler', new ErrorHandler());
            console.log('✅ Error Handler loaded');
        }
        
        // Logging system
        if (typeof Logger !== 'undefined') {
            this.extensions.set('logger', new Logger());
            console.log('✅ Logger loaded');
        }
        
        // Data validation
        if (typeof Validator !== 'undefined') {
            this.extensions.set('validator', new Validator());
            console.log('✅ Validator loaded');
        }
    }

    // Load analytics extensions
    async loadAnalyticsExtensions() {
        console.log('📊 Loading analytics extensions...');
        
        // Analytics engine
        if (typeof AnalyticsEngine !== 'undefined') {
            this.extensions.set('analyticsEngine', new AnalyticsEngine());
            console.log('✅ Analytics Engine loaded');
        }
        
        // Reporting engine
        if (typeof ReportingEngine !== 'undefined') {
            this.extensions.set('reportingEngine', new ReportingEngine());
            console.log('✅ Reporting Engine loaded');
        }
        
        // Real-time data service
        if (typeof RealTimeDataService !== 'undefined') {
            this.extensions.set('realTimeDataService', new RealTimeDataService());
            console.log('✅ Real-time Data Service loaded');
        }
    }

    // Load data management extensions
    async loadDataExtensions() {
        console.log('💾 Loading data extensions...');
        
        // Cache manager
        if (typeof CacheManager !== 'undefined') {
            this.extensions.set('cacheManager', new CacheManager());
            console.log('✅ Cache Manager loaded');
        }
        
        // Memory manager
        if (typeof MemoryManager !== 'undefined') {
            this.extensions.set('memoryManager', new MemoryManager());
            console.log('✅ Memory Manager loaded');
        }
        
        // Database schema
        if (typeof DatabaseSchema !== 'undefined') {
            this.extensions.set('databaseSchema', new DatabaseSchema());
            console.log('✅ Database Schema loaded');
        }
        
        // Data integration plan
        if (typeof DataIntegrationPlan !== 'undefined') {
            this.extensions.set('dataIntegrationPlan', new DataIntegrationPlan());
            console.log('✅ Data Integration Plan loaded');
        }
        
        // Sample data generator
        if (typeof SampleDataGenerator !== 'undefined') {
            this.extensions.set('sampleDataGenerator', new SampleDataGenerator());
            console.log('✅ Sample Data Generator loaded');
        }
    }

    // Load performance extensions
    async loadPerformanceExtensions() {
        console.log('⚡ Loading performance extensions...');
        
        // Performance optimizer
        if (typeof PerformanceOptimizer !== 'undefined') {
            this.extensions.set('performanceOptimizer', new PerformanceOptimizer());
            console.log('✅ Performance Optimizer loaded');
        }
        
        // Offline manager
        if (typeof OfflineManager !== 'undefined') {
            this.extensions.set('offlineManager', new OfflineManager());
            console.log('✅ Offline Manager loaded');
        }
    }

    // Load accessibility extensions
    async loadAccessibilityExtensions() {
        console.log('♿ Loading accessibility extensions...');
        
        // Accessibility manager
        if (typeof AccessibilityManager !== 'undefined') {
            this.extensions.set('accessibilityManager', new AccessibilityManager());
            console.log('✅ Accessibility Manager loaded');
        }
    }

    // Get extension by name
    getExtension(name) {
        return this.extensions.get(name);
    }

    // Trigger data refresh across all extensions
    triggerDataRefresh() {
        console.log('🔄 Triggering data refresh...');
        
        // Refresh real-time data
        const realTimeService = this.getExtension('realTimeDataService');
        if (realTimeService && realTimeService.refresh) {
            realTimeService.refresh();
        }
        
        // Refresh cache
        const cacheManager = this.getExtension('cacheManager');
        if (cacheManager && cacheManager.refresh) {
            cacheManager.refresh();
        }
        
        // Update analytics
        const analyticsEngine = this.getExtension('analyticsEngine');
        if (analyticsEngine && analyticsEngine.updateAnalytics) {
            analyticsEngine.updateAnalytics();
        }
    }

    // Handle extension errors
    handleExtensionError(error) {
        const errorHandler = this.getExtension('errorHandler');
        if (errorHandler && errorHandler.handleError) {
            errorHandler.handleError(error);
        } else {
            console.error('Extension error:', error);
        }
    }

    // Get extension status
    getStatus() {
        return {
            initialized: this.initialized,
            extensionCount: this.extensions.size,
            extensions: Array.from(this.extensions.keys()),
            config: this.config
        };
    }
}

// Chart.js Extensions Configuration
const ChartExtensions = {
    // Custom chart plugins
    plugins: {
        // Tooltip customization
        tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#4f46e5',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += new Intl.NumberFormat('en-ZA', {
                            style: 'currency',
                            currency: 'ZAR'
                        }).format(context.parsed.y);
                    }
                    return label;
                }
            }
        },
        
        // Legend customization
        legend: {
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    family: 'Inter, sans-serif',
                    size: 12
                }
            }
        }
    },
    
    // Global chart options
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        },
        interaction: {
            intersect: false,
            mode: 'index'
        }
    }
};

// Supabase Extensions Configuration
const SupabaseExtensions = {
    // Real-time subscriptions
    subscriptions: {
        fuelData: 'fuel_sales',
        shopData: 'shop_sales',
        analytics: 'analytics_data'
    },
    
    // Row Level Security policies
    rls: {
        enabled: true,
        policies: {
            fuel_sales: 'company_id = auth.jwt() ->> \'company_id\'',
            shop_sales: 'company_id = auth.jwt() ->> \'company_id\'',
            analytics_data: 'company_id = auth.jwt() ->> \'company_id\''
        }
    },
    
    // Storage configuration
    storage: {
        buckets: ['pdf-reports', 'exports', 'backups'],
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['application/pdf', 'text/csv', 'application/json']
    }
};

// Performance Extensions Configuration
const PerformanceExtensions = {
    // Caching strategies
    cache: {
        localStorage: {
            enabled: true,
            maxSize: 50 * 1024 * 1024, // 50MB
            ttl: 24 * 60 * 60 * 1000 // 24 hours
        },
        memory: {
            enabled: true,
            maxItems: 1000,
            ttl: 60 * 60 * 1000 // 1 hour
        }
    },
    
    // Lazy loading
    lazyLoading: {
        enabled: true,
        threshold: 0.1,
        rootMargin: '50px'
    },
    
    // Service worker
    serviceWorker: {
        enabled: true,
        scope: '/',
        cacheName: 'fuel-analytics-v1'
    }
};

// Accessibility Extensions Configuration
const AccessibilityExtensions = {
    // Keyboard navigation
    keyboard: {
        enabled: true,
        shortcuts: {
            'Alt+1': 'Go to Overview',
            'Alt+2': 'Go to Reports',
            'Alt+3': 'Go to Analytics',
            'Alt+4': 'Go to Insights',
            'Alt+R': 'Refresh data',
            'Alt+U': 'Upload file'
        }
    },
    
    // Screen reader support
    screenReader: {
        enabled: true,
        announcements: true,
        liveRegions: true
    },
    
    // High contrast mode
    highContrast: {
        enabled: false,
        toggle: true
    }
};

// Initialize extensions when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global extension manager
    window.extensionManager = new ExtensionManager();
    
    // Initialize extensions
    window.extensionManager.initialize().then(() => {
        console.log('🎉 Fuel Analytics Extensions ready!');
        
        // Apply Chart.js extensions
        if (typeof Chart !== 'undefined') {
            Chart.defaults.plugins = {
                ...Chart.defaults.plugins,
                ...ChartExtensions.plugins
            };
            Chart.defaults.options = {
                ...Chart.defaults.options,
                ...ChartExtensions.options
            };
        }
        
        // Set up performance monitoring
        if (window.extensionManager.getExtension('performanceOptimizer')) {
            window.extensionManager.getExtension('performanceOptimizer').startMonitoring();
        }
        
        // Initialize accessibility features
        if (window.extensionManager.getExtension('accessibilityManager')) {
            window.extensionManager.getExtension('accessibilityManager').initialize();
        }
        
    }).catch(error => {
        console.error('Failed to initialize extensions:', error);
    });
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ExtensionManager,
        ChartExtensions,
        SupabaseExtensions,
        PerformanceExtensions,
        AccessibilityExtensions
    };
}
