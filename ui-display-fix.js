// UI Display Fix - Forces the reports to show on the dashboard
// Copy and paste this in browser console

console.log('🎨 Applying UI Display Fix...');

// First, let's check what elements exist
console.log('🔍 Checking DOM elements...');
const reportsHistory = document.getElementById('reports-history');
const reportsList = document.getElementById('reports-list');

console.log('reports-history element:', reportsHistory);
console.log('reports-list element:', reportsList);

if (!reportsHistory || !reportsList) {
    console.log('❌ Elements not found, creating them...');
    
    // Find the main container
    const mainContainer = document.querySelector('.dashboard-container') || 
                         document.querySelector('.container') || 
                         document.querySelector('main') ||
                         document.body;
    
    if (mainContainer) {
        // Create reports-history element if it doesn't exist
        if (!reportsHistory) {
            const newReportsHistory = document.createElement('div');
            newReportsHistory.id = 'reports-history';
            newReportsHistory.style.display = 'none';
            newReportsHistory.style.marginTop = '20px';
            newReportsHistory.innerHTML = `
                <div class="card">
                    <h3 style="color: #fff; margin-bottom: 20px;">📊 Reports from Supabase Storage</h3>
                    <div id="reports-list"></div>
                </div>
            `;
            mainContainer.appendChild(newReportsHistory);
            console.log('✅ Created reports-history element');
        }
        
        // Create reports-list element if it doesn't exist
        if (!reportsList) {
            const newReportsList = document.createElement('div');
            newReportsList.id = 'reports-list';
            newReportsList.style.padding = '20px';
            mainContainer.appendChild(newReportsList);
            console.log('✅ Created reports-list element');
        }
    }
}

// Now let's create a working display function
window.displayReportsNow = async function() {
    console.log('🎨 UI DISPLAY: Starting to show reports...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            console.error('❌ Supabase client not available');
            return;
        }
        
        // Get files from Supabase
        const { data: rootFiles, error } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .list('', { limit: 1000 });
        
        if (error) {
            console.error('❌ Error fetching files:', error);
            return;
        }
        
        console.log(`🎨 UI DISPLAY: Found ${rootFiles.length} files`);
        
        // Find or create display elements
        let reportsHistory = document.getElementById('reports-history');
        let reportsList = document.getElementById('reports-list');
        
        if (!reportsHistory) {
            // Create a visible reports section
            reportsHistory = document.createElement('div');
            reportsHistory.id = 'reports-history';
            reportsHistory.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                background: #1a202c;
                border: 2px solid #4a5568;
                border-radius: 12px;
                padding: 20px;
                z-index: 10000;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            `;
            
            reportsHistory.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #fff; margin: 0;">📊 Supabase Reports</h3>
                    <button onclick="document.getElementById('reports-history').remove()" style="background: #ef4444; color: white; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer;">✕ Close</button>
                </div>
                <div id="reports-list"></div>
            `;
            
            document.body.appendChild(reportsHistory);
            console.log('✅ Created floating reports window');
        }
        
        reportsList = document.getElementById('reports-list');
        
        if (!reportsList) {
            console.error('❌ Still no reports-list element');
            return;
        }
        
        // Show the reports section
        reportsHistory.style.display = 'block';
        
        // Create the display content
        let html = '';
        
        if (rootFiles.length === 0) {
            html = `
                <div style="text-align: center; padding: 40px; color: #a0aec0;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📭</div>
                    <h3 style="color: #fff; margin-bottom: 10px;">No Reports Found</h3>
                    <p>No reports found in Supabase storage.</p>
                </div>
            `;
        } else {
            // Filter for PDF files
            const pdfFiles = rootFiles.filter(file => 
                file.name && file.name.toLowerCase().endsWith('.pdf')
            );
            
            console.log(`🎨 UI DISPLAY: Found ${pdfFiles.length} PDF files`);
            
            if (pdfFiles.length === 0) {
                html = `
                    <div style="text-align: center; padding: 40px; color: #a0aec0;">
                        <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
                        <h3 style="color: #fff; margin-bottom: 10px;">No PDF Reports Found</h3>
                        <p>Found ${rootFiles.length} files but none are PDF reports.</p>
                    </div>
                `;
            } else {
                // Sort by creation date
                pdfFiles.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                
                pdfFiles.forEach((file, index) => {
                    const fileName = file.name || 'Unknown File';
                    const fileDate = file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown Date';
                    const fileSize = file.metadata?.size || 0;
                    const fileSizeKB = Math.round(fileSize / 1024);
                    
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
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px;">
                                <button onclick="alert('View: ${fileName}')" style="background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">View Report</button>
                                <button onclick="alert('Download: ${fileName}')" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">Download</button>
                            </div>
                            <div style="color: #718096; font-size: 12px; margin-top: 10px; border-top: 1px solid #4a5568; padding-top: 8px;">
                                Report #${index + 1} • Source: Supabase Storage (UI Display Fix)
                            </div>
                        </div>
                    `;
                });
            }
        }
        
        // Update the display
        reportsList.innerHTML = html;
        
        console.log('🎨 UI DISPLAY: Reports displayed successfully!');
        console.log(`📊 UI DISPLAY: Showing ${rootFiles.length} files`);
        
    } catch (error) {
        console.error('❌ UI DISPLAY: Error:', error);
    }
};

// Override the View Reports button
const viewHistoryBtn = document.getElementById('view-history');
if (viewHistoryBtn) {
    viewHistoryBtn.removeAttribute('onclick');
    viewHistoryBtn.addEventListener('click', function() {
        console.log('🎨 UI DISPLAY: View Reports button clicked');
        window.displayReportsNow();
    });
    console.log('✅ UI DISPLAY: Button event handler updated');
}

console.log('✅ UI Display Fix applied!');
console.log('🎉 Click "View Reports" to see the floating reports window!');

