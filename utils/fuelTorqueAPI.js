/**
 * FUEL FLUX Fuel Torque API Integration
 * Complete integration with Fuel Torque PAT system for real-time data
 */

class FuelTorqueAPI {
  constructor() {
    this.baseURL = 'https://api.fueltorque.com'; // Replace with actual API URL
    this.accessToken = null;
    this.siteId = null;
    this.siteName = null;
    this.isAuthenticated = false;
    this.connectionStatus = 'disconnected';
    this.lastSync = null;
    this.errorCount = 0;
    this.retryAttempts = 5;
    this.retryDelay = 30000; // 30 seconds
    
    // API endpoints configuration
    this.endpoints = {
      authenticate: '/auth/pat',
      transactions: '/api/v1/transactions',
      volumes: '/api/v1/volumes',
      sales: '/api/v1/sales',
      inventory: '/api/v1/inventory',
      pumps: '/api/v1/pumps',
      tanks: '/api/v1/tanks',
      reports: '/api/v1/reports'
    };

    // Data mapping for different fuel types
    this.fuelTypeMapping = {
      '95_UNLEADED': 'petrol',
      '93_UNLEADED': 'petrol', 
      'DIESEL_50': 'diesel',
      'DIESEL_500': 'diesel',
      'LPG': 'lpg'
    };

    this.initialize();
  }

  /**
   * Initialize the API connection
   */
  initialize() {
    this.loadCredentials();
    this.setupEventListeners();
    this.startConnectionMonitoring();
  }

  /**
   * Load stored credentials
   */
  loadCredentials() {
    try {
      const credentials = JSON.parse(localStorage.getItem('fuelFlux_patCredentials'));
      if (credentials) {
        this.accessToken = credentials.accessToken;
        this.siteId = credentials.siteId;
        this.siteName = credentials.siteName;
        this.testConnection();
      }
    } catch (error) {
      console.error('Error loading PAT credentials:', error);
    }
  }

  /**
   * Save credentials securely
   */
  saveCredentials(accessToken, siteId, siteName) {
    try {
      const credentials = {
        accessToken,
        siteId,
        siteName,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('fuelFlux_patCredentials', JSON.stringify(credentials));
      
      this.accessToken = accessToken;
      this.siteId = siteId;
      this.siteName = siteName;
      
      console.log('PAT credentials saved successfully');
      this.testConnection();
    } catch (error) {
      console.error('Error saving PAT credentials:', error);
      throw new Error('Failed to save credentials');
    }
  }

  /**
   * Test API connection
   */
  async testConnection() {
    if (!this.accessToken || !this.siteId) {
      this.connectionStatus = 'disconnected';
      return false;
    }

    try {
      this.connectionStatus = 'connecting';
      
      const response = await this.makeRequest('/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'X-Site-ID': this.siteId
        }
      });

      if (response.success) {
        this.connectionStatus = 'connected';
        this.isAuthenticated = true;
        this.lastSync = new Date().toISOString();
        this.errorCount = 0;
        
        console.log('Fuel Torque API connected successfully');
        this.dispatchEvent('connectionEstablished', { siteId: this.siteId });
        return true;
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('API connection test failed:', error);
      this.connectionStatus = 'failed';
      this.isAuthenticated = false;
      this.errorCount++;
      
      this.dispatchEvent('connectionFailed', { error: error.message });
      return false;
    }
  }

  /**
   * Get real-time fuel transactions
   */
  async getFuelTransactions(options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endDate = new Date(),
      fuelType = null,
      limit = 1000,
      offset = 0
    } = options;

