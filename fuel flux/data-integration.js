// ========================================
// DATA INTEGRATION ENGINE
// ========================================

class DataIntegrationEngine {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.historicalData = {};
    this.trends = {};
    this.integrationSettings = {
      revenueUpliftFactor: 0.15, // 15% revenue uplift from renovations
      delayMonths: 3, // 3 months delay before uplift starts
      decayRate: 0.02, // 2% monthly decay in uplift
      learningRate: 0.1, // 10% learning from historical data
      projectionMonths: 60 // 5 years projection
    };
  }

  // ========================================
  // HISTORICAL DATA ANALYSIS
  // ========================================

  // Load and analyze historical revenue data
  async loadHistoricalData(companyId, months = 24) {
    try {
      console.log('Loading historical data for company:', companyId);
      
      // Get monthly reports from the last N months
      const { data: reports, error } = await this.supabase
        .from('monthly_reports')
        .select(`
          *,
          fuel_data(*),
          shop_data(*)
        `)
        .eq('company_id', companyId)
        .order('report_year', { ascending: false })
        .order('report_month', { ascending: false })
        .limit(months);

      if (error) throw error;

      // Process and structure historical data
      const historicalData = this.processHistoricalData(reports);
      this.historicalData = historicalData;
      
      // Calculate trends
      this.trends = this.calculateTrends(historicalData);
      
      console.log('Historical data loaded:', historicalData);
      return historicalData;
    } catch (error) {
      console.error('Error loading historical data:', error);
      throw error;
    }
  }

  // Process raw historical data into structured format
  processHistoricalData(reports) {
    const processed = {
      monthly: [],
      fuel: {
        total: [],
        byType: {},
        margins: []
      },
      shop: {
        total: [],
        byCategory: {},
        margins: []
      },
      combined: {
        revenue: [],
        growth: [],
        seasonality: []
      }
    };

    // Sort reports by date
    const sortedReports = reports.sort((a, b) => {
      const dateA = new Date(a.report_year, a.report_month - 1);
      const dateB = new Date(b.report_year, b.report_month - 1);
      return dateA - dateB;
    });

    sortedReports.forEach(report => {
      const monthKey = `${report.report_year}-${report.report_month.toString().padStart(2, '0')}`;
      
      // Process fuel data
      if (report.fuel_data && report.fuel_data.length > 0) {
        const fuelData = report.fuel_data[0];
        const fuelRevenue = fuelData.diesel_ex_revenue + fuelData.vpower_95_revenue + fuelData.vpower_diesel_revenue;
        const fuelVolume = fuelData.diesel_ex_volume + fuelData.vpower_95_volume + fuelData.vpower_diesel_volume;
        
        processed.fuel.total.push({
          month: monthKey,
          revenue: fuelRevenue,
          volume: fuelVolume,
          margin: fuelData.total_margin || 0
        });

        // Track by fuel type
        ['diesel_ex', 'vpower_95', 'vpower_diesel'].forEach(type => {
          if (!processed.fuel.byType[type]) {
            processed.fuel.byType[type] = [];
          }
          processed.fuel.byType[type].push({
            month: monthKey,
            revenue: fuelData[`${type}_revenue`] || 0,
            volume: fuelData[`${type}_volume`] || 0,
            margin: fuelData[`${type}_margin`] || 0
          });
        });
      }

      // Process shop data
      if (report.shop_data && report.shop_data.length > 0) {
        const shopData = report.shop_data[0];
        const shopRevenue = shopData.total_revenue || 0;
        
        processed.shop.total.push({
          month: monthKey,
          revenue: shopRevenue,
          units: shopData.total_units || 0,
          margin: shopData.total_margin || 0
        });

        // Track by category
        if (shopData.categories) {
          Object.keys(shopData.categories).forEach(category => {
            if (!processed.shop.byCategory[category]) {
              processed.shop.byCategory[category] = [];
            }
            processed.shop.byCategory[category].push({
              month: monthKey,
              revenue: shopData.categories[category].revenue || 0,
              units: shopData.categories[category].units || 0,
              margin: shopData.categories[category].margin || 0
            });
          });
        }
      }

      // Combined metrics
      const totalRevenue = (processed.fuel.total[processed.fuel.total.length - 1]?.revenue || 0) + 
                          (processed.shop.total[processed.shop.total.length - 1]?.revenue || 0);
      
      processed.combined.revenue.push({
        month: monthKey,
        total: totalRevenue,
        fuel: processed.fuel.total[processed.fuel.total.length - 1]?.revenue || 0,
        shop: processed.shop.total[processed.shop.total.length - 1]?.revenue || 0
      });

      // Calculate month-over-month growth
      if (processed.combined.revenue.length > 1) {
        const prevRevenue = processed.combined.revenue[processed.combined.revenue.length - 2].total;
        const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
        processed.combined.growth.push({
          month: monthKey,
          growth: growth
        });
      }
    });

    return processed;
  }

  // Calculate trends from historical data
  calculateTrends(historicalData) {
    const trends = {
      revenue: {
        growth: 0,
        seasonality: [],
        volatility: 0
      },
      fuel: {
        growth: 0,
        marginTrend: 0,
        volumeTrend: 0
      },
      shop: {
        growth: 0,
        marginTrend: 0,
        categoryGrowth: {}
      }
    };

    // Calculate revenue growth trend
    if (historicalData.combined.revenue.length > 1) {
      const firstRevenue = historicalData.combined.revenue[0].total;
      const lastRevenue = historicalData.combined.revenue[historicalData.combined.revenue.length - 1].total;
      const months = historicalData.combined.revenue.length - 1;
      
      trends.revenue.growth = months > 0 ? 
        (Math.pow(lastRevenue / firstRevenue, 1 / months) - 1) * 100 : 0;
    }

    // Calculate fuel trends
    if (historicalData.fuel.total.length > 1) {
      const firstFuel = historicalData.fuel.total[0].revenue;
      const lastFuel = historicalData.fuel.total[historicalData.fuel.total.length - 1].revenue;
      const months = historicalData.fuel.total.length - 1;
      
      trends.fuel.growth = months > 0 ? 
        (Math.pow(lastFuel / firstFuel, 1 / months) - 1) * 100 : 0;
    }

    // Calculate shop trends
    if (historicalData.shop.total.length > 1) {
      const firstShop = historicalData.shop.total[0].revenue;
      const lastShop = historicalData.shop.total[historicalData.shop.total.length - 1].revenue;
      const months = historicalData.shop.total.length - 1;
      
      trends.shop.growth = months > 0 ? 
        (Math.pow(lastShop / firstShop, 1 / months) - 1) * 100 : 0;
    }

    // Calculate volatility (standard deviation of growth rates)
    if (historicalData.combined.growth.length > 1) {
      const growthRates = historicalData.combined.growth.map(g => g.growth);
      const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
      const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length;
      trends.revenue.volatility = Math.sqrt(variance);
    }

    return trends;
  }

  // ========================================
  // TREND PROJECTION
  // ========================================

  // Project future revenue based on historical trends
  projectFutureRevenue(months = 60) {
    if (!this.historicalData.combined.revenue.length) {
      return null;
    }

    const projections = {
      fuel: [],
      shop: [],
      combined: []
    };

    const lastFuelRevenue = this.historicalData.fuel.total[this.historicalData.fuel.total.length - 1]?.revenue || 0;
    const lastShopRevenue = this.historicalData.shop.total[this.historicalData.shop.total.length - 1]?.revenue || 0;
    const lastCombinedRevenue = lastFuelRevenue + lastShopRevenue;

    for (let i = 1; i <= months; i++) {
      // Project fuel revenue with trend
      const fuelGrowth = this.trends.fuel.growth / 100;
      const projectedFuel = lastFuelRevenue * Math.pow(1 + fuelGrowth, i);

      // Project shop revenue with trend
      const shopGrowth = this.trends.shop.growth / 100;
      const projectedShop = lastShopRevenue * Math.pow(1 + shopGrowth, i);

      // Apply seasonality (simplified - could be enhanced with actual seasonal patterns)
      const seasonalFactor = this.calculateSeasonalFactor(i);

      projections.fuel.push({
        month: i,
        revenue: projectedFuel * seasonalFactor,
        volume: this.projectFuelVolume(i, lastFuelRevenue),
        margin: this.projectFuelMargin(i)
      });

      projections.shop.push({
        month: i,
        revenue: projectedShop * seasonalFactor,
        units: this.projectShopUnits(i, lastShopRevenue),
        margin: this.projectShopMargin(i)
      });

      projections.combined.push({
        month: i,
        total: (projectedFuel + projectedShop) * seasonalFactor,
        fuel: projectedFuel * seasonalFactor,
        shop: projectedShop * seasonalFactor
      });
    }

    return projections;
  }

  // Calculate seasonal factor (simplified)
  calculateSeasonalFactor(monthIndex) {
    // Simple seasonal pattern - could be enhanced with actual data
    const month = (monthIndex % 12) + 1;
    
    // Holiday season boost (Dec-Jan)
    if (month === 12 || month === 1) return 1.15;
    
    // Summer boost (Dec-Feb in Southern Hemisphere)
    if (month === 12 || month === 1 || month === 2) return 1.10;
    
    // Winter boost (Jun-Aug in Southern Hemisphere)
    if (month === 6 || month === 7 || month === 8) return 1.05;
    
    // Standard period
    return 1.0;
  }

  // Project fuel volume based on revenue trend
  projectFuelVolume(monthIndex, lastRevenue) {
    const volumePerRevenue = this.historicalData.fuel.total.length > 0 ? 
      this.historicalData.fuel.total[this.historicalData.fuel.total.length - 1].volume / 
      this.historicalData.fuel.total[this.historicalData.fuel.total.length - 1].revenue : 1;
    
    const projectedRevenue = lastRevenue * Math.pow(1 + this.trends.fuel.growth / 100, monthIndex);
    return projectedRevenue * volumePerRevenue;
  }

  // Project fuel margin
  projectFuelMargin(monthIndex) {
    const avgMargin = this.historicalData.fuel.total.length > 0 ?
      this.historicalData.fuel.total.reduce((sum, data) => sum + data.margin, 0) / 
      this.historicalData.fuel.total.length : 0.15;
    
    return avgMargin;
  }

  // Project shop units
  projectShopUnits(monthIndex, lastRevenue) {
    const unitsPerRevenue = this.historicalData.shop.total.length > 0 ?
      this.historicalData.shop.total[this.historicalData.shop.total.length - 1].units /
      this.historicalData.shop.total[this.historicalData.shop.total.length - 1].revenue : 1;
    
    const projectedRevenue = lastRevenue * Math.pow(1 + this.trends.shop.growth / 100, monthIndex);
    return projectedRevenue * unitsPerRevenue;
  }

  // Project shop margin
  projectShopMargin(monthIndex) {
    const avgMargin = this.historicalData.shop.total.length > 0 ?
      this.historicalData.shop.total.reduce((sum, data) => sum + data.margin, 0) /
      this.historicalData.shop.total.length : 0.25;
    
    return avgMargin;
  }

  // ========================================
  // RENOVATION INTEGRATION
  // ========================================

  // Integrate renovation costs with projected revenue
  integrateRenovationWithProjections(renovationCashflows, projectedRevenue) {
    if (!projectedRevenue) return null;

    const integrated = {
      monthly: [],
      summary: {
        totalInvestment: 0,
        totalRevenue: 0,
        netBenefit: 0,
        paybackPeriod: null,
        roi: 0
      }
    };

    const horizon = Math.max(renovationCashflows.length, projectedRevenue.combined.length);
    let cumulativeInvestment = 0;
    let cumulativeRevenue = 0;

    for (let i = 0; i < horizon; i++) {
      const renovationCost = i < renovationCashflows.length ? renovationCashflows[i] : 0;
      const baseRevenue = i < projectedRevenue.combined.length ? projectedRevenue.combined[i].total : 0;
      
      // Calculate revenue uplift from renovations
      const revenueUplift = this.calculateRevenueUplift(i, renovationCost);
      const adjustedRevenue = baseRevenue * (1 + revenueUplift);
      
      const netCashflow = adjustedRevenue - renovationCost;
      cumulativeInvestment += renovationCost;
      cumulativeRevenue += adjustedRevenue;

      integrated.monthly.push({
        month: i + 1,
        renovationCost: renovationCost,
        baseRevenue: baseRevenue,
        revenueUplift: revenueUplift,
        adjustedRevenue: adjustedRevenue,
        netCashflow: netCashflow,
        cumulativeInvestment: cumulativeInvestment,
        cumulativeRevenue: cumulativeRevenue
      });
    }

    // Calculate summary metrics
    integrated.summary.totalInvestment = cumulativeInvestment;
    integrated.summary.totalRevenue = cumulativeRevenue;
    integrated.summary.netBenefit = cumulativeRevenue - cumulativeInvestment;
    integrated.summary.roi = cumulativeInvestment > 0 ? 
      ((cumulativeRevenue - cumulativeInvestment) / cumulativeInvestment) * 100 : 0;

    // Calculate payback period
    let cumulative = 0;
    for (let i = 0; i < integrated.monthly.length; i++) {
      cumulative += integrated.monthly[i].netCashflow;
      if (cumulative >= 0) {
        integrated.summary.paybackPeriod = i + 1;
        break;
      }
    }

    return integrated;
  }

  // Calculate revenue uplift from renovations
  calculateRevenueUplift(monthIndex, renovationCost) {
    if (renovationCost === 0) return 0;
    
    const { revenueUpliftFactor, delayMonths, decayRate } = this.integrationSettings;
    const effectiveMonth = Math.max(0, monthIndex - delayMonths);
    
    return revenueUpliftFactor * Math.exp(-decayRate * effectiveMonth);
  }

  // ========================================
  // AUTOMATED UPDATES
  // ========================================

  // Set up automated data updates
  async setupAutomatedUpdates(companyId, updateInterval = 24 * 60 * 60 * 1000) { // 24 hours
    console.log('Setting up automated data updates for company:', companyId);
    
    // Store update configuration
    const updateConfig = {
      companyId: companyId,
      lastUpdate: new Date().toISOString(),
      updateInterval: updateInterval,
      isActive: true
    };

    try {
      // Save to database
      const { error } = await this.supabase
        .from('data_integration_config')
        .upsert([updateConfig], { onConflict: 'company_id' });

      if (error) throw error;

      // Set up periodic updates
      setInterval(async () => {
        await this.performAutomatedUpdate(companyId);
      }, updateInterval);

      console.log('Automated updates configured successfully');
      return true;
    } catch (error) {
      console.error('Error setting up automated updates:', error);
      return false;
    }
  }

  // Perform automated data update
  async performAutomatedUpdate(companyId) {
    try {
      console.log('Performing automated data update for company:', companyId);
      
      // Reload historical data
      await this.loadHistoricalData(companyId);
      
      // Update projections
      const projections = this.projectFutureRevenue();
      
      // Update renovation integrations if any exist
      await this.updateRenovationIntegrations(companyId, projections);
      
      // Log update
      const { error } = await this.supabase
        .from('data_integration_logs')
        .insert([{
          company_id: companyId,
          update_type: 'automated',
          status: 'success',
          data_summary: {
            historical_months: this.historicalData.combined.revenue.length,
            projection_months: projections ? projections.combined.length : 0
          }
        }]);

      if (error) console.error('Error logging update:', error);
      
      console.log('Automated update completed successfully');
    } catch (error) {
      console.error('Error performing automated update:', error);
      
      // Log error
      try {
        await this.supabase
          .from('data_integration_logs')
          .insert([{
            company_id: companyId,
            update_type: 'automated',
            status: 'error',
            error_message: error.message
          }]);
      } catch (logError) {
        console.error('Error logging update error:', logError);
      }
    }
  }

  // Update renovation integrations with new projections
  async updateRenovationIntegrations(companyId, projections) {
    try {
      // Get active renovation projects
      const { data: projects, error } = await this.supabase
        .from('renovation_projects')
        .select('*')
        .eq('created_by', companyId)
        .eq('status', 'active');

      if (error) throw error;

      // Update each project's cash flows with new projections
      for (const project of projects) {
        const cashFlows = await this.getProjectCashFlows(project.id);
        if (cashFlows && cashFlows.length > 0) {
          const integrated = this.integrateRenovationWithProjections(cashFlows, projections);
          if (integrated) {
            await this.updateProjectCashFlows(project.id, integrated);
          }
        }
      }
    } catch (error) {
      console.error('Error updating renovation integrations:', error);
    }
  }

  // Get project cash flows
  async getProjectCashFlows(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_cash_flows')
        .select('*')
        .eq('project_id', projectId)
        .order('month_index', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting project cash flows:', error);
      return null;
    }
  }

  // Update project cash flows
  async updateProjectCashFlows(projectId, integratedData) {
    try {
      // Update cash flows with integrated data
      const updatedCashFlows = integratedData.monthly.map((month, index) => ({
        project_id: projectId,
        month_index: index,
        capex_renovations_zar: month.renovationCost,
        revenue_zar: month.adjustedRevenue,
        opex_zar: 0, // Could be enhanced with actual OPEX data
        tax_zar: 0, // Could be enhanced with actual tax calculations
        net_cashflow_zar: month.netCashflow,
        cumulative_zar: month.cumulativeRevenue - month.cumulativeInvestment
      }));

      // Delete existing cash flows
      await this.supabase
        .from('renovation_cash_flows')
        .delete()
        .eq('project_id', projectId);

      // Insert updated cash flows
      const { error } = await this.supabase
        .from('renovation_cash_flows')
        .insert(updatedCashFlows);

      if (error) throw error;

      console.log('Updated cash flows for project:', projectId);
    } catch (error) {
      console.error('Error updating project cash flows:', error);
    }
  }

  // ========================================
  // INSIGHTS AND RECOMMENDATIONS
  // ========================================

  // Generate business insights from integrated data
  generateInsights(integratedData, historicalData) {
    const insights = {
      revenue: [],
      renovation: [],
      recommendations: []
    };

    // Revenue insights
    if (historicalData.combined.revenue.length > 0) {
      const avgGrowth = this.trends.revenue.growth;
      const volatility = this.trends.revenue.volatility;

      insights.revenue.push({
        type: 'growth',
        message: `Average monthly revenue growth: ${avgGrowth.toFixed(2)}%`,
        impact: avgGrowth > 5 ? 'positive' : avgGrowth > 0 ? 'neutral' : 'negative'
      });

      insights.revenue.push({
        type: 'volatility',
        message: `Revenue volatility: ${volatility.toFixed(2)}%`,
        impact: volatility < 10 ? 'positive' : volatility < 20 ? 'neutral' : 'negative'
      });
    }

    // Renovation insights
    if (integratedData) {
      const roi = integratedData.summary.roi;
      const payback = integratedData.summary.paybackPeriod;

      insights.renovation.push({
        type: 'roi',
        message: `Projected ROI: ${roi.toFixed(2)}%`,
        impact: roi > 20 ? 'positive' : roi > 10 ? 'neutral' : 'negative'
      });

      if (payback) {
        insights.renovation.push({
          type: 'payback',
          message: `Payback period: ${payback} months`,
          impact: payback < 24 ? 'positive' : payback < 48 ? 'neutral' : 'negative'
        });
      }
    }

    // Generate recommendations
    insights.recommendations = this.generateRecommendations(insights, integratedData);

    return insights;
  }

  // Generate actionable recommendations
  generateRecommendations(insights, integratedData) {
    const recommendations = [];

    // Revenue-based recommendations
    const revenueGrowth = insights.revenue.find(i => i.type === 'growth');
    if (revenueGrowth && revenueGrowth.impact === 'negative') {
      recommendations.push({
        priority: 'high',
        category: 'revenue',
        title: 'Revenue Growth Optimization',
        description: 'Consider implementing revenue optimization strategies to improve growth rates.',
        action: 'Review pricing strategies and customer acquisition methods.'
      });
    }

    // Renovation-based recommendations
    const renovationROI = insights.renovation.find(i => i.type === 'roi');
    if (renovationROI && renovationROI.impact === 'positive') {
      recommendations.push({
        priority: 'high',
        category: 'renovation',
        title: 'Proceed with Renovation',
        description: 'Renovation project shows strong ROI potential.',
        action: 'Consider accelerating renovation timeline to capture benefits sooner.'
      });
    }

    // Data quality recommendations
    if (this.historicalData.combined.revenue.length < 12) {
      recommendations.push({
        priority: 'medium',
        category: 'data',
        title: 'Improve Data Collection',
        description: 'Limited historical data available for accurate projections.',
        action: 'Continue collecting monthly data to improve projection accuracy.'
      });
    }

    return recommendations;
  }

  // ========================================
  // EXPORT AND REPORTING
  // ========================================

  // Export integrated data for reporting
  exportIntegratedData(integratedData, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(integratedData, null, 2);
      
      case 'csv':
        return this.convertToCSV(integratedData);
      
      case 'excel':
        return this.convertToExcel(integratedData);
      
      default:
        return JSON.stringify(integratedData, null, 2);
    }
  }

  // Convert data to CSV format
  convertToCSV(integratedData) {
    if (!integratedData || !integratedData.monthly) return '';

    const headers = ['Month', 'Renovation Cost', 'Base Revenue', 'Revenue Uplift', 'Adjusted Revenue', 'Net Cashflow'];
    const rows = integratedData.monthly.map(month => [
      month.month,
      month.renovationCost.toFixed(2),
      month.baseRevenue.toFixed(2),
      (month.revenueUplift * 100).toFixed(2) + '%',
      month.adjustedRevenue.toFixed(2),
      month.netCashflow.toFixed(2)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // Convert data to Excel format (simplified)
  convertToExcel(integratedData) {
    // This would typically use a library like SheetJS
    // For now, return CSV format
    return this.convertToCSV(integratedData);
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.DataIntegrationEngine = DataIntegrationEngine;
}
