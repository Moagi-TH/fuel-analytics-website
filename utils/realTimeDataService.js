/**
 * FUEL FLUX - Real-time Data Service
 * Phase 5.4: Live Real-time Updates Implementation
 * Connects API data to database and provides live dashboard updates
 */

class RealTimeDataService {
    constructor() {
        this.supabase = null;
        this.fuelTorqueAPI = null;
        this.analyticsEngine = null;
        this.isInitialized = false;
        this.isRunning = false;
        this.updateInterval = null;
        this.subscribers = new Map();
        this.lastUpdateTime = null;
        this.connectionStatus = 'disconnected';
        this.retryAttempts = 0;
        this.maxRetryAttempts = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    async initialize(supabaseClient, fuelTorqueAPI, analyticsEngine) {
        try {
            this.supabase = supabaseClient;
            this.fuelTorqueAPI = fuelTorqueAPI;
            this.analyticsEngine = analyticsEngine;
            this.isInitialized = true;

            // Set up real-time subscriptions
            await this.setupRealTimeSubscriptions();
            
            console.log('Real-time Data Service: Initialized successfully');
            return true;
        } catch (error) {
            console.error('Real-time Data Service: Initialization failed', error);
            return false;
        }
    }

    /**
     * Set up real-time database subscriptions
     */
    async setupRealTimeSubscriptions() {
        if (!this.supabase) return;

        try {
            // Subscribe to fuel transactions changes
            this.supabase
                .channel('fuel_transactions_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'fuel_transactions' },
                    (payload) => {
                        this.handleFuelTransactionUpdate(payload);
                    }
                )
                .subscribe();

            // Subscribe to sales summaries changes
            this.supabase
                .channel('sales_summaries_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'sales_summaries' },
                    (payload) => {
                        this.handleSalesSummaryUpdate(payload);
                    }
                )
                .subscribe();

            // Subscribe to performance metrics changes
            this.supabase
                .channel('performance_metrics_changes')
                .on('postgres_changes', 
                    { event: '*', schema: 'public', table: 'performance_metrics' },
                    (payload) => {
                        this.handlePerformanceMetricsUpdate(payload);
                    }
                )
                .subscribe();

            console.log('Real-time Data Service: Subscriptions set up successfully');
        } catch (error) {
            console.error('Real-time Data Service: Subscription setup failed', error);
        }
    }

    /**
     * Start real-time data synchronization
     */
    async startRealTimeSync() {
        if (!this.isInitialized || this.isRunning) return;

        try {
            this.isRunning = true;
            this.connectionStatus = 'connecting';

            console.log('Real-time Data Service: Starting real-time sync...');

            // Initial data sync
            await this.performInitialSync();

            // Set up periodic updates
            this.updateInterval = setInterval(async () => {
                await this.performPeriodicUpdate();
            }, 30000); // Update every 30 seconds

            this.connectionStatus = 'connected';
            this.retryAttempts = 0;

            console.log('Real-time Data Service: Real-time sync started successfully');
            this.notifySubscribers('status', { status: 'connected', lastUpdate: new Date() });

        } catch (error) {
            console.error('Real-time Data Service: Failed to start real-time sync', error);
            this.connectionStatus = 'error';
            await this.handleConnectionError(error);
        }
    }

    /**
     * Stop real-time data synchronization
     */
    stopRealTimeSync() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.connectionStatus = 'disconnected';

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        console.log('Real-time Data Service: Real-time sync stopped');
        this.notifySubscribers('status', { status: 'disconnected', lastUpdate: new Date() });
    }

