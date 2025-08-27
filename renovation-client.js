// ========================================
// RENOVATION SUPABASE CLIENT
// ========================================

class RenovationClient {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.currentProject = null;
    this.financialEngine = new AdvancedFinancialEngine();
  }

  // ========================================
  // PROJECT MANAGEMENT
  // ========================================

  // Create a new renovation project
  async createProject(projectData) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_projects')
        .insert([{
          name: projectData.name || 'My Renovation Project',
          description: projectData.description,
          currency: projectData.currency || 'ZAR',
          start_date: projectData.startDate || new Date().toISOString().split('T')[0],
          horizon_months: projectData.horizon || 120,
          discount_rate_annual: projectData.discountRate || 0.12,
          tax_rate: projectData.taxRate || 0.28,
          vat_rate: projectData.vatRate || 0.15
        }])
        .select()
        .single();

      if (error) throw error;

      this.currentProject = data;
      
      // Create default groups for the project
      await this.createDefaultGroups(data.id);
      
      return data;
    } catch (error) {
      console.error('Error creating renovation project:', error);
      throw error;
    }
  }

  // Get all projects for the current user
  async getProjects() {
    try {
      const { data, error } = await this.supabase
        .from('renovation_projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching renovation projects:', error);
      throw error;
    }
  }

  // Get a specific project by ID
  async getProject(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      
      this.currentProject = data;
      return data;
    } catch (error) {
      console.error('Error fetching renovation project:', error);
      throw error;
    }
  }

  // Update project settings
  async updateProject(projectId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      
      if (this.currentProject && this.currentProject.id === projectId) {
        this.currentProject = data;
      }
      
      return data;
    } catch (error) {
      console.error('Error updating renovation project:', error);
      throw error;
    }
  }

  // Delete a project
  async deleteProject(projectId) {
    try {
      const { error } = await this.supabase
        .from('renovation_projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      if (this.currentProject && this.currentProject.id === projectId) {
        this.currentProject = null;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting renovation project:', error);
      throw error;
    }
  }

  // ========================================
  // RENOVATION GROUPS
  // ========================================

  // Create default groups for a project
  async createDefaultGroups(projectId) {
    const defaultGroups = [
      { name: 'Forecourt', description: 'Forecourt improvements and maintenance', sort_order: 1 },
      { name: 'Pumps & Nozzles', description: 'Fuel pump and nozzle upgrades', sort_order: 2 },
      { name: 'Canopy', description: 'Canopy repairs and improvements', sort_order: 3 },
      { name: 'Shop Fit-out', description: 'Convenience store renovations', sort_order: 4 },
      { name: 'IT & Security', description: 'Technology and security upgrades', sort_order: 5 },
      { name: 'Compliance', description: 'Regulatory compliance improvements', sort_order: 6 },
      { name: 'Other', description: 'Miscellaneous renovations', sort_order: 7 }
    ];

    try {
      const groupsWithProjectId = defaultGroups.map(group => ({
        ...group,
        project_id: projectId
      }));

      const { data, error } = await this.supabase
        .from('renovation_groups')
        .insert(groupsWithProjectId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating default groups:', error);
      throw error;
    }
  }

  // Get groups for a project
  async getGroups(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_groups')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching renovation groups:', error);
      throw error;
    }
  }

  // Create a custom group
  async createGroup(groupData) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_groups')
        .insert([{
          project_id: groupData.projectId,
          name: groupData.name,
          description: groupData.description,
          sort_order: groupData.sortOrder || 999
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating renovation group:', error);
      throw error;
    }
  }

  // ========================================
  // RENOVATION ITEMS
  // ========================================

  // Create a renovation item
  async createItem(itemData) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_items')
        .insert([{
          project_id: itemData.projectId,
          group_id: itemData.groupId,
          name: itemData.name,
          description: itemData.description,
          category: itemData.category,
          qty: itemData.qty,
          unit_cost_zar: itemData.unitCost,
          contingency_pct: itemData.contingency,
          vat_applicable: itemData.vatApplicable,
          salvage_value_zar: itemData.salvage,
          start_month: itemData.startMonth,
          spread_type: itemData.spreadType,
          spread_months: itemData.spreadMonths,
          custom_schedule: itemData.customSchedule
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating renovation item:', error);
      throw error;
    }
  }

  // Get all items for a project
  async getItems(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_items')
        .select(`
          *,
          renovation_groups(name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching renovation items:', error);
      throw error;
    }
  }

  // Update a renovation item
  async updateItem(itemId, updates) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating renovation item:', error);
      throw error;
    }
  }

  // Delete a renovation item
  async deleteItem(itemId) {
    try {
      const { error } = await this.supabase
        .from('renovation_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting renovation item:', error);
      throw error;
    }
  }

  // ========================================
  // CASH FLOW MANAGEMENT
  // ========================================

  // Calculate and save cash flows for a project
  async calculateCashFlows(projectId) {
    try {
      // Get project settings
      const project = await this.getProject(projectId);
      const items = await this.getItems(projectId);
      
      // Calculate monthly cash flows
      const cashFlows = this.calculateMonthlyCashFlows(items, project);
      
      // Delete existing cash flows
      await this.supabase
        .from('renovation_cash_flows')
        .delete()
        .eq('project_id', projectId);
      
      // Insert new cash flows
      const { data, error } = await this.supabase
        .from('renovation_cash_flows')
        .insert(cashFlows)
        .select();

      if (error) throw error;
      
      // Calculate and save metrics
      await this.calculateMetrics(projectId, cashFlows);
      
      return data;
    } catch (error) {
      console.error('Error calculating cash flows:', error);
      throw error;
    }
  }

  // Calculate monthly cash flows from renovation items
  calculateMonthlyCashFlows(items, project) {
    const horizon = project.horizon_months;
    const cashFlows = [];
    
    // Initialize monthly arrays
    const monthlyCapex = new Array(horizon + 1).fill(0);
    const monthlyRevenue = new Array(horizon + 1).fill(0);
    const monthlyOpex = new Array(horizon + 1).fill(0);
    
    // Process each renovation item
    items.forEach(item => {
      const totalCost = item.qty * item.unit_cost_zar * (1 + item.contingency_pct / 100);
      const vatCost = item.vat_applicable ? totalCost * project.vat_rate : 0;
      const totalWithVat = totalCost + vatCost;
      
      if (item.spread_type === 'one_off') {
        if (item.start_month <= horizon) {
          monthlyCapex[item.start_month] += totalWithVat;
        }
      } else if (item.spread_type === 'even') {
        const monthlyAmount = totalWithVat / item.spread_months;
        for (let i = 0; i < item.spread_months && (item.start_month + i) <= horizon; i++) {
          monthlyCapex[item.start_month + i] += monthlyAmount;
        }
      } else if (item.spread_type === 'custom' && item.custom_schedule) {
        Object.entries(item.custom_schedule).forEach(([month, amount]) => {
          const monthIndex = parseInt(month);
          if (monthIndex <= horizon) {
            monthlyCapex[monthIndex] += parseFloat(amount);
          }
        });
      }
    });
    
    // Create cash flow records
    let cumulative = 0;
    for (let i = 0; i <= horizon; i++) {
      const netCashflow = monthlyRevenue[i] - monthlyOpex[i] - monthlyCapex[i];
      cumulative += netCashflow;
      
      cashFlows.push({
        project_id: project.id,
        month_index: i,
        capex_renovations_zar: monthlyCapex[i],
        revenue_zar: monthlyRevenue[i],
        opex_zar: monthlyOpex[i],
        tax_zar: 0, // Will be calculated based on revenue
        net_cashflow_zar: netCashflow,
        cumulative_zar: cumulative
      });
    }
    
    return cashFlows;
  }

  // Get cash flows for a project
  async getCashFlows(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_cash_flows')
        .select('*')
        .eq('project_id', projectId)
        .order('month_index', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching cash flows:', error);
      throw error;
    }
  }

  // ========================================
  // METRICS CALCULATION
  // ========================================

  // Calculate and save project metrics with advanced financial analysis
  async calculateMetrics(projectId, cashFlows) {
    try {
      const project = await this.getProject(projectId);
      const items = await this.getItems(projectId);
      
      // Calculate basic metrics
      const totalBudget = items.reduce((sum, item) => {
        const totalCost = item.qty * item.unit_cost_zar * (1 + item.contingency_pct / 100);
        const vatCost = item.vat_applicable ? totalCost * project.vat_rate : 0;
        return sum + totalCost + vatCost;
      }, 0);
      
      const totalSpent = 0; // Placeholder for actual spending tracking
      const completionRate = items.filter(item => item.status === 'completed').length / items.length * 100;
      
      // Calculate financial metrics using advanced engine
      const netCashflows = cashFlows.map(cf => cf.net_cashflow_zar);
      const monthlyRate = Math.pow(1 + project.discount_rate_annual, 1/12) - 1;
      
      // Basic metrics
      const npv = this.financialEngine.calculateNPV(netCashflows, monthlyRate);
      const irr = this.financialEngine.calculateIRR(netCashflows);
      const payback = this.financialEngine.calculatePaybackPeriod(netCashflows);
      const roi = this.financialEngine.calculateROI(totalBudget, netCashflows.reduce((sum, cf) => sum + cf, 0));
      
      // Advanced metrics
      const mirr = this.financialEngine.calculateMIRR(netCashflows, monthlyRate, monthlyRate);
      const breakEven = this.financialEngine.calculateBreakEven(netCashflows, totalBudget);
      
      // Scenario analysis
      const scenarios = this.financialEngine.generateScenarioAnalysis(
        netCashflows, 
        monthlyRate, 
        { horizon: project.horizon_months }
      );
      
      // Sensitivity analysis
      const sensitivityVariables = {
        revenue_growth: { min: 0.02, max: 0.20, step: 0.02, type: 'revenue_multiplier' },
        cost_inflation: { min: 0.05, max: 0.15, step: 0.01, type: 'cost_multiplier' },
        timing_shift: { min: -6, max: 6, step: 1, type: 'timing_shift' }
      };
      
      const sensitivity = this.financialEngine.performSensitivityAnalysis(
        netCashflows, 
        monthlyRate, 
        sensitivityVariables
      );
      
      // Risk metrics
      const riskMetrics = {
        cash_flow_volatility: this.financialEngine.calculateStandardDeviation(netCashflows),
        max_drawdown: this.financialEngine.calculateMaxDrawdown(netCashflows),
        var_95: this.financialEngine.calculateVaR(scenarios, 0.95),
        expected_value: this.financialEngine.calculateExpectedValue(scenarios)
      };
      
      // Generate comprehensive financial summary
      const financialSummary = this.financialEngine.generateFinancialSummary(
        netCashflows, 
        monthlyRate, 
        totalBudget, 
        scenarios
      );
      
      // Save enhanced metrics
      const { data, error } = await this.supabase
        .from('renovation_metrics')
        .upsert([{
          project_id: projectId,
          npv_zar: npv,
          irr_monthly: irr,
          irr_annual: irr ? Math.pow(1 + irr, 12) - 1 : null,
          payback_months: payback,
          payback_years: payback ? payback / 12 : null,
          total_budget_zar: totalBudget,
          total_spent_zar: totalSpent,
          completion_rate: completionRate,
          // Store additional metrics as JSON
          advanced_metrics: {
            roi: roi,
            mirr: mirr,
            break_even: breakEven,
            scenarios: scenarios,
            sensitivity: sensitivity,
            risk_metrics: riskMetrics,
            financial_summary: financialSummary
          }
        }], { onConflict: 'project_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error calculating advanced metrics:', error);
      throw error;
    }
  }

  // Note: All financial calculations now use the AdvancedFinancialEngine
  // These methods are kept for backward compatibility but delegate to the engine

  // Get metrics for a project
  async getMetrics(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_metrics')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  // ========================================
  // SNAPSHOT MANAGEMENT
  // ========================================

  // Create a project snapshot
  async createSnapshot(projectId) {
    try {
      const project = await this.getProject(projectId);
      const items = await this.getItems(projectId);
      const cashFlows = await this.getCashFlows(projectId);
      const metrics = await this.getMetrics(projectId);
      
      const snapshotData = {
        project,
        items,
        cashFlows,
        metrics,
        timestamp: new Date().toISOString()
      };
      
      // Get next version number
      const { data: existingSnapshots } = await this.supabase
        .from('renovation_snapshots')
        .select('version')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1);
      
      const nextVersion = existingSnapshots.length > 0 ? existingSnapshots[0].version + 1 : 1;
      
      const { data, error } = await this.supabase
        .from('renovation_snapshots')
        .insert([{
          project_id: projectId,
          snapshot_data: snapshotData,
          version: nextVersion
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating snapshot:', error);
      throw error;
    }
  }

  // Get snapshots for a project
  async getSnapshots(projectId) {
    try {
      const { data, error } = await this.supabase
        .from('renovation_snapshots')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      throw error;
    }
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.RenovationClient = RenovationClient;
}
