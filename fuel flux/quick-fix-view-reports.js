// Quick fix for View Reports - Copy and paste this entire code in browser console

console.log('🔧 Applying quick fix for View Reports...');

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

// 2. Create simple View Reports function
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
        
        // Find the reports section
        const reportsHistory = document.getElementById('reports-history');
        
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
                                </div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button onclick="alert('View Report: ${fileName}')" class="button primary" style="padding: 6px 12px; font-size: 12px;">View Report</button>
                            <button onclick="alert('Download: ${fileName}')" class="button secondary" style="padding: 6px 12px; font-size: 12px;">Download</button>
                        </div>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        
        // Update the reports display
        reportsHistory.innerHTML = html;
        
        console.log('✅ Reports display updated successfully');
        
    } catch (error) {
        console.error('❌ Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 3. Set up clean event handler for View Reports button
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
}

console.log('✅ Quick fix applied successfully!');
console.log('🎉 View Reports button should now work correctly!');
console.log('💡 Click the "View Reports" button to test it.');
