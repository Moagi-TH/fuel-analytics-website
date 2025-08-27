/**
 * FUEL FLUX Analytics Engine
 * Comprehensive business logic for fuel analytics, trend analysis, and performance metrics
 */

class AnalyticsEngine {
  constructor() {
    this.metrics = new Map();
    this.trends = new Map();
    this.forecasts = new Map();
    this.alerts = new Map();
    this.benchmarks = {
      fuelEfficiency: { good: 0.8, excellent: 0.9, poor: 0.6 },
      profitMargin: { good: 12, excellent: 18, poor: 8 },
      shopFuelRatio: { good: 0.3, excellent: 0.5, poor: 0.2 },
      volumeEfficiency: { good: 0.75, excellent: 0.9, poor: 0.6 }
    };
    
    this.initialize();
  }

  /**
   * Initialize analytics engine
   */
  initialize() {
    this.setupCalculators();
    this.setupTrendDetectors();
    this.setupForecastingModels();
    this.setupAlertSystem();
    this.setupBenchmarking();
  }

  /**
   * Setup calculation engines
   */
  setupCalculators() {
    this.calculators = {
      // Fuel Efficiency Metrics
      fuelEfficiency: {
        litersPerRand: (volume, revenue) => volume / Math.max(revenue, 1),
        randPerLiter: (revenue, volume) => revenue / Math.max(volume, 1),
        efficiencyRatio: (volume, revenue, cost) => {
          const grossProfit = revenue - cost;
          return grossProfit / Math.max(volume, 1);
        }
      },

      // Profitability Metrics
      profitability: {
        grossProfitMargin: (revenue, cost) => {
          const grossProfit = revenue - cost;
          return (grossProfit / Math.max(revenue, 1)) * 100;
        },
        netProfitMargin: (revenue, totalCosts) => {
          const netProfit = revenue - totalCosts;
          return (netProfit / Math.max(revenue, 1)) * 100;
        },
        profitPerLiter: (profit, volume) => profit / Math.max(volume, 1),
        roi: (profit, investment) => (profit / Math.max(investment, 1)) * 100
      },

      // Volume Metrics
      volume: {
        averageDailyVolume: (totalVolume, days) => totalVolume / Math.max(days, 1),
        volumeGrowth: (currentVolume, previousVolume) => {
          return ((currentVolume - previousVolume) / Math.max(previousVolume, 1)) * 100;
        },
        marketShare: (siteVolume, totalMarketVolume) => {
          return (siteVolume / Math.max(totalMarketVolume, 1)) * 100;
        }
      },

      // Shop Performance Metrics
      shop: {
        shopFuelRatio: (shopRevenue, fuelRevenue) => {
          return shopRevenue / Math.max(fuelRevenue, 1);
        },
        shopConversionRate: (shopCustomers, totalCustomers) => {
          return (shopCustomers / Math.max(totalCustomers, 1)) * 100;
        },
        averageShopTicket: (shopRevenue, shopCustomers) => {
          return shopRevenue / Math.max(shopCustomers, 1);
        }
      },

      // Operational Efficiency
      operational: {
        laborCostRatio: (laborCost, revenue) => (laborCost / Math.max(revenue, 1)) * 100,
        overheadRatio: (overhead, revenue) => (overhead / Math.max(revenue, 1)) * 100,
        breakEvenVolume: (fixedCosts, contributionMargin) => {
          return fixedCosts / Math.max(contributionMargin, 1);
        }
      }
    };
  }

