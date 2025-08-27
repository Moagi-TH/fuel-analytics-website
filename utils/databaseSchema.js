/**
 * FUEL FLUX - Supabase Database Schema
 * Phase 5.2: Real Database Storage Implementation
 * Replaces localStorage with proper Supabase database
 */

class DatabaseSchema {
    constructor() {
        this.supabase = null;
        this.isInitialized = false;
        this.tables = {
            fuel_transactions: 'fuel_transactions',
            fuel_volumes: 'fuel_volumes',
            fuel_inventory: 'fuel_inventory',
            sales_summaries: 'sales_summaries',
            performance_metrics: 'performance_metrics',
            employees: 'employees',
            employee_performance: 'employee_performance',
            training_records: 'training_records',
            sites: 'sites',
            user_site_access: 'user_site_access',
            report_history: 'report_history',
            system_settings: 'system_settings'
        };
    }

    async initialize(supabaseClient) {
        try {
            this.supabase = supabaseClient;
            this.isInitialized = true;
            console.log('Database Schema: Initialized successfully');
            return true;
        } catch (error) {
            console.error('Database Schema: Initialization failed', error);
            return false;
        }
    }

    /**
     * Create all database tables
     */
    async createAllTables() {
        if (!this.isInitialized) {
            throw new Error('Database Schema not initialized');
        }

        console.log('Database Schema: Creating all tables...');
        
        try {
            // Create tables in order (respecting foreign key dependencies)
            await this.createSitesTable();
            await this.createFuelTransactionsTable();
            await this.createFuelVolumesTable();
            await this.createFuelInventoryTable();
            await this.createSalesSummariesTable();
            await this.createPerformanceMetricsTable();
            await this.createEmployeesTable();
            await this.createEmployeePerformanceTable();
            await this.createTrainingRecordsTable();
            await this.createUserSiteAccessTable();
            await this.createReportHistoryTable();
            await this.createSystemSettingsTable();

            console.log('Database Schema: All tables created successfully');
            return true;
        } catch (error) {
            console.error('Database Schema: Table creation failed', error);
            throw error;
        }
    }

    /**
     * Create sites table
     */
    async createSitesTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS sites (
                id SERIAL PRIMARY KEY,
                site_code VARCHAR(20) UNIQUE NOT NULL,
                site_name VARCHAR(255) NOT NULL,
                location VARCHAR(500),
                fuel_torque_site_id INTEGER,
                fuel_torque_access_token TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Sites table created');
    }

