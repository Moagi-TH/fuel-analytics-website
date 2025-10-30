/**
 * FUEL FLUX - Live Dashboard Component
 * Phase 5.4: Real-time Dashboard with Live Updates
 * Displays live data from Supabase database with real-time updates
 */

class LiveDashboard {
    constructor(containerId, realTimeService) {
        this.container = document.getElementById(containerId);
        this.realTimeService = realTimeService;
        this.charts = new Map();
        this.updateQueue = [];
        this.isUpdating = false;
        this.lastDataRefresh = null;
        this.autoRefreshInterval = null;
        
        // Performance tracking
        this.updateCount = 0;
        this.lastUpdateTime = Date.now();
        this.updateStats = {
            totalUpdates: 0,
            averageUpdateTime: 0,
            lastUpdateDuration: 0
        };

        this.initialize();
    }

    async initialize() {
        try {
            console.log('Live Dashboard: Initializing...');
            
            // Create dashboard structure
            this.createDashboardStructure();
            
            // Set up real-time subscriptions
            this.setupRealTimeSubscriptions();
            
            // Initialize charts
            await this.initializeCharts();
            
            // Start auto-refresh
            this.startAutoRefresh();
            
            // Load initial data
            await this.loadInitialData();
            
            console.log('Live Dashboard: Initialized successfully');
            
        } catch (error) {
            console.error('Live Dashboard: Initialization failed', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    /**
     * Create dashboard HTML structure
     */
    createDashboardStructure() {
        this.container.innerHTML = `
            <div class="live-dashboard">
                <!-- Header with connection status -->
                <div class="dashboard-header">
                    <div class="header-left">
                        <h1>FUEL FLUX Live Dashboard</h1>
                        <div class="connection-status">
                            <span class="status-indicator" id="connectionIndicator"></span>
                            <span class="status-text" id="connectionStatus">Connecting...</span>
                            <span class="last-update" id="lastUpdate">Last update: Never</span>
                        </div>
                    </div>
                    <div class="header-right">
                        <div class="performance-stats">
                            <span class="stat">Updates: <span id="updateCount">0</span></span>
                            <span class="stat">Avg Time: <span id="avgUpdateTime">0ms</span></span>
                        </div>
                        <button class="refresh-btn" id="manualRefresh">Refresh Now</button>
                    </div>
                </div>

                <!-- Real-time metrics cards -->
                <div class="metrics-grid">
                    <div class="metric-card" id="revenueCard">
                        <div class="metric-header">
                            <h3>Today's Revenue</h3>
                            <span class="metric-change" id="revenueChange">+0%</span>
                        </div>
                        <div class="metric-value" id="revenueValue">R 0.00</div>
                        <div class="metric-chart" id="revenueChart"></div>
                    </div>

                    <div class="metric-card" id="volumeCard">
                        <div class="metric-header">
                            <h3>Fuel Volume</h3>
                            <span class="metric-change" id="volumeChange">+0%</span>
                        </div>
                        <div class="metric-value" id="volumeValue">0 L</div>
                        <div class="metric-chart" id="volumeChart"></div>
                    </div>

                    <div class="metric-card" id="efficiencyCard">
                        <div class="metric-header">
                            <h3>Fuel Efficiency</h3>
                            <span class="metric-change" id="efficiencyChange">+0%</span>
                        </div>
                        <div class="metric-value" id="efficiencyValue">0.00</div>
                        <div class="metric-chart" id="efficiencyChart"></div>
                    </div>

                    <div class="metric-card" id="profitCard">
                        <div class="metric-header">
                            <h3>Profit Margin</h3>
                            <span class="metric-change" id="profitChange">+0%</span>
                        </div>
                        <div class="metric-value" id="profitValue">0.00%</div>
                        <div class="metric-chart" id="profitChart"></div>
                    </div>
                </div>

                <!-- Live charts section -->
                <div class="charts-section">
                    <div class="chart-container">
                        <h3>Real-time Revenue Trend</h3>
                        <canvas id="revenueTrendChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Live Fuel Distribution</h3>
                        <canvas id="fuelDistributionChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Performance Metrics</h3>
                        <canvas id="performanceChart"></canvas>
                    </div>
                    <div class="chart-container">
                        <h3>Transaction Volume</h3>
                        <canvas id="transactionVolumeChart"></canvas>
                    </div>
                </div>

                <!-- Live alerts section -->
                <div class="alerts-section">
                    <h3>Live Alerts</h3>
                    <div class="alerts-container" id="alertsContainer">
                        <div class="no-alerts">No active alerts</div>
                    </div>
                </div>

                <!-- Real-time data log -->
                <div class="data-log-section">
                    <h3>Real-time Data Log</h3>
                    <div class="log-container" id="dataLog">
                        <div class="log-entry">Dashboard initialized...</div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        this.addEventListeners();
    }

    /**
     * Set up real-time subscriptions
     */
    setupRealTimeSubscriptions() {
        if (!this.realTimeService) return;

        // Subscribe to all real-time events
        this.realTimeService.subscribe('status', (data) => {
            this.updateConnectionStatus(data);
        });

        this.realTimeService.subscribe('fuel_transactions', (data) => {
            this.queueUpdate('fuel_transactions', data);
        });

        this.realTimeService.subscribe('sales_summaries', (data) => {
            this.queueUpdate('sales_summaries', data);
        });

        this.realTimeService.subscribe('performance_metrics', (data) => {
            this.queueUpdate('performance_metrics', data);
        });

        this.realTimeService.subscribe('data', (data) => {
            this.handleDataUpdate(data);
        });
    }

    /**
     * Initialize all charts
     */
    async initializeCharts() {
        try {
            // Revenue Trend Chart
            this.charts.revenueTrend = new Chart(
                document.getElementById('revenueTrendChart').getContext('2d'),
                this.getRevenueTrendConfig()
            );

            // Fuel Distribution Chart
            this.charts.fuelDistribution = new Chart(
                document.getElementById('fuelDistributionChart').getContext('2d'),
                this.getFuelDistributionConfig()
            );

            // Performance Chart
            this.charts.performance = new Chart(
                document.getElementById('performanceChart').getContext('2d'),
                this.getPerformanceConfig()
            );

            // Transaction Volume Chart
            this.charts.transactionVolume = new Chart(
                document.getElementById('transactionVolumeChart').getContext('2d'),
                this.getTransactionVolumeConfig()
            );

            console.log('Live Dashboard: Charts initialized successfully');

        } catch (error) {
            console.error('Live Dashboard: Chart initialization failed', error);
        }
    }

    /**
     * Load initial data
     */
    async loadInitialData() {
        try {
            console.log('Live Dashboard: Loading initial data...');
            
            // Fetch latest data from database
            const data = await this.fetchLatestData();
            
            // Update dashboard with initial data
            this.updateDashboard(data);
            
            // Log the initial load
            this.logData('Initial data loaded', data);
            
        } catch (error) {
            console.error('Live Dashboard: Failed to load initial data', error);
            this.showError('Failed to load initial data');
        }
    }

    /**
     * Queue update for processing
     */
    queueUpdate(type, data) {
        this.updateQueue.push({ type, data, timestamp: Date.now() });
        this.processUpdateQueue();
    }

    /**
     * Process queued updates
     */
    async processUpdateQueue() {
        if (this.isUpdating || this.updateQueue.length === 0) return;

        this.isUpdating = true;
        const startTime = Date.now();

        try {
            // Process all queued updates
            const updates = [...this.updateQueue];
            this.updateQueue = [];

            // Group updates by type
            const groupedUpdates = this.groupUpdatesByType(updates);

            // Apply updates
            for (const [type, data] of groupedUpdates) {
                await this.applyUpdate(type, data);
            }

            // Update performance stats
            const updateDuration = Date.now() - startTime;
            this.updatePerformanceStats(updateDuration);

            // Update last update time
            this.lastDataRefresh = new Date();
            this.updateLastUpdateTime();

            // Log the updates
            this.logData(`${updates.length} updates processed`, groupedUpdates);

        } catch (error) {
            console.error('Live Dashboard: Failed to process updates', error);
        } finally {
            this.isUpdating = false;
        }
    }

    /**
     * Handle data updates from real-time service
     */
    handleDataUpdate(data) {
        console.log('Live Dashboard: Received data update', data);
        
        if (data.type === 'incremental_update') {
            // Handle incremental updates
            this.handleIncrementalUpdate(data.updates);
        }
        
        // Log the update
        this.logData('Real-time data update received', data);
    }

    /**
     * Handle incremental updates
     */
    async handleIncrementalUpdate(updates) {
        try {
            // Update metrics based on new data
            if (updates.transactions) {
                await this.updateMetricsFromTransactions(updates.transactions);
            }

            if (updates.sales) {
                await this.updateMetricsFromSales(updates.sales);
            }

            // Refresh charts
            this.refreshCharts();

        } catch (error) {
            console.error('Live Dashboard: Failed to handle incremental update', error);
        }
    }

    /**
     * Update metrics from new transactions
     */
    async updateMetricsFromTransactions(transactions) {
        try {
            // Calculate new totals
            const totals = transactions.reduce((acc, transaction) => {
                acc.revenue += transaction.total_amount || 0;
                acc.volume += transaction.volume || 0;
                acc.count += 1;
                return acc;
            }, { revenue: 0, volume: 0, count: 0 });

            // Update metric cards
            this.updateMetricCard('revenue', totals.revenue);
            this.updateMetricCard('volume', totals.volume);

            // Update charts
            this.updateChartData('revenueTrend', transactions);
            this.updateChartData('transactionVolume', transactions);

        } catch (error) {
            console.error('Live Dashboard: Failed to update metrics from transactions', error);
        }
    }

    /**
     * Update metrics from new sales data
     */
    async updateMetricsFromSales(salesData) {
        try {
            // Update efficiency and profit metrics
            const efficiency = this.calculateEfficiency(salesData);
            const profit = this.calculateProfit(salesData);

            this.updateMetricCard('efficiency', efficiency);
            this.updateMetricCard('profit', profit);

            // Update performance chart
            this.updateChartData('performance', salesData);

        } catch (error) {
            console.error('Live Dashboard: Failed to update metrics from sales', error);
        }
    }

    /**
     * Update metric card display
     */
    updateMetricCard(metricType, value) {
        const cardId = `${metricType}Card`;
        const valueId = `${metricType}Value`;
        const changeId = `${metricType}Change`;

        const card = document.getElementById(cardId);
        const valueElement = document.getElementById(valueId);
        const changeElement = document.getElementById(changeId);

        if (!card || !valueElement) return;

        // Get previous value
        const previousValue = parseFloat(valueElement.textContent.replace(/[^\d.-]/g, '')) || 0;
        const currentValue = parseFloat(value) || 0;

        // Calculate change
        const change = previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;

        // Update value
        valueElement.textContent = this.formatMetricValue(metricType, currentValue);

        // Update change indicator
        if (changeElement) {
            changeElement.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
            changeElement.className = `metric-change ${change >= 0 ? 'positive' : 'negative'}`;
        }

        // Animate the update
        this.animateMetricCard(card);
    }

    /**
     * Format metric value based on type
     */
    formatMetricValue(type, value) {
        switch (type) {
            case 'revenue':
                return `R ${value.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;
            case 'volume':
                return `${value.toLocaleString('en-ZA')} L`;
            case 'efficiency':
                return value.toFixed(2);
            case 'profit':
                return `${value.toFixed(2)}%`;
            default:
                return value.toString();
        }
    }

    /**
     * Animate metric card update
     */
    animateMetricCard(card) {
        card.style.transform = 'scale(1.05)';
        card.style.transition = 'transform 0.2s ease-in-out';
        
        setTimeout(() => {
            card.style.transform = 'scale(1)';
        }, 200);
    }

    /**
     * Update chart data
     */
    updateChartData(chartName, newData) {
        const chart = this.charts.get(chartName);
        if (!chart) return;

        try {
            switch (chartName) {
                case 'revenueTrend':
                    this.updateRevenueTrendChart(chart, newData);
                    break;
                case 'fuelDistribution':
                    this.updateFuelDistributionChart(chart, newData);
                    break;
                case 'performance':
                    this.updatePerformanceChart(chart, newData);
                    break;
                case 'transactionVolume':
                    this.updateTransactionVolumeChart(chart, newData);
                    break;
            }

            chart.update('none'); // Update without animation for better performance

        } catch (error) {
            console.error(`Live Dashboard: Failed to update ${chartName} chart`, error);
        }
    }

    /**
     * Update connection status display
     */
    updateConnectionStatus(data) {
        const indicator = document.getElementById('connectionIndicator');
        const statusText = document.getElementById('connectionStatus');

        if (!indicator || !statusText) return;

        const status = data.status;
        indicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                statusText.textContent = 'Connected';
                break;
            case 'connecting':
                statusText.textContent = 'Connecting...';
                break;
            case 'error':
                statusText.textContent = 'Connection Error';
                break;
            default:
                statusText.textContent = 'Disconnected';
        }
    }

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Auto-refresh every 30 seconds
        this.autoRefreshInterval = setInterval(async () => {
            await this.refreshData();
        }, 30000);
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    /**
     * Refresh data manually
     */
    async refreshData() {
        try {
            console.log('Live Dashboard: Manual refresh requested');
            
            const data = await this.fetchLatestData();
            this.updateDashboard(data);
            
            this.logData('Manual refresh completed', data);
            
        } catch (error) {
            console.error('Live Dashboard: Manual refresh failed', error);
            this.showError('Failed to refresh data');
        }
    }

    /**
     * Update performance statistics
     */
    updatePerformanceStats(updateDuration) {
        this.updateCount++;
        this.updateStats.totalUpdates = this.updateCount;
        this.updateStats.lastUpdateDuration = updateDuration;
        this.updateStats.averageUpdateTime = 
            (this.updateStats.averageUpdateTime * (this.updateCount - 1) + updateDuration) / this.updateCount;

        // Update display
        document.getElementById('updateCount').textContent = this.updateCount;
        document.getElementById('avgUpdateTime').textContent = `${Math.round(this.updateStats.averageUpdateTime)}ms`;
    }

    /**
     * Update last update time display
     */
    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement && this.lastDataRefresh) {
            lastUpdateElement.textContent = `Last update: ${this.lastDataRefresh.toLocaleTimeString()}`;
        }
    }

