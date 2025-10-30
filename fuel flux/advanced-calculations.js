// ========================================
// ADVANCED FINANCIAL CALCULATIONS ENGINE
// ========================================

class AdvancedFinancialEngine {
  constructor() {
    this.scenarios = {
      optimistic: { revenue_growth: 0.15, cost_inflation: 0.05, discount_rate_adjustment: -0.02 },
      realistic: { revenue_growth: 0.08, cost_inflation: 0.08, discount_rate_adjustment: 0.00 },
      pessimistic: { revenue_growth: 0.02, cost_inflation: 0.12, discount_rate_adjustment: 0.03 }
    };
  }

  // ========================================
  // CORE FINANCIAL CALCULATIONS
  // ========================================

  // Calculate Net Present Value with enhanced precision
  calculateNPV(cashflows, discountRate, startPeriod = 0) {
    if (!Array.isArray(cashflows) || cashflows.length === 0) return 0;
    
    return cashflows.reduce((npv, cf, i) => {
      const period = startPeriod + i;
      return npv + cf / Math.pow(1 + discountRate, period);
    }, 0);
  }

  // Calculate Internal Rate of Return using Newton-Raphson method
  calculateIRR(cashflows, guess = 0.01, maxIterations = 200, tolerance = 1e-9) {
    if (!Array.isArray(cashflows) || cashflows.length === 0) return null;
    
    let r = guess;
    
    for (let i = 0; i < maxIterations; i++) {
      let f = 0, df = 0;
      
      for (let j = 0; j < cashflows.length; j++) {
        const denom = Math.pow(1 + r, j);
        f += cashflows[j] / denom;
        df -= j * cashflows[j] / Math.pow(1 + r, j + 1);
      }
      
      if (Math.abs(f) < tolerance) return r;
      if (Math.abs(df) < tolerance) break;
      
      r = r - f / df;
      
      // Prevent runaway values
      if (r < -0.99 || r > 10) break;
    }
    
    return null;
  }

  // Calculate Payback Period with interpolation
  calculatePaybackPeriod(cashflows) {
    if (!Array.isArray(cashflows) || cashflows.length === 0) return null;
    
    let cumulative = 0;
    
    for (let i = 0; i < cashflows.length; i++) {
      const prevCumulative = cumulative;
      cumulative += cashflows[i];
      
      if (cumulative >= 0) {
        if (cashflows[i] === 0) return i;
        
        // Linear interpolation
        const interpolation = Math.abs(prevCumulative) / Math.abs(cashflows[i]);
        return i - interpolation;
      }
    }
    
    return null;
  }

  // Calculate Return on Investment
  calculateROI(totalInvestment, totalReturns, timePeriod = 1) {
    if (totalInvestment <= 0) return null;
    
    const netReturn = totalReturns - totalInvestment;
    return (netReturn / totalInvestment) * 100;
  }

  // Calculate Modified Internal Rate of Return (MIRR)
  calculateMIRR(cashflows, financeRate, reinvestRate) {
    if (!Array.isArray(cashflows) || cashflows.length === 0) return null;
    
    const negativeFlows = [];
    const positiveFlows = [];
    
    cashflows.forEach(cf => {
      if (cf < 0) negativeFlows.push(cf);
      else positiveFlows.push(cf);
    });
    
    if (negativeFlows.length === 0 || positiveFlows.length === 0) return null;
    
    const pv = negativeFlows.reduce((sum, cf) => sum + cf / Math.pow(1 + financeRate, 1), 0);
    const fv = positiveFlows.reduce((sum, cf, i) => sum + cf * Math.pow(1 + reinvestRate, cashflows.length - 1 - i), 0);
    
    return Math.pow(-fv / pv, 1 / cashflows.length) - 1;
  }

  // ========================================
  // SCENARIO ANALYSIS
  // ========================================

  // Generate multiple scenario projections
  generateScenarioAnalysis(baseCashflows, baseDiscountRate, projectSettings) {
    const scenarios = {};
    
    Object.keys(this.scenarios).forEach(scenarioName => {
      const scenario = this.scenarios[scenarioName];
      const adjustedCashflows = this.adjustCashflowsForScenario(
        baseCashflows, 
        scenario, 
        projectSettings
      );
      
      const adjustedDiscountRate = baseDiscountRate + scenario.discount_rate_adjustment;
      
      scenarios[scenarioName] = {
        npv: this.calculateNPV(adjustedCashflows, adjustedDiscountRate),
        irr: this.calculateIRR(adjustedCashflows),
        payback: this.calculatePaybackPeriod(adjustedCashflows),
        cashflows: adjustedCashflows,
        assumptions: scenario
      };
    });
    
    return scenarios;
  }