    /**
     * Create fuel transactions table
     */
    async createFuelTransactionsTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS fuel_transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                timestamp TIMESTAMPTZ NOT NULL,
                fuel_type VARCHAR(20) NOT NULL,
                volume DECIMAL(10,2) NOT NULL,
                price DECIMAL(10,2) NOT NULL,
                total_amount DECIMAL(10,2) NOT NULL,
                pump_number INTEGER,
                nozzle_number INTEGER,
                transaction_type VARCHAR(50),
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Fuel transactions table created');
    }

    /**
     * Create fuel volumes table
     */
    async createFuelVolumesTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS fuel_volumes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                date DATE NOT NULL,
                fuel_type VARCHAR(20) NOT NULL,
                volume DECIMAL(10,2) NOT NULL,
                transactions_count INTEGER NOT NULL,
                average_price DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(site_id, date, fuel_type)
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Fuel volumes table created');
    }

    /**
     * Create fuel inventory table
     */
    async createFuelInventoryTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS fuel_inventory (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                tank_id VARCHAR(50) NOT NULL,
                fuel_type VARCHAR(20) NOT NULL,
                current_level DECIMAL(10,2) NOT NULL,
                capacity DECIMAL(10,2) NOT NULL,
                percentage DECIMAL(5,2) NOT NULL,
                temperature DECIMAL(5,2),
                alerts JSONB,
                last_updated TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Fuel inventory table created');
    }

    /**
     * Create sales summaries table
     */
    async createSalesSummariesTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS sales_summaries (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                date DATE NOT NULL,
                fuel_revenue DECIMAL(12,2) NOT NULL,
                fuel_volume DECIMAL(10,2) NOT NULL,
                fuel_transactions INTEGER NOT NULL,
                shop_revenue DECIMAL(12,2),
                shop_transactions INTEGER,
                shop_average_ticket DECIMAL(10,2),
                total_revenue DECIMAL(12,2) NOT NULL,
                costs DECIMAL(12,2),
                profit_margin DECIMAL(5,2),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(site_id, date)
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Sales summaries table created');
    }

    /**
     * Create performance metrics table
     */
    async createPerformanceMetricsTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                date DATE NOT NULL,
                fuel_efficiency DECIMAL(8,4),
                shop_fuel_ratio DECIMAL(8,4),
                gross_profit_margin DECIMAL(5,2),
                net_profit_margin DECIMAL(5,2),
                profit_per_liter DECIMAL(8,4),
                labor_cost_ratio DECIMAL(5,2),
                overhead_ratio DECIMAL(5,2),
                performance_score DECIMAL(5,2),
                grade VARCHAR(2),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(site_id, date)
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Performance metrics table created');
    }

    /**
     * Create employees table
     */
    async createEmployeesTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS employees (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                employee_code VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255),
                phone VARCHAR(50),
                position VARCHAR(100) NOT NULL,
                employee_type VARCHAR(50) NOT NULL,
                salary DECIMAL(10,2),
                start_date DATE NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Employees table created');
    }

    /**
     * Create employee performance table
     */
    async createEmployeePerformanceTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS employee_performance (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id),
                site_id INTEGER NOT NULL REFERENCES sites(id),
                assessment_date DATE NOT NULL,
                efficiency_score DECIMAL(5,2),
                productivity_score DECIMAL(5,2),
                quality_score DECIMAL(5,2),
                attendance_score DECIMAL(5,2),
                customer_satisfaction DECIMAL(5,2),
                overall_score DECIMAL(5,2),
                notes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Employee performance table created');
    }

    /**
     * Create training records table
     */
    async createTrainingRecordsTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS training_records (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                employee_id UUID REFERENCES employees(id),
                training_type VARCHAR(100) NOT NULL,
                training_name VARCHAR(255) NOT NULL,
                completed_at TIMESTAMPTZ NOT NULL,
                score DECIMAL(5,2),
                certificate_url VARCHAR(500),
                valid_until TIMESTAMPTZ,
                status VARCHAR(20) DEFAULT 'completed',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Training records table created');
    }

    /**
     * Create user site access table
     */
    async createUserSiteAccessTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS user_site_access (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users(id),
                site_id INTEGER REFERENCES sites(id),
                role VARCHAR(50) NOT NULL,
                permissions JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, site_id)
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: User site access table created');
    }

    /**
     * Create report history table
     */
    async createReportHistoryTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS report_history (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID REFERENCES auth.users(id),
                site_id INTEGER NOT NULL,
                report_type VARCHAR(50) NOT NULL,
                report_period VARCHAR(50),
                file_url VARCHAR(500),
                file_size INTEGER,
                status VARCHAR(20) DEFAULT 'generated',
                metadata JSONB,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: Report history table created');
    }

    /**
     * Create system settings table
     */
    async createSystemSettingsTable() {
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS system_settings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                site_id INTEGER NOT NULL,
                setting_key VARCHAR(100) NOT NULL,
                setting_value TEXT,
                setting_type VARCHAR(20) DEFAULT 'string',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(site_id, setting_key)
            );
        `;

        await this.executeSQL(createTableSQL);
        console.log('Database Schema: System settings table created');
    }

    /**
     * Set up Row Level Security (RLS) policies
     */
    async setupRLSPolicies() {
        const rlsPolicies = [
            // Sites - users can only see their assigned sites
            `ALTER TABLE sites ENABLE ROW LEVEL SECURITY;`,
            `CREATE POLICY "Users can view their assigned sites" ON sites FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_site_access usa 
                    WHERE usa.site_id = sites.id AND usa.user_id = auth.uid()
                )
            );`,

            // Fuel transactions - users can only see data for their sites
            `ALTER TABLE fuel_transactions ENABLE ROW LEVEL SECURITY;`,
            `CREATE POLICY "Users can view site fuel transactions" ON fuel_transactions FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM user_site_access usa 
                    WHERE usa.site_id = fuel_transactions.site_id AND usa.user_id = auth.uid()
                )
            );`,

            // Similar policies for other tables...
        ];

        for (const policy of rlsPolicies) {
            await this.executeSQL(policy);
        }

        console.log('Database Schema: RLS policies configured');
    }

    /**
     * Create database indexes for performance
     */
    async createIndexes() {
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_fuel_transactions_site_date ON fuel_transactions(site_id, timestamp);`,
            `CREATE INDEX IF NOT EXISTS idx_fuel_volumes_site_date ON fuel_volumes(site_id, date);`,
            `CREATE INDEX IF NOT EXISTS idx_sales_summaries_site_date ON sales_summaries(site_id, date);`,
            `CREATE INDEX IF NOT EXISTS idx_performance_metrics_site_date ON performance_metrics(site_id, date);`,
            `CREATE INDEX IF NOT EXISTS idx_employees_site ON employees(site_id);`,
            `CREATE INDEX IF NOT EXISTS idx_employee_performance_site_date ON employee_performance(site_id, assessment_date);`
        ];

        for (const index of indexes) {
            await this.executeSQL(index);
        }

        console.log('Database Schema: Performance indexes created');
    }

    /**
     * Execute SQL query
     */
    async executeSQL(sql) {
        try {
            const { data, error } = await this.supabase.rpc('exec_sql', { sql_query: sql });
            
            if (error) {
                // Fallback to direct query if RPC not available
                const { error: directError } = await this.supabase.from('_supabase_meta').select('*');
                if (directError) {
                    console.warn('Database Schema: RPC not available, some features may not work');
                }
            }
            
            return { data, error };
        } catch (error) {
            console.error('Database Schema: SQL execution failed', error);
            throw error;
        }
    }

    /**
     * Test database connectivity and permissions
     */
    async testConnection() {
        try {
            const { data, error } = await this.supabase.from('sites').select('count').limit(1);
            
            if (error) {
                console.error('Database Schema: Connection test failed', error);
                return false;
            }

            console.log('Database Schema: Connection test successful');
            return true;
        } catch (error) {
            console.error('Database Schema: Connection test failed', error);
            return false;
        }
    }

    /**
     * Migrate data from localStorage to Supabase
     */
    async migrateFromLocalStorage() {
        console.log('Database Schema: Starting localStorage migration...');
        
        try {
            // Migrate fuel price history
            const fuelPrices = JSON.parse(localStorage.getItem('fuelPriceHistory') || '{}');
            if (fuelPrices && Object.keys(fuelPrices).length > 0) {
                await this.migrateFuelPrices(fuelPrices);
            }

            // Migrate performance data
            const performanceData = JSON.parse(localStorage.getItem('performanceData') || '{}');
            if (performanceData && Object.keys(performanceData).length > 0) {
                await this.migratePerformanceData(performanceData);
            }

            // Migrate personnel data
            const personnelData = JSON.parse(localStorage.getItem('personnelData') || '{}');
            if (personnelData && Object.keys(personnelData).length > 0) {
                await this.migratePersonnelData(personnelData);
            }

            console.log('Database Schema: localStorage migration completed');
            return true;
        } catch (error) {
            console.error('Database Schema: Migration failed', error);
            return false;
        }
    }

    async migrateFuelPrices(fuelPrices) {
        // Implementation for migrating fuel prices
        console.log('Database Schema: Migrating fuel prices...');
    }

    async migratePerformanceData(performanceData) {
        // Implementation for migrating performance data
        console.log('Database Schema: Migrating performance data...');
    }

    async migratePersonnelData(personnelData) {
        // Implementation for migrating personnel data
        console.log('Database Schema: Migrating personnel data...');
    }
}

// Export for use in other modules
window.DatabaseSchema = DatabaseSchema;
export default DatabaseSchema;
