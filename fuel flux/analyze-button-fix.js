// Analyze Button Fix - Add analyze functionality to populate dashboard
// Copy and paste this in browser console

console.log('🔬 ANALYZE: Adding analyze functionality to reports...');

// 1. Add analyze function to existing clean functions
window.cleanAnalyzeReport = async function(fileName) {
    console.log('🔬 ANALYZE: Starting analysis of report:', fileName);
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ ANALYZE: Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        // Show loading state
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'analyze-loading';
        loadingMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #1a202c;
            border: 2px solid #4a5568;
            border-radius: 12px;
            padding: 30px;
            z-index: 100000;
            text-align: center;
            color: #fff;
            font-size: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        `;
        loadingMessage.innerHTML = `
            <div style="margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 15px;">🔬</div>
                <h3 style="margin: 0 0 10px 0; color: #fff;">Analyzing Report</h3>
                <p style="margin: 0; color: #a0aec0;">Processing ${fileName}...</p>
            </div>
            <div style="display: flex; justify-content: center; margin-top: 20px;">
                <div style="width: 40px; height: 40px; border: 4px solid #4a5568; border-top: 4px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(loadingMessage);
        
        // Call Supabase edge function to analyze the report
        console.log('🌐 ANALYZE: Calling Supabase edge function...');
        const edgeFunctionUrl = 'https://fynfomhoikzpsrbghnzr.functions.supabase.co/analyze-storage-report';
        
        const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({
                fileName: fileName,
                bucketName: 'fuel-reports'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Edge function error: ${response.status} ${response.statusText}`);
        }
        
        const analysisData = await response.json();
        console.log('✅ ANALYZE: Edge function response:', analysisData);
        
        // Remove loading message
        document.getElementById('analyze-loading')?.remove();
        
        if (analysisData.error) {
            console.error('❌ ANALYZE: Edge function returned error:', analysisData.error);
            alert('❌ Analysis failed: ' + analysisData.error);
            return;
        }
        
        // Process the analysis data and populate dashboard
        console.log('📊 ANALYZE: Processing analysis data...');
        await processAnalysisData(analysisData, fileName);
        
        // Show success message
        alert('✅ Report analyzed successfully! Dashboard updated with monthly data.');
        
        // Close the reports modal
        const reportsModal = document.getElementById('clean-reports-window');
        if (reportsModal) {
            reportsModal.remove();
        }
        
    } catch (error) {
        console.error('❌ ANALYZE: Error analyzing report:', error);
        
        // Remove loading message
        document.getElementById('analyze-loading')?.remove();
        
        alert('❌ Error analyzing report: ' + error.message);
    }
};

// 2. Process analysis data and update dashboard
async function processAnalysisData(analysisData, fileName) {
    console.log('📊 PROCESSING: Updating dashboard with analysis data...');
    
    try {
        // Extract period from filename
        const periodMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
        const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
        
        // Store analysis data globally
        window.currentAnalysisData = {
            ...analysisData,
            fileName: fileName,
            period: period,
            analyzedAt: new Date().toISOString()
        };
        
        // Update dashboard metrics if analysis data contains metrics
        if (analysisData.metrics) {
            console.log('📈 PROCESSING: Updating dashboard metrics...');
            updateDashboardMetrics(analysisData.metrics);
        }
        
        // Update monthly performance if analysis data contains monthly data
        if (analysisData.monthlyData) {
            console.log('📅 PROCESSING: Updating monthly performance...');
            updateMonthlyPerformance(analysisData.monthlyData);
        }
        
        // Update reports list to show analyzed status
        if (window.uploadedReports) {
            // Find the report in uploadedReports and mark as analyzed
            const reportIndex = window.uploadedReports.findIndex(report => 
                report.fileName === fileName || report.name === fileName
            );
            
            if (reportIndex !== -1) {
                window.uploadedReports[reportIndex].analyzed = true;
                window.uploadedReports[reportIndex].analysisData = analysisData;
                window.uploadedReports[reportIndex].period = period;
                
                // Save to localStorage
                localStorage.setItem('uploadedReports', JSON.stringify(window.uploadedReports));
                console.log('✅ PROCESSING: Report marked as analyzed in uploadedReports');
            }
        }
        
        // Trigger dashboard refresh
        if (typeof window.updateDashboardMetrics === 'function') {
            window.updateDashboardMetrics();
        }
        
        if (typeof window.renderMonthlyPerformance === 'function') {
            window.renderMonthlyPerformance();
        }
        
        console.log('✅ PROCESSING: Dashboard updated successfully with analysis data');
        
    } catch (error) {
        console.error('❌ PROCESSING: Error processing analysis data:', error);
        throw error;
    }
}

// 3. Update dashboard metrics function
function updateDashboardMetrics(metrics) {
    console.log('📈 METRICS: Updating dashboard metrics...');
    
    try {
        // Update revenue metrics
        if (metrics.totalRevenue !== undefined) {
            const revenueElement = document.querySelector('[data-metric="revenue"]') || 
                                 document.getElementById('total-revenue') ||
                                 document.querySelector('.metric-value');
            if (revenueElement) {
                revenueElement.textContent = `R ${metrics.totalRevenue.toLocaleString()}`;
                console.log('✅ METRICS: Updated revenue to', metrics.totalRevenue);
            }
        }
        
        // Update fuel volume metrics
        if (metrics.fuelVolume !== undefined) {
            const volumeElement = document.querySelector('[data-metric="volume"]') || 
                                document.getElementById('fuel-volume') ||
                                document.querySelector('.metric-value:nth-child(2)');
            if (volumeElement) {
                volumeElement.textContent = `${metrics.fuelVolume.toLocaleString()} L`;
                console.log('✅ METRICS: Updated fuel volume to', metrics.fuelVolume);
            }
        }
        
        // Update other metrics as needed
        if (metrics.transactions !== undefined) {
            const transactionsElement = document.querySelector('[data-metric="transactions"]') || 
                                      document.getElementById('total-transactions');
            if (transactionsElement) {
                transactionsElement.textContent = metrics.transactions.toLocaleString();
                console.log('✅ METRICS: Updated transactions to', metrics.transactions);
            }
        }
        
    } catch (error) {
        console.error('❌ METRICS: Error updating dashboard metrics:', error);
    }
}

// 4. Update monthly performance function
function updateMonthlyPerformance(monthlyData) {
    console.log('📅 MONTHLY: Updating monthly performance...');
    
    try {
        // Update monthly performance section
        const monthlySection = document.getElementById('monthly-performance') ||
                             document.querySelector('.monthly-performance') ||
                             document.querySelector('[data-section="monthly"]');
        
        if (monthlySection && monthlyData) {
            // Create or update monthly performance display
            let html = `
                <div class="monthly-performance-card" style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 20px; margin: 15px 0;">
                    <h4 style="color: #fff; margin: 0 0 15px 0; font-size: 18px;">📊 Monthly Performance Analysis</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            `;
            
            // Add monthly metrics
            Object.entries(monthlyData).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    html += `
                        <div style="background: #1a202c; padding: 15px; border-radius: 6px; text-align: center;">
                            <div style="color: #a0aec0; font-size: 14px; margin-bottom: 5px;">${key.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div style="color: #fff; font-size: 20px; font-weight: 600;">${value.toLocaleString()}</div>
                        </div>
                    `;
                }
            });
            
            html += `
                    </div>
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #4a5568;">
                        <div style="color: #718096; font-size: 12px;">
                            Analyzed from: ${window.currentAnalysisData?.fileName || 'Unknown'} • 
                            Period: ${window.currentAnalysisData?.period || 'Unknown'} • 
                            Source: Supabase Edge Function
                        </div>
                    </div>
                </div>
            `;
            
            monthlySection.innerHTML = html;
            console.log('✅ MONTHLY: Updated monthly performance section');
        }
        
    } catch (error) {
        console.error('❌ MONTHLY: Error updating monthly performance:', error);
    }
}

// 5. Update the existing showReportsNow function to include analyze buttons
if (window.showReportsNow) {
    const originalShowReportsNow = window.showReportsNow;
    
    window.showReportsNow = async function() {
        // Call the original function
        await originalShowReportsNow();
        
        // Wait a bit for the modal to be created
        setTimeout(() => {
            // Add analyze buttons to existing reports
            const reportButtons = document.querySelectorAll('#clean-reports-window button[onclick*="cleanViewReport"]');
            reportButtons.forEach((viewButton, index) => {
                const reportContainer = viewButton.closest('div[style*="background: #2d3748"]');
                if (reportContainer) {
                    const buttonContainer = reportContainer.querySelector('div[style*="display: flex; gap: 15px"]');
                    if (buttonContainer) {
                        // Extract filename from the view button onclick
                        const onclickAttr = viewButton.getAttribute('onclick');
                        const fileNameMatch = onclickAttr.match(/cleanViewReport\('([^']+)'\)/);
                        
                        if (fileNameMatch) {
                            const fileName = fileNameMatch[1];
                            
                            // Create analyze button
                            const analyzeButton = document.createElement('button');
                            analyzeButton.textContent = '🔬 Analyze';
                            analyzeButton.style.cssText = `
                                background: #8b5cf6; 
                                color: white; 
                                border: none; 
                                padding: 12px 24px; 
                                border-radius: 10px; 
                                cursor: pointer; 
                                font-size: 15px; 
                                font-weight: 600; 
                                transition: all 0.2s ease;
                            `;
                            
                            analyzeButton.addEventListener('click', function() {
                                window.cleanAnalyzeReport(fileName);
                            });
                            
                            // Insert analyze button before the delete button
                            const deleteButton = buttonContainer.querySelector('button[onclick*="cleanDeleteReport"]');
                            if (deleteButton) {
                                buttonContainer.insertBefore(analyzeButton, deleteButton);
                            } else {
                                buttonContainer.appendChild(analyzeButton);
                            }
                            
                            console.log(`✅ ANALYZE: Added analyze button for ${fileName}`);
                        }
                    }
                }
            });
        }, 100);
    };
}

console.log('✅ ANALYZE: Analyze functionality added successfully!');
console.log('🔬 ANALYZE: Analyze buttons will appear next to View/Download buttons');
console.log('📊 ANALYZE: Click Analyze to process report data and populate dashboard');
console.log('🌐 ANALYZE: Uses Supabase edge function for data extraction');