    /**
     * Perform initial data synchronization
     */
    async performInitialSync() {
        try {
            console.log('Real-time Data Service: Performing initial sync...');

            // Fetch latest data from Fuel Torque API
            const fuelData = await this.fetchLatestFuelData();
            const salesData = await this.fetchLatestSalesData();
            const inventoryData = await this.fetchLatestInventoryData();

            // Process and store data
            await this.processAndStoreData(fuelData, salesData, inventoryData);

            // Update analytics engine with latest data
            await this.updateAnalyticsEngine();

            this.lastUpdateTime = new Date();
            console.log('Real-time Data Service: Initial sync completed');

        } catch (error) {
            console.error('Real-time Data Service: Initial sync failed', error);
            throw error;
        }
    }

    /**
     * Perform periodic data updates
     */
    async performPeriodicUpdate() {
        try {
            const startTime = Date.now();

            // Fetch incremental updates from API
            const updates = await this.fetchIncrementalUpdates();

            if (updates && Object.keys(updates).length > 0) {
                // Process updates
                await this.processUpdates(updates);

                // Update analytics engine
                await this.updateAnalyticsEngine();

                // Notify subscribers
                this.notifySubscribers('data', { 
                    type: 'incremental_update', 
                    updates, 
                    timestamp: new Date() 
                });

                this.lastUpdateTime = new Date();
                console.log(`Real-time Data Service: Periodic update completed in ${Date.now() - startTime}ms`);
            }

        } catch (error) {
            console.error('Real-time Data Service: Periodic update failed', error);
            await this.handleConnectionError(error);
        }
    }

    /**
     * Fetch latest fuel data from API
     */
    async fetchLatestFuelData() {
        try {
            if (!this.fuelTorqueAPI) return null;

            const transactions = await this.fuelTorqueAPI.getFuelTransactions({
                limit: 100,
                since: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            });

            const volumes = await this.fuelTorqueAPI.getFuelVolumes({
                limit: 100,
                since: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });

            return { transactions, volumes };
        } catch (error) {
            console.error('Real-time Data Service: Failed to fetch fuel data', error);
            return null;
        }
    }

    /**
     * Fetch latest sales data from API
     */
    async fetchLatestSalesData() {
        try {
            if (!this.fuelTorqueAPI) return null;

            const salesData = await this.fuelTorqueAPI.getSalesData({
                limit: 100,
                since: new Date(Date.now() - 24 * 60 * 60 * 1000)
            });

            return salesData;
        } catch (error) {
            console.error('Real-time Data Service: Failed to fetch sales data', error);
            return null;
        }
    }

    /**
     * Fetch latest inventory data from API
     */
    async fetchLatestInventoryData() {
        try {
            if (!this.fuelTorqueAPI) return null;

            const inventory = await this.fuelTorqueAPI.getInventoryLevels();
            const pumpStatus = await this.fuelTorqueAPI.getPumpStatus();
            const tankLevels = await this.fuelTorqueAPI.getTankLevels();

            return { inventory, pumpStatus, tankLevels };
        } catch (error) {
            console.error('Real-time Data Service: Failed to fetch inventory data', error);
            return null;
        }
    }

    /**
     * Fetch incremental updates
     */
    async fetchIncrementalUpdates() {
        try {
            if (!this.fuelTorqueAPI || !this.lastUpdateTime) return null;

            const updates = {};

            // Fetch new transactions since last update
            const newTransactions = await this.fuelTorqueAPI.getFuelTransactions({
                since: this.lastUpdateTime,
                limit: 50
            });

            if (newTransactions && newTransactions.length > 0) {
                updates.transactions = newTransactions;
            }

            // Fetch new sales data since last update
            const newSalesData = await this.fuelTorqueAPI.getSalesData({
                since: this.lastUpdateTime,
                limit: 50
            });

            if (newSalesData && newSalesData.length > 0) {
                updates.sales = newSalesData;
            }

            return updates;
        } catch (error) {
            console.error('Real-time Data Service: Failed to fetch incremental updates', error);
            return null;
        }
    }

