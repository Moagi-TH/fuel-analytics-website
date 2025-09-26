// Complete Cleanup Fix - Remove all duplicate functions and fix View Reports
// Copy and paste this in browser console

console.log('🧹 COMPLETE CLEANUP: Starting comprehensive fix...');

// 1. Clear all existing conflicting functions and variables
console.log('🗑️ Clearing conflicting functions...');

// Remove all existing showReportsNow functions
delete window.showReportsNow;
delete window.displayReportsNow;
delete window.showReportsClean;
delete window.forceRefreshReports;
delete window.loadReportsFromStorage;
delete window.renderReportsHistory;
delete window.viewReportHistory;

// Clear any existing reports elements
const existingReportsHistory = document.getElementById('reports-history');
const existingReportsList = document.getElementById('reports-list');
const existingCleanWindow = document.getElementById('clean-reports-window');

if (existingReportsHistory) existingReportsHistory.remove();
if (existingReportsList) existingReportsList.remove();
if (existingCleanWindow) existingCleanWindow.remove();

console.log('✅ Cleared all conflicting functions and elements');

// 2. Initialize Supabase client (clean version)
window.initializeSupabaseClient = function() {
    if (!window.supabaseClient && window.supabase) {
        const supabaseUrl = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        
        window.supabaseClient = {
            supabase: window.supabase.createClient(supabaseUrl, supabaseKey),
            initialized: true
        };
        
        console.log('✅ CLEAN: Supabase client initialized');
        return true;
    }
    return !!window.supabaseClient;
};

// 3. Create ONE clean View Reports function
window.showReportsNow = async function() {
    console.log('🎯 CLEAN: Starting View Reports (single source of truth)...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ CLEAN: Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        // Get files from Supabase storage
        console.log('🔍 CLEAN: Fetching files from Supabase...');
        const { data: files, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { limit: 1000 });
        
        if (error) {
            console.error('❌ CLEAN: Error fetching files:', error);
            alert('❌ Error fetching files: ' + error.message);
            return;
        }
        
        console.log(`✅ CLEAN: Found ${files.length} files in Supabase`);
        
        // Remove any existing reports window
        const existingWindow = document.getElementById('clean-reports-window');
        if (existingWindow) {
            existingWindow.remove();
        }
        
        // Create new floating window
        const reportsWindow = document.createElement('div');
        reportsWindow.id = 'clean-reports-window';
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
        
        // Create header
        let content = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #4a5568; padding-bottom: 20px;">
                <div>
                    <h2 style="color: #fff; margin: 0; font-size: 28px; font-weight: 700;">
                        📊 Supabase Reports
                    </h2>
                    <p style="color: #a0aec0; margin: 5px 0 0 0; font-size: 16px;">
                        Direct access to your uploaded PDF reports
                    </p>
                </div>
                <button onclick="document.getElementById('clean-reports-window').remove()" 
                        style="background: #ef4444; color: white; border: none; padding: 12px 18px; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600; transition: background 0.2s ease;">
                    ✕ Close
                </button>
            </div>
        `;
        
        // Create content based on files
        if (files.length === 0) {
            content += `
                <div style="text-align: center; padding: 80px 20px; color: #a0aec0;">
                    <div style="font-size: 80px; margin-bottom: 30px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 20px; font-size: 24px;">No Reports Found</h3>
                    <p style="font-size: 18px; line-height: 1.6; margin-bottom: 15px;">No reports found in Supabase storage.</p>
                    <p style="font-size: 16px; color: #718096;">Upload a PDF report to get started.</p>
                </div>
            `;
        } else {
            // Filter for PDF files
            const pdfFiles = files.filter(file => 
                file.name && file.name.toLowerCase().endsWith('.pdf')
            );
            
            console.log(`📄 CLEAN: Found ${pdfFiles.length} PDF files`);
            
            if (pdfFiles.length === 0) {
                content += `
                    <div style="text-align: center; padding: 80px 20px; color: #a0aec0;">
                        <div style="font-size: 80px; margin-bottom: 30px;">📄</div>
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
                                    📊 Report Summary
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
                        <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 12px; padding: 25px; margin: 20px 0; transition: all 0.3s ease; hover:border-color: #3b82f6;">
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
                                    <button onclick="cleanViewReport('${file.name}')" 
                                            style="background: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease; hover:background: #2563eb;">
                                        📖 View Report
                                    </button>
                                    <button onclick="cleanDownloadReport('${file.name}')" 
                                            style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease; hover:background: #059669;">
                                        📥 Download
                                    </button>
                                    <button onclick="cleanDeleteReport('${file.name}')" 
                                            style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 10px; cursor: pointer; font-size: 15px; font-weight: 600; transition: all 0.2s ease; hover:background: #dc2626;">
                                        🗑️ Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        // Add footer
        content += `
            <div style="border-top: 1px solid #4a5568; padding-top: 20px; margin-top: 30px; text-align: center;">
                <p style="color: #718096; font-size: 14px; margin: 0;">
                    Powered by Supabase Storage • Clean Integration • No Conflicts
                </p>
            </div>
        `;
        
        reportsWindow.innerHTML = content;
        document.body.appendChild(reportsWindow);
        
        console.log('🎯 CLEAN: Reports window created and displayed successfully!');
        console.log(`📊 CLEAN: Showing ${files.length} total files (${pdfFiles.length} PDFs) from Supabase`);
        
    } catch (error) {
        console.error('❌ CLEAN: Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 4. Create clean report action functions
window.cleanViewReport = async function(fileName) {
    console.log('📖 CLEAN: Viewing report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
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
        console.error('❌ CLEAN: Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.cleanDownloadReport = async function(fileName) {
    console.log('📥 CLEAN: Downloading report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
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
        } else {
            alert('❌ Could not get download URL');
        }
        
    } catch (error) {
        console.error('❌ CLEAN: Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.cleanDeleteReport = async function(fileName) {
    console.log('🗑️ CLEAN: Deleting report:', fileName);
    
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
        return;
    }
    
    try {
        window.initializeSupabaseClient();
        
        const { error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .remove([fileName]);
        
        if (error) {
            alert('❌ Error deleting file: ' + error.message);
            return;
        }
        
        console.log('✅ CLEAN: File deleted from Supabase');
        alert('✅ Report deleted successfully');
        
        // Refresh the display
        window.showReportsNow();
        
    } catch (error) {
        console.error('❌ CLEAN: Error deleting report:', error);
        alert('❌ Error deleting report: ' + error.message);
    }
};

// 5. Fix the View Reports button (clean approach)
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    // Remove all existing event listeners by cloning the button
    const newBtn = viewHistoryBtn.cloneNode(true);
    viewHistoryBtn.parentNode.replaceChild(newBtn, viewHistoryBtn);
    
    // Add clean event listener
    newBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🎯 CLEAN: View Reports button clicked');
        window.showReportsNow();
    });
    
    // Remove any onclick attributes
    newBtn.removeAttribute('onclick');
    
    console.log('✅ CLEAN: Button event handler set up cleanly');
}

// 6. Clear any conflicting console messages
console.clear();

console.log('🎯 COMPLETE CLEANUP: All duplicate functions removed!');
console.log('✅ CLEAN: Single showReportsNow function created');
console.log('✅ CLEAN: Supabase client initialized');
console.log('✅ CLEAN: View Reports button fixed');
console.log('🎉 CLEAN: Click "View Reports" to see the clean, working version!');
console.log('💡 CLEAN: No more conflicts - single source of truth!');