  // Adjust cash flows based on scenario assumptions
  adjustCashflowsForScenario(cashflows, scenario, projectSettings) {
    return cashflows.map((cf, i) => {
      if (cf > 0) {
        // Revenue growth for positive cash flows
        return cf * Math.pow(1 + scenario.revenue_growth, i / 12);
      } else {
        // Cost inflation for negative cash flows
        return cf * Math.pow(1 + scenario.cost_inflation, i / 12);
      }
    });
  }

  // ========================================
  // SENSITIVITY ANALYSIS
  // ========================================

  // Perform sensitivity analysis on key variables
  performSensitivityAnalysis(baseCashflows, baseDiscountRate, variables) {
    const sensitivity = {};
    
    Object.keys(variables).forEach(variableName => {
      const variable = variables[variableName];
      const results = [];
      
      // Test range of values for each variable
      for (let i = variable.min; i <= variable.max; i += variable.step) {
        const adjustedCashflows = this.adjustCashflowsForVariable(
          baseCashflows, 
          variableName, 
          i, 
          variable.type
        );
        
        const npv = this.calculateNPV(adjustedCashflows, baseDiscountRate);
        const irr = this.calculateIRR(adjustedCashflows);
        
        results.push({
          value: i,
          npv: npv,
          irr: irr,
          change: ((npv - baseCashflows.npv) / baseCashflows.npv) * 100
        });
      }
      
      sensitivity[variableName] = {
        variable: variable,
        results: results,
        impact: this.calculateVariableImpact(results)
      };
    });
    
    return sensitivity;
  }

  // Adjust cash flows for sensitivity analysis
  adjustCashflowsForVariable(cashflows, variableName, value, type) {
    switch (type) {
      case 'revenue_multiplier':
        return cashflows.map(cf => cf > 0 ? cf * value : cf);
      case 'cost_multiplier':
        return cashflows.map(cf => cf < 0 ? cf * value : cf);
      case 'timing_shift':
        return this.shiftCashflows(cashflows, value);
      default:
        return cashflows;
    }
  }

  // Shift cash flows in time
  shiftCashflows(cashflows, months) {
    const shifted = new Array(cashflows.length).fill(0);
    
    cashflows.forEach((cf, i) => {
      const newIndex = i + months;
      if (newIndex >= 0 && newIndex < cashflows.length) {
        shifted[newIndex] = cf;
      }
    });
    
    return shifted;
  }

  // Calculate impact of variable changes
  calculateVariableImpact(results) {
    const changes = results.map(r => r.change);
    return {
      max_positive: Math.max(...changes),
      max_negative: Math.min(...changes),
      average: changes.reduce((sum, c) => sum + c, 0) / changes.length,
      volatility: this.calculateStandardDeviation(changes)
    };
  }