    /**
     * Log data for debugging
     */
    logData(message, data) {
        const logContainer = document.getElementById('dataLog');
        if (!logContainer) return;

        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.innerHTML = `
            <span class="log-time">[${timestamp}]</span>
            <span class="log-message">${message}</span>
            <span class="log-details" style="display: none;">${JSON.stringify(data, null, 2)}</span>
        `;

        // Add click to expand
        logEntry.addEventListener('click', () => {
            const details = logEntry.querySelector('.log-details');
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        });

        logContainer.appendChild(logEntry);

        // Keep only last 50 entries
        if (logContainer.children.length > 50) {
            logContainer.removeChild(logContainer.firstChild);
        }

        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    /**
     * Show error message
     */
    showError(message) {
        console.error('Live Dashboard Error:', message);
        
        // Create error alert
        const alertContainer = document.getElementById('alertsContainer');
        if (alertContainer) {
            const alertElement = document.createElement('div');
            alertElement.className = 'alert error';
            alertElement.innerHTML = `
                <span class="alert-icon">⚠️</span>
                <span class="alert-message">${message}</span>
                <span class="alert-time">${new Date().toLocaleTimeString()}</span>
            `;
            
            alertContainer.appendChild(alertElement);
            
            // Remove after 10 seconds
            setTimeout(() => {
                if (alertElement.parentNode) {
                    alertElement.parentNode.removeChild(alertElement);
                }
            }, 10000);
        }
    }

    /**
     * Add event listeners
     */
    addEventListeners() {
        const refreshBtn = document.getElementById('manualRefresh');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshData();
            });
        }
    }

    /**
     * Fetch latest data from database
     */
    async fetchLatestData() {
        // This would fetch data from Supabase
        // For now, return mock data
        return {
            revenue: 45000,
            volume: 12500,
            efficiency: 0.85,
            profit: 12.5,
            transactions: [],
            sales: []
        };
    }

    /**
     * Chart configuration methods
     */
    getRevenueTrendConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    borderColor: '#20B2AA',
                    backgroundColor: 'rgba(32, 178, 170, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false // Disable animations for better performance
            }
        };
    }

    getFuelDistributionConfig() {
        return {
            type: 'doughnut',
            data: {
                labels: ['Petrol', 'Diesel', 'Other'],
                datasets: [{
                    data: [60, 35, 5],
                    backgroundColor: ['#20B2AA', '#3498DB', '#95A5A6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    getPerformanceConfig() {
        return {
            type: 'bar',
            data: {
                labels: ['Efficiency', 'Profit', 'Volume'],
                datasets: [{
                    label: 'Performance',
                    data: [85, 75, 90],
                    backgroundColor: ['#20B2AA', '#3498DB', '#2ECC71']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        };
    }

    getTransactionVolumeConfig() {
        return {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Transactions',
                    data: [],
                    borderColor: '#E74C3C',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false
            }
        };
    }

    // Utility methods
    groupUpdatesByType(updates) {
        const grouped = new Map();
        updates.forEach(update => {
            if (!grouped.has(update.type)) {
                grouped.set(update.type, []);
            }
            grouped.get(update.type).push(update.data);
        });
        return grouped;
    }

    calculateEfficiency(data) {
        // Calculate fuel efficiency
        return 0.85; // Placeholder
    }

    calculateProfit(data) {
        // Calculate profit margin
        return 12.5; // Placeholder
    }

    // Cleanup method
    destroy() {
        this.stopAutoRefresh();
        
        // Clear charts
        this.charts.forEach(chart => {
            if (chart.destroy) {
                chart.destroy();
            }
        });
        
        // Clear subscriptions
        if (this.realTimeService) {
            this.realTimeService.unsubscribe('status', this.updateConnectionStatus);
            this.realTimeService.unsubscribe('fuel_transactions', this.queueUpdate);
            this.realTimeService.unsubscribe('sales_summaries', this.queueUpdate);
            this.realTimeService.unsubscribe('performance_metrics', this.queueUpdate);
            this.realTimeService.unsubscribe('data', this.handleDataUpdate);
        }
    }
}

// Export for use in other modules
window.LiveDashboard = LiveDashboard;
export default LiveDashboard;
