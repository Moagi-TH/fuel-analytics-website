// Final fix for View Reports - This will work with the actual HTML structure
// Copy and paste this in browser console

console.log('🔧 Applying final fix for View Reports...');

// 1. Initialize Supabase client
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

// 2. Create the View Reports function that works with the actual HTML
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
        
        // Get files from Supabase storage
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
        
        // Wait a moment for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Find the reports section - try multiple selectors
        let reportsHistory = document.getElementById('reports-history');
        let reportsList = document.getElementById('reports-list');
        
        // If elements not found, wait and try again
        if (!reportsHistory || !reportsList) {
            console.log('⏳ Elements not found, waiting...');
            await new Promise(resolve => setTimeout(resolve, 500));
            reportsHistory = document.getElementById('reports-history');
            reportsList = document.getElementById('reports-list');
        }
        
        if (!reportsHistory) {
            console.error('❌ Reports history section not found');
            alert('❌ Reports history section not found');
            return;
        }
        
        if (!reportsList) {
            console.error('❌ Reports list element not found');
            alert('❌ Reports list element not found');
            return;
        }
        
        console.log('✅ Found reports elements');
        
        // Show the reports section
        reportsHistory.style.display = 'block';
        
        // Hide other sections
        const uploadArea = document.getElementById('upload-area');
        const manualForm = document.getElementById('manual-form');
        const monthlyPerformance = document.getElementById('monthly-performance');
        
        if (uploadArea) uploadArea.style.display = 'none';
        if (manualForm) manualForm.style.display = 'none';
        if (monthlyPerformance) monthlyPerformance.style.display = 'none';
        
        // Create reports display
        let html = '';
        
        if (files.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 10px;">No Reports Found</h3>
                    <p>No reports found in Supabase storage.</p>
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
                
                // Extract period from filename if possible
                const periodMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
                const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
                
                html += `
                    <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 20px; margin: 15px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                            <div style="flex: 1;">
                                <h5 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${fileName}</h5>
                                <div style="color: #a0aec0; font-size: 13px; margin-bottom: 5px;">
                                    <span style="background: #3182ce; color: white; padding: 3px 8px; border-radius: 4px; margin-right: 10px; font-size: 11px; font-weight: 500;">SUPABASE</span>
                                    <span>📅 ${fileDate}</span>
                                    <span style="margin: 0 10px;">•</span>
                                    <span>📊 ${fileSizeKB} KB</span>
                                    <span style="margin: 0 10px;">•</span>
                                    <span>📅 Period: ${period}</span>
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button onclick="viewReportFromSupabase('${file.name}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">View Report</button>
                            <button onclick="downloadReportFromSupabase('${file.name}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Download</button>
                            <button onclick="deleteReportFromSupabase('${file.name}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Delete</button>
                        </div>
                        <div style="color: #718096; font-size: 12px; margin-top: 10px; border-top: 1px solid #4a5568; padding-top: 8px;">
                            Report #${index + 1} • Period: ${period} • Source: Supabase Storage
                        </div>
                    </div>
                `;
            });
        }
        
        // Update the reports list
        reportsList.innerHTML = html;
        
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
        console.log(`📊 Displayed ${files.length} reports from Supabase`);
        
    } catch (error) {
        console.error('❌ Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 3. Helper functions for report actions
window.viewReportFromSupabase = async function(fileName) {
    console.log('📖 Viewing report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            alert('❌ Supabase client not available');
            return;
        }
        
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
        console.error('❌ Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.downloadReportFromSupabase = async function(fileName) {
    console.log('📥 Downloading report:', fileName);
    
    try {
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            alert('❌ Supabase client not available');
            return;
        }
        
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
        console.error('❌ Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.deleteReportFromSupabase = async function(fileName) {
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

// 4. Fix the View Reports button
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    // Remove existing onclick
    viewHistoryBtn.removeAttribute('onclick');
    
    // Add new event listener
    viewHistoryBtn.addEventListener('click', function() {
        console.log('📋 View History button clicked');
        window.showReportsNow();
    });
    
    console.log('✅ View Reports button event handler set up');
} else {
    console.log('⚠️ View History button not found');
}

console.log('✅ Final fix applied successfully!');
console.log('🎉 View Reports should now work correctly!');
console.log('💡 Click the "View Reports" button to test it.');