    try {
      const params = new URLSearchParams({
        site_id: this.siteId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        limit: limit.toString(),
        offset: offset.toString()
      });

      if (fuelType) {
        params.append('fuel_type', fuelType);
      }

      const response = await this.makeRequest(`${this.endpoints.transactions}?${params}`);
      
      if (response.success) {
        return this.transformTransactionData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch transaction data');
      }
    } catch (error) {
      console.error('Error fetching fuel transactions:', error);
      throw error;
    }
  }

  /**
   * Get fuel volume data
   */
  async getFuelVolumes(options = {}) {
    const {
      period = 'daily',
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate = new Date(),
      fuelType = null
    } = options;

    try {
      const params = new URLSearchParams({
        site_id: this.siteId,
        period,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });

      if (fuelType) {
        params.append('fuel_type', fuelType);
      }

      const response = await this.makeRequest(`${this.endpoints.volumes}?${params}`);
      
      if (response.success) {
        return this.transformVolumeData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch volume data');
      }
    } catch (error) {
      console.error('Error fetching fuel volumes:', error);
      throw error;
    }
  }

  /**
   * Get sales data
   */
  async getSalesData(options = {}) {
    const {
      startDate = new Date(Date.now() - 24 * 60 * 60 * 1000),
      endDate = new Date(),
      includeShop = true,
      includeFuel = true
    } = options;

    try {
      const params = new URLSearchParams({
        site_id: this.siteId,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        include_shop: includeShop.toString(),
        include_fuel: includeFuel.toString()
      });

      const response = await this.makeRequest(`${this.endpoints.sales}?${params}`);
      
      if (response.success) {
        return this.transformSalesData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch sales data');
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  }

  /**
   * Get inventory levels
   */
  async getInventoryLevels() {
    try {
      const params = new URLSearchParams({
        site_id: this.siteId
      });

      const response = await this.makeRequest(`${this.endpoints.inventory}?${params}`);
      
      if (response.success) {
        return this.transformInventoryData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch inventory data');
      }
    } catch (error) {
      console.error('Error fetching inventory levels:', error);
      throw error;
    }
  }

  /**
   * Get pump status and performance
   */
  async getPumpStatus() {
    try {
      const params = new URLSearchParams({
        site_id: this.siteId
      });

      const response = await this.makeRequest(`${this.endpoints.pumps}?${params}`);
      
      if (response.success) {
        return this.transformPumpData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch pump data');
      }
    } catch (error) {
      console.error('Error fetching pump status:', error);
      throw error;
    }
  }

  /**
   * Get tank levels and alerts
   */
  async getTankLevels() {
    try {
      const params = new URLSearchParams({
        site_id: this.siteId
      });

      const response = await this.makeRequest(`${this.endpoints.tanks}?${params}`);
      
      if (response.success) {
        return this.transformTankData(response.data);
      } else {
        throw new Error(response.message || 'Failed to fetch tank data');
      }
    } catch (error) {
      console.error('Error fetching tank levels:', error);
      throw error;
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'X-Site-ID': this.siteId,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, requestOptions);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.isAuthenticated = false;
          this.connectionStatus = 'disconnected';
          throw new Error('Authentication expired');
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  /**
   * Transform transaction data to our format
   */
  transformTransactionData(rawData) {
    return {
      transactions: rawData.transactions?.map(transaction => ({
        id: transaction.id,
        timestamp: new Date(transaction.timestamp),
        fuelType: this.fuelTypeMapping[transaction.fuel_type] || transaction.fuel_type,
        volume: parseFloat(transaction.volume),
        price: parseFloat(transaction.price),
        totalAmount: parseFloat(transaction.total_amount),
        pumpNumber: transaction.pump_number,
        nozzleNumber: transaction.nozzle_number,
        transactionType: transaction.transaction_type
      })) || [],
      summary: {
        totalTransactions: rawData.summary?.total_transactions || 0,
        totalVolume: parseFloat(rawData.summary?.total_volume || 0),
        totalRevenue: parseFloat(rawData.summary?.total_revenue || 0),
        averagePrice: parseFloat(rawData.summary?.average_price || 0)
      },
      metadata: {
        fetchedAt: new Date().toISOString(),
        siteId: this.siteId,
        siteName: this.siteName
      }
    };
  }

  /**
   * Transform volume data to our format
   */
  transformVolumeData(rawData) {
    return {
      volumes: rawData.volumes?.map(volume => ({
        date: new Date(volume.date),
        fuelType: this.fuelTypeMapping[volume.fuel_type] || volume.fuel_type,
        volume: parseFloat(volume.volume),
        transactions: parseInt(volume.transactions),
        averagePrice: parseFloat(volume.average_price)
      })) || [],
      summary: {
        totalVolume: parseFloat(rawData.summary?.total_volume || 0),
        totalTransactions: parseInt(rawData.summary?.total_transactions || 0),
        averagePrice: parseFloat(rawData.summary?.average_price || 0)
      }
    };
  }

  /**
   * Transform sales data to our format
   */
  transformSalesData(rawData) {
    return {
      sales: {
        fuel: {
          revenue: parseFloat(rawData.sales?.fuel?.revenue || 0),
          volume: parseFloat(rawData.sales?.fuel?.volume || 0),
          transactions: parseInt(rawData.sales?.fuel?.transactions || 0)
        },
        shop: {
          revenue: parseFloat(rawData.sales?.shop?.revenue || 0),
          transactions: parseInt(rawData.sales?.shop?.transactions || 0),
          averageTicket: parseFloat(rawData.sales?.shop?.average_ticket || 0)
        }
      },
      totalRevenue: parseFloat(rawData.total_revenue || 0),
      period: {
        start: new Date(rawData.period?.start || Date.now()),
        end: new Date(rawData.period?.end || Date.now())
      }
    };
  }

  /**
   * Transform inventory data to our format
   */
  transformInventoryData(rawData) {
    return {
      tanks: rawData.tanks?.map(tank => ({
        tankId: tank.tank_id,
        fuelType: this.fuelTypeMapping[tank.fuel_type] || tank.fuel_type,
        currentLevel: parseFloat(tank.current_level),
        capacity: parseFloat(tank.capacity),
        percentage: parseFloat(tank.percentage),
        lastUpdated: new Date(tank.last_updated)
      })) || [],
      totalCapacity: parseFloat(rawData.total_capacity || 0),
      totalCurrentLevel: parseFloat(rawData.total_current_level || 0)
    };
  }

  /**
   * Transform pump data to our format
   */
  transformPumpData(rawData) {
    return {
      pumps: rawData.pumps?.map(pump => ({
        pumpId: pump.pump_id,
        pumpNumber: pump.pump_number,
        status: pump.status,
        fuelTypes: pump.fuel_types?.map(type => this.fuelTypeMapping[type] || type) || [],
        lastTransaction: pump.last_transaction ? new Date(pump.last_transaction) : null,
        dailyVolume: parseFloat(pump.daily_volume || 0),
        dailyRevenue: parseFloat(pump.daily_revenue || 0)
      })) || [],
      activePumps: rawData.active_pumps || 0,
      totalPumps: rawData.total_pumps || 0
    };
  }

  /**
   * Transform tank data to our format
   */
  transformTankData(rawData) {
    return {
      tanks: rawData.tanks?.map(tank => ({
        tankId: tank.tank_id,
        fuelType: this.fuelTypeMapping[tank.fuel_type] || tank.fuel_type,
        currentLevel: parseFloat(tank.current_level),
        capacity: parseFloat(tank.capacity),
        percentage: parseFloat(tank.percentage),
        temperature: parseFloat(tank.temperature || 0),
        alerts: tank.alerts || [],
        lastUpdated: new Date(tank.last_updated)
      })) || [],
      alerts: rawData.alerts || [],
      totalCapacity: parseFloat(rawData.total_capacity || 0)
    };
  }

  /**
   * Start real-time data monitoring
   */
  startRealTimeMonitoring(callback) {
    if (!this.isAuthenticated) {
      console.error('Cannot start real-time monitoring: not authenticated');
      return;
    }

    this.realTimeInterval = setInterval(async () => {
      try {
        const data = await this.getLatestData();
        if (callback) {
          callback(data);
        }
        this.lastSync = new Date().toISOString();
      } catch (error) {
        console.error('Real-time monitoring error:', error);
        this.errorCount++;
        
        if (this.errorCount >= this.retryAttempts) {
          this.stopRealTimeMonitoring();
          this.dispatchEvent('monitoringFailed', { error: error.message });
        }
      }
    }, 30000); // 30 seconds

    console.log('Real-time monitoring started');
  }

  /**
   * Stop real-time data monitoring
   */
  stopRealTimeMonitoring() {
    if (this.realTimeInterval) {
      clearInterval(this.realTimeInterval);
      this.realTimeInterval = null;
      console.log('Real-time monitoring stopped');
    }
  }

  /**
   * Get latest data from all endpoints
   */
  async getLatestData() {
    try {
      const [transactions, volumes, sales, inventory, pumps, tanks] = await Promise.all([
        this.getFuelTransactions({ limit: 100 }),
        this.getFuelVolumes({ period: 'daily' }),
        this.getSalesData(),
        this.getInventoryLevels(),
        this.getPumpStatus(),
        this.getTankLevels()
      ]);

      return {
        transactions,
        volumes,
        sales,
        inventory,
        pumps,
        tanks,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching latest data:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners for connection monitoring
   */
  setupEventListeners() {
    // Monitor connection status
    setInterval(() => {
      if (this.connectionStatus === 'connected' && this.isAuthenticated) {
        // Connection is healthy
        this.errorCount = Math.max(0, this.errorCount - 1);
      }
    }, 60000); // Check every minute
  }

  /**
   * Start connection monitoring
   */
  startConnectionMonitoring() {
    this.connectionMonitor = setInterval(async () => {
      if (this.isAuthenticated) {
        await this.testConnection();
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Dispatch custom events
   */
  dispatchEvent(eventName, data) {
    const event = new CustomEvent(`fuelTorqueAPI:${eventName}`, { detail: data });
    window.dispatchEvent(event);
  }

  /**
   * Get connection status
   */
  getConnectionStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      connectionStatus: this.connectionStatus,
      lastSync: this.lastSync,
      errorCount: this.errorCount,
      siteId: this.siteId,
      siteName: this.siteName
    };
  }

  /**
   * Clear stored credentials
   */
  clearCredentials() {
    localStorage.removeItem('fuelFlux_patCredentials');
    this.accessToken = null;
    this.siteId = null;
    this.siteName = null;
    this.isAuthenticated = false;
    this.connectionStatus = 'disconnected';
    this.stopRealTimeMonitoring();
    
    console.log('PAT credentials cleared');
  }
}

// Global Fuel Torque API instance
window.fuelTorqueAPI = new FuelTorqueAPI();

// export default window.fuelTorqueAPI;