    /**
     * Process and store data in database
     */
    async processAndStoreData(fuelData, salesData, inventoryData) {
        try {
            if (!this.supabase) return;

            const siteId = await this.getCurrentSiteId();
            if (!siteId) return;

            // Process fuel transactions
            if (fuelData && fuelData.transactions) {
                await this.storeFuelTransactions(fuelData.transactions, siteId);
            }

            // Process sales data
            if (salesData) {
                await this.storeSalesData(salesData, siteId);
            }

            // Process inventory data
            if (inventoryData) {
                await this.storeInventoryData(inventoryData, siteId);
            }

            // Calculate and store performance metrics
            await this.calculateAndStorePerformanceMetrics(siteId);

        } catch (error) {
            console.error('Real-time Data Service: Failed to process and store data', error);
            throw error;
        }
    }

    /**
     * Process updates and store in database
     */
    async processUpdates(updates) {
        try {
            if (!this.supabase) return;

            const siteId = await this.getCurrentSiteId();
            if (!siteId) return;

            // Process new transactions
            if (updates.transactions) {
                await this.storeFuelTransactions(updates.transactions, siteId);
            }

            // Process new sales data
            if (updates.sales) {
                await this.storeSalesData(updates.sales, siteId);
            }

            // Recalculate performance metrics
            await this.calculateAndStorePerformanceMetrics(siteId);

        } catch (error) {
            console.error('Real-time Data Service: Failed to process updates', error);
            throw error;
        }
    }

    /**
     * Update analytics engine with latest data
     */
    async updateAnalyticsEngine() {
        try {
            if (!this.analyticsEngine) return;

            const siteId = await this.getCurrentSiteId();
            if (!siteId) return;

            // Fetch latest data from database
            const latestData = await this.fetchLatestDataFromDatabase(siteId);

            // Update analytics engine
            await this.analyticsEngine.updateWithRealData(latestData);

            console.log('Real-time Data Service: Analytics engine updated with latest data');

        } catch (error) {
            console.error('Real-time Data Service: Failed to update analytics engine', error);
        }
    }

    /**
     * Store fuel transactions in database
     */
    async storeFuelTransactions(transactions, siteId) {
        try {
            const processedTransactions = transactions.map(transaction => ({
                site_id: siteId,
                timestamp: transaction.timestamp,
                fuel_type: transaction.fuel_type,
                volume: transaction.volume,
                price: transaction.price,
                total_amount: transaction.total_amount,
                pump_number: transaction.pump_number,
                nozzle_number: transaction.nozzle_number,
                transaction_type: transaction.transaction_type,
                metadata: transaction.metadata
            }));

            const { error } = await this.supabase
                .from('fuel_transactions')
                .insert(processedTransactions);

            if (error) {
                console.error('Real-time Data Service: Failed to store fuel transactions', error);
                throw error;
            }

            console.log(`Real-time Data Service: Stored ${processedTransactions.length} fuel transactions`);

        } catch (error) {
            console.error('Real-time Data Service: Failed to store fuel transactions', error);
            throw error;
        }
    }

    /**
     * Store sales data in database
     */
    async storeSalesData(salesData, siteId) {
        try {
            // Aggregate sales data by date
            const salesByDate = this.aggregateSalesData(salesData);
            const today = new Date().toISOString().split('T')[0];

            // Store daily sales summary
            const salesSummary = {
                site_id: siteId,
                date: today,
                fuel_revenue: salesByDate.fuel_revenue || 0,
                fuel_volume: salesByDate.fuel_volume || 0,
                fuel_transactions: salesByDate.fuel_transactions || 0,
                shop_revenue: salesByDate.shop_revenue || 0,
                shop_transactions: salesByDate.shop_transactions || 0,
                shop_average_ticket: salesByDate.shop_average_ticket || 0,
                total_revenue: (salesByDate.fuel_revenue || 0) + (salesByDate.shop_revenue || 0),
                costs: salesByDate.costs || 0,
                profit_margin: this.calculateProfitMargin(salesByDate)
            };

            const { error } = await this.supabase
                .from('sales_summaries')
                .upsert(salesSummary, { onConflict: 'site_id,date' });

            if (error) {
                console.error('Real-time Data Service: Failed to store sales data', error);
                throw error;
            }

            console.log('Real-time Data Service: Sales data stored successfully');

        } catch (error) {
            console.error('Real-time Data Service: Failed to store sales data', error);
            throw error;
        }
    }

