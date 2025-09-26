// Fix for View Reports function - Consolidates data sources and fixes conflicts
// Run this in the browser console on the dashboard page

console.log('🔧 Fixing View Reports function...');

// 0. Initialize Supabase client function (required first)
window.initializeSupabaseClient = function() {
    if (!window.supabaseClient && window.supabase) {
        const supabaseUrl = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        
        window.supabaseClient = {
            supabase: window.supabase.createClient(supabaseUrl, supabaseKey),
            initialized: true
        };
        
        console.log('✅ Supabase client initialized');
        return true;
    }
    return !!window.supabaseClient;
};

// 1. Remove all conflicting event handlers
function removeConflictingHandlers() {
    const viewHistoryBtn = document.getElementById('view-history');
    if (viewHistoryBtn) {
        // Remove all event listeners by cloning the element
        const newBtn = viewHistoryBtn.cloneNode(true);
        viewHistoryBtn.parentNode.replaceChild(newBtn, viewHistoryBtn);
        console.log('✅ Removed conflicting event handlers');
    }
}

// 2. Create a clean, consolidated View Reports function
window.showReportsNow = async function() {
    console.log('📊 Loading reports from Supabase...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        // Get files from Supabase storage (single source of truth)
        console.log('🔍 Fetching files from Supabase storage...');
        const { data: files, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { limit: 100 });
        
        if (error) {
            console.error('❌ Error fetching files:', error);
            alert('❌ Error fetching files: ' + error.message);
            return;
        }
        
        console.log(`✅ Found ${files.length} files in Supabase storage`);
        
        // Find the reports section
        const reportsHistory = document.getElementById('reports-history');
        const reportsList = document.getElementById('reports-list');
        
        if (!reportsHistory) {
            console.error('❌ Reports history section not found');
            alert('❌ Reports history section not found');
            return;
        }
        
        // Show the reports section
        reportsHistory.style.display = 'block';
        
        // Hide other sections
        const uploadArea = document.getElementById('upload-area');
        const manualForm = document.getElementById('manual-form');
        const monthlyPerformance = document.getElementById('monthly-performance');
        
        if (uploadArea) uploadArea.style.display = 'none';
        if (manualForm) manualForm.style.display = 'none';
        if (monthlyPerformance) monthlyPerformance.style.display = 'none';
        
        // Clear existing content
        if (reportsList) {
            reportsList.innerHTML = '';
        }
        
        // Create reports display
        let html = `
            <div class="form-section">
                <h4>📋 Reports from Supabase (${files.length})</h4>
                <p class="form-hint">All reports stored in Supabase cloud storage</p>
        `;
        
        if (files.length === 0) {
            html += `
                <div class="info-card">
                    <p>📭 No reports found in Supabase storage.</p>
                    <p>Upload a PDF report to get started.</p>
                </div>
            `;
        } else {
            // Sort files by creation date (newest first)
            const sortedFiles = files.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            sortedFiles.forEach((file, index) => {
                const fileName = file.name || 'Unknown File';
                const fileDate = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date';
                const fileSize = file.metadata?.size || 0;
                const fileSizeKB = Math.round(fileSize / 1024);
                
                // Extract month/year from filename if possible
                const monthYearMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
                const period = monthYearMatch ? `${monthYearMatch[1]}/${monthYearMatch[2]}` : 'Unknown Period';
                
                html += `
                    <div class="report-card" style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 15px; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                            <div>
                                <h5 style="color: #fff; margin: 0 0 5px 0; font-size: 14px;">${fileName}</h5>
                                <div style="color: #a0aec0; font-size: 12px;">
                                    <span style="background: #3182ce; color: white; padding: 2px 6px; border-radius: 4px; margin-right: 8px;">Supabase</span>
                                    <span>📅 ${fileDate}</span>
                                    <span style="margin: 0 8px;">•</span>
                                    <span>📊 ${fileSizeKB} KB</span>
                                    <span style="margin: 0 8px;">•</span>
                                    <span>📅 Period: ${period}</span>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="viewReport('${file.name}')" class="button primary" style="padding: 6px 12px; font-size: 12px;">View Report</button>
                            <button onclick="downloadReport('${file.name}')" class="button secondary" style="padding: 6px 12px; font-size: 12px;">Download</button>
                            <button onclick="deleteReport('${file.name}')" class="button" style="background: #e53e3e; color: white; padding: 6px 12px; font-size: 12px;">Delete</button>
                        </div>
                        <div style="color: #718096; font-size: 11px; margin-top: 8px;">
                            Report #${index + 1} • Period: ${period}
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        // Update the reports list
        if (reportsList) {
            reportsList.innerHTML = html;
        } else {
            reportsHistory.innerHTML = html;
        }
        
        // Update the global reports array for compatibility
        window.uploadedReports = files.map(file => ({
            name: file.name,
            size: file.metadata?.size || 0,
            uploadDate: file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date',
            storagePath: file.name,
            source: 'Supabase',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        }));
        
        console.log('✅ Reports display updated successfully');
        
    } catch (error) {
        console.error('❌ Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 3. Add helper functions for report actions
window.viewReport = async function(fileName) {
    console.log('📖 Viewing report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            alert('❌ Supabase client not available');
            return;
        }
        
        // Get signed URL for the file
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(fileName, 3600); // 1 hour expiry
        
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
        console.error('❌ Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.downloadReport = async function(fileName) {
    console.log('📥 Downloading report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            alert('❌ Supabase client not available');
            return;
        }
        
        // Get signed URL for download
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(fileName, 3600);
        
        if (error) {
            alert('❌ Error downloading file: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            // Create download link
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
        console.error('❌ Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.deleteReport = async function(fileName) {
    console.log('🗑️ Deleting report:', fileName);
    
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            alert('❌ Supabase client not available');
            return;
        }
        
        const { error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .remove([fileName]);
        
        if (error) {
            alert('❌ Error deleting file: ' + error.message);
            return;
        }
        
        console.log('✅ File deleted from Supabase');
        alert('✅ Report deleted successfully');
        
        // Refresh the reports display
        window.showReportsNow();
        
    } catch (error) {
        console.error('❌ Error deleting report:', error);
        alert('❌ Error deleting report: ' + error.message);
    }
};

// 4. Set up clean event handler
function setupCleanEventHandler() {
    const viewHistoryBtn = document.getElementById('view-history');
    if (viewHistoryBtn) {
        viewHistoryBtn.onclick = function() {
            console.log('📋 View History button clicked');
            window.showReportsNow();
        };
        console.log('✅ Clean event handler set up');
    }
}

// 5. Apply the fix
removeConflictingHandlers();
setupCleanEventHandler();

console.log('✅ View Reports fix applied successfully!');
console.log('🎉 View Reports should now work correctly with Supabase');
