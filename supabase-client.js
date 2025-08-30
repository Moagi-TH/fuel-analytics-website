// Supabase Client Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://fynfomhoikzpsrbghnzr.supabase.co';
// Updated anon key - you may need to get the current one from your Supabase dashboard
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
// Initialize Supabase client
let supabase = null;

// Function to initialize Supabase client
function initializeSupabase() {
    try {
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
            return supabase;
        } else {
            console.error('Supabase library not available');
            return null;
        }
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        return null;
    }
}

// Try to initialize immediately
initializeSupabase();

// Also try on window load
window.addEventListener('load', () => {
    initializeSupabase();
});

// Data Management Class
class FuelAnalyticsDB {
    constructor() {
        this.currentUser = null;
        this.currentCompany = null;
        this.isInitialized = false;
        this.reportChannel = null;
    }

    // Initialize the database connection
    async initialize() {
        try {
            // Ensure Supabase client is initialized
            if (!supabase) {
                supabase = initializeSupabase();
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
            }

            // Get current user session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) {
                console.warn('User session check failed:', userError.message);
                // Don't throw error for auth issues, just return not authenticated
                return { success: false, user: null, company: null, error: userError.message };
            }

            if (user) {
                this.currentUser = user;
                
                try {
                    // Get user profile and company
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('*, companies(*)')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.warn('Profile fetch failed:', profileError.message);
                        // User exists but no profile - this is normal for new users
                        this.isInitialized = true;
                        return { success: true, user, company: null, needsProfile: true };
                    }
                    
                    this.currentCompany = profile.companies;
                    this.isInitialized = true;
                    
                    console.log('Database initialized for user:', user.email);
                    return { success: true, user, company: this.currentCompany };
                } catch (profileError) {
                    console.warn('Profile setup needed:', profileError.message);
                    this.isInitialized = true;
                    return { success: true, user, company: null, needsProfile: true };
                }
            } else {
                console.log('No authenticated user found');
                return { success: false, user: null, company: null };
            }
        } catch (error) {
            console.error('Database initialization error:', error);
            return { success: false, error: error.message };
        }
    }

    // Authentication methods
    async signIn(email, password) {
        try {
            // Ensure Supabase client is initialized
            if (!supabase) {
                supabase = initializeSupabase();
                if (!supabase) {
                    throw new Error('Supabase client not available');
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            
            // Re-initialize after sign in
            await this.initialize();
            return { success: true, user: data.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.currentCompany = null;
            this.isInitialized = false;
            
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Monthly Reports Management
    async saveMonthlyReport(reportData) {
        if (!this.isInitialized) {
            console.error('❌ Database not initialized');
            throw new Error('Database not initialized');
        }

        console.log('🔄 Starting to save monthly report...');
        console.log('📊 Report data:', reportData);
        console.log('🏢 Current company:', this.currentCompany);
        console.log('👤 Current user:', this.currentUser);

        try {
            // Extract data from AI analysis
            const { period, fuels, shop_lines, forecast } = reportData;
            
            console.log('📅 Period:', period);
            console.log('⛽ Fuels:', fuels);
            console.log('🛍️ Shop lines:', shop_lines);
            
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
            
            const { data: report, error: reportError } = await supabase
                .from('monthly_reports')
                .insert(reportInsertData)
                .select()
                .single();

            if (reportError) {
                console.error('❌ Error inserting report:', reportError);
                throw reportError;
            }
            
            console.log('✅ Report inserted successfully:', report);

            // Save fuel data
            const fuelData = Object.entries(fuels).map(([fuelType, fuel]) => ({
                monthly_report_id: report.id,
                fuel_type: fuelType,
                total_revenue: fuel.total_revenue_zar,
                quantity_liters: fuel.quantity_liters,
                margin_percent: fuel.margin_percent,
                profit_zar: fuel.profit_zar
            }));

            const { error: fuelError } = await supabase
                .from('fuel_data')
                .insert(fuelData);

            if (fuelError) throw fuelError;

            // Save shop data
            const shopData = shop_lines.map(item => ({
                monthly_report_id: report.id,
                category: item.category,
                total_revenue: item.total_revenue_zar,
                quantity_units: item.quantity_units
            }));

            const { error: shopError } = await supabase
                .from('shop_data')
                .insert(shopData);

            if (shopError) throw shopError;

            // Save forecast data
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

                const { error: forecastError } = await supabase
                    .from('forecast_data')
                    .insert(forecastData);

                if (forecastError) throw forecastError;
            }

            console.log('Monthly report saved successfully:', report.id);
            return { success: true, reportId: report.id };
        } catch (error) {
            console.error('Error saving monthly report:', error);
            return { success: false, error: error.message };
        }
    }

    async getMonthlyReports() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        // Check if currentCompany exists
        if (!this.currentCompany || !this.currentCompany.id) {
            console.warn('No company context available, trying to get user profile...');
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
                        console.error('No company found for user');
                        return { success: false, error: 'No company found for user' };
                    }
                } else {
                    console.error('No authenticated user found');
                    return { success: false, error: 'No authenticated user found' };
                }
            } catch (error) {
                console.error('Error getting user profile:', error);
                return { success: false, error: error.message };
            }
        }

        try {
            const { data, error } = await supabase
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

            if (error) throw error;
            
            return { success: true, reports: data };
        } catch (error) {
            console.error('Error fetching monthly reports:', error);
            return { success: false, error: error.message };
        }
    }

    async getMonthlyReportById(reportId) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const { data, error } = await supabase
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

            if (error) throw error;
            
            return { success: true, report: data };
        } catch (error) {
            console.error('Error fetching report:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteMonthlyReport(reportId) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const { error } = await supabase
                .from('monthly_reports')
                .delete()
                .eq('id', reportId)
                .eq('company_id', this.currentCompany.id);

            if (error) throw error;
            
            console.log('Report deleted successfully:', reportId);
            return { success: true };
        } catch (error) {
            console.error('Error deleting report:', error);
            return { success: false, error: error.message };
        }
    }

    // Performance Metrics
    async getMonthlyPerformance(year, month) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const { data, error } = await supabase
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

            if (error) throw error;
            
            return { success: true, performance: data };
        } catch (error) {
            console.error('Error fetching monthly performance:', error);
            return { success: false, error: error.message };
        }
    }

    async getOverallPerformance() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            // First try to get data from local storage as fallback
            const localData = localStorage.getItem('monthlyData');
            if (localData) {
                const parsedData = JSON.parse(localData);
                console.log('Using local storage data for overall performance');
                return { 
                    success: true, 
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

            // Try database query with error handling
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('*')
                .limit(12);

            if (error) {
                console.warn('Database query failed, using local storage:', error);
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
                // Create new company
                const { data: newCompany, error: createCompanyError } = await supabase
                    .from('companies')
                    .insert([{
                        name: companyName,
                        address: '123 Test Street, Test City',
                        phone: '+27 123 456 789',
                        email: 'test@fuelstation.com',
                        created_at: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (createCompanyError) {
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
}

// Create global instance
window.fuelAnalyticsDB = new FuelAnalyticsDB();

// Global function to fix current user profile (for console use)
window.fixCurrentUserProfile = async function() {
    try {
        console.log('Fixing current user profile...');
        
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FuelAnalyticsDB, supabase };
}