    /**
     * Store inventory data in database
     */
    async storeInventoryData(inventoryData, siteId) {
        try {
            if (inventoryData.inventory) {
                for (const tank of inventoryData.inventory) {
                    const inventoryRecord = {
                        site_id: siteId,
                        tank_id: tank.tank_id,
                        fuel_type: tank.fuel_type,
                        current_level: tank.current_level,
                        capacity: tank.capacity,
                        percentage: (tank.current_level / tank.capacity) * 100,
                        temperature: tank.temperature,
                        alerts: tank.alerts || {}
                    };

                    const { error } = await this.supabase
                        .from('fuel_inventory')
                        .upsert(inventoryRecord, { onConflict: 'site_id,tank_id' });

                    if (error) {
                        console.error('Real-time Data Service: Failed to store inventory data', error);
                    }
                }
            }

            console.log('Real-time Data Service: Inventory data stored successfully');

        } catch (error) {
            console.error('Real-time Data Service: Failed to store inventory data', error);
            throw error;
        }
    }

    /**
     * Calculate and store performance metrics
     */
    async calculateAndStorePerformanceMetrics(siteId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch today's sales data
            const { data: salesData } = await this.supabase
                .from('sales_summaries')
                .select('*')
                .eq('site_id', siteId)
                .eq('date', today)
                .single();

            if (!salesData) return;

            // Calculate performance metrics
            const metrics = {
                site_id: siteId,
                date: today,
                fuel_efficiency: this.calculateFuelEfficiency(salesData),
                shop_fuel_ratio: this.calculateShopFuelRatio(salesData),
                gross_profit_margin: this.calculateGrossProfitMargin(salesData),
                net_profit_margin: this.calculateNetProfitMargin(salesData),
                profit_per_liter: this.calculateProfitPerLiter(salesData),
                performance_score: this.calculatePerformanceScore(salesData),
                grade: this.calculatePerformanceGrade(salesData)
            };

            const { error } = await this.supabase
                .from('performance_metrics')
                .upsert(metrics, { onConflict: 'site_id,date' });

            if (error) {
                console.error('Real-time Data Service: Failed to store performance metrics', error);
                throw error;
            }

            console.log('Real-time Data Service: Performance metrics calculated and stored');

        } catch (error) {
            console.error('Real-time Data Service: Failed to calculate performance metrics', error);
            throw error;
        }
    }

    /**
     * Handle real-time database updates
     */
    handleFuelTransactionUpdate(payload) {
        console.log('Real-time Data Service: Fuel transaction update received', payload);
        this.notifySubscribers('fuel_transactions', payload);
    }

    handleSalesSummaryUpdate(payload) {
        console.log('Real-time Data Service: Sales summary update received', payload);
        this.notifySubscribers('sales_summaries', payload);
    }

    handlePerformanceMetricsUpdate(payload) {
        console.log('Real-time Data Service: Performance metrics update received', payload);
        this.notifySubscribers('performance_metrics', payload);
    }

    /**
     * Subscribe to real-time updates
     */
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(callback);
    }

    /**
     * Unsubscribe from real-time updates
     */
    unsubscribe(eventType, callback) {
        if (this.subscribers.has(eventType)) {
            const callbacks = this.subscribers.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    /**
     * Notify subscribers of updates
     */
    notifySubscribers(eventType, data) {
        if (this.subscribers.has(eventType)) {
            this.subscribers.get(eventType).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Real-time Data Service: Subscriber callback error', error);
                }
            });
        }
    }

    /**
     * Handle connection errors with retry logic
     */
    async handleConnectionError(error) {
        this.connectionStatus = 'error';
        this.retryAttempts++;

        console.error(`Real-time Data Service: Connection error (attempt ${this.retryAttempts}/${this.maxRetryAttempts})`, error);

        if (this.retryAttempts < this.maxRetryAttempts) {
            // Retry after delay
            setTimeout(() => {
                if (this.isRunning) {
                    this.performPeriodicUpdate();
                }
            }, this.retryDelay);
        } else {
            // Max retries reached, stop sync
            console.error('Real-time Data Service: Max retry attempts reached, stopping sync');
            this.stopRealTimeSync();
        }

        this.notifySubscribers('status', { 
            status: 'error', 
            error: error.message, 
            retryAttempts: this.retryAttempts 
        });
    }

    /**
     * Get current site ID
     */
    async getCurrentSiteId() {
        try {
            // This would typically come from user session or context
            // For now, we'll use a default site
            const { data: sites } = await this.supabase
                .from('sites')
                .select('id')
                .limit(1);

            return sites && sites.length > 0 ? sites[0].id : null;
        } catch (error) {
            console.error('Real-time Data Service: Failed to get current site ID', error);
            return null;
        }
    }

    /**
     * Fetch latest data from database
     */
    async fetchLatestDataFromDatabase(siteId) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Fetch today's data
            const [salesData, performanceData, inventoryData] = await Promise.all([
                this.supabase.from('sales_summaries').select('*').eq('site_id', siteId).eq('date', today).single(),
                this.supabase.from('performance_metrics').select('*').eq('site_id', siteId).eq('date', today).single(),
                this.supabase.from('fuel_inventory').select('*').eq('site_id', siteId)
            ]);

            return {
                sales: salesData.data,
                performance: performanceData.data,
                inventory: inventoryData.data
            };

        } catch (error) {
            console.error('Real-time Data Service: Failed to fetch latest data from database', error);
            return null;
        }
    }

    /**
     * Utility methods for data processing
     */
    aggregateSalesData(salesData) {
        // Implementation for aggregating sales data
        return {};
    }

    calculateProfitMargin(salesData) {
        if (!salesData.total_revenue || salesData.total_revenue === 0) return 0;
        const profit = salesData.total_revenue - (salesData.costs || 0);
        return (profit / salesData.total_revenue) * 100;
    }

    calculateFuelEfficiency(salesData) {
        if (!salesData.fuel_volume || salesData.fuel_volume === 0) return 0;
        return salesData.fuel_revenue / salesData.fuel_volume;
    }

    calculateShopFuelRatio(salesData) {
        if (!salesData.fuel_volume || salesData.fuel_volume === 0) return 0;
        return (salesData.shop_revenue || 0) / salesData.fuel_volume;
    }

    calculateGrossProfitMargin(salesData) {
        return this.calculateProfitMargin(salesData);
    }

    calculateNetProfitMargin(salesData) {
        // Additional calculations for net profit margin
        return this.calculateProfitMargin(salesData);
    }

    calculateProfitPerLiter(salesData) {
        if (!salesData.fuel_volume || salesData.fuel_volume === 0) return 0;
        const profit = salesData.fuel_revenue - (salesData.costs || 0);
        return profit / salesData.fuel_volume;
    }

    calculatePerformanceScore(salesData) {
        // Calculate overall performance score based on various metrics
        return 85.0; // Placeholder
    }

    calculatePerformanceGrade(salesData) {
        const score = this.calculatePerformanceScore(salesData);
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            status: this.connectionStatus,
            isRunning: this.isRunning,
            lastUpdate: this.lastUpdateTime,
            retryAttempts: this.retryAttempts
        };
    }
}

// Export for use in other modules
window.RealTimeDataService = RealTimeDataService;
export default RealTimeDataService;
