// Fixed Analyze Function - Uses your actual edge functions
// Copy and paste this in browser console

console.log('🔧 FIXING: Analyze function with actual edge functions...');

// 1. First, fix the pdfFiles variable error in showReportsNow
window.showReportsNowFixed = async function() {
    console.log('🎯 FIXED: Starting View Reports (with variable fix)...');
    
    try {
        // Initialize Supabase client
        if (!window.supabaseClient && window.supabase) {
            const supabaseUrl = 'https://fynfomhoikzpsrbghnzr.supabase.co';
            const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
            
            window.supabaseClient = {
                supabase: window.supabase.createClient(supabaseUrl, supabaseKey),
                initialized: true
            };
        }
        
        if (!window.supabaseClient) {
            console.error('❌ FIXED: Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        // Get files from Supabase storage
        console.log('🔍 FIXED: Fetching files from Supabase...');
        const { data: files, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { limit: 1000 });
        
        if (error) {
            console.error('❌ FIXED: Error fetching files:', error);
            alert('❌ Error fetching files: ' + error.message);
            return;
        }
        
        console.log(`✅ FIXED: Found ${files.length} files in Supabase`);
        
        // Remove any existing reports window
        const existingWindow = document.getElementById('fixed-reports-window');
        if (existingWindow) {
            existingWindow.remove();
        }
        
        // Create new floating window
        const reportsWindow = document.createElement('div');
        reportsWindow.id = 'fixed-reports-window';
        reportsWindow.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
            background: #1a202c;
            border: 3px solid #4a5568;
            border-radius: 15px;
            padding: 30px;
            z-index: 99999;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        // Filter for PDF files (fix variable scope)
        const pdfFiles = files.filter(file => 
            file && file.name && file.name.toLowerCase().endsWith('.pdf')
        );
        
        console.log(`📄 FIXED: Found ${pdfFiles.length} PDF files`);
        
        // Create header
        let content = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #4a5568; padding-bottom: 20px;">
                <div>
                    <h2 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">
                        📊 Supabase Reports (Fixed)
                    </h2>
                    <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 16px;">
                        Direct access to your uploaded PDF reports with working analyze
                    </p>
                </div>
                <button onclick="document.getElementById('fixed-reports-window').remove()" 
                        style="background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background 0.2s ease;">
                    ✕ Close
                </button>
            </div>
        `;
        
        // Create content based on files
        if (pdfFiles.length === 0) {
            content += `
                <div style="text-align: center; padding: 80px 20px; color: #a0aec0;">
                    <div style="font-size: 80px; margin-bottom: 30px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 20px; font-size: 24px;">No PDF Reports Found</h3>
                    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">Found ${files.length} files but none are PDF reports.</p>
                    <p style="font-size: 16px; color: #718096;">Upload a PDF file to see it here.</p>
                </div>
            `;
        } else {
            // Sort by creation date (newest first)
            pdfFiles.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            // Add summary
            content += `
                <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 10px; padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h4 style="color: #fff; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">
                                📊 Report Summary (Fixed)
                            </h4>
                            <p style="color: #a0aec0; margin: 0; font-size: 16px;">
                                ${pdfFiles.length} PDF report${pdfFiles.length !== 1 ? 's' : ''} found in Supabase storage
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <div style="color: #10b981; font-size: 24px; font-weight: 700;">${pdfFiles.length}</div>
                            <div style="color: #718096; font-size: 14px;">Total Reports</div>
                        </div>
                    </div>
                </div>
            `;
            
            // Display each report
            pdfFiles.forEach((file, index) => {
                const fileName = file.name || 'Unknown File';
                const fileDate = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date';
                const fileSize = file.metadata?.size || 0;
                const fileSizeKB = Math.round(fileSize / 1024);
                
                // Extract period from filename
                const periodMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
                const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
                
                content += `
                    <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 12px; padding: 25px; margin: 20px 0; transition: all 0.3s ease;">
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <div style="flex: 1;">
                                    <h4 style="color: #fff; margin: 0 0 12px 0; font-size: 20px; font-weight: 600; line-height: 1.3;">
                                        ${fileName}
                                    </h4>
                                    <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
                                        <span style="background: #3182ce; color: white; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                                            SUPABASE
                                        </span>
                                        <span style="background: #10b981; color: white; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;">
                                            PDF
                                        </span>
                                        <span style="background: #6b7280; color: white; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;">
                                            📅 ${fileDate}
                                        </span>
                                        <span style="background: #6b7280; color: white; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 500;">
                                            📊 ${fileSizeKB} KB
                                        </span>
                                    </div>
                                    <div style="color: #718096; font-size: 14px; margin-top: 8px;">
                                        Period: ${period} • Report #${index + 1} • Source: Supabase Storage
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                                <button onclick="fixedViewReport('${fileName}')" 
                                        style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease;">
                                    📖 View Report
                                </button>
                                <button onclick="fixedAnalyzeReport('${fileName}')" 
                                        style="background: #8b5cf6; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease;">
                                    🔬 Analyze Report
                                </button>
                                <button onclick="fixedDownloadReport('${fileName}')" 
                                        style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease;">
                                    📥 Download
                                </button>
                                <button onclick="fixedDeleteReport('${fileName}')" 
                                        style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease;">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
        
        // Add footer
        content += `
            <div style="border-top: 1px solid #4a5568; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #718096; font-size: 14px; margin: 0;">
                    Fixed Version • Uses Your Actual Edge Functions • No Variable Errors
                </p>
            </div>
        `;
        
        reportsWindow.innerHTML = content;
        document.body.appendChild(reportsWindow);
        
        console.log('🎯 FIXED: Reports window created successfully!');
        console.log(`📊 FIXED: Showing ${files.length} total files (${pdfFiles.length} PDFs) from Supabase`);
        
    } catch (error) {
        console.error('❌ FIXED: Error in showReportsNowFixed:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 2. Fixed analyze function using your actual edge functions
window.fixedAnalyzeReport = async function(fileName) {
    console.log('🔬 FIXED ANALYZE: Starting analysis with your edge functions:', fileName);
    
    try {
        // Show loading state
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'fixed-analyze-loading';
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
                <p style="margin: 0; color: #a0aec0;">Processing ${fileName} with your edge functions...</p>
                <p style="margin: 10px 0 0 0; color: #718096; font-size: 14px;">Step 1: Process Report Upload</p>
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
        
        // Step 1: Process Report Upload
        console.log('📤 FIXED ANALYZE: Step 1 - Process Report Upload');
        const processUrl = 'https://fynfomhoikzpsrbghnzr.functions.supabase.co/process-report-upload';
        
        const processResponse = await fetch(processUrl, {
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
        
        if (!processResponse.ok) {
            throw new Error(`Process upload error: ${processResponse.status} ${processResponse.statusText}`);
        }
        
        const processData = await processResponse.json();
        console.log('✅ FIXED ANALYZE: Step 1 complete:', processData);
        
        // Update loading message for step 2
        const loadingEl = document.getElementById('fixed-analyze-loading');
        if (loadingEl) {
            loadingEl.querySelector('p:last-of-type').textContent = 'Step 2: Calculate Metrics';
        }
        
        // Step 2: Calculate Metrics
        console.log('📊 FIXED ANALYZE: Step 2 - Calculate Metrics');
        const metricsUrl = 'https://fynfomhoikzpsrbghnzr.functions.supabase.co/calculate-metrics';
        
        const metricsResponse = await fetch(metricsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({
                fileName: fileName,
                processData: processData
            })
        });
        
        if (!metricsResponse.ok) {
            throw new Error(`Calculate metrics error: ${metricsResponse.status} ${metricsResponse.statusText}`);
        }
        
        const metricsData = await metricsResponse.json();
        console.log('✅ FIXED ANALYZE: Step 2 complete:', metricsData);
        
        // Update loading message for step 3
        if (loadingEl) {
            loadingEl.querySelector('p:last-of-type').textContent = 'Step 3: Generate Insights';
        }
        
        // Step 3: Generate Insights
        console.log('💡 FIXED ANALYZE: Step 3 - Generate Insights');
        const insightsUrl = 'https://fynfomhoikzpsrbghnzr.functions.supabase.co/-generate-insights-';
        
        const insightsResponse = await fetch(insightsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({
                fileName: fileName,
                processData: processData,
                metricsData: metricsData
            })
        });
        
        if (!insightsResponse.ok) {
            throw new Error(`Generate insights error: ${insightsResponse.status} ${insightsResponse.statusText}`);
        }
        
        const insightsData = await insightsResponse.json();
        console.log('✅ FIXED ANALYZE: Step 3 complete:', insightsData);
        
        // Remove loading message
        document.getElementById('fixed-analyze-loading')?.remove();
        
        // Combine all data
        const combinedData = {
            processData,
            metricsData,
            insightsData,
            fileName: fileName,
            analyzedAt: new Date().toISOString()
        };
        
        // Process the analysis data and populate dashboard
        console.log('📊 FIXED ANALYZE: Processing combined analysis data...');
        await processFixedAnalysisData(combinedData, fileName);
        
        // Show success message
        alert(`✅ Report analyzed successfully using your 3-step edge function process!\n\n1. Process Report Upload ✅\n2. Calculate Metrics ✅\n3. Generate Insights ✅\n\nDashboard updated with data.`);
        
        // Close the reports modal
        const reportsModal = document.getElementById('fixed-reports-window');
        if (reportsModal) {
            reportsModal.remove();
        }
        
    } catch (error) {
        console.error('❌ FIXED ANALYZE: Error analyzing report:', error);
        
        // Remove loading message
        document.getElementById('fixed-analyze-loading')?.remove();
        
        alert('❌ Error analyzing report: ' + error.message + '\n\nPlease check the console for more details.');
    }
};

// 3. Process the combined analysis data
async function processFixedAnalysisData(combinedData, fileName) {
    console.log('📊 FIXED PROCESSING: Updating dashboard with combined analysis data...');
    
    try {
        // Store analysis data globally
        window.currentAnalysisData = combinedData;
        
        // Update dashboard with metrics data
        if (combinedData.metricsData && combinedData.metricsData.metrics) {
            console.log('📈 FIXED PROCESSING: Updating dashboard metrics...');
            updateFixedDashboardMetrics(combinedData.metricsData.metrics);
        }
        
        // Update with insights
        if (combinedData.insightsData) {
            console.log('💡 FIXED PROCESSING: Updating dashboard with insights...');
            updateFixedInsights(combinedData.insightsData);
        }
        
        console.log('✅ FIXED PROCESSING: Dashboard updated successfully with all data');
        
    } catch (error) {
        console.error('❌ FIXED PROCESSING: Error processing analysis data:', error);
        throw error;
    }
}

// 4. Other fixed functions (view, download, delete)
window.fixedViewReport = async function(fileName) {
    console.log('📖 FIXED: Viewing report:', fileName);
    try {
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(fileName, 3600);
        
        if (error) {
            alert('❌ Error opening file: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            window.open(signedUrl.signedUrl, '_blank');
        } else {
            alert('❌ Could not get file URL');
        }
    } catch (error) {
        console.error('❌ FIXED: Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.fixedDownloadReport = async function(fileName) {
    console.log('📥 FIXED: Downloading report:', fileName);
    try {
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(fileName, 3600);
        
        if (error) {
            alert('❌ Error downloading file: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            const link = document.createElement('a');
            link.href = signedUrl.signedUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('❌ FIXED: Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.fixedDeleteReport = async function(fileName) {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }
    
    try {
        const { error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .remove([fileName]);
        
        if (error) {
            alert('❌ Error deleting file: ' + error.message);
            return;
        }
        
        alert('✅ Report deleted successfully');
        window.showReportsNowFixed(); // Refresh
    } catch (error) {
        console.error('❌ FIXED: Error deleting report:', error);
        alert('❌ Error deleting report: ' + error.message);
    }
};

// 5. Update dashboard functions
function updateFixedDashboardMetrics(metrics) {
    console.log('📈 FIXED METRICS: Updating dashboard with metrics:', metrics);
    
    // Update any metric elements found on the page
    Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
            // Try multiple selectors to find metric elements
            const selectors = [
                `[data-metric="${key}"]`,
                `#${key}`,
                `#total-${key}`,
                `#${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`
            ];
            
            selectors.forEach(selector => {
                const element = document.querySelector(selector);
                if (element) {
                    element.textContent = formatMetricValue(key, value);
                    console.log(`✅ FIXED METRICS: Updated ${key} to ${value}`);
                }
            });
        }
    });
}

function updateFixedInsights(insights) {
    console.log('💡 FIXED INSIGHTS: Updating dashboard with insights:', insights);
    
    // Create or update insights section
    let insightsSection = document.getElementById('insights-section');
    if (!insightsSection) {
        insightsSection = document.createElement('div');
        insightsSection.id = 'insights-section';
        insightsSection.style.cssText = `
            background: #2d3748;
            border: 1px solid #4a5568;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            position: fixed;
            top: 20px;
            right: 20px;
            width: 300px;
            z-index: 10000;
            max-height: 400px;
            overflow-y: auto;
        `;
        document.body.appendChild(insightsSection);
    }
    
    insightsSection.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h4 style="color: #fff; margin: 0; font-size: 18px;">💡 AI Insights</h4>
            <button onclick="document.getElementById('insights-section').remove()" 
                    style="background: #ef4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">×</button>
        </div>
        <div style="color: #a0aec0; font-size: 14px; line-height: 1.5;">
            ${JSON.stringify(insights, null, 2).replace(/[{}",]/g, '').split('\n').map(line => line.trim()).filter(line => line).join('<br>')}
        </div>
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #4a5568; color: #718096; font-size: 12px;">
            Generated by Edge Functions • ${new Date().toLocaleTimeString()}
        </div>
    `;
}

function formatMetricValue(key, value) {
    if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('profit')) {
        return `R ${value.toLocaleString()}`;
    } else if (key.toLowerCase().includes('volume') || key.toLowerCase().includes('liter')) {
        return `${value.toLocaleString()} L`;
    } else if (key.toLowerCase().includes('percentage') || key.toLowerCase().includes('margin')) {
        return `${value}%`;
    } else {
        return value.toLocaleString();
    }
}

// 6. Override the View Reports button to use the fixed version
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    const newBtn = viewHistoryBtn.cloneNode(true);
    viewHistoryBtn.parentNode.replaceChild(newBtn, viewHistoryBtn);
    
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🎯 FIXED: Using fixed View Reports function');
        window.showReportsNowFixed();
    });
    
    newBtn.removeAttribute('onclick');
    console.log('✅ FIXED: View Reports button updated to use fixed version');
}

console.log('🔧 FIXED: All functions updated successfully!');
console.log('✅ FIXED: No more variable errors');
console.log('🔬 FIXED: Analyze uses your 3 actual edge functions');
console.log('📊 FIXED: Dashboard will be populated with real data');
console.log('💡 FIXED: Click "View Reports" to test the working version!');
