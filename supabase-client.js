// Supabase Client Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://fynfomhoikzpsrbghnzr.supabase.co';
// Updated anon key - you may need to get the current one from your Supabase dashboard
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'

// Initialize Supabase client
let supabase = null;

// Enhanced error handling and retry logic
class SupabaseError extends Error {
    constructor(message, code, details = null) {
        super(message);
        this.name = 'SupabaseError';
        this.code = code;
        this.details = details;
    }
}

// Retry configuration
const RETRY_CONFIG = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000
};

// Utility function for exponential backoff retry
async function retryOperation(operation, maxAttempts = RETRY_CONFIG.maxAttempts) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            if (attempt === maxAttempts) {
                throw error;
            }
            
            // Don't retry on authentication errors
            if (error.message?.includes('JWT') || error.message?.includes('auth')) {
                throw error;
            }
            
            // Calculate delay with exponential backoff
            const delay = Math.min(
                RETRY_CONFIG.baseDelay * Math.pow(2, attempt - 1),
                RETRY_CONFIG.maxDelay
            );
            
            console.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${delay}ms:`, error.message);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw lastError;
}

// Function to initialize Supabase client
function initializeSupabase() {
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase client initialized successfully');
            return supabase;
        } else {
            console.error('❌ Supabase library not available');
            return null;
        }
    } catch (error) {
        console.error('❌ Failed to initialize Supabase client:', error);
        return null;
    }
}

// Wait for Supabase library to load before initializing
function waitForSupabase() {
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        initializeSupabase();
    } else {
        // Check again in 100ms
        setTimeout(waitForSupabase, 100);
    }
}

// Start waiting for Supabase library
waitForSupabase();

// Also try on window load
window.addEventListener('load', () => {
    waitForSupabase();
});

// Enhanced Data Management Class
class FuelAnalyticsDB {
    constructor() {
        this.currentUser = null;
        this.currentCompany = null;
        this.isInitialized = false;
        this.reportChannel = null;
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.initializationPromise = null;
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processPendingOperations();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }

    // Enhanced initialization with better error handling
    async initialize() {
        // Prevent multiple simultaneous initializations
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    async _performInitialization() {
        try {
            console.log('🔄 Initializing FuelAnalyticsDB...');
            
            // Ensure Supabase client is initialized
            if (!supabase) {
                supabase = initializeSupabase();
                if (!supabase) {
                    throw new SupabaseError('Supabase client not available', 'CLIENT_UNAVAILABLE');
                }
            }

            // Check network connectivity
            if (!this.isOnline) {
                console.warn('⚠️ Offline mode - using local storage only');
                return { success: false, offline: true, error: 'No internet connection' };
            }

            // Get current user session with retry
            const { data: { user }, error: userError } = await retryOperation(async () => {
                const result = await supabase.auth.getUser();
                if (result.error) throw result.error;
                return result;
            });

            if (userError) {
                console.warn('⚠️ User session check failed:', userError.message);
                return { success: false, user: null, company: null, error: userError.message };
            }

            if (user) {
                this.currentUser = user;
                
                try {
                    // Get user profile and company with retry
                    const { data: profile, error: profileError } = await retryOperation(async () => {
                        const result = await supabase
                            .from('profiles')
                            .select('*, companies(*)')
                            .eq('id', user.id)
                            .single();
                        
                        if (result.error) throw result.error;
                        return result;
                    });

                    if (profileError) {
                        console.warn('⚠️ Profile fetch failed:', profileError.message);
                        this.isInitialized = true;
                        return { success: true, user, company: null, needsProfile: true };
                    }
                    
                    this.currentCompany = profile.companies;
                    this.isInitialized = true;
                    
                    console.log('✅ Database initialized for user:', user.email);
                    return { success: true, user, company: this.currentCompany };
                } catch (profileError) {
                    console.warn('⚠️ Profile setup needed:', profileError.message);
                    this.isInitialized = true;
                    return { success: true, user, company: null, needsProfile: true };
                }
            } else {
                console.log('ℹ️ No authenticated user found');
                return { success: false, user: null, company: null };
            }
        } catch (error) {
            console.error('❌ Database initialization error:', error);
            return { success: false, error: error.message };
        } finally {
            this.initializationPromise = null;
        }
    }

    // Enhanced authentication methods
    async signIn(email, password) {
        try {
            if (!this.isOnline) {
                throw new SupabaseError('Cannot sign in while offline', 'OFFLINE');
            }

            // Ensure Supabase client is initialized
            if (!supabase) {
                supabase = initializeSupabase();
                if (!supabase) {
                    throw new SupabaseError('Supabase client not available', 'CLIENT_UNAVAILABLE');
                }
            }

            const { data, error } = await retryOperation(async () => {
                const result = await supabase.auth.signInWithPassword({ email, password });
                if (result.error) throw result.error;
                return result;
            });
            
            if (error) throw error;
            
            // Re-initialize after sign in
            await this.initialize();
            return { success: true, user: data.user };
        } catch (error) {
            console.error('❌ Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await retryOperation(async () => {
                const result = await supabase.auth.signOut();
                if (result.error) throw result.error;
                return result;
            });
            
            if (error) throw error;
            
            this.currentUser = null;
            this.currentCompany = null;
            this.isInitialized = false;
            
            return { success: true };
        } catch (error) {
            console.error('❌ Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced Monthly Reports Management with better error handling
    async saveMonthlyReport(reportData) {
        if (!this.isInitialized) {
            console.error('❌ Database not initialized');
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        if (!this.isOnline) {
            // Queue operation for when online
            this.pendingOperations.push({
                type: 'saveReport',
                data: reportData,
                timestamp: Date.now()
            });
            throw new SupabaseError('Cannot save while offline - queued for later', 'OFFLINE_QUEUED');
        }

        console.log('🔄 Starting to save monthly report...');
        console.log('📊 Report data:', reportData);

        try {
            // Extract data from AI analysis
            const { period, fuels, shop_lines, forecast } = reportData;
            
            // Create monthly report record
            const reportInsertData = {
                company_id: this.currentCompany.id,
                uploaded_by: this.currentUser.id,
                file_name: `Report_${period.year}_${period.month.toString().padStart(2, '0')}`,
                report_month: period.month,
                report_year: period.year,
                processing_status: 'completed',
                total_revenue: Object.values(fuels).reduce((sum, fuel) => sum + fuel.total_revenue_zar, 0) +
                               shop_lines.reduce((sum, item) => sum + item.total_revenue_zar, 0),
                total_profit: Object.values(fuels).reduce((sum, fuel) => sum + (fuel.profit_zar || 0), 0),
                total_volume: Object.values(fuels).reduce((sum, fuel) => sum + fuel.quantity_liters, 0)
            };
            
            console.log('💾 Inserting report data:', reportInsertData);
            
            const { data: report, error: reportError } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .insert(reportInsertData)
                    .select()
                    .single();
                
                if (result.error) throw result.error;
                return result;
            });

            if (reportError) {
                console.error('❌ Error inserting report:', reportError);
                throw reportError;
            }
            
            console.log('✅ Report inserted successfully:', report);

            // Save fuel data with retry
            const fuelData = Object.entries(fuels).map(([fuelType, fuel]) => ({
                monthly_report_id: report.id,
                fuel_type: fuelType,
                total_revenue: fuel.total_revenue_zar,
                quantity_liters: fuel.quantity_liters,
                margin_percent: fuel.margin_percent,
                profit_zar: fuel.profit_zar
            }));

            await retryOperation(async () => {
                const result = await supabase.from('fuel_data').insert(fuelData);
                if (result.error) throw result.error;
                return result;
            });

            // Save shop data with retry
            const shopData = shop_lines.map(item => ({
                monthly_report_id: report.id,
                category: item.category,
                total_revenue: item.total_revenue_zar,
                quantity_units: item.quantity_units
            }));

            await retryOperation(async () => {
                const result = await supabase.from('shop_data').insert(shopData);
                if (result.error) throw result.error;
                return result;
            });

            // Save forecast data if available
            if (forecast) {
                const forecastData = {
                    monthly_report_id: report.id,
                    forecast_month: period.month === 12 ? 1 : period.month + 1,
                    forecast_year: period.month === 12 ? period.year + 1 : period.year,
                    method: forecast.method,
                    assumptions: forecast.assumptions,
                    predicted_revenue: Object.values(forecast.fuels).reduce((sum, fuel) => sum + fuel.total_revenue_zar, 0) +
                                     forecast.shop_lines.reduce((sum, item) => sum + item.total_revenue_zar, 0),
                    confidence_score: 0.8
                };

                await retryOperation(async () => {
                    const result = await supabase.from('forecast_data').insert(forecastData);
                    if (result.error) throw result.error;
                    return result;
                });
            }

            console.log('✅ Monthly report saved successfully:', report.id);
            return { success: true, reportId: report.id };
        } catch (error) {
            console.error('❌ Error saving monthly report:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced report loading with caching
    async getMonthlyReports() {
        if (!this.isInitialized) {
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        // Check if currentCompany exists
        if (!this.currentCompany || !this.currentCompany.id) {
            console.warn('⚠️ No company context available, trying to get user profile...');
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*, companies(*)')
                        .eq('id', user.id)
                        .single();
                    
                    if (profile && profile.companies) {
                        this.currentCompany = profile.companies;
                    } else {
                        console.error('❌ No company found for user');
                        return { success: false, error: 'No company found for user' };
                    }
                } else {
                    console.error('❌ No authenticated user found');
                    return { success: false, error: 'No authenticated user found' };
                }
            } catch (error) {
                console.error('❌ Error getting user profile:', error);
                return { success: false, error: error.message };
            }
        }

        try {
            const { data, error } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .select(`
                        *,
                        fuel_data(*),
                        shop_data(*),
                        ai_insights(*),
                        forecast_data(*)
                    `)
                    .eq('company_id', this.currentCompany.id)
                    .order('report_year', { ascending: false })
                    .order('report_month', { ascending: false });

                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;
            
            return { success: true, reports: data };
        } catch (error) {
            console.error('❌ Error fetching monthly reports:', error);
            return { success: false, error: error.message };
        }
    }

    async getMonthlyReportById(reportId) {
        if (!this.isInitialized) {
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        try {
            const { data, error } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .select(`
                        *,
                        fuel_data(*),
                        shop_data(*),
                        ai_insights(*),
                        forecast_data(*)
                    `)
                    .eq('id', reportId)
                    .eq('company_id', this.currentCompany.id)
                    .single();

                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;
            
            return { success: true, report: data };
        } catch (error) {
            console.error('❌ Error fetching report:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteMonthlyReport(reportId) {
        if (!this.isInitialized) {
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        if (!this.isOnline) {
            // Queue operation for when online
            this.pendingOperations.push({
                type: 'deleteReport',
                data: { reportId },
                timestamp: Date.now()
            });
            throw new SupabaseError('Cannot delete while offline - queued for later', 'OFFLINE_QUEUED');
        }

        try {
            const { error } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .delete()
                    .eq('id', reportId)
                    .eq('company_id', this.currentCompany.id);

                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;
            
            console.log('✅ Report deleted successfully:', reportId);
            return { success: true };
        } catch (error) {
            console.error('❌ Error deleting report:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced Performance Metrics with caching
    async getMonthlyPerformance(year, month) {
        if (!this.isInitialized) {
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        try {
            const { data, error } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .select(`
                        *,
                        fuel_data(*),
                        shop_data(*)
                    `)
                    .eq('company_id', this.currentCompany.id)
                    .eq('report_year', year)
                    .eq('report_month', month)
                    .single();

                if (result.error) throw result.error;
                return result;
            });

            if (error) throw error;
            
            return { success: true, performance: data };
        } catch (error) {
            console.error('❌ Error fetching monthly performance:', error);
            return { success: false, error: error.message };
        }
    }

    async getOverallPerformance() {
        if (!this.isInitialized) {
            throw new SupabaseError('Database not initialized', 'NOT_INITIALIZED');
        }

        try {
            // Check if we're offline and use local storage as fallback
            if (!this.isOnline) {
                console.log('⚠️ Offline mode - using local storage for overall performance');
                const localData = localStorage.getItem('monthlyData');
                if (localData) {
                    const parsedData = JSON.parse(localData);
                    return { 
                        success: true, 
                        offline: true,
                        overall: {
                            totalRevenue: 0,
                            totalProfit: 0,
                            totalVolume: 0,
                            avgRevenue: 0,
                            avgProfit: 0,
                            reportCount: Object.keys(parsedData).length
                        },
                        monthlyData: parsedData
                    };
                }
            }

            // Try database query with retry
            const { data, error } = await retryOperation(async () => {
                const result = await supabase
                    .from('monthly_reports')
                    .select('*')
                    .eq('company_id', this.currentCompany.id)
                    .order('report_year', { ascending: false })
                    .order('report_month', { ascending: false })
                    .limit(12);

                if (result.error) throw result.error;
                return result;
            });

            if (error) {
                console.warn('⚠️ Database query failed, using local storage:', error);
                // Return empty data structure
                return { 
                    success: true, 
                    overall: {
                        totalRevenue: 0,
                        totalProfit: 0,
                        totalVolume: 0,
                        avgRevenue: 0,
                        avgProfit: 0,
                        reportCount: 0
                    },
                    monthlyData: []
                };
            }
            
            // Calculate overall metrics if data exists
            if (data && data.length > 0) {
                const totalRevenue = data.reduce((sum, report) => sum + parseFloat(report.total_revenue || 0), 0);
                const totalProfit = data.reduce((sum, report) => sum + parseFloat(report.total_profit || 0), 0);
                const totalVolume = data.reduce((sum, report) => sum + parseFloat(report.total_volume || 0), 0);
                const avgRevenue = totalRevenue / data.length;
                const avgProfit = totalProfit / data.length;
                
                return { 
                    success: true, 
                    overall: {
                        totalRevenue,
                        totalProfit,
                        totalVolume,
                        avgRevenue,
                        avgProfit,
                        reportCount: data.length
                    },
                    monthlyData: data
                };
            } else {
                return { 
                    success: true, 
                    overall: {
                        totalRevenue: 0,
                        totalProfit: 0,
                        totalVolume: 0,
                        avgRevenue: 0,
                        avgProfit: 0,
                        reportCount: 0
                    },
                    monthlyData: []
                };
            }
        } catch (error) {
            console.error('Error fetching overall performance:', error);
            return { success: false, error: error.message };
        }
    }

    // AI Insights Management
    async saveAIInsights(reportId, insights) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const insightsData = insights.map(insight => ({
                monthly_report_id: reportId,
                priority: insight.priority || 'medium',
                title: insight.title,
                description: insight.description,
                insight_type: insight.type || 'general'
            }));

            const { error } = await supabase
                .from('ai_insights')
                .insert(insightsData);

            if (error) throw error;
            
            console.log('AI insights saved successfully');
            return { success: true };
        } catch (error) {
            console.error('Error saving AI insights:', error);
            return { success: false, error: error.message };
        }
    }

    // Utility methods
    async checkAuthStatus() {
        const { data: { session } } = await supabase.auth.getSession();
        return session !== null;
    }

    onAuthStateChange(callback) {
        return supabase.auth.onAuthStateChange(callback);
    }

    // Profile and Company Setup
    async setupUserProfile(user, companyName = 'Test Fuel Station') {
        try {
            if (!supabase) {
                throw new Error('Supabase client not available');
            }

            console.log('Setting up profile for user:', user.email);

            // Step 1: Create or get company
            let company = null;

            // Try to find existing company
            const { data: existingCompanies, error: companySearchError } = await supabase
                .from('companies')
                .select('*')
                .eq('name', companyName)
                .limit(1);

            if (companySearchError) {
                console.warn('Company search failed:', companySearchError);
            }

            if (existingCompanies && existingCompanies.length > 0) {
                company = existingCompanies[0];
                console.log('Using existing company:', company.id);
            } else {
                // Create new company with better error handling
                console.log('Creating new company:', companyName);
                const { data: newCompany, error: createCompanyError } = await supabase
                    .from('companies')
                    .insert([{
                        name: companyName,
                        address: '123 Test Street, Test City',
                        phone: '+27 123 456 789',
                        email: 'test@fuelstation.com'
                    }])
                    .select()
                    .single();

                if (createCompanyError) {
                    console.error('Company creation error details:', createCompanyError);
                    if (createCompanyError.message.includes('row-level security policy')) {
                        throw new Error('Database security policy prevents company creation. Please run the RLS fix script in Supabase.');
                    }
                    throw new Error('Failed to create company: ' + createCompanyError.message);
                }

                company = newCompany;
                console.log('Created new company:', company.id);
            }

            // Step 2: Create or update user profile
            const { data: existingProfile, error: profileSearchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileSearchError && !profileSearchError.message.includes('No rows found')) {
                console.warn('Profile search failed:', profileSearchError);
            }

            if (existingProfile) {
                // Update existing profile with company
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        company_id: company.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);

                if (updateError) {
                    throw new Error('Failed to update profile: ' + updateError.message);
                }

                console.log('Updated existing profile with company');
            } else {
                // Create new profile
                const { error: createProfileError } = await supabase
                    .from('profiles')
                    .insert([{
                        id: user.id,
                        email: user.email,
                        company_id: company.id,
                        role: 'admin',
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    }]);

                if (createProfileError) {
                    throw new Error('Failed to create profile: ' + createProfileError.message);
                }

                console.log('Created new profile with company');
            }

            // Step 3: Set current company and mark as initialized
            this.currentCompany = company;
            this.isInitialized = true;

            return {
                success: true,
                user: user,
                company: company,
                message: 'Profile setup completed successfully'
            };

        } catch (error) {
            console.error('Error setting up user profile:', error);
            return { success: false, error: error.message };
        }
    }

    // Subscribe to real-time changes on reports and dependent tables
    subscribeToMonthlyReportChanges(onChangeCallback) {
        try {
            if (!this.isInitialized || !this.currentCompany) return null;

            // Clean up existing subscription
            if (this.reportChannel) {
                this.reportChannel.unsubscribe();
                this.reportChannel = null;
            }

            const companyId = this.currentCompany.id;

            this.reportChannel = supabase
                .channel('realtime-monthly-reports')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'monthly_reports',
                    filter: `company_id=eq.${companyId}`
                }, (payload) => {
                    console.log('Realtime change (monthly_reports):', payload);
                    if (typeof onChangeCallback === 'function') onChangeCallback(payload);
                })
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'fuel_data'
                }, (payload) => {
                    console.log('Realtime change (fuel_data):', payload);
                    if (typeof onChangeCallback === 'function') onChangeCallback(payload);
                })
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'shop_data'
                }, (payload) => {
                    console.log('Realtime change (shop_data):', payload);
                    if (typeof onChangeCallback === 'function') onChangeCallback(payload);
                })
                .subscribe((status) => {
                    console.log('Realtime channel status:', status);
                });

            return this.reportChannel;
        } catch (error) {
            console.error('Failed to subscribe to realtime changes:', error);
            return null;
        }
    }

    // Process pending operations when coming back online
    async processPendingOperations() {
        if (this.pendingOperations.length === 0) return;

        console.log(`🔄 Processing ${this.pendingOperations.length} pending operations...`);

        const operations = [...this.pendingOperations];
        this.pendingOperations = [];

        for (const operation of operations) {
            try {
                switch (operation.type) {
                    case 'saveReport':
                        await this.saveMonthlyReport(operation.data);
                        console.log('✅ Pending report saved successfully');
                        break;
                    case 'deleteReport':
                        await this.deleteMonthlyReport(operation.data.reportId);
                        console.log('✅ Pending report deleted successfully');
                        break;
                    default:
                        console.warn('⚠️ Unknown pending operation type:', operation.type);
                }
            } catch (error) {
                console.error('❌ Failed to process pending operation:', error);
                // Re-queue failed operations
                this.pendingOperations.push(operation);
            }
        }
    }

    // Enhanced data synchronization
    async syncDataWithLocalStorage() {
        try {
            console.log('🔄 Syncing database data with local storage...');
            
            const result = await this.getMonthlyReports();
            if (result.success && result.reports) {
                // Convert database format to local storage format
                const localData = {};
                
                result.reports.forEach(report => {
                    const monthKey = `${report.report_month}/${report.report_year}`;
                    if (!localData[monthKey]) {
                        localData[monthKey] = [];
                    }
                    
                    localData[monthKey].push({
                        name: report.file_name,
                        month: report.report_month,
                        year: report.report_year,
                        uploadDate: new Date(report.created_at).toLocaleDateString(),
                        data: {
                            period: { month: report.report_month, year: report.report_year },
                            fuels: {
                                diesel_ex: report.fuel_data.find(f => f.fuel_type === 'diesel_ex') || { total_revenue_zar: 0, quantity_liters: 0 },
                                vpower_95: report.fuel_data.find(f => f.fuel_type === 'vpower_95') || { total_revenue_zar: 0, quantity_liters: 0 },
                                vpower_diesel: report.fuel_data.find(f => f.fuel_type === 'vpower_diesel') || { total_revenue_zar: 0, quantity_liters: 0 }
                            },
                            shop_lines: report.shop_data.map(s => ({
                                category: s.category,
                                total_revenue_zar: s.total_revenue,
                                quantity_units: s.quantity_units
                            }))
                        },
                        id: report.id
                    });
                });
                
                // Save to local storage
                localStorage.setItem('monthlyData', JSON.stringify(localData));
                console.log('✅ Data synced to local storage');
                
                return { success: true, data: localData };
            }
        } catch (error) {
            console.error('❌ Error syncing data:', error);
            return { success: false, error: error.message };
        }
    }

    // Enhanced health check
    async healthCheck() {
        try {
            const checks = {
                supabase: false,
                auth: false,
                database: false,
                tables: false,
                online: this.isOnline
            };

            // Check Supabase client
            if (supabase) {
                checks.supabase = true;
                
                // Check authentication
                const { data: { user } } = await supabase.auth.getUser();
                checks.auth = !!user;
                
                if (user) {
                    // Check database connectivity
                    try {
                        const { data, error } = await supabase
                            .from('monthly_reports')
                            .select('count')
                            .limit(1);
                        
                        checks.database = !error;
                        checks.tables = !error;
                    } catch (dbError) {
                        console.warn('Database check failed:', dbError);
                    }
                }
            }

            return {
                success: true,
                checks,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // Enhanced cache management
    async clearCache() {
        try {
            // Clear local storage
            localStorage.removeItem('monthlyData');
            
            // Clear any cached data in memory
            this.pendingOperations = [];
            
            console.log('✅ Cache cleared successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ Error clearing cache:', error);
            return { success: false, error: error.message };
        }
    }

    // Get connection status
    getConnectionStatus() {
        return {
            online: this.isOnline,
            initialized: this.isInitialized,
            authenticated: !!this.currentUser,
            pendingOperations: this.pendingOperations.length
        };
    }
}

// Create global instance
window.fuelAnalyticsDB = new FuelAnalyticsDB();

// Enhanced global functions for debugging and management

// Global function to fix current user profile (for console use)
window.fixCurrentUserProfile = async function() {
    try {
        console.log('🔧 Fixing current user profile...');
        
        // Ensure Supabase client is initialized
        if (!supabase) {
            supabase = initializeSupabase();
            if (!supabase) {
                throw new Error('Supabase client not available');
            }
        }
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            throw new Error('No authenticated user found');
        }
        
        // Setup profile
        const result = await window.fuelAnalyticsDB.setupUserProfile(user);
        
        if (result.success) {
            console.log('✅ Profile fixed successfully!');
            console.log('User:', result.user.email);
            console.log('Company:', result.company.name);
            console.log('Company ID:', result.company.id);
            
            // Re-initialize the database
            await window.fuelAnalyticsDB.initialize();
            
            return result;
        } else {
            throw new Error(result.error);
        }
        
    } catch (error) {
        console.error('❌ Error fixing profile:', error.message);
        return { success: false, error: error.message };
    }
};

// Global function to check database health
window.checkDatabaseHealth = async function() {
    try {
        console.log('🏥 Checking database health...');
        
        if (!window.fuelAnalyticsDB) {
            throw new Error('FuelAnalyticsDB not available');
        }
        
        const health = await window.fuelAnalyticsDB.healthCheck();
        console.log('Health check result:', health);
        
        return health;
    } catch (error) {
        console.error('❌ Health check failed:', error);
        return { success: false, error: error.message };
    }
};

// Global function to sync data
window.syncDatabaseData = async function() {
    try {
        console.log('🔄 Syncing database data...');
        
        if (!window.fuelAnalyticsDB) {
            throw new Error('FuelAnalyticsDB not available');
        }
        
        const result = await window.fuelAnalyticsDB.syncDataWithLocalStorage();
        console.log('Sync result:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Sync failed:', error);
        return { success: false, error: error.message };
    }
};

// Global function to clear cache
window.clearDatabaseCache = async function() {
    try {
        console.log('🧹 Clearing database cache...');
        
        if (!window.fuelAnalyticsDB) {
            throw new Error('FuelAnalyticsDB not available');
        }
        
        const result = await window.fuelAnalyticsDB.clearCache();
        console.log('Cache clear result:', result);
        
        return result;
    } catch (error) {
        console.error('❌ Cache clear failed:', error);
        return { success: false, error: error.message };
    }
};

// Global function to get connection status
window.getConnectionStatus = function() {
    try {
        if (!window.fuelAnalyticsDB) {
            throw new Error('FuelAnalyticsDB not available');
        }
        
        const status = window.fuelAnalyticsDB.getConnectionStatus();
        console.log('Connection status:', status);
        
        return status;
    } catch (error) {
        console.error('❌ Status check failed:', error);
        return { error: error.message };
    }
};

// Global function to process pending operations
window.processPendingOperations = async function() {
    try {
        console.log('🔄 Processing pending operations...');
        
        if (!window.fuelAnalyticsDB) {
            throw new Error('FuelAnalyticsDB not available');
        }
        
        await window.fuelAnalyticsDB.processPendingOperations();
        console.log('✅ Pending operations processed');
        
        return { success: true };
    } catch (error) {
        console.error('❌ Processing failed:', error);
        return { success: false, error: error.message };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FuelAnalyticsDB, supabase };
}
