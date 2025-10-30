/**
 * Analytics Dashboard Component
 * Displays comprehensive analytics using the analytics engine
 */

class AnalyticsDashboard {
  constructor(container) {
    this.container = container;
    this.analyticsEngine = window.analyticsEngine;
    this.sampleDataGenerator = window.sampleDataGenerator;
    this.charts = new Map();
    
    this.initialize();
  }

  /**
   * Initialize analytics dashboard
   */
  initialize() {
    this.generateSampleData();
    this.calculateAnalytics();
    this.renderDashboard();
    this.setupEventListeners();
  }

  /**
   * Generate sample data for testing
   */
  generateSampleData() {
    // Generate 12 months of historical data
    this.monthlyData = this.sampleDataGenerator.generateMonthlyData(12);
    this.dailyData = this.sampleDataGenerator.generateDailyData(30);
    
    // Use current month data for metrics
    this.currentData = this.monthlyData[this.monthlyData.length - 1];
    
    // Generate additional data
    this.competitorData = this.sampleDataGenerator.generateCompetitorData();
    this.marketData = this.sampleDataGenerator.generateMarketData();
    this.personnelData = this.sampleDataGenerator.generatePersonnelData();
    this.renovationData = this.sampleDataGenerator.generateRenovationData();
    this.expansionData = this.sampleDataGenerator.generateExpansionData();
  }

  /**
   * Calculate comprehensive analytics
   */
  calculateAnalytics() {
    // Calculate current metrics
    this.metrics = this.analyticsEngine.calculateMetrics(this.currentData);
    
    // Analyze trends
    this.trends = this.analyticsEngine.analyzeTrends(this.monthlyData);
    
    // Generate forecasts
    this.forecasts = this.analyticsEngine.generateForecasts(this.monthlyData, 6);
    
    // Generate alerts
    this.alerts = this.analyticsEngine.generateAlerts(this.currentData);
    
    // Generate insights
    this.insights = this.analyticsEngine.generateInsights(this.currentData, this.trends, this.forecasts);
    
    // Calculate performance score
    this.performanceScore = this.analyticsEngine.benchmarking.calculateScore({
      fuelEfficiency: { value: this.metrics.fuelEfficiency.efficiencyRatio, weight: 1.5, category: 'fuelEfficiency' },
      profitMargin: { value: this.metrics.profitability.grossProfitMargin, weight: 2.0, category: 'profitMargin' },
      shopFuelRatio: { value: this.metrics.shop.shopFuelRatio, weight: 1.0, category: 'shopFuelRatio' },
      volumeEfficiency: { value: this.metrics.operational.laborCostRatio / 100, weight: 1.0, category: 'volumeEfficiency' }
    });
  }

