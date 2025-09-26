// Working View Reports Fix - Based on the successful test page
// Copy and paste this in browser console

console.log('🔧 Applying WORKING View Reports fix...');

// 1. Initialize Supabase client (same as test page)
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

// 2. Working View Reports function (based on successful test page)
window.showReportsNow = async function() {
    console.log('🚀 WORKING: Loading reports from Supabase (based on successful test)...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        console.log('🔍 WORKING: Fetching files from Supabase storage...');
        
        // Get files from root directory (same as test page)
        const { data: rootFiles, error: rootError } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { limit: 1000 });
        
        if (rootError) {
            console.error('❌ WORKING: Error fetching files:', rootError);
            alert('❌ Error fetching files: ' + rootError.message);
            return;
        }
        
        console.log(`✅ WORKING: Found ${rootFiles.length} files in root directory`);
        
        // Also check uploads directory
        let uploadsFiles = [];
        try {
            const { data: uploads, error: uploadsError } = await window.supabaseClient.supabase.storage
                .from('fuel-reports')
                .list('uploads', { limit: 1000 });
            
            if (!uploadsError && uploads) {
                uploadsFiles = uploads;
                console.log(`✅ WORKING: Found ${uploads.length} files in uploads/ directory`);
            }
        } catch (e) {
            console.log('⚠️ WORKING: Could not check uploads directory:', e.message);
        }
        
        // Check uploads/anonymous directory
        let anonymousFiles = [];
        try {
            const { data: anonymous, error: anonymousError } = await window.supabaseClient.supabase.storage
                .from('fuel-reports')
                .list('uploads/anonymous', { limit: 1000 });
            
            if (!anonymousError && anonymous) {
                anonymousFiles = anonymous;
                console.log(`✅ WORKING: Found ${anonymous.length} files in uploads/anonymous/ directory`);
            }
        } catch (e) {
            console.log('⚠️ WORKING: Could not check anonymous directory:', e.message);
        }
        
        // Combine all files (same logic as test page)
        const allFiles = [
            ...rootFiles.map(f => ({ ...f, path: f.name, directory: 'root' })),
            ...uploadsFiles.map(f => ({ ...f, path: 'uploads/' + f.name, directory: 'uploads' })),
            ...anonymousFiles.map(f => ({ ...f, path: 'uploads/anonymous/' + f.name, directory: 'uploads/anonymous' }))
        ];
        
        console.log(`✅ WORKING: Total files found: ${allFiles.length}`);
        
        // Wait for DOM elements
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find reports elements
        const reportsHistory = document.getElementById('reports-history');
        const reportsList = document.getElementById('reports-list');
        
        if (!reportsHistory) {
            console.error('❌ WORKING: Reports history element not found');
            alert('❌ Reports history section not found');
            return;
        }
        
        if (!reportsList) {
            console.error('❌ WORKING: Reports list element not found');
            alert('❌ Reports list element not found');
            return;
        }
        
        console.log('✅ WORKING: Found DOM elements');
        
        // Show reports section
        reportsHistory.style.display = 'block';
        
        // Hide other sections
        const uploadArea = document.getElementById('upload-area');
        const manualForm = document.getElementById('manual-form');
        const monthlyPerformance = document.getElementById('monthly-performance');
        
        if (uploadArea) uploadArea.style.display = 'none';
        if (manualForm) manualForm.style.display = 'none';
        if (monthlyPerformance) monthlyPerformance.style.display = 'none';
        
        // Create reports display (same style as test page)
        let html = '';
        
        if (allFiles.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 10px;">No Reports Found</h3>
                    <p>No reports found in Supabase storage.</p>
                    <p>Upload a PDF report to get started.</p>
                </div>
            `;
        } else {
            // Filter for PDF files only
            const pdfFiles = allFiles.filter(file => 
                file.name && file.name.toLowerCase().endsWith('.pdf')
            );
            
            console.log(`📄 WORKING: Found ${pdfFiles.length} PDF files`);
            
            if (pdfFiles.length === 0) {
                html = `
                    <div style="text-align: center; padding: 40px; color: #a0aec0;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <h3 style="color: #fff; margin-bottom: 10px;">No PDF Reports Found</h3>
                        <p>Found ${allFiles.length} files but none are PDF reports.</p>
                        <p>Upload a PDF file to see it here.</p>
                    </div>
                `;
            } else {
                // Sort by creation date (newest first)
                pdfFiles.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                
                pdfFiles.forEach((file, index) => {
                    const fileName = file.name || 'Unknown File';
                    const filePath = file.path || fileName;
                    const fileDate = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date';
                    const fileSize = file.metadata?.size || 0;
                    const fileSizeKB = Math.round(fileSize / 1024);
                    const directory = file.directory || 'root';
                    
                    // Extract period from filename
                    const periodMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
                    const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
                    
                    html += `
                        <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 20px; margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <div style="flex: 1;">
                                    <h5 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${fileName}</h5>
                                    <div style="color: #a0aec0; font-size: 13px; margin-bottom: 5px;">
                                        <span style="background: #3182ce; color: white; padding: 3px 8px; border-radius: 4px; margin-right: 10px; font-size: 11px; font-weight: 500;">SUPABASE</span>
                                        <span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px; margin-right: 10px; font-size: 11px; font-weight: 500;">PDF</span>
                                        <span>📅 ${fileDate}</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span>📊 ${fileSizeKB} KB</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span>📁 ${directory}</span>
                                    </div>
                                    <div style="color: #718096; font-size: 11px; margin-top: 5px;">
                                        Path: ${filePath}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="workingViewReport('${filePath}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">View Report</button>
                                <button onclick="workingDownloadReport('${filePath}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Download</button>
                                <button onclick="workingDeleteReport('${filePath}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Delete</button>
                            </div>
                            <div style="color: #718096; font-size: 12px; margin-top: 10px; border-top: 1px solid #4a5568; padding-top: 8px;">
                                Report #${index + 1} • Period: ${period} • Source: Supabase Storage (Working)
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        // Update the reports list
        reportsList.innerHTML = html;
        
        console.log(`✅ WORKING: Successfully displayed ${allFiles.length} files`);
        console.log(`📊 WORKING: Reports section updated with Supabase data`);
        
    } catch (error) {
        console.error('❌ WORKING: Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 3. Working report action functions
window.workingViewReport = async function(filePath) {
    console.log('📖 WORKING: Viewing report:', filePath);
    
    try {
        window.initializeSupabaseClient();
        
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(filePath, 3600);
        
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
        console.error('❌ WORKING: Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.workingDownloadReport = async function(filePath) {
    console.log('📥 WORKING: Downloading report:', filePath);
    
    try {
        window.initializeSupabaseClient();
        
        const { data: signedUrl, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(filePath, 3600);
        
        if (error) {
            alert('❌ Error downloading file: ' + error.message);
            return;
        }
        
        if (signedUrl?.signedUrl) {
            const link = document.createElement('a');
            link.href = signedUrl.signedUrl;
            link.download = filePath.split('/').pop();
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('❌ Could not get download URL');
        }
        
    } catch (error) {
        console.error('❌ WORKING: Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.workingDeleteReport = async function(filePath) {
    console.log('🗑️ WORKING: Deleting report:', filePath);
    
    if (!confirm('Are you sure you want to delete this report?')) {
        return;
    }
    
    try {
        window.initializeSupabaseClient();
        
        const { error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .remove([filePath]);
        
        if (error) {
            alert('❌ Error deleting file: ' + error.message);
            return;
        }
        
        console.log('✅ WORKING: File deleted from Supabase');
        alert('✅ Report deleted successfully');
        
        // Refresh the reports display
        window.showReportsNow();
        
    } catch (error) {
        console.error('❌ WORKING: Error deleting report:', error);
        alert('❌ Error deleting report: ' + error.message);
    }
};

// 4. Fix the View Reports button
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    viewHistoryBtn.removeAttribute('onclick');
    viewHistoryBtn.addEventListener('click', function() {
        console.log('📋 WORKING: View History button clicked');
        window.showReportsNow();
    });
    console.log('✅ WORKING: View Reports button event handler set up');
}

console.log('✅ WORKING: View Reports fix applied successfully!');
console.log('🎉 WORKING: View Reports will now work exactly like the test page!');
console.log('💡 Click the "View Reports" button to test the working version.');

