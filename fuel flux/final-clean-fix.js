// Final Clean Fix - Completely avoid all variable conflicts
// Copy and paste this in browser console

console.log('🧹 FINAL CLEAN: Starting completely clean version...');

// Clear the console first
console.clear();

// 1. Remove ALL existing functions and variables to prevent conflicts
if (typeof window.showReportsNowFixed !== 'undefined') delete window.showReportsNowFixed;
if (typeof window.fixedAnalyzeReport !== 'undefined') delete window.fixedAnalyzeReport;
if (typeof window.fixedViewReport !== 'undefined') delete window.fixedViewReport;
if (typeof window.fixedDownloadReport !== 'undefined') delete window.fixedDownloadReport;

// Remove any existing modal windows
const existingModals = document.querySelectorAll('[id*="reports-window"], [id*="loading"]');
existingModals.forEach(modal => modal.remove());

// 2. Create the working View Reports function with unique namespace
window.FINAL = window.FINAL || {};

window.FINAL.initSupabase = function() {
    if (!window.FINAL.supabaseClient && window.supabase) {
        const url = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        window.FINAL.supabaseClient = window.supabase.createClient(url, key);
        console.log('✅ FINAL: Supabase initialized');
    }
    return !!window.FINAL.supabaseClient;
};

window.FINAL.showReports = async function() {
    console.log('📊 FINAL: Loading reports...');
    
    try {
        // Initialize Supabase
        window.FINAL.initSupabase();
        
        if (!window.FINAL.supabaseClient) {
            alert('❌ Supabase not available');
            return;
        }
        
        // Get files
        const { data: allFiles, error: filesError } = await window.FINAL.supabaseClient.storage
            .from('fuel-reports')
            .list('', { limit: 1000 });
        
        if (filesError) {
            console.error('Error fetching files:', filesError);
            alert('❌ Error fetching files: ' + filesError.message);
            return;
        }
        
        console.log(`Found ${allFiles.length} total files`);
        
        // Filter PDF files
        const pdfs = allFiles.filter(f => f && f.name && f.name.toLowerCase().endsWith('.pdf'));
        console.log(`Found ${pdfs.length} PDF files`);
        
        // Remove existing modal
        const existing = document.getElementById('final-reports-modal');
        if (existing) existing.remove();
        
        // Create modal
        const modal = document.createElement('div');
        modal.id = 'final-reports-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.8); z-index: 99999;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: #1a202c; border: 3px solid #4a5568; border-radius: 15px;
            width: 90%; max-width: 900px; max-height: 90vh; overflow-y: auto;
            padding: 30px; position: relative;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #4a5568;
        `;
        header.innerHTML = `
            <div>
                <h2 style="color: #fff; margin: 0; font-size: 24px; font-weight: 700;">📊 Final Reports</h2>
                <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 14px;">Clean version with 3-step analysis</p>
            </div>
            <button id="final-close-btn" style="background: #ef4444; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600;">✕ Close</button>
        `;
        
        // Create body
        const body = document.createElement('div');
        
        if (pdfs.length === 0) {
            body.innerHTML = `
                <div style="text-align: center; padding: 60px 20px; color: #a0aec0;">
                    <div style="font-size: 64px; margin-bottom: 20px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 15px;">No PDF Reports Found</h3>
                    <p>Upload a PDF report to get started.</p>
                </div>
            `;
        } else {
            // Sort files by date
            pdfs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            // Create report cards
            let reportsHTML = `
                <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 10px; padding: 15px; margin-bottom: 20px; text-align: center;">
                    <h4 style="color: #10b981; margin: 0 0 5px 0; font-size: 18px;">📊 ${pdfs.length} PDF Report${pdfs.length !== 1 ? 's' : ''} Found</h4>
                    <p style="color: #a0aec0; margin: 0; font-size: 14px;">Ready for 3-step analysis</p>
                </div>
            `;
            
            pdfs.forEach((file, index) => {
                const name = file.name || 'Unknown';
                const date = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date';
                const size = file.metadata?.size || 0;
                const sizeKB = Math.round(size / 1024);
                
                reportsHTML += `
                    <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 10px; padding: 20px; margin: 15px 0;">
                        <h4 style="color: #fff; margin: 0 0 10px 0; font-size: 16px; font-weight: 600; word-break: break-word;">${name}</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
                            <span style="background: #3182ce; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">SUPABASE</span>
                            <span style="background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 500;">PDF</span>
                            <span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">📅 ${date}</span>
                            <span style="background: #6b7280; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px;">📊 ${sizeKB} KB</span>
                        </div>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="final-view-btn" data-filename="${name}" 
                                    style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                                📖 View
                            </button>
                            <button class="final-analyze-btn" data-filename="${name}" 
                                    style="background: #8b5cf6; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                                🔬 3-Step Analyze
                            </button>
                            <button class="final-download-btn" data-filename="${name}" 
                                    style="background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 500;">
                                📥 Download
                            </button>
                        </div>
                    </div>
                `;
            });
            
            body.innerHTML = reportsHTML;
        }
        
        // Assemble modal
        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add event listeners
        document.getElementById('final-close-btn').addEventListener('click', () => {
            document.getElementById('final-reports-modal').remove();
        });
        
        // Add button event listeners
        document.querySelectorAll('.final-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.getAttribute('data-filename');
                window.FINAL.viewReport(filename);
            });
        });
        
        document.querySelectorAll('.final-analyze-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.getAttribute('data-filename');
                window.FINAL.analyzeReport(filename);
            });
        });
        
        document.querySelectorAll('.final-download-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filename = e.target.getAttribute('data-filename');
                window.FINAL.downloadReport(filename);
            });
        });
        
        console.log('✅ FINAL: Modal created with event listeners');
        
    } catch (error) {
        console.error('❌ FINAL: Error in showReports:', error);
        alert('❌ Error: ' + error.message);
    }
};

window.FINAL.viewReport = async function(filename) {
    console.log('📖 FINAL: Viewing:', filename);
    try {
        const { data: signedUrl, error } = await window.FINAL.supabaseClient.storage
            .from('fuel-reports')
            .createSignedUrl(filename, 3600);
        
        if (error) {
            alert('❌ Error: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            window.open(signedUrl.signedUrl, '_blank');
        } else {
            alert('❌ Could not get file URL');
        }
    } catch (error) {
        console.error('❌ FINAL: View error:', error);
        alert('❌ View error: ' + error.message);
    }
};

window.FINAL.downloadReport = async function(filename) {
    console.log('📥 FINAL: Downloading:', filename);
    try {
        const { data: signedUrl, error } = await window.FINAL.supabaseClient.storage
            .from('fuel-reports')
            .createSignedUrl(filename, 3600);
        
        if (error) {
            alert('❌ Error: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            const link = document.createElement('a');
            link.href = signedUrl.signedUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } catch (error) {
        console.error('❌ FINAL: Download error:', error);
        alert('❌ Download error: ' + error.message);
    }
};

window.FINAL.analyzeReport = async function(filename) {
    console.log('🔬 FINAL: Starting 3-step analysis for:', filename);
    
    try {
        // Create loading overlay
        const loading = document.createElement('div');
        loading.id = 'final-loading';
        loading.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); z-index: 100000;
            display: flex; align-items: center; justify-content: center;
        `;
        
        const loadingContent = document.createElement('div');
        loadingContent.style.cssText = `
            background: #1a202c; border: 2px solid #8b5cf6; border-radius: 12px;
            padding: 30px; text-align: center; color: #fff; min-width: 300px;
        `;
        
        loadingContent.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 15px;">🔬</div>
            <h3 style="margin: 0 0 10px 0;">3-Step Analysis</h3>
            <p style="margin: 0 0 5px 0; color: #a0aec0;">${filename}</p>
            <p id="final-step-indicator" style="margin: 10px 0; color: #8b5cf6; font-weight: 500;">Step 1: Process Report Upload</p>
            <div style="width: 40px; height: 40px; border: 4px solid #4a5568; border-top: 4px solid #8b5cf6; border-radius: 50%; animation: spin 1s linear infinite; margin: 20px auto;"></div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        
        loading.appendChild(loadingContent);
        document.body.appendChild(loading);
        
        const stepIndicator = document.getElementById('final-step-indicator');
        
        // Step 1: Process Report Upload
        console.log('📤 FINAL: Step 1 - Process Report Upload');
        stepIndicator.textContent = 'Step 1: Processing report upload...';
        
        const step1Response = await fetch('https://fynfomhoikzpsrbghnzr.functions.supabase.co/process-report-upload', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({ fileName: filename, bucketName: 'fuel-reports' })
        });
        
        const step1Data = await step1Response.json();
        console.log('✅ FINAL: Step 1 complete:', step1Data);
        
        // Step 2: Calculate Metrics
        console.log('📊 FINAL: Step 2 - Calculate Metrics');
        stepIndicator.textContent = 'Step 2: Calculating metrics...';
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        
        const step2Response = await fetch('https://fynfomhoikzpsrbghnzr.functions.supabase.co/calculate-metrics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({ fileName: filename, processData: step1Data })
        });
        
        const step2Data = await step2Response.json();
        console.log('✅ FINAL: Step 2 complete:', step2Data);
        
        // Step 3: Generate Insights
        console.log('💡 FINAL: Step 3 - Generate Insights');
        stepIndicator.textContent = 'Step 3: Generating insights...';
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const step3Response = await fetch('https://fynfomhoikzpsrbghnzr.functions.supabase.co/-generate-insights-', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDU3OTEsImV4cCI6MjA3MDA4MTc5MX0.cEOR4UiBh1tWXFL6nC7ftRpi2un8DfCAG5cD7xdd_Cw'
            },
            body: JSON.stringify({ fileName: filename, processData: step1Data, metricsData: step2Data })
        });
        
        const step3Data = await step3Response.json();
        console.log('✅ FINAL: Step 3 complete:', step3Data);
        
        // Remove loading
        document.getElementById('final-loading').remove();
        
        // Store results
        window.FINAL.lastAnalysis = {
            fileName: filename,
            processData: step1Data,
            metricsData: step2Data,
            insightsData: step3Data,
            analyzedAt: new Date().toISOString()
        };
        
        // Show success
        alert(`✅ 3-Step Analysis Complete!\n\nFile: ${filename}\n\n1. Process Report Upload ✅\n2. Calculate Metrics ✅\n3. Generate Insights ✅\n\nResults stored in window.FINAL.lastAnalysis`);
        
        // Close the modal
        const modal = document.getElementById('final-reports-modal');
        if (modal) modal.remove();
        
        // Show results in console
        console.log('📊 FINAL: Analysis results:', window.FINAL.lastAnalysis);
        
    } catch (error) {
        console.error('❌ FINAL: Analysis error:', error);
        document.getElementById('final-loading')?.remove();
        alert('❌ Analysis failed: ' + error.message + '\n\nCheck console for details.');
    }
};

// 3. Update the View Reports button to use the clean function
const originalViewBtn = document.getElementById('view-history');
if (originalViewBtn) {
    // Clone to remove all existing event listeners
    const cleanViewBtn = originalViewBtn.cloneNode(true);
    originalViewBtn.parentNode.replaceChild(cleanViewBtn, originalViewBtn);
    
    // Add clean event listener
    cleanViewBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 FINAL: Clean View Reports clicked');
        window.FINAL.showReports();
    });
    
    // Remove onclick attribute
    cleanViewBtn.removeAttribute('onclick');
    
    console.log('✅ FINAL: View Reports button updated');
}

// 4. Final setup
console.log('🧹 FINAL CLEAN: Setup complete!');
console.log('✅ FINAL: All functions under window.FINAL namespace');
console.log('✅ FINAL: No variable conflicts');
console.log('✅ FINAL: 3-step analysis ready');
console.log('✅ FINAL: Clean event listeners');
console.log('🎉 FINAL: Click "View Reports" to test the completely clean version!');
console.log('💡 FINAL: Results will be in window.FINAL.lastAnalysis after analysis');