  /**
   * Setup trend detection
   */
  setupTrendDetectors() {
    this.trendDetectors = {
      // Moving Average Trend Detection
      movingAverage: (data, period = 7) => {
        if (data.length < period) return null;
        
        const recent = data.slice(-period);
        const average = recent.reduce((sum, val) => sum + val, 0) / period;
        
        return {
          trend: recent[recent.length - 1] > average ? 'increasing' : 'decreasing',
          strength: Math.abs(recent[recent.length - 1] - average) / average,
          average
        };
      },

      // Linear Regression Trend
      linearRegression: (data) => {
        if (data.length < 2) return null;
        
        const n = data.length;
        const x = Array.from({length: n}, (_, i) => i);
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * data[i], 0);
        const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        return {
          slope,
          intercept,
          trend: slope > 0 ? 'increasing' : 'decreasing',
          strength: Math.abs(slope),
          r2: this.calculateRSquared(data, x.map(xi => slope * xi + intercept))
        };
      },

      // Seasonality Detection
      seasonality: (data, period = 12) => {
        if (data.length < period * 2) return null;
        
        const seasonalFactors = [];
        for (let i = 0; i < period; i++) {
          const seasonalData = [];
          for (let j = i; j < data.length; j += period) {
            seasonalData.push(data[j]);
          }
          seasonalFactors[i] = seasonalData.reduce((sum, val) => sum + val, 0) / seasonalData.length;
        }
        
        const overallAverage = data.reduce((sum, val) => sum + val, 0) / data.length;
        const seasonalityIndex = seasonalFactors.map(factor => factor / overallAverage);
        
        return {
          seasonalityIndex,
          strength: this.calculateSeasonalityStrength(seasonalityIndex),
          dominantPeriod: seasonalityIndex.indexOf(Math.max(...seasonalityIndex))
        };
      }
    };
  }

  /**
   * Setup forecasting models
   */
  setupForecastingModels() {
    this.forecasters = {
      // Simple Moving Average Forecast
      movingAverage: (data, periods = 7, forecastDays = 30) => {
        if (data.length < periods) return null;
        
        const recentAverage = data.slice(-periods).reduce((sum, val) => sum + val, 0) / periods;
        const forecast = Array(forecastDays).fill(recentAverage);
        
        return {
          forecast,
          method: 'moving_average',
          confidence: this.calculateForecastConfidence(data, periods)
        };
      },

      // Linear Regression Forecast
      linearRegression: (data, forecastDays = 30) => {
        const trend = this.trendDetectors.linearRegression(data);
        if (!trend) return null;
        
        const forecast = [];
        for (let i = 1; i <= forecastDays; i++) {
          const prediction = trend.slope * (data.length + i - 1) + trend.intercept;
          forecast.push(Math.max(prediction, 0)); // Ensure non-negative
        }
        
        return {
          forecast,
          method: 'linear_regression',
          confidence: trend.r2,
          trend: trend.trend
        };
      },

      // Seasonal Forecast
      seasonal: (data, seasonality, forecastDays = 30) => {
        if (!seasonality || !seasonality.seasonalityIndex) return null;
        
        const baseForecast = this.forecasters.linearRegression(data, forecastDays);
        if (!baseForecast) return null;
        
        const seasonalForecast = baseForecast.forecast.map((value, index) => {
          const seasonalIndex = index % seasonality.seasonalityIndex.length;
          return value * seasonality.seasonalityIndex[seasonalIndex];
        });
        
        return {
          forecast: seasonalForecast,
          method: 'seasonal_adjusted',
          confidence: baseForecast.confidence * seasonality.strength
        };
      }
    };
  }

  /**
   * Setup alert system
   */
  setupAlertSystem() {
    this.alertSystem = {
      // Performance Alerts
      performance: {
        lowFuelEfficiency: (efficiency, threshold = 0.6) => {
          return {
            triggered: efficiency < threshold,
            severity: 'high',
            message: `Fuel efficiency (${efficiency.toFixed(2)}) below threshold (${threshold})`,
            recommendation: 'Review pricing strategy and operational efficiency'
          };
        },

        highProfitMargin: (margin, threshold = 20) => {
          return {
            triggered: margin > threshold,
            severity: 'low',
            message: `Profit margin (${margin.toFixed(1)}%) above threshold (${threshold}%)`,
            recommendation: 'Consider competitive pricing analysis'
          };
        },

        lowShopFuelRatio: (ratio, threshold = 0.2) => {
          return {
            triggered: ratio < threshold,
            severity: 'medium',
            message: `Shop-to-fuel ratio (${ratio.toFixed(2)}) below threshold (${threshold})`,
            recommendation: 'Focus on shop sales and customer engagement'
          };
        }
      },

      // Trend Alerts
      trends: {
        decliningTrend: (trend, threshold = 0.05) => {
          return {
            triggered: trend.trend === 'decreasing' && trend.strength > threshold,
            severity: 'medium',
            message: `Declining trend detected (strength: ${trend.strength.toFixed(3)})`,
            recommendation: 'Investigate causes and implement corrective measures'
          };
        },

        strongGrowth: (trend, threshold = 0.1) => {
          return {
            triggered: trend.trend === 'increasing' && trend.strength > threshold,
            severity: 'low',
            message: `Strong growth trend detected (strength: ${trend.strength.toFixed(3)})`,
            recommendation: 'Capitalize on growth momentum'
          };
        }
      },

      // Operational Alerts
      operational: {
        highLaborCost: (ratio, threshold = 25) => {
          return {
            triggered: ratio > threshold,
            severity: 'high',
            message: `Labor cost ratio (${ratio.toFixed(1)}%) above threshold (${threshold}%)`,
            recommendation: 'Review staffing levels and efficiency'
          };
        },

        lowVolumeEfficiency: (efficiency, threshold = 0.7) => {
          return {
            triggered: efficiency < threshold,
            severity: 'medium',
            message: `Volume efficiency (${efficiency.toFixed(2)}) below threshold (${threshold})`,
            recommendation: 'Optimize operations and resource utilization'
          };
        }
      }
    };
  }

  /**
   * Setup benchmarking
   */
  setupBenchmarking() {
    this.benchmarking = {
      // Performance Rating
      calculateRating: (metric, value, category) => {
        const benchmarks = this.benchmarks[category];
        if (!benchmarks) return null;

        if (value >= benchmarks.excellent) return 'excellent';
        if (value >= benchmarks.good) return 'good';
        if (value >= benchmarks.poor) return 'average';
        return 'poor';
      },

      // Competitive Analysis
      competitiveAnalysis: (siteData, competitorData) => {
        const analysis = {};
        
        Object.keys(siteData).forEach(metric => {
          if (competitorData[metric]) {
            const siteValue = siteData[metric];
            const competitorValue = competitorData[metric];
            const difference = ((siteValue - competitorValue) / competitorValue) * 100;
            
            analysis[metric] = {
              siteValue,
              competitorValue,
              difference,
              position: difference > 0 ? 'ahead' : 'behind',
              gap: Math.abs(difference)
            };
          }
        });
        
        return analysis;
      },

      // Performance Scoring
      calculateScore: (metrics) => {
        let totalScore = 0;
        let maxScore = 0;
        
        Object.keys(metrics).forEach(metric => {
          const value = metrics[metric].value;
          const weight = metrics[metric].weight || 1;
          const rating = this.benchmarking.calculateRating(metric, value, metrics[metric].category);
          
          const score = this.getScoreFromRating(rating) * weight;
          totalScore += score;
          maxScore += 10 * weight; // Assuming 10 is max score per metric
        });
        
        return {
          score: totalScore,
          percentage: (totalScore / maxScore) * 100,
          grade: this.getGradeFromPercentage((totalScore / maxScore) * 100)
        };
      }
    };
  }

  /**
   * Calculate comprehensive metrics
   * @param {Object} data - Fuel station data
   * @returns {Object} Calculated metrics
   */
  calculateMetrics(data) {
    const metrics = {};

    // Basic fuel metrics
    metrics.fuelEfficiency = {
      litersPerRand: this.calculators.fuelEfficiency.litersPerRand(data.fuelVolume, data.fuelRevenue),
      randPerLiter: this.calculators.fuelEfficiency.randPerLiter(data.fuelRevenue, data.fuelVolume),
      efficiencyRatio: this.calculators.fuelEfficiency.efficiencyRatio(
        data.fuelVolume, data.fuelRevenue, data.fuelCost
      )
    };

    // Profitability metrics
    metrics.profitability = {
      grossProfitMargin: this.calculators.profitability.grossProfitMargin(
        data.fuelRevenue, data.fuelCost
      ),
      netProfitMargin: this.calculators.profitability.netProfitMargin(
        data.fuelRevenue, data.totalCosts || data.fuelCost
      ),
      profitPerLiter: this.calculators.profitability.profitPerLiter(
        data.fuelRevenue - data.fuelCost, data.fuelVolume
      )
    };

    // Shop metrics
    metrics.shop = {
      shopFuelRatio: this.calculators.shop.shopFuelRatio(
        data.shopRevenue || 0, data.fuelRevenue
      ),
      shopConversionRate: this.calculators.shop.shopConversionRate(
        data.shopCustomers || 0, data.totalCustomers || data.fuelCustomers || 0
      ),
      averageShopTicket: this.calculators.shop.averageShopTicket(
        data.shopRevenue || 0, data.shopCustomers || 1
      )
    };

    // Operational metrics
    metrics.operational = {
      laborCostRatio: this.calculators.operational.laborCostRatio(
        data.laborCost || 0, data.fuelRevenue
      ),
      overheadRatio: this.calculators.operational.overheadRatio(
        data.overhead || 0, data.fuelRevenue
      ),
      breakEvenVolume: this.calculators.operational.breakEvenVolume(
        data.fixedCosts || data.fuelCost, 
        data.contributionMargin || (data.fuelRevenue - data.fuelCost) / data.fuelVolume
      )
    };

    // Ratings
    metrics.ratings = {
      fuelEfficiency: this.benchmarking.calculateRating(
        metrics.fuelEfficiency.efficiencyRatio, 'fuelEfficiency'
      ),
      profitability: this.benchmarking.calculateRating(
        metrics.profitability.grossProfitMargin, 'profitMargin'
      ),
      shopPerformance: this.benchmarking.calculateRating(
        metrics.shop.shopFuelRatio, 'shopFuelRatio'
      )
    };

    return metrics;
  }

  /**
   * Analyze trends in historical data
   * @param {Array} historicalData - Array of historical data points
   * @returns {Object} Trend analysis
   */
  analyzeTrends(historicalData) {
    const trends = {};

    // Moving average trends
    trends.movingAverage = this.trendDetectors.movingAverage(
      historicalData.map(d => d.fuelVolume || d.volume)
    );

    // Linear regression trends
    trends.linearRegression = this.trendDetectors.linearRegression(
      historicalData.map(d => d.fuelRevenue || d.revenue)
    );

    // Seasonality analysis
    trends.seasonality = this.trendDetectors.seasonality(
      historicalData.map(d => d.fuelVolume || d.volume)
    );

    return trends;
  }

  /**
   * Generate forecasts
   * @param {Array} historicalData - Historical data
   * @param {number} forecastDays - Number of days to forecast
   * @returns {Object} Forecast results
   */
  generateForecasts(historicalData, forecastDays = 30) {
    const forecasts = {};
    const volumeData = historicalData.map(d => d.fuelVolume || d.volume);
    const revenueData = historicalData.map(d => d.fuelRevenue || d.revenue);

    // Moving average forecast
    forecasts.movingAverage = this.forecasters.movingAverage(volumeData, 7, forecastDays);

    // Linear regression forecast
    forecasts.linearRegression = this.forecasters.linearRegression(revenueData, forecastDays);

    // Seasonal forecast
    const seasonality = this.trendDetectors.seasonality(volumeData);
    if (seasonality) {
      forecasts.seasonal = this.forecasters.seasonal(volumeData, seasonality, forecastDays);
    }

    return forecasts;
  }

  /**
   * Generate alerts based on current data
   * @param {Object} data - Current data
   * @returns {Array} Array of alerts
   */
  generateAlerts(data) {
    const alerts = [];
    const metrics = this.calculateMetrics(data);

    // Performance alerts
    Object.keys(this.alertSystem.performance).forEach(alertType => {
      const alert = this.alertSystem.performance[alertType](
        metrics.fuelEfficiency.efficiencyRatio
      );
      if (alert.triggered) alerts.push(alert);
    });

    // Operational alerts
    Object.keys(this.alertSystem.operational).forEach(alertType => {
      const alert = this.alertSystem.operational[alertType](
        metrics.operational.laborCostRatio
      );
      if (alert.triggered) alerts.push(alert);
    });

    return alerts;
  }

  /**
   * Generate business insights
   * @param {Object} data - Current data
   * @param {Object} trends - Trend analysis
   * @param {Object} forecasts - Forecast results
   * @returns {Array} Array of insights
   */
  generateInsights(data, trends, forecasts) {
    const insights = [];
    const metrics = this.calculateMetrics(data);

    // Performance insights
    if (metrics.ratings.fuelEfficiency === 'poor') {
      insights.push({
        type: 'performance',
        severity: 'high',
        title: 'Low Fuel Efficiency Detected',
        description: 'Your fuel efficiency is below industry standards',
        recommendation: 'Review pricing strategy and operational efficiency',
        impact: 'High'
      });
    }

    if (metrics.shop.shopFuelRatio < 0.3) {
      insights.push({
        type: 'opportunity',
        severity: 'medium',
        title: 'Shop Sales Opportunity',
        description: 'Shop-to-fuel ratio is low, indicating room for improvement',
        recommendation: 'Focus on shop sales and customer engagement strategies',
        impact: 'Medium'
      });
    }

    // Trend insights
    if (trends.linearRegression && trends.linearRegression.trend === 'decreasing') {
      insights.push({
        type: 'trend',
        severity: 'medium',
        title: 'Declining Revenue Trend',
        description: 'Revenue is showing a declining trend',
        recommendation: 'Investigate causes and implement growth strategies',
        impact: 'High'
      });
    }

    return insights;
  }

  // Helper methods
  calculateRSquared(actual, predicted) {
    const mean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
    const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
    const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0);
    return 1 - (ssRes / ssTot);
  }

  calculateSeasonalityStrength(seasonalityIndex) {
    const max = Math.max(...seasonalityIndex);
    const min = Math.min(...seasonalityIndex);
    return (max - min) / max;
  }

  calculateForecastConfidence(data, periods) {
    const variance = this.calculateVariance(data.slice(-periods));
    const mean = data.slice(-periods).reduce((sum, val) => sum + val, 0) / periods;
    return Math.max(0, 1 - (variance / (mean * mean)));
  }

  calculateVariance(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
  }

  getScoreFromRating(rating) {
    const scores = { excellent: 10, good: 8, average: 6, poor: 3 };
    return scores[rating] || 5;
  }

  getGradeFromPercentage(percentage) {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }
}

// Global analytics engine instance
window.analyticsEngine = new AnalyticsEngine();

export default window.analyticsEngine;