  /**
   * Render the analytics dashboard
   */
  renderDashboard() {
    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <div class="analytics-header">
          <h2>Business Analytics Dashboard</h2>
          <p>Comprehensive analysis of your fuel station performance</p>
        </div>

        <!-- Performance Score -->
        <div class="performance-score-section">
          <h3>Overall Performance Score</h3>
          <div class="score-display">
            <div class="score-circle ${this.getScoreClass(this.performanceScore.percentage)}">
              <span class="score-number">${this.performanceScore.score.toFixed(1)}</span>
              <span class="score-grade">${this.performanceScore.grade}</span>
            </div>
            <div class="score-details">
              <p>Score: ${this.performanceScore.score.toFixed(1)} / 50</p>
              <p>Percentage: ${this.performanceScore.percentage.toFixed(1)}%</p>
              <p>Grade: ${this.performanceScore.grade}</p>
            </div>
          </div>
        </div>

        <!-- Key Metrics -->
        <div class="metrics-grid">
          <div class="metric-card">
            <h4>Fuel Efficiency</h4>
            <div class="metric-value">${this.metrics.fuelEfficiency.efficiencyRatio.toFixed(2)}</div>
            <div class="metric-rating ${this.metrics.ratings.fuelEfficiency}">
              ${this.metrics.ratings.fuelEfficiency.toUpperCase()}
            </div>
            <div class="metric-description">Liters per Rand efficiency</div>
          </div>

          <div class="metric-card">
            <h4>Profit Margin</h4>
            <div class="metric-value">${this.metrics.profitability.grossProfitMargin.toFixed(1)}%</div>
            <div class="metric-rating ${this.metrics.ratings.profitability}">
              ${this.metrics.ratings.profitability.toUpperCase()}
            </div>
            <div class="metric-description">Gross profit margin</div>
          </div>

          <div class="metric-card">
            <h4>Shop Performance</h4>
            <div class="metric-value">${this.metrics.shop.shopFuelRatio.toFixed(2)}</div>
            <div class="metric-rating ${this.metrics.ratings.shopPerformance}">
              ${this.metrics.ratings.shopPerformance.toUpperCase()}
            </div>
            <div class="metric-description">Shop to fuel revenue ratio</div>
          </div>

          <div class="metric-card">
            <h4>Labor Cost Ratio</h4>
            <div class="metric-value">${this.metrics.operational.laborCostRatio.toFixed(1)}%</div>
            <div class="metric-description">Labor cost as % of revenue</div>
          </div>
        </div>

        <!-- Trends and Forecasts -->
        <div class="trends-section">
          <h3>Performance Trends & Forecasts</h3>
          <div class="trends-grid">
            <div class="trend-card">
              <h4>Volume Trend</h4>
              <div class="trend-info">
                <span class="trend-direction ${this.trends.movingAverage?.trend || 'stable'}">
                  ${this.trends.movingAverage?.trend || 'Stable'}
                </span>
                <span class="trend-strength">
                  Strength: ${this.trends.movingAverage?.strength?.toFixed(3) || 'N/A'}
                </span>
              </div>
            </div>

            <div class="trend-card">
              <h4>Revenue Trend</h4>
              <div class="trend-info">
                <span class="trend-direction ${this.trends.linearRegression?.trend || 'stable'}">
                  ${this.trends.linearRegression?.trend || 'Stable'}
                </span>
                <span class="trend-strength">
                  R²: ${this.trends.linearRegression?.r2?.toFixed(3) || 'N/A'}
                </span>
              </div>
            </div>

            <div class="trend-card">
              <h4>Seasonality</h4>
              <div class="trend-info">
                <span class="trend-direction">
                  ${this.trends.seasonality ? 'Detected' : 'None'}
                </span>
                <span class="trend-strength">
                  Strength: ${this.trends.seasonality?.strength?.toFixed(3) || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <h3>Performance Charts</h3>
          <div class="charts-grid">
            <div class="chart-container">
              <h4>Revenue Trend</h4>
              <canvas id="revenue-chart"></canvas>
            </div>
            <div class="chart-container">
              <h4>Volume Trend</h4>
              <canvas id="volume-chart"></canvas>
            </div>
            <div class="chart-container">
              <h4>Profit Margin Trend</h4>
              <canvas id="profit-chart"></canvas>
            </div>
            <div class="chart-container">
              <h4>6-Month Forecast</h4>
              <canvas id="forecast-chart"></canvas>
            </div>
          </div>
        </div>

        <!-- Alerts and Insights -->
        <div class="alerts-insights-section">
          <div class="alerts-column">
            <h3>Active Alerts (${this.alerts.length})</h3>
            <div class="alerts-list">
              ${this.alerts.map(alert => `
                <div class="alert-item ${alert.severity}">
                  <div class="alert-header">
                    <span class="alert-severity">${alert.severity.toUpperCase()}</span>
                    <span class="alert-type">${alert.recommendation}</span>
                  </div>
                  <div class="alert-message">${alert.message}</div>
                </div>
              `).join('')}
              ${this.alerts.length === 0 ? '<p class="no-alerts">No active alerts</p>' : ''}
            </div>
          </div>

          <div class="insights-column">
            <h3>Business Insights (${this.insights.length})</h3>
            <div class="insights-list">
              ${this.insights.map(insight => `
                <div class="insight-item ${insight.severity}">
                  <div class="insight-header">
                    <span class="insight-type">${insight.type.toUpperCase()}</span>
                    <span class="insight-severity">${insight.severity.toUpperCase()}</span>
                  </div>
                  <h4>${insight.title}</h4>
                  <p>${insight.description}</p>
                  <div class="insight-recommendation">
                    <strong>Recommendation:</strong> ${insight.recommendation}
                  </div>
                </div>
              `).join('')}
              ${this.insights.length === 0 ? '<p class="no-insights">No insights available</p>' : ''}
            </div>
          </div>
        </div>

        <!-- Competitive Analysis -->
        <div class="competitive-analysis-section">
          <h3>Competitive Analysis</h3>
          <div class="competitive-grid">
            <div class="competitive-metric">
              <h4>Fuel Efficiency</h4>
              <div class="comparison">
                <span class="your-value">${this.metrics.fuelEfficiency.efficiencyRatio.toFixed(2)}</span>
                <span class="vs">vs</span>
                <span class="competitor-value">${this.competitorData.averageFuelEfficiency.toFixed(2)}</span>
              </div>
              <div class="performance-indicator ${this.metrics.fuelEfficiency.efficiencyRatio > this.competitorData.averageFuelEfficiency ? 'better' : 'worse'}">
                ${this.metrics.fuelEfficiency.efficiencyRatio > this.competitorData.averageFuelEfficiency ? 'Above Average' : 'Below Average'}
              </div>
            </div>

            <div class="competitive-metric">
              <h4>Profit Margin</h4>
              <div class="comparison">
                <span class="your-value">${this.metrics.profitability.grossProfitMargin.toFixed(1)}%</span>
                <span class="vs">vs</span>
                <span class="competitor-value">${this.competitorData.averageProfitMargin.toFixed(1)}%</span>
              </div>
              <div class="performance-indicator ${this.metrics.profitability.grossProfitMargin > this.competitorData.averageProfitMargin ? 'better' : 'worse'}">
                ${this.metrics.profitability.grossProfitMargin > this.competitorData.averageProfitMargin ? 'Above Average' : 'Below Average'}
              </div>
            </div>

            <div class="competitive-metric">
              <h4>Shop Ratio</h4>
              <div class="comparison">
                <span class="your-value">${this.metrics.shop.shopFuelRatio.toFixed(2)}</span>
                <span class="vs">vs</span>
                <span class="competitor-value">${this.competitorData.averageShopFuelRatio.toFixed(2)}</span>
              </div>
              <div class="performance-indicator ${this.metrics.shop.shopFuelRatio > this.competitorData.averageShopFuelRatio ? 'better' : 'worse'}">
                ${this.metrics.shop.shopFuelRatio > this.competitorData.averageShopFuelRatio ? 'Above Average' : 'Below Average'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderCharts();
  }

  /**
   * Render charts using Chart.js
   */
  renderCharts() {
    // Revenue Trend Chart
    this.renderRevenueChart();
    this.renderVolumeChart();
    this.renderProfitChart();
    this.renderForecastChart();
  }

  /**
   * Render revenue trend chart
   */
  renderRevenueChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const labels = this.monthlyData.map(d => `${d.month}/${d.year}`);
    const data = this.monthlyData.map(d => d.fuelRevenue);

    this.charts.set('revenue', new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Fuel Revenue',
          data,
          borderColor: '#20B2AA',
          backgroundColor: 'rgba(32, 178, 170, 0.1)',
          tension: 0.4
        }, {
          label: 'Shop Revenue',
          data: this.monthlyData.map(d => d.shopRevenue),
          borderColor: '#FF6B6B',
          backgroundColor: 'rgba(255, 107, 107, 0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Revenue Trends'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R ' + value.toLocaleString();
              }
            }
          }
        }
      }
    }));
  }

  /**
   * Render volume trend chart
   */
  renderVolumeChart() {
    const ctx = document.getElementById('volume-chart');
    if (!ctx) return;

    const labels = this.monthlyData.map(d => `${d.month}/${d.year}`);
    const data = this.monthlyData.map(d => d.fuelVolume);

    this.charts.set('volume', new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Total Volume (L)',
          data,
          backgroundColor: 'rgba(32, 178, 170, 0.8)',
          borderColor: '#20B2AA',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Volume Trends'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString() + ' L';
              }
            }
          }
        }
      }
    }));
  }

  /**
   * Render profit margin chart
   */
  renderProfitChart() {
    const ctx = document.getElementById('profit-chart');
    if (!ctx) return;

    const labels = this.monthlyData.map(d => `${d.month}/${d.year}`);
    const data = this.monthlyData.map(d => ((d.fuelRevenue - d.fuelCost) / d.fuelRevenue) * 100);

    this.charts.set('profit', new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Profit Margin (%)',
          data,
          borderColor: '#4ECDC4',
          backgroundColor: 'rgba(78, 205, 196, 0.1)',
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Monthly Profit Margin'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toFixed(1) + '%';
              }
            }
          }
        }
      }
    }));
  }

  /**
   * Render forecast chart
   */
  renderForecastChart() {
    const ctx = document.getElementById('forecast-chart');
    if (!ctx) return;

    const historicalLabels = this.monthlyData.map(d => `${d.month}/${d.year}`);
    const forecastLabels = Array.from({length: 6}, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() + i + 1);
      return `${date.getMonth() + 1}/${date.getFullYear()}`;
    });

    const historicalData = this.monthlyData.map(d => d.fuelRevenue);
    const forecastData = this.forecasts.movingAverage?.forecast || Array(6).fill(historicalData[historicalData.length - 1]);

    this.charts.set('forecast', new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...historicalLabels, ...forecastLabels],
        datasets: [{
          label: 'Historical Revenue',
          data: [...historicalData, ...Array(6).fill(null)],
          borderColor: '#20B2AA',
          backgroundColor: 'rgba(32, 178, 170, 0.1)',
          tension: 0.4
        }, {
          label: 'Forecast Revenue',
          data: [...Array(historicalData.length).fill(null), ...forecastData],
          borderColor: '#FFD93D',
          backgroundColor: 'rgba(255, 217, 61, 0.1)',
          borderDash: [5, 5],
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: '6-Month Revenue Forecast'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return 'R ' + value.toLocaleString();
              }
            }
          }
        }
      }
    }));
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Add refresh button functionality
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh Analytics';
    refreshBtn.className = 'refresh-analytics-btn';
    refreshBtn.addEventListener('click', () => {
      this.refreshAnalytics();
    });

    this.container.querySelector('.analytics-header').appendChild(refreshBtn);
  }

  /**
   * Refresh analytics data
   */
  refreshAnalytics() {
    this.generateSampleData();
    this.calculateAnalytics();
    this.updateDashboard();
  }

  /**
   * Update dashboard with new data
   */
  updateDashboard() {
    // Update metrics
    this.updateMetrics();
    
    // Update charts
    this.updateCharts();
    
    // Update alerts and insights
    this.updateAlertsInsights();
  }

  /**
   * Update metrics display
   */
  updateMetrics() {
    const metricsGrid = this.container.querySelector('.metrics-grid');
    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div class="metric-card">
          <h4>Fuel Efficiency</h4>
          <div class="metric-value">${this.metrics.fuelEfficiency.efficiencyRatio.toFixed(2)}</div>
          <div class="metric-rating ${this.metrics.ratings.fuelEfficiency}">
            ${this.metrics.ratings.fuelEfficiency.toUpperCase()}
          </div>
          <div class="metric-description">Liters per Rand efficiency</div>
        </div>

        <div class="metric-card">
          <h4>Profit Margin</h4>
          <div class="metric-value">${this.metrics.profitability.grossProfitMargin.toFixed(1)}%</div>
          <div class="metric-rating ${this.metrics.ratings.profitability}">
            ${this.metrics.ratings.profitability.toUpperCase()}
          </div>
          <div class="metric-description">Gross profit margin</div>
        </div>

        <div class="metric-card">
          <h4>Shop Performance</h4>
          <div class="metric-value">${this.metrics.shop.shopFuelRatio.toFixed(2)}</div>
          <div class="metric-rating ${this.metrics.ratings.shopPerformance}">
            ${this.metrics.ratings.shopPerformance.toUpperCase()}
          </div>
          <div class="metric-description">Shop to fuel revenue ratio</div>
        </div>

        <div class="metric-card">
          <h4>Labor Cost Ratio</h4>
          <div class="metric-value">${this.metrics.operational.laborCostRatio.toFixed(1)}%</div>
          <div class="metric-description">Labor cost as % of revenue</div>
        </div>
      `;
    }
  }

  /**
   * Update charts with new data
   */
  updateCharts() {
    // Update revenue chart
    const revenueChart = this.charts.get('revenue');
    if (revenueChart) {
      revenueChart.data.labels = this.monthlyData.map(d => `${d.month}/${d.year}`);
      revenueChart.data.datasets[0].data = this.monthlyData.map(d => d.fuelRevenue);
      revenueChart.data.datasets[1].data = this.monthlyData.map(d => d.shopRevenue);
      revenueChart.update();
    }

    // Update other charts similarly...
  }

  /**
   * Update alerts and insights
   */
  updateAlertsInsights() {
    const alertsList = this.container.querySelector('.alerts-list');
    const insightsList = this.container.querySelector('.insights-list');

    if (alertsList) {
      alertsList.innerHTML = this.alerts.map(alert => `
        <div class="alert-item ${alert.severity}">
          <div class="alert-header">
            <span class="alert-severity">${alert.severity.toUpperCase()}</span>
            <span class="alert-type">${alert.recommendation}</span>
          </div>
          <div class="alert-message">${alert.message}</div>
        </div>
      `).join('') || '<p class="no-alerts">No active alerts</p>';
    }

    if (insightsList) {
      insightsList.innerHTML = this.insights.map(insight => `
        <div class="insight-item ${insight.severity}">
          <div class="insight-header">
            <span class="insight-type">${insight.type.toUpperCase()}</span>
            <span class="insight-severity">${insight.severity.toUpperCase()}</span>
          </div>
          <h4>${insight.title}</h4>
          <p>${insight.description}</p>
          <div class="insight-recommendation">
            <strong>Recommendation:</strong> ${insight.recommendation}
          </div>
        </div>
      `).join('') || '<p class="no-insights">No insights available</p>';
    }
  }

  /**
   * Get CSS class for score display
   */
  getScoreClass(percentage) {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'good';
    if (percentage >= 70) return 'average';
    return 'poor';
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.charts.forEach(chart => chart.destroy());
    this.charts.clear();
  }
}

export default AnalyticsDashboard;
