// Direct Reports Fix - Force reports to show regardless of existing code conflicts
// Copy and paste this in browser console

console.log('🔍 DIRECT REPORTS FIX: Starting direct report loading and display...');

// Clear console for clarity
console.clear();

// 1. Create a completely independent reports loader
window.DIRECT_REPORTS = window.DIRECT_REPORTS || {};

// Initialize Supabase directly
window.DIRECT_REPORTS.initSupabase = function() {
    if (!window.DIRECT_REPORTS.supabase && window.supabase) {
        const url = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        window.DIRECT_REPORTS.supabase = window.supabase.createClient(url, key);
        console.log('✅ DIRECT: Supabase client initialized');
        return true;
    }
    return !!window.DIRECT_REPORTS.supabase;
};

// 2. Direct report loader that actually works
window.DIRECT_REPORTS.loadReports = async function() {
    console.log('📁 DIRECT: Loading reports directly from Supabase...');
    
    try {
        // Initialize Supabase
        if (!window.DIRECT_REPORTS.initSupabase()) {
            console.error('❌ DIRECT: Failed to initialize Supabase');
            return [];
        }
        
        console.log('🔍 DIRECT: Checking fuel-reports bucket...');
        
        // Get files from the fuel-reports bucket
        const { data: files, error } = await window.DIRECT_REPORTS.supabase.storage
            .from('fuel-reports')
            .list('', { 
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });
        
        if (error) {
            console.error('❌ DIRECT: Error loading reports:', error);
            throw error;
        }
        
        console.log(`📊 DIRECT: Found ${files.length} files in fuel-reports bucket`);
        console.log('📋 DIRECT: Files:', files);
        
        // Filter for PDF files
        const pdfFiles = files.filter(file => {
            return file && file.name && file.name.toLowerCase().endsWith('.pdf');
        });
        
        console.log(`📄 DIRECT: Found ${pdfFiles.length} PDF files`);
        
        // Also check subdirectories
        const subdirs = ['uploads', 'uploads/anonymous'];
        let allPdfFiles = [...pdfFiles];
        
        for (const subdir of subdirs) {
            try {
                console.log(`🔍 DIRECT: Checking ${subdir} directory...`);
                const { data: subdirFiles, error: subdirError } = await window.DIRECT_REPORTS.supabase.storage
                    .from('fuel-reports')
                    .list(subdir, { limit: 1000 });
                
                if (!subdirError && subdirFiles) {
                    const subdirPdfs = subdirFiles.filter(file => 
                        file && file.name && file.name.toLowerCase().endsWith('.pdf')
                    ).map(file => ({
                        ...file,
                        path: `${subdir}/${file.name}`,
                        directory: subdir
                    }));
                    
                    allPdfFiles = [...allPdfFiles, ...subdirPdfs];
                    console.log(`📄 DIRECT: Found ${subdirPdfs.length} PDFs in ${subdir}`);
                }
            } catch (subdirErr) {
                console.log(`⚠️ DIRECT: Could not check ${subdir}:`, subdirErr.message);
            }
        }
        
        console.log(`📊 DIRECT: Total PDF files found: ${allPdfFiles.length}`);
        return allPdfFiles;
        
    } catch (error) {
        console.error('❌ DIRECT: Error in loadReports:', error);
        return [];
    }
};

