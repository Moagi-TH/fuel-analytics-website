// Supabase Client Configuration
// Replace these with your actual Supabase project credentials

const SUPABASE_URL = 'https://fynfomhoikzpsrbghnzr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';

// Initialize Supabase client
let supabase = null;

// Function to initialize Supabase client
function initializeSupabase() {
    if (window.supabase && !supabase) {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase client initialized');
    }
    return supabase;
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
            // Get current user session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError) throw userError;

            if (user) {
                this.currentUser = user;
                
                // Get user profile and company
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, companies(*)')
                    .eq('id', user.id)
                    .single();

                if (profileError) throw profileError;
                
                this.currentCompany = profile.companies;
                this.isInitialized = true;
                
                console.log('Database initialized for user:', user.email);
                return { success: true, user, company: this.currentCompany };
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
            throw new Error('Database not initialized');
        }

        try {
            // Extract data from AI analysis
            const { period, fuels, shop_lines, forecast } = reportData;
            
            // Create monthly report record
            const { data: report, error: reportError } = await supabase
                .from('monthly_reports')
                .insert({
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
                })
                .select()
                .single();

            if (reportError) throw reportError;

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
            const { data, error } = await supabase
                .from('monthly_reports')
                .select('total_revenue, total_profit, total_volume, report_month, report_year')
                .eq('company_id', this.currentCompany.id)
                .order('report_year', { ascending: false })
                .order('report_month', { ascending: false })
                .limit(12);

            if (error) throw error;
            
            // Calculate overall metrics
            const totalRevenue = data.reduce((sum, report) => sum + parseFloat(report.total_revenue), 0);
            const totalProfit = data.reduce((sum, report) => sum + parseFloat(report.total_profit), 0);
            const totalVolume = data.reduce((sum, report) => sum + parseFloat(report.total_volume), 0);
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

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FuelAnalyticsDB, supabase };
}
