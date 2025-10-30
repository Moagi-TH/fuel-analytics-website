// Direct Supabase fix - Bypasses all existing code and directly loads from Supabase
// Copy and paste this in browser console

console.log('🔧 Applying DIRECT Supabase fix...');

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

// 2. DIRECT function that bypasses all existing code
window.showReportsNow = async function() {
    console.log('🚀 DIRECT: Loading reports from Supabase (bypassing all existing code)...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not available');
            alert('❌ Supabase client not available');
            return;
        }
        
        console.log('🔍 DIRECT: Fetching files from Supabase storage...');
        
        // Get ALL files from Supabase storage (including subdirectories)
        const { data: allFiles, error: listError } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { 
                limit: 1000,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });
        
        if (listError) {
            console.error('❌ DIRECT: Error fetching files:', listError);
            alert('❌ Error fetching files: ' + listError.message);
            return;
        }
        
        console.log(`✅ DIRECT: Found ${allFiles.length} files in Supabase storage`);
        console.log('📋 DIRECT: All files:', allFiles);
        
        // Also check subdirectories for files
        let allFilesList = [...allFiles];
        
        // Check uploads directory
        try {
            const { data: uploadsFiles, error: uploadsError } = await window.supabaseClient.supabase.storage
                .from('fuel-reports')
                .list('uploads', { limit: 1000 });
            
            if (!uploadsError && uploadsFiles) {
                console.log(`📁 DIRECT: Found ${uploadsFiles.length} files in uploads/ directory`);
                allFilesList = [...allFilesList, ...uploadsFiles.map(f => ({ ...f, path: `uploads/${f.name}` }))];
            }
        } catch (e) {
            console.log('⚠️ DIRECT: Could not check uploads directory:', e.message);
        }
        
        // Check anonymous directory
        try {
            const { data: anonymousFiles, error: anonymousError } = await window.supabaseClient.supabase.storage
                .from('fuel-reports')
                .list('uploads/anonymous', { limit: 1000 });
            
            if (!anonymousError && anonymousFiles) {
                console.log(`📁 DIRECT: Found ${anonymousFiles.length} files in uploads/anonymous/ directory`);
                allFilesList = [...allFilesList, ...anonymousFiles.map(f => ({ ...f, path: `uploads/anonymous/${f.name}` }))];
            }
        } catch (e) {
            console.log('⚠️ DIRECT: Could not check anonymous directory:', e.message);
        }
        
        console.log(`✅ DIRECT: Total files found: ${allFilesList.length}`);
        
        // Wait for DOM
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Find elements
        const reportsHistory = document.getElementById('reports-history');
        const reportsList = document.getElementById('reports-list');
        
        if (!reportsHistory) {
            console.error('❌ DIRECT: Reports history element not found');
            alert('❌ Reports history section not found');
            return;
        }
        
        if (!reportsList) {
            console.error('❌ DIRECT: Reports list element not found');
            alert('❌ Reports list element not found');
            return;
        }
        
        console.log('✅ DIRECT: Found DOM elements');
        
        // Show reports section
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
        
        if (allFilesList.length === 0) {
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
            const pdfFiles = allFilesList.filter(file => 
                file.name && (
                    file.name.toLowerCase().endsWith('.pdf') || 
                    file.name.toLowerCase().includes('.pdf')
                )
            );
            
            console.log(`📄 DIRECT: Found ${pdfFiles.length} PDF files`);
            
            if (pdfFiles.length === 0) {
                html = `
                    <div style="text-align: center; padding: 40px; color: #a0aec0;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <h3 style="color: #fff; margin-bottom: 10px;">No PDF Reports Found</h3>
                        <p>Found ${allFilesList.length} files but none are PDF reports.</p>
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
                    
                    // Extract period from filename
                    const periodMatch = fileName.match(/(\d{1,2})\/(\d{4})/);
                    const period = periodMatch ? `${periodMatch[1]}/${periodMatch[2]}` : 'Unknown Period';
                    
                    html += `
                        <div style="background: #2d3748; border: 1px solid #4a5568; border-radius: 8px; padding: 20px; margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                                <div style="flex: 1;">
                                    <h5 style="color: #fff; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${fileName}</h5>
                                    <div style="color: #a0aec0; font-size: 13px; margin-bottom: 5px;">
                                        <span style="background: #3182ce; color: white; padding: 3px 8px; border-radius: 4px; margin-right: 10px; font-size: 11px; font-weight: 500;">SUPABASE DIRECT</span>
                                        <span>📅 ${fileDate}</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span>📊 ${fileSizeKB} KB</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span>📅 Period: ${period}</span>
                                    </div>
                                    <div style="color: #718096; font-size: 11px; margin-top: 5px;">
                                        Path: ${filePath}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="directViewReport('${filePath}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">View Report</button>
                                <button onclick="directDownloadReport('${filePath}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Download</button>
                                <button onclick="directDeleteReport('${filePath}')" style="background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Delete</button>
                            </div>
                            <div style="color: #718096; font-size: 12px; margin-top: 10px; border-top: 1px solid #4a5568; padding-top: 8px;">
                                Report #${index + 1} • Period: ${period} • Source: Supabase Storage (Direct Access)
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        // Update the reports list
        reportsList.innerHTML = html;
        
        console.log(`✅ DIRECT: Successfully displayed ${allFilesList.length} files`);
        console.log(`📊 DIRECT: Reports section updated with Supabase data`);
        
    } catch (error) {
        console.error('❌ DIRECT: Error in showReportsNow:', error);
        alert('❌ Error loading reports: ' + error.message);
    }
};

// 3. Direct report action functions
window.directViewReport = async function(filePath) {
    console.log('📖 DIRECT: Viewing report:', filePath);
    
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
        console.error('❌ DIRECT: Error viewing report:', error);
        alert('❌ Error viewing report: ' + error.message);
    }
};

window.directDownloadReport = async function(filePath) {
    console.log('📥 DIRECT: Downloading report:', filePath);
    
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
        console.error('❌ DIRECT: Error downloading report:', error);
        alert('❌ Error downloading report: ' + error.message);
    }
};

window.directDeleteReport = async function(filePath) {
    console.log('🗑️ DIRECT: Deleting report:', filePath);
    
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
        
        console.log('✅ DIRECT: File deleted from Supabase');
        alert('✅ Report deleted successfully');
        
        // Refresh the reports display
        window.showReportsNow();
        
    } catch (error) {
        console.error('❌ DIRECT: Error deleting report:', error);
        alert('❌ Error deleting report: ' + error.message);
    }
};

// 4. Fix the View Reports button
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    viewHistoryBtn.removeAttribute('onclick');
    viewHistoryBtn.addEventListener('click', function() {
        console.log('📋 DIRECT: View History button clicked');
        window.showReportsNow();
    });
    console.log('✅ DIRECT: View Reports button event handler set up');
}

console.log('✅ DIRECT: Supabase fix applied successfully!');
console.log('🎉 DIRECT: View Reports will now load directly from Supabase storage!');
console.log('💡 Click the "View Reports" button to test direct Supabase access.');