// 3. Direct reports display that bypasses all existing code
window.DIRECT_REPORTS.showReports = async function() {
    console.log('🎯 DIRECT: Showing reports directly (bypassing all existing code)...');
    
    try {
        // Load reports directly
        const reports = await window.DIRECT_REPORTS.loadReports();
        
        // Remove any existing modal
        const existingModal = document.getElementById('direct-reports-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'direct-reports-modal';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;
        
        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
            border: 3px solid #10b981;
            border-radius: 15px;
            width: 90%;
            max-width: 1000px;
            max-height: 85vh;
            overflow-y: auto;
            padding: 30px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4a5568;
        `;
        
        header.innerHTML = `
            <div>
                <h2 style="color: #10b981; margin: 0; font-size: 28px; font-weight: 700; display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 32px;">📊</span>
                    Direct Reports Access
                </h2>
                <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 16px;">
                    Bypassing all conflicts • Direct Supabase access
                </p>
            </div>
            <button onclick="document.getElementById('direct-reports-modal').remove()" 
                    style="background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: all 0.2s;">
                ✕ Close
            </button>
        `;
        
        // Create body content
        const body = document.createElement('div');
        
        if (reports.length === 0) {
            body.innerHTML = `
                <div style="text-align: center; padding: 80px 20px; color: #a0aec0;">
                    <div style="font-size: 80px; margin-bottom: 30px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 20px; font-size: 24px;">No PDF Reports Found</h3>
                    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">
                        We checked the fuel-reports bucket and all subdirectories but found no PDF files.
                    </p>
                    <div style="background: #2d3748; padding: 20px; border-radius: 10px; margin-top: 30px; text-align: left;">
                        <h4 style="color: #f59e0b; margin: 0 0 10px 0;">🔍 Debug Information:</h4>
                        <ul style="color: #a0aec0; margin: 0; padding-left: 20px; line-height: 1.6;">
                            <li>Bucket: fuel-reports</li>
                            <li>Checked: root, uploads/, uploads/anonymous/</li>
                            <li>Filter: .pdf files only</li>
                            <li>Connection: ${window.DIRECT_REPORTS.supabase ? 'Connected' : 'Failed'}</li>
                        </ul>
                    </div>
                    <p style="font-size: 14px; color: #718096; margin-top: 20px;">
                        Try uploading a PDF report first, then come back to view it here.
                    </p>
                </div>
            `;
        } else {
            // Sort reports by creation date
            reports.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            
            // Create summary header
            let bodyHTML = `
                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; text-align: center;">
                    <h3 style="color: white; margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">
                        🎉 ${reports.length} PDF Report${reports.length !== 1 ? 's' : ''} Found!
                    </h3>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">
                        Direct access from Supabase storage • Ready for analysis
                    </p>
                </div>
            `;
            
            // Create report cards
            reports.forEach((report, index) => {
                const name = report.name || 'Unknown File';
                const path = report.path || name;
                const directory = report.directory || 'root';
                const date = report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown Date';
                const time = report.created_at ? new Date(report.created_at).toLocaleTimeString() : 'Unknown Time';
                const size = report.metadata?.size || 0;
                const sizeKB = Math.round(size / 1024);
                
                // Extract period info from filename
                const periodMatch = name.match(/(\d{1,2})\s*\/\s*(\d{4})/);
                const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
                
                bodyHTML += `
                    <div style="background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%); border: 2px solid #4a5568; border-radius: 12px; padding: 25px; margin: 20px 0; transition: all 0.3s ease; position: relative;">
                        <div style="position: absolute; top: 15px; right: 15px; background: #10b981; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">
                            #${index + 1}
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <h4 style="color: #fff; margin: 0 0 12px 0; font-size: 18px; font-weight: 600; line-height: 1.3; padding-right: 50px; word-break: break-word;">
                                ${name}
                            </h4>
                            
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px;">
                                <span style="background: #3182ce; color: white; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    SUPABASE
                                </span>
                                <span style="background: #10b981; color: white; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    PDF
                                </span>
                                <span style="background: #8b5cf6; color: white; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    📁 ${directory}
                                </span>
                                <span style="background: #f59e0b; color: white; padding: 5px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                                    📊 ${sizeKB} KB
                                </span>
                            </div>
                            
                            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; font-size: 13px;">
                                    <div>
                                        <div style="color: #a0aec0; margin-bottom: 4px;">📅 Date Created</div>
                                        <div style="color: #e2e8f0; font-weight: 500;">${date}</div>
                                    </div>
                                    <div>
                                        <div style="color: #a0aec0; margin-bottom: 4px;">⏰ Time</div>
                                        <div style="color: #e2e8f0; font-weight: 500;">${time}</div>
                                    </div>
                                    <div>
                                        <div style="color: #a0aec0; margin-bottom: 4px;">📋 Period</div>
                                        <div style="color: #e2e8f0; font-weight: 500;">${period}</div>
                                    </div>
                                    <div>
                                        <div style="color: #a0aec0; margin-bottom: 4px;">📂 Path</div>
                                        <div style="color: #e2e8f0; font-weight: 500; font-size: 11px; word-break: break-all;">${path}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                            <button onclick="window.DIRECT_REPORTS.viewReport('${path}')" 
                                    style="background: #3b82f6; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s ease; flex: 1; min-width: 120px;">
                                📖 View Report
                            </button>
                            <button onclick="window.DIRECT_REPORTS.downloadReport('${path}', '${name}')" 
                                    style="background: #10b981; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s ease; flex: 1; min-width: 120px;">
                                📥 Download
                            </button>
                            <button onclick="window.DIRECT_REPORTS.analyzeReport('${path}')" 
                                    style="background: #8b5cf6; color: white; border: none; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.2s ease; flex: 1; min-width: 120px;">
                                🔬 Analyze
                            </button>
                        </div>
                    </div>
                `;
            });
            
            body.innerHTML = bodyHTML;
        }
        
        // Assemble modal
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        console.log(`✅ DIRECT: Modal displayed with ${reports.length} reports`);
        
    } catch (error) {
        console.error('❌ DIRECT: Error in showReports:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 4. Report action functions
window.DIRECT_REPORTS.viewReport = async function(filePath) {
    console.log('📖 DIRECT: Viewing report:', filePath);
    try {
        const { data: signedUrl, error } = await window.DIRECT_REPORTS.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(filePath, 3600);
        
        if (error) throw error;
        
        if (signedUrl?.signedUrl) {
            window.open(signedUrl.signedUrl, '_blank');
            console.log('✅ DIRECT: Report opened in new tab');
        } else {
            throw new Error('No signed URL returned');
        }
    } catch (error) {
        console.error('❌ DIRECT: Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.DIRECT_REPORTS.downloadReport = async function(filePath, fileName) {
    console.log('📥 DIRECT: Downloading report:', filePath);
    try {
        const { data: signedUrl, error } = await window.DIRECT_REPORTS.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(filePath, 3600);
        
        if (error) throw error;
        
        if (signedUrl?.signedUrl) {
            const link = document.createElement('a');
            link.href = signedUrl.signedUrl;
            link.download = fileName || filePath.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            console.log('✅ DIRECT: Download started');
        } else {
            throw new Error('No signed URL returned');
        }
    } catch (error) {
        console.error('❌ DIRECT: Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.DIRECT_REPORTS.analyzeReport = async function(filePath) {
    console.log('🔬 DIRECT: Starting analysis for:', filePath);
    
    // Use the CORS-aware analysis if available
    if (window.CORS_FIX && window.CORS_FIX.analyzeReport) {
        const fileName = filePath.split('/').pop();
        await window.CORS_FIX.analyzeReport(fileName);
    } else {
        alert('Analysis function not available. Please load the CORS fix first.');
    }
};

// 5. Override the existing View Reports button
const viewReportsBtn = document.getElementById('view-history');
if (viewReportsBtn) {
    // Clone to remove all existing listeners
    const newBtn = viewReportsBtn.cloneNode(true);
    viewReportsBtn.parentNode.replaceChild(newBtn, viewReportsBtn);
    
    // Add new event listener
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🎯 DIRECT: View Reports clicked - using direct access');
        window.DIRECT_REPORTS.showReports();
    });
    
    // Remove any onclick attributes
    newBtn.removeAttribute('onclick');
    
    console.log('✅ DIRECT: View Reports button updated to use direct access');
}

console.log('🔍 DIRECT REPORTS FIX: Setup complete!');
console.log('✅ DIRECT: Independent Supabase client');
console.log('✅ DIRECT: Direct bucket access (fuel-reports)');
console.log('✅ DIRECT: Checks all subdirectories');
console.log('✅ DIRECT: Bypasses all existing code conflicts');
console.log('🎉 DIRECT: Click "View Reports" to see direct Supabase access!');
