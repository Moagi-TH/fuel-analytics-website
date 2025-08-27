/**
 * Sample Data Generator
 * Generates realistic sample data for testing the analytics engine
 */

class SampleDataGenerator {
  constructor() {
    this.baseData = {
      fuelPrices: {
        petrol: { min: 20, max: 25, current: 22.50 },
        diesel: { min: 18, max: 23, current: 20.75 }
      },
      volumes: {
        petrol: { min: 500, max: 2000, average: 1200 },
        diesel: { min: 300, max: 1500, average: 900 }
      },
      shopData: {
        conversionRate: { min: 0.15, max: 0.35, average: 0.25 },
        averageTicket: { min: 50, max: 150, average: 85 }
      },
      operational: {
        laborCost: { min: 15000, max: 35000, average: 25000 },
        overhead: { min: 8000, max: 20000, average: 12000 },
        fixedCosts: { min: 50000, max: 100000, average: 75000 }
      }
    };
  }

  /**
   * Generate sample monthly data
   * @param {number} months - Number of months to generate
   * @returns {Array} Array of monthly data objects
   */
  generateMonthlyData(months = 12) {
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      
      data.push(this.generateMonthData(date, i));
    }

    return data;
  }

  /**
   * Generate sample daily data
   * @param {number} days - Number of days to generate
   * @returns {Array} Array of daily data objects
   */
  generateDailyData(days = 30) {
    const data = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      data.push(this.generateDayData(date, i));
    }

    return data;
  }

  /**
   * Generate single month data
   * @param {Date} date - Date for the month
   * @param {number} monthIndex - Month index for trends
   * @returns {Object} Month data object
   */
  generateMonthData(date, monthIndex) {
    // Add seasonal variation (higher in winter months)
    const seasonalityFactor = this.calculateSeasonality(date);
    
    // Add trend (slight growth over time)
    const trendFactor = 1 + (monthIndex * 0.02);
    
    // Generate fuel volumes with variation
    const petrolVolume = this.generateVolume('petrol', seasonalityFactor * trendFactor);
    const dieselVolume = this.generateVolume('diesel', seasonalityFactor * trendFactor);
    
    // Generate prices with some variation
    const petrolPrice = this.generatePrice('petrol', monthIndex);
    const dieselPrice = this.generatePrice('diesel', monthIndex);
    
    // Calculate revenues
    const petrolRevenue = petrolVolume * petrolPrice;
    const dieselRevenue = dieselVolume * dieselPrice;
    const fuelRevenue = petrolRevenue + dieselRevenue;
    
    // Calculate costs (with some efficiency improvement over time)
    const costEfficiencyFactor = 1 - (monthIndex * 0.005);
    const petrolCost = petrolVolume * (petrolPrice * 0.85 * costEfficiencyFactor);
    const dieselCost = dieselVolume * (dieselPrice * 0.87 * costEfficiencyFactor);
    const fuelCost = petrolCost + dieselCost;
    
    // Generate shop data
    const shopCustomers = Math.floor((petrolVolume + dieselVolume) * this.baseData.shopData.conversionRate.average);
    const shopRevenue = shopCustomers * this.baseData.shopData.averageTicket.average;
    
    // Generate operational costs
    const laborCost = this.baseData.operational.laborCost.average * (1 + (monthIndex * 0.01));
    const overhead = this.baseData.operational.overhead.average;
    const fixedCosts = this.baseData.operational.fixedCosts.average;
    
    return {
      date: date.toISOString().split('T')[0],
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      
      // Fuel data
      petrolVolume,
      petrolPrice,
      petrolRevenue,
      petrolCost,
      dieselVolume,
      dieselPrice,
      dieselRevenue,
      dieselCost,
      fuelVolume: petrolVolume + dieselVolume,
      fuelRevenue,
      fuelCost,
      
      // Shop data
      shopRevenue,
      shopCustomers,
      totalCustomers: shopCustomers + Math.floor(petrolVolume + dieselVolume),
      
      // Operational data
      laborCost,
      overhead,
      fixedCosts,
      totalCosts: fuelCost + laborCost + overhead + fixedCosts,
      
      // Calculated fields
      grossProfit: fuelRevenue - fuelCost,
      netProfit: fuelRevenue + shopRevenue - (fuelCost + laborCost + overhead + fixedCosts),
      totalRevenue: fuelRevenue + shopRevenue,
      
      // Metadata
      seasonalityFactor,
      trendFactor,
      costEfficiencyFactor
    };
  }

  /**
   * Generate single day data
   * @param {Date} date - Date for the day
   * @param {number} dayIndex - Day index for trends
   * @returns {Object} Day data object
   */
  generateDayData(date, dayIndex) {
    // Add weekly patterns (weekend vs weekday)
    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.8 : 1.0;
    
    // Add daily variation
    const dailyVariation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    
    // Generate volumes for one day
    const petrolVolume = this.generateVolume('petrol', weekendFactor * dailyVariation) / 30;
    const dieselVolume = this.generateVolume('diesel', weekendFactor * dailyVariation) / 30;
    
    // Use current prices
    const petrolPrice = this.baseData.fuelPrices.petrol.current;
    const dieselPrice = this.baseData.fuelPrices.diesel.current;
    
    // Calculate revenues
    const petrolRevenue = petrolVolume * petrolPrice;
    const dieselRevenue = dieselVolume * dieselPrice;
    const fuelRevenue = petrolRevenue + dieselRevenue;
    
    // Calculate costs
    const petrolCost = petrolVolume * (petrolPrice * 0.85);
    const dieselCost = dieselVolume * (dieselPrice * 0.87);
    const fuelCost = petrolCost + dieselCost;
    
    // Generate shop data for one day
    const shopCustomers = Math.floor((petrolVolume + dieselVolume) * this.baseData.shopData.conversionRate.average);
    const shopRevenue = shopCustomers * this.baseData.shopData.averageTicket.average;
    
    return {
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
      
      // Fuel data
      petrolVolume,
      petrolPrice,
      petrolRevenue,
      petrolCost,
      dieselVolume,
      dieselPrice,
      dieselRevenue,
      dieselCost,
      fuelVolume: petrolVolume + dieselVolume,
      fuelRevenue,
      fuelCost,
      
      // Shop data
      shopRevenue,
      shopCustomers,
      totalCustomers: shopCustomers + Math.floor(petrolVolume + dieselVolume),
      
      // Calculated fields
      grossProfit: fuelRevenue - fuelCost,
      netProfit: fuelRevenue + shopRevenue - fuelCost,
      totalRevenue: fuelRevenue + shopRevenue,
      
      // Metadata
      weekendFactor,
      dailyVariation
    };
  }

  /**
   * Generate volume with realistic variation
   * @param {string} fuelType - Type of fuel
   * @param {number} factor - Adjustment factor
   * @returns {number} Volume in liters
   */
  generateVolume(fuelType, factor = 1) {
    const baseVolume = this.baseData.volumes[fuelType].average;
    const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
    return Math.floor(baseVolume * (1 + variation) * factor);
  }

  /**
   * Generate price with realistic variation
   * @param {string} fuelType - Type of fuel
   * @param {number} monthIndex - Month index for trends
   * @returns {number} Price per liter
   */
  generatePrice(fuelType, monthIndex) {
    const basePrice = this.baseData.fuelPrices[fuelType].current;
    const trend = monthIndex * 0.01; // Slight price increase over time
    const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
    return Math.round((basePrice * (1 + trend + variation)) * 100) / 100;
  }

  /**
   * Calculate seasonality factor based on date
   * @param {Date} date - Date to calculate seasonality for
   * @returns {number} Seasonality factor
   */
  calculateSeasonality(date) {
    const month = date.getMonth();
    
    // Higher consumption in winter (May-August in Southern Hemisphere)
    const winterMonths = [4, 5, 6, 7]; // May, June, July, August
    if (winterMonths.includes(month)) {
      return 1.15; // 15% higher in winter
    }
    
    // Lower consumption in summer (December-February)
    const summerMonths = [11, 0, 1]; // December, January, February
    if (summerMonths.includes(month)) {
      return 0.85; // 15% lower in summer
    }
    
    return 1.0; // Normal for other months
  }

  /**
   * Generate competitor data for comparison
   * @returns {Object} Competitor data
   */
  generateCompetitorData() {
    return {
      averageFuelEfficiency: 0.82,
      averageProfitMargin: 14.5,
      averageShopFuelRatio: 0.28,
      averageVolumeEfficiency: 0.78,
      averageLaborCostRatio: 22.3,
      averageOverheadRatio: 8.7
    };
  }

  /**
   * Generate market data
   * @returns {Object} Market data
   */
  generateMarketData() {
    return {
      totalMarketVolume: 5000000, // 5M liters per month
      averageMarketPrice: {
        petrol: 23.20,
        diesel: 21.50
      },
      marketGrowthRate: 2.5, // 2.5% annual growth
      seasonalFactors: {
        winter: 1.12,
        summer: 0.88,
        spring: 1.02,
        autumn: 0.98
      }
    };
  }

  /**
   * Generate personnel data
   * @returns {Object} Personnel data
   */
  generatePersonnelData() {
    return {
      employees: [
        {
          id: 1,
          name: 'John Smith',
          role: 'Station Manager',
          performance: 85,
          attendance: 95,
          customerSatisfaction: 4.2
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'Cashier',
          performance: 78,
          attendance: 88,
          customerSatisfaction: 4.0
        },
        {
          id: 3,
          name: 'Mike Wilson',
          role: 'Pump Attendant',
          performance: 82,
          attendance: 92,
          customerSatisfaction: 4.1
        }
      ],
      performanceMetrics: {
        averagePerformance: 81.7,
        averageAttendance: 91.7,
        averageCustomerSatisfaction: 4.1,
        turnoverRate: 12.5,
        trainingHours: 24
      }
    };
  }

  /**
   * Generate renovation project data
   * @returns {Array} Renovation projects
   */
  generateRenovationData() {
    return [
      {
        id: 1,
        name: 'Shop Expansion',
        description: 'Expand shop floor space by 50%',
        startDate: '2024-03-01',
        endDate: '2024-05-15',
        budget: 150000,
        actualCost: 145000,
        status: 'completed',
        expectedROI: 25,
        actualROI: 28
      },
      {
        id: 2,
        name: 'Fuel Pump Upgrade',
        description: 'Upgrade to modern fuel pumps',
        startDate: '2024-06-01',
        endDate: '2024-07-30',
        budget: 80000,
        actualCost: 82000,
        status: 'in-progress',
        expectedROI: 15,
        actualROI: null
      },
      {
        id: 3,
        name: 'Car Wash Installation',
        description: 'Install automated car wash',
        startDate: '2024-09-01',
        endDate: '2024-10-31',
        budget: 120000,
        actualCost: 0,
        status: 'planned',
        expectedROI: 20,
        actualROI: null
      }
    ];
  }

  /**
   * Generate expansion opportunities
   * @returns {Array} Expansion opportunities
   */
  generateExpansionData() {
    return [
      {
        id: 1,
        name: 'New Site - Mall Location',
        location: 'Shopping Mall Complex',
        investment: 500000,
        expectedRevenue: 180000,
        expectedProfit: 45000,
        riskLevel: 'medium',
        timeframe: '12 months',
        npv: 125000,
        irr: 22
      },
      {
        id: 2,
        name: 'Highway Site Expansion',
        location: 'N1 Highway',
        investment: 800000,
        expectedRevenue: 250000,
        expectedProfit: 75000,
        riskLevel: 'low',
        timeframe: '18 months',
        npv: 200000,
        irr: 28
      },
      {
        id: 3,
        name: 'Urban Mini Station',
        location: 'City Center',
        investment: 300000,
        expectedRevenue: 120000,
        expectedProfit: 30000,
        riskLevel: 'high',
        timeframe: '9 months',
        npv: 75000,
        irr: 18
      }
    ];
  }
}

// Global sample data generator instance
window.sampleDataGenerator = new SampleDataGenerator();

export default window.sampleDataGenerator;