  // Calculate standard deviation
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
    return Math.sqrt(variance);
  }

  // ========================================
  // RISK ANALYSIS
  // ========================================

  // Calculate Value at Risk (VaR)
  calculateVaR(scenarios, confidenceLevel = 0.95) {
    const npvs = Object.values(scenarios).map(s => s.npv);
    npvs.sort((a, b) => a - b);
    
    const index = Math.floor((1 - confidenceLevel) * npvs.length);
    return npvs[index];
  }

  // Calculate Expected Value
  calculateExpectedValue(scenarios, probabilities = null) {
    if (!probabilities) {
      // Equal probability for each scenario
      const scenarioCount = Object.keys(scenarios).length;
      probabilities = Object.keys(scenarios).reduce((acc, key) => {
        acc[key] = 1 / scenarioCount;
        return acc;
      }, {});
    }
    
    return Object.keys(scenarios).reduce((sum, key) => {
      return sum + scenarios[key].npv * probabilities[key];
    }, 0);
  }

  // Calculate Risk-Adjusted Return
  calculateRiskAdjustedReturn(expectedValue, standardDeviation, riskFreeRate = 0.05) {
    if (standardDeviation === 0) return null;
    return (expectedValue - riskFreeRate) / standardDeviation;
  }

  // ========================================
  // BREAK-EVEN ANALYSIS
  // ========================================

  // Calculate break-even point
  calculateBreakEven(cashflows, totalInvestment) {
    let cumulative = -totalInvestment;
    
    for (let i = 0; i < cashflows.length; i++) {
      cumulative += cashflows[i];
      if (cumulative >= 0) {
        return {
          period: i,
          months: i,
          years: i / 12,
          cumulative_return: cumulative
        };
      }
    }
    
    return null;
  }

  // Calculate break-even sensitivity
  calculateBreakEvenSensitivity(cashflows, totalInvestment, variables) {
    const sensitivity = {};
    
    Object.keys(variables).forEach(variableName => {
      const variable = variables[variableName];
      const results = [];
      
      for (let i = variable.min; i <= variable.max; i += variable.step) {
        const adjustedCashflows = this.adjustCashflowsForVariable(
          cashflows, 
          variableName, 
          i, 
          variable.type
        );
        
        const breakEven = this.calculateBreakEven(adjustedCashflows, totalInvestment);
        results.push({
          value: i,
          break_even_period: breakEven ? breakEven.period : null,
          break_even_years: breakEven ? breakEven.years : null
        });
      }
      
      sensitivity[variableName] = results;
    });
    
    return sensitivity;
  }

  // ========================================
  // INTEGRATION WITH EXISTING DATA
  // ========================================

  // Integrate renovation costs with existing revenue data
  integrateWithExistingData(renovationCashflows, existingRevenueData, integrationSettings) {
    const integratedCashflows = [];
    const horizon = Math.max(renovationCashflows.length, existingRevenueData.length);
    
    for (let i = 0; i < horizon; i++) {
      const renovationCost = i < renovationCashflows.length ? renovationCashflows[i] : 0;
      const existingRevenue = i < existingRevenueData.length ? existingRevenueData[i] : 0;
      
      // Apply revenue uplift if renovation is expected to increase sales
      const revenueUplift = this.calculateRevenueUplift(i, renovationCost, integrationSettings);
      const adjustedRevenue = existingRevenue * (1 + revenueUplift);
      
      integratedCashflows.push(adjustedRevenue - renovationCost);
    }
    
    return integratedCashflows;
  }

  // Calculate revenue uplift from renovations
  calculateRevenueUplift(month, renovationCost, settings) {
    if (renovationCost === 0) return 0;
    
    const { uplift_factor, delay_months, decay_rate } = settings;
    const effectiveMonth = Math.max(0, month - delay_months);
    
    return uplift_factor * Math.exp(-decay_rate * effectiveMonth);
  }

  // ========================================
  // PROFESSIONAL METRICS SUMMARY
  // ========================================

  // Generate comprehensive financial summary
  generateFinancialSummary(cashflows, discountRate, totalInvestment, scenarios = null) {
    const summary = {
      basic_metrics: {
        npv: this.calculateNPV(cashflows, discountRate),
        irr: this.calculateIRR(cashflows),
        payback_period: this.calculatePaybackPeriod(cashflows),
        roi: this.calculateROI(totalInvestment, cashflows.reduce((sum, cf) => sum + cf, 0))
      },
      risk_metrics: {
        cash_flow_volatility: this.calculateStandardDeviation(cashflows),
        max_drawdown: this.calculateMaxDrawdown(cashflows),
        worst_case_period: this.findWorstPeriod(cashflows)
      },
      scenarios: scenarios ? this.analyzeScenarios(scenarios) : null,
      recommendations: this.generateRecommendations(cashflows, discountRate, totalInvestment)
    };
    
    return summary;
  }

  // Calculate maximum drawdown
  calculateMaxDrawdown(cashflows) {
    let peak = 0;
    let maxDrawdown = 0;
    let cumulative = 0;
    
    cashflows.forEach(cf => {
      cumulative += cf;
      if (cumulative > peak) peak = cumulative;
      
      const drawdown = (peak - cumulative) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });
    
    return maxDrawdown;
  }

  // Find worst performing period
  findWorstPeriod(cashflows) {
    let worstPeriod = 0;
    let worstValue = cashflows[0];
    
    cashflows.forEach((cf, i) => {
      if (cf < worstValue) {
        worstValue = cf;
        worstPeriod = i;
      }
    });
    
    return { period: worstPeriod, value: worstValue };
  }

  // Analyze scenario results
  analyzeScenarios(scenarios) {
    const npvs = Object.values(scenarios).map(s => s.npv);
    const irrs = Object.values(scenarios).map(s => s.irr).filter(irr => irr !== null);
    
    return {
      npv_range: { min: Math.min(...npvs), max: Math.max(...npvs) },
      irr_range: irrs.length > 0 ? { min: Math.min(...irrs), max: Math.max(...irrs) } : null,
      probability_positive_npv: npvs.filter(npv => npv > 0).length / npvs.length,
      expected_npv: npvs.reduce((sum, npv) => sum + npv, 0) / npvs.length
    };
  }

  // Generate investment recommendations
  generateRecommendations(cashflows, discountRate, totalInvestment) {
    const npv = this.calculateNPV(cashflows, discountRate);
    const irr = this.calculateIRR(cashflows);
    const payback = this.calculatePaybackPeriod(cashflows);
    
    const recommendations = [];
    
    if (npv > 0) {
      recommendations.push('Proceed with renovation - positive NPV indicates value creation');
    } else {
      recommendations.push('Reconsider renovation - negative NPV indicates value destruction');
    }
    
    if (irr && irr > discountRate) {
      recommendations.push('IRR exceeds cost of capital - financially attractive');
    } else if (irr) {
      recommendations.push('IRR below cost of capital - consider alternative investments');
    }
    
    if (payback && payback < 5) {
      recommendations.push('Quick payback period - low risk investment');
    } else if (payback) {
      recommendations.push('Extended payback period - consider long-term benefits');
    }
    
    return recommendations;
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.AdvancedFinancialEngine = AdvancedFinancialEngine;
}
