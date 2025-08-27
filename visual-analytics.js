// ========================================
// VISUAL ANALYTICS ENGINE
// ========================================

class VisualAnalyticsEngine {
  constructor() {
    this.charts = {};
    this.colors = {
      primary: '#2563eb',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      danger: '#dc2626',
      info: '#0891b2',
      light: '#f3f4f6',
      dark: '#1f2937',
      // Scenario colors
      optimistic: '#059669',
      realistic: '#2563eb',
      pessimistic: '#dc2626',
      // Chart colors
      chart1: '#3b82f6',
      chart2: '#8b5cf6',
      chart3: '#06b6d4',
      chart4: '#10b981',
      chart5: '#f59e0b',
      chart6: '#ef4444'
    };
  }

  // ========================================
  // CASH FLOW VISUALIZATIONS
  // ========================================

  // Create comprehensive cash flow chart
  createCashFlowChart(containerId, cashFlows, projectSettings) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const labels = this.generateTimeLabels(cashFlows.length, projectSettings);
    const capexData = cashFlows.map(cf => -cf.capex_renovations_zar);
    const revenueData = cashFlows.map(cf => cf.revenue_zar);
    const netData = cashFlows.map(cf => cf.net_cashflow_zar);
    const cumulativeData = cashFlows.map(cf => cf.cumulative_zar);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cumulative Cash Flow',
            data: cumulativeData,
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primary + '20',
            borderWidth: 3,
            fill: true,
            yAxisID: 'y-cumulative'
          },
          {
            label: 'Net Cash Flow',
            data: netData,
            borderColor: this.colors.secondary,
            backgroundColor: this.colors.secondary + '20',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y-net'
          },
          {
            label: 'Revenue',
            data: revenueData,
            borderColor: this.colors.success,
            backgroundColor: this.colors.success + '20',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y-net'
          },
          {
            label: 'Renovation Costs',
            data: capexData,
            borderColor: this.colors.danger,
            backgroundColor: this.colors.danger + '20',
            borderWidth: 2,
            fill: false,
            yAxisID: 'y-net'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          title: {
            display: true,
            text: 'Cash Flow Projection',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top',
            labels: { usePointStyle: true }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R ' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Time Period' },
            grid: { display: true }
          },
          'y-cumulative': {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Cumulative (R)' },
            grid: { display: true }
          },
          'y-net': {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Monthly (R)' },
            grid: { display: false }
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // Create before/after cash flow comparison
  createBeforeAfterChart(containerId, beforeCashFlows, afterCashFlows, projectSettings) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const labels = this.generateTimeLabels(beforeCashFlows.length, projectSettings);
    const beforeData = beforeCashFlows.map(cf => cf.net_cashflow_zar);
    const afterData = afterCashFlows.map(cf => cf.net_cashflow_zar);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Before Renovation',
            data: beforeData,
            borderColor: this.colors.warning,
            backgroundColor: this.colors.warning + '20',
            borderWidth: 2,
            fill: false,
            borderDash: [5, 5]
          },
          {
            label: 'After Renovation',
            data: afterData,
            borderColor: this.colors.success,
            backgroundColor: this.colors.success + '20',
            borderWidth: 3,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Before vs After Renovation',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R ' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Time Period' }
          },
          y: {
            title: { display: true, text: 'Net Cash Flow (R)' },
            beginAtZero: false
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // ========================================
  // SCENARIO ANALYSIS CHARTS
  // ========================================

  // Create scenario comparison chart
  createScenarioChart(containerId, scenarios) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const scenarioNames = Object.keys(scenarios);
    const npvData = scenarioNames.map(name => scenarios[name].npv);
    const irrData = scenarioNames.map(name => scenarios[name].irr ? scenarios[name].irr * 100 : 0);
    const paybackData = scenarioNames.map(name => scenarios[name].payback || 0);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: scenarioNames.map(name => name.charAt(0).toUpperCase() + name.slice(1)),
        datasets: [
          {
            label: 'NPV (R)',
            data: npvData,
            backgroundColor: this.colors.chart1,
            yAxisID: 'y-npv'
          },
          {
            label: 'IRR (%)',
            data: irrData,
            backgroundColor: this.colors.chart2,
            yAxisID: 'y-irr'
          },
          {
            label: 'Payback (Months)',
            data: paybackData,
            backgroundColor: this.colors.chart3,
            yAxisID: 'y-payback'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Scenario Analysis Comparison',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataset.label.includes('NPV')) {
                  return 'NPV: R ' + context.parsed.y.toLocaleString();
                } else if (context.dataset.label.includes('IRR')) {
                  return 'IRR: ' + context.parsed.y.toFixed(2) + '%';
                } else {
                  return 'Payback: ' + context.parsed.y.toFixed(1) + ' months';
                }
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Scenario' }
          },
          'y-npv': {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'NPV (R)' }
          },
          'y-irr': {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'IRR (%)' },
            grid: { display: false }
          },
          'y-payback': {
            type: 'linear',
            display: false
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // Create scenario cash flow comparison
  createScenarioCashFlowChart(containerId, scenarios, projectSettings) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const labels = this.generateTimeLabels(Object.values(scenarios)[0].cashflows.length, projectSettings);
    const datasets = Object.keys(scenarios).map((scenarioName, index) => ({
      label: scenarioName.charAt(0).toUpperCase() + scenarioName.slice(1),
      data: scenarios[scenarioName].cashflows,
      borderColor: [this.colors.optimistic, this.colors.realistic, this.colors.pessimistic][index],
      backgroundColor: [this.colors.optimistic, this.colors.realistic, this.colors.pessimistic][index] + '20',
      borderWidth: 2,
      fill: false
    }));

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Scenario Cash Flow Comparison',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': R ' + context.parsed.y.toLocaleString();
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Time Period' }
          },
          y: {
            title: { display: true, text: 'Net Cash Flow (R)' },
            beginAtZero: false
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // ========================================
  // SENSITIVITY ANALYSIS CHARTS
  // ========================================

  // Create tornado chart for sensitivity analysis
  createTornadoChart(containerId, sensitivity) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const variables = Object.keys(sensitivity);
    const maxImpacts = variables.map(variable => Math.abs(sensitivity[variable].impact.max_positive));
    const minImpacts = variables.map(variable => Math.abs(sensitivity[variable].impact.max_negative));
    const labels = variables.map(variable => variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Maximum Positive Impact (%)',
            data: maxImpacts,
            backgroundColor: this.colors.success,
            borderColor: this.colors.success,
            borderWidth: 1
          },
          {
            label: 'Maximum Negative Impact (%)',
            data: minImpacts.map(impact => -impact),
            backgroundColor: this.colors.danger,
            borderColor: this.colors.danger,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          title: {
            display: true,
            text: 'Sensitivity Analysis - Tornado Chart',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = Math.abs(context.parsed.x);
                return context.dataset.label + ': ' + value.toFixed(1) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Impact on NPV (%)' },
            beginAtZero: true
          },
          y: {
            title: { display: true, text: 'Variables' }
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // Create spider/radar chart for sensitivity analysis
  createSpiderChart(containerId, sensitivity) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const variables = Object.keys(sensitivity);
    const volatilityData = variables.map(variable => sensitivity[variable].impact.volatility);
    const labels = variables.map(variable => variable.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    const chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Volatility Impact',
            data: volatilityData,
            backgroundColor: this.colors.primary + '40',
            borderColor: this.colors.primary,
            borderWidth: 2,
            pointBackgroundColor: this.colors.primary,
            pointBorderColor: this.colors.primary,
            pointHoverBackgroundColor: this.colors.primary,
            pointHoverBorderColor: this.colors.primary
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Sensitivity Analysis - Risk Profile',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Volatility: ' + context.parsed.r.toFixed(2) + '%';
              }
            }
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Volatility (%)'
            }
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // ========================================
  // RISK ANALYSIS CHARTS
  // ========================================

  // Create risk distribution chart
  createRiskDistributionChart(containerId, scenarios) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const npvs = Object.values(scenarios).map(s => s.npv);
    const bins = this.createHistogramBins(npvs, 10);
    const frequencies = this.calculateFrequencies(npvs, bins);

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.map(bin => 'R ' + bin.toLocaleString()),
        datasets: [
          {
            label: 'NPV Distribution',
            data: frequencies,
            backgroundColor: this.colors.info,
            borderColor: this.colors.info,
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'NPV Risk Distribution',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Frequency: ' + context.parsed.y;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'NPV Range (R)' }
          },
          y: {
            title: { display: true, text: 'Frequency' },
            beginAtZero: true
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // Create drawdown chart
  createDrawdownChart(containerId, cashFlows) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const labels = this.generateTimeLabels(cashFlows.length, { horizon_months: cashFlows.length });
    const cumulative = [];
    let runningTotal = 0;
    
    cashFlows.forEach(cf => {
      runningTotal += cf.net_cashflow_zar;
      cumulative.push(runningTotal);
    });

    const peak = Math.max(...cumulative);
    const drawdowns = cumulative.map(value => ((peak - value) / peak) * 100);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Drawdown (%)',
            data: drawdowns,
            borderColor: this.colors.danger,
            backgroundColor: this.colors.danger + '20',
            borderWidth: 2,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Maximum Drawdown Analysis',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Drawdown: ' + context.parsed.y.toFixed(2) + '%';
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Time Period' }
          },
          y: {
            title: { display: true, text: 'Drawdown (%)' },
            beginAtZero: true,
            reverse: true
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // ========================================
  // BREAK-EVEN ANALYSIS CHARTS
  // ========================================

  // Create break-even chart
  createBreakEvenChart(containerId, cashFlows, totalInvestment) {
    const ctx = document.getElementById(containerId);
    if (!ctx) return null;

    const labels = this.generateTimeLabels(cashFlows.length, { horizon_months: cashFlows.length });
    const cumulative = [];
    let runningTotal = -totalInvestment;
    
    cashFlows.forEach(cf => {
      runningTotal += cf.net_cashflow_zar;
      cumulative.push(runningTotal);
    });

    const breakEvenPoint = this.findBreakEvenPoint(cumulative);

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cumulative Cash Flow',
            data: cumulative,
            borderColor: this.colors.primary,
            backgroundColor: this.colors.primary + '20',
            borderWidth: 3,
            fill: false
          },
          {
            label: 'Break-Even Line',
            data: new Array(cumulative.length).fill(0),
            borderColor: this.colors.dark,
            backgroundColor: this.colors.dark + '20',
            borderWidth: 2,
            borderDash: [5, 5],
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'Break-Even Analysis',
            font: { size: 16, weight: 'bold' }
          },
          legend: {
            position: 'top'
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                if (context.dataset.label === 'Break-Even Line') {
                  return 'Break-Even: R 0';
                }
                return 'Cumulative: R ' + context.parsed.y.toLocaleString();
              }
            }
          },
          annotation: breakEvenPoint ? {
            annotations: {
              breakEven: {
                type: 'point',
                xValue: breakEvenPoint,
                yValue: 0,
                backgroundColor: this.colors.success,
                borderColor: this.colors.success,
                borderWidth: 2,
                radius: 6,
                label: {
                  content: 'Break-Even Point',
                  enabled: true,
                  position: 'top'
                }
              }
            }
          } : {}
        },
        scales: {
          x: {
            title: { display: true, text: 'Time Period' }
          },
          y: {
            title: { display: true, text: 'Cumulative Cash Flow (R)' },
            beginAtZero: false
          }
        }
      }
    });

    this.charts[containerId] = chart;
    return chart;
  }

  // ========================================
  // KPI DASHBOARD CHARTS
  // ========================================

  // Create KPI summary chart
  createKPISummaryChart(containerId, metrics) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    // Clear existing content
    container.innerHTML = "";

    const kpis = [
      { 
        label: "NPV", 
        value: metrics.npv_zar || 0, 
        color: this.colors.success,
        format: "currency",
        prefix: "R "
      },
      { 
        label: "IRR", 
        value: metrics.irr_annual ? metrics.irr_annual * 100 : 0, 
        color: this.colors.primary,
        format: "percentage",
        suffix: "%"
      },
      { 
        label: "Payback Period", 
        value: metrics.payback_years || 0, 
        color: this.colors.warning,
        format: "years",
        suffix: " years"
      },
      { 
        label: "ROI", 
        value: metrics.advanced_metrics?.roi || 0, 
        color: this.colors.info,
        format: "percentage",
        suffix: "%"
      }
    ];

    // Create KPI cards layout
    const kpiGrid = document.createElement("div");
    kpiGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;

    kpis.forEach(kpi => {
      const kpiCard = document.createElement("div");
      kpiCard.style.cssText = `
        text-align: center;
        padding: 20px;
        border-radius: 8px;
        background: linear-gradient(135deg, ${kpi.color}15, ${kpi.color}25);
        border-left: 4px solid ${kpi.color};
        transition: transform 0.2s ease;
      `;

      const label = document.createElement("div");
      label.style.cssText = `
        font-size: 14px;
        font-weight: 600;
        color: #666;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      `;
      label.textContent = kpi.label;

      const value = document.createElement("div");
      value.style.cssText = `
        font-size: 24px;
        font-weight: bold;
        color: ${kpi.color};
        margin-bottom: 5px;
      `;

      // Format the value based on type
      let formattedValue = "";
      if (kpi.format === "currency") {
        formattedValue = kpi.prefix + Math.abs(kpi.value).toLocaleString();
      } else if (kpi.format === "percentage") {
        formattedValue = kpi.value.toFixed(2) + kpi.suffix;
      } else if (kpi.format === "years") {
        formattedValue = kpi.value.toFixed(1) + kpi.suffix;
      } else {
        formattedValue = kpi.value.toLocaleString();
      }

      value.textContent = formattedValue;

      // Add trend indicator if available
      const trend = document.createElement("div");
      trend.style.cssText = `
        font-size: 12px;
        color: #888;
        font-style: italic;
      `;
      
      if (kpi.value > 0) {
        trend.textContent = "Positive";
        trend.style.color = this.colors.success;
      } else if (kpi.value < 0) {
        trend.textContent = "Negative";
        trend.style.color = this.colors.danger;
      } else {
        trend.textContent = "Neutral";
        trend.style.color = "#888";
      }

      kpiCard.appendChild(label);
      kpiCard.appendChild(value);
      kpiCard.appendChild(trend);
      kpiGrid.appendChild(kpiCard);

      // Add hover effect
      kpiCard.addEventListener("mouseenter", () => {
        kpiCard.style.transform = "translateY(-2px)";
        kpiCard.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
      });

      kpiCard.addEventListener("mouseleave", () => {
        kpiCard.style.transform = "translateY(0)";
        kpiCard.style.boxShadow = "none";
      });
    });

    container.appendChild(kpiGrid);

    // Store reference for potential updates
    this.charts[containerId] = {
      type: "kpi-summary",
      container: container,
      kpis: kpis,
      update: (newMetrics) => {
        // Update function for real-time updates
        this.createKPISummaryChart(containerId, newMetrics);
      }
    };

    return this.charts[containerId];
  }
  // HELPER FUNCTIONS
  // ========================================

  // Generate time labels
  generateTimeLabels(periods, projectSettings) {
    const labels = [];
    for (let i = 0; i <= periods; i++) {
      if (i === 0) {
        labels.push('Start');
      } else if (i % 12 === 0) {
        labels.push(`Year ${Math.floor(i / 12)}`);
      } else {
        labels.push(`M${i}`);
      }
    }
    return labels;
  }

  // Create histogram bins
  createHistogramBins(data, numBins) {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const binSize = (max - min) / numBins;
    const bins = [];
    
    for (let i = 0; i < numBins; i++) {
      bins.push(min + (i * binSize));
    }
    
    return bins;
  }

  // Calculate frequencies for histogram
  calculateFrequencies(data, bins) {
    const frequencies = new Array(bins.length - 1).fill(0);
    
    data.forEach(value => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (value >= bins[i] && value < bins[i + 1]) {
          frequencies[i]++;
          break;
        }
      }
    });
    
    return frequencies;
  }

  // Find break-even point
  findBreakEvenPoint(cumulative) {
    for (let i = 0; i < cumulative.length; i++) {
      if (cumulative[i] >= 0) {
        return i;
      }
    }
    return null;
  }

  // Download chart as image
  downloadChart(containerId, filename = 'chart') {
    const chart = this.charts[containerId];
    if (!chart) return;

    const link = document.createElement('a');
    link.download = filename + '.png';
    link.href = chart.toBase64Image();
    link.click();
  }

  // Update chart data
  updateChart(containerId, newData) {
    const chart = this.charts[containerId];
    if (!chart) return;

    chart.data = newData;
    chart.update();
  }

  // Destroy chart
  destroyChart(containerId) {
    const chart = this.charts[containerId];
    if (chart) {
      chart.destroy();
      delete this.charts[containerId];
    }
  }

  // Destroy all charts
  destroyAllCharts() {
    Object.keys(this.charts).forEach(containerId => {
      this.destroyChart(containerId);
    });
  }
}

// Export for use in other files
if (typeof window !== 'undefined') {
  window.VisualAnalyticsEngine = VisualAnalyticsEngine;
}
