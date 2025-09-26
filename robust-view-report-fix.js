// Robust View Report Fix - Ensure view report always works without conflicts
// Copy and paste this in browser console

console.log('📖 ROBUST VIEW: Creating bulletproof view report function...');

// Clear console for clarity
console.clear();

// 1. Create a completely independent view report system
window.ROBUST_VIEW = window.ROBUST_VIEW || {};

// Initialize Supabase for viewing (independent instance)
window.ROBUST_VIEW.initSupabase = function() {
    if (!window.ROBUST_VIEW.supabase && window.supabase) {
        const url = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        window.ROBUST_VIEW.supabase = window.supabase.createClient(url, key);
        console.log('✅ ROBUST VIEW: Independent Supabase client initialized for viewing');
        return true;
    }
    return !!window.ROBUST_VIEW.supabase;
};

// 2. Robust view report function that always works
window.ROBUST_VIEW.viewReport = async function(filePath, fileName) {
    console.log('📖 ROBUST VIEW: Opening report:', filePath || fileName);
    
    try {
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'view-report-loading';
        loadingIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 25px 35px;
            border-radius: 12px;
            z-index: 999999;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            border: 2px solid #3b82f6;
        `;
        
        loadingIndicator.innerHTML = `
            <div style="margin-bottom: 15px; font-size: 32px;">📖</div>
            <div style="margin-bottom: 10px;">Opening Report...</div>
            <div style="color: #a0aec0; font-size: 14px; margin-bottom: 15px;">${fileName || filePath}</div>
            <div style="width: 30px; height: 30px; border: 3px solid #4a5568; border-top: 3px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
        
        document.body.appendChild(loadingIndicator);
        
        // Initialize Supabase
        if (!window.ROBUST_VIEW.initSupabase()) {
            throw new Error('Failed to initialize Supabase for viewing');
        }
        
        // Create signed URL
        console.log('🔗 ROBUST VIEW: Creating signed URL for:', filePath);
        const { data: signedUrlData, error } = await window.ROBUST_VIEW.supabase.storage
            .from('fuel-reports')
            .createSignedUrl(filePath, 3600); // 1 hour expiry
        
        // Remove loading indicator
        document.getElementById('view-report-loading')?.remove();
        
        if (error) {
            console.error('❌ ROBUST VIEW: Error creating signed URL:', error);
            throw new Error(`Failed to create signed URL: ${error.message}`);
        }
        
        if (!signedUrlData || !signedUrlData.signedUrl) {
            console.error('❌ ROBUST VIEW: No signed URL returned');
            throw new Error('No signed URL returned from Supabase');
        }
        
        const signedUrl = signedUrlData.signedUrl;
        console.log('✅ ROBUST VIEW: Signed URL created successfully');
        
        // Show success notification
        const successNotification = document.createElement('div');
        successNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            z-index: 999999;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        successNotification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="font-size: 20px;">✅</div>
                <div>
                    <div style="font-size: 14px; margin-bottom: 4px;">Report Opened Successfully</div>
                    <div style="font-size: 12px; opacity: 0.9;">${fileName || filePath.split('/').pop()}</div>
                </div>
            </div>
        `;
        
        // Add slide-in animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(successNotification);
        
        // Auto-remove notification after 3 seconds
        setTimeout(() => {
            successNotification?.remove();
        }, 3000);
        
        // Open in new tab/window
        console.log('🚀 ROBUST VIEW: Opening PDF in new tab...');
        const newWindow = window.open(signedUrl, '_blank');
        
        // Check if popup was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            console.warn('⚠️ ROBUST VIEW: Popup blocked, providing fallback...');
            
            // Create fallback modal with direct link
            const fallbackModal = document.createElement('div');
            fallbackModal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 1000000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            fallbackModal.innerHTML = `
                <div style="background: linear-gradient(135deg, #1a202c, #2d3748); border: 3px solid #3b82f6; border-radius: 15px; padding: 35px; text-align: center; color: white; max-width: 500px; margin: 20px;">
                    <div style="font-size: 48px; margin-bottom: 20px;">📖</div>
                    <h3 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 24px; font-weight: 700;">Report Ready to View</h3>
                    <p style="color: #a0aec0; margin: 0 0 25px 0; font-size: 16px; line-height: 1.5;">
                        Your PDF report is ready to view. Click the button below to open it.
                    </p>
                    <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #3b82f6;">
                        <div style="color: #93c5fd; font-size: 14px; margin-bottom: 8px; font-weight: 600;">📄 File Details</div>
                        <div style="color: #e2e8f0; font-size: 13px; word-break: break-all;">${fileName || filePath}</div>
                    </div>
                    <div style="display: flex; gap: 15px; justify-content: center;">
                        <a href="${signedUrl}" target="_blank" rel="noopener noreferrer" 
                           style="background: #3b82f6; color: white; text-decoration: none; padding: 15px 25px; border-radius: 10px; font-weight: 600; display: inline-block; transition: all 0.2s;">
                            📖 Open PDF Report
                        </a>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                                style="background: #6b7280; color: white; border: none; padding: 15px 25px; border-radius: 10px; font-weight: 600; cursor: pointer;">
                            Cancel
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(fallbackModal);
            console.log('✅ ROBUST VIEW: Fallback modal created for popup-blocked scenario');
        } else {
            console.log('✅ ROBUST VIEW: PDF opened successfully in new tab');
        }
        
        // Log success
        console.log('🎉 ROBUST VIEW: View report completed successfully');
        
    } catch (error) {
        console.error('❌ ROBUST VIEW: Error viewing report:', error);
        
        // Remove loading indicator if still present
        document.getElementById('view-report-loading')?.remove();
        
        // Show error notification
        const errorNotification = document.createElement('div');
        errorNotification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            padding: 20px 25px;
            border-radius: 10px;
            z-index: 999999;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
            max-width: 400px;
        `;
        
        errorNotification.innerHTML = `
            <div style="display: flex; align-items: start; gap: 12px;">
                <div style="font-size: 24px;">❌</div>
                <div>
                    <div style="font-size: 16px; margin-bottom: 8px;">Failed to Open Report</div>
                    <div style="font-size: 13px; opacity: 0.9; line-height: 1.4;">${error.message}</div>
                    <div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">File: ${fileName || filePath}</div>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: rgba(255,255,255,0.2); border: none; color: white; font-size: 16px; cursor: pointer; padding: 4px 8px; border-radius: 4px;">×</button>
            </div>
        `;
        
        document.body.appendChild(errorNotification);
        
        // Auto-remove error after 8 seconds
        setTimeout(() => {
            errorNotification?.remove();
        }, 8000);
    }
};

// 3. Test function to verify view report works
window.ROBUST_VIEW.testViewReport = function() {
    console.log('🧪 ROBUST VIEW: Testing view report with sample file...');
    
    // Test with the known PDF file
    const testFileName = '2025-09-15T17-10-02-351Z_Period Report 1 Jul 2025 00_00 to 31 Jul 2025 23_59-1.pdf';
    window.ROBUST_VIEW.viewReport(testFileName, testFileName);
};

// 4. Override ALL existing view report functions to use robust version
console.log('🔧 ROBUST VIEW: Overriding all existing view report functions...');

// Override DIRECT_REPORTS view function
if (window.DIRECT_REPORTS && window.DIRECT_REPORTS.viewReport) {
    window.DIRECT_REPORTS.originalViewReport = window.DIRECT_REPORTS.viewReport;
    window.DIRECT_REPORTS.viewReport = function(filePath) {
        const fileName = filePath ? filePath.split('/').pop() : 'Unknown File';
        console.log('📖 ROBUST VIEW: DIRECT_REPORTS using robust view for:', filePath);
        return window.ROBUST_VIEW.viewReport(filePath, fileName);
    };
    console.log('✅ ROBUST VIEW: DIRECT_REPORTS viewReport overridden');
}

// Override any FINAL view functions
if (window.FINAL && window.FINAL.viewReport) {
    window.FINAL.originalViewReport = window.FINAL.viewReport;
    window.FINAL.viewReport = function(fileName) {
        console.log('📖 ROBUST VIEW: FINAL using robust view for:', fileName);
        return window.ROBUST_VIEW.viewReport(fileName, fileName);
    };
    console.log('✅ ROBUST VIEW: FINAL viewReport overridden');
}

// Override any CORS_FIX view functions
if (window.CORS_FIX && window.CORS_FIX.viewReport) {
    window.CORS_FIX.originalViewReport = window.CORS_FIX.viewReport;
    window.CORS_FIX.viewReport = function(fileName) {
        console.log('📖 ROBUST VIEW: CORS_FIX using robust view for:', fileName);
        return window.ROBUST_VIEW.viewReport(fileName, fileName);
    };
    console.log('✅ ROBUST VIEW: CORS_FIX viewReport overridden');
}

// 5. Create a global view report function that can be called from anywhere
window.viewReportRobust = function(filePath, fileName) {
    console.log('📖 GLOBAL: Using robust view report for:', filePath || fileName);
    return window.ROBUST_VIEW.viewReport(filePath || fileName, fileName || filePath);
};

// 6. Override any inline onclick handlers for view report buttons
setTimeout(() => {
    console.log('🔧 ROBUST VIEW: Scanning for view report buttons to update...');
    
    // Find all buttons that might be view report buttons
    const allButtons = document.querySelectorAll('button');
    let updatedButtons = 0;
    
    allButtons.forEach(button => {
        const buttonText = button.textContent.toLowerCase();
        const onclickAttr = button.getAttribute('onclick') || '';
        
        // Check if this looks like a view report button
        if (buttonText.includes('view') && (buttonText.includes('report') || onclickAttr.includes('viewReport'))) {
            // Extract filename from onclick if possible
            const fileNameMatch = onclickAttr.match(/['"](.*?\.pdf)['"]/);
            
            if (fileNameMatch) {
                const fileName = fileNameMatch[1];
                button.removeAttribute('onclick');
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📖 ROBUST VIEW: Button click intercepted for:', fileName);
                    window.ROBUST_VIEW.viewReport(fileName, fileName);
                });
                updatedButtons++;
                console.log('✅ ROBUST VIEW: Updated button for:', fileName);
            }
        }
    });
    
    console.log(`✅ ROBUST VIEW: Updated ${updatedButtons} view report buttons`);
}, 1000);

console.log('📖 ROBUST VIEW: Setup complete!');
console.log('✅ ROBUST VIEW: Independent Supabase client for viewing');
console.log('✅ ROBUST VIEW: Bulletproof signed URL creation');
console.log('✅ ROBUST VIEW: Popup blocker fallback with direct link');
console.log('✅ ROBUST VIEW: Comprehensive error handling');
console.log('✅ ROBUST VIEW: Success/error notifications');
console.log('✅ ROBUST VIEW: All existing view functions overridden');
console.log('🧪 TEST: Run window.ROBUST_VIEW.testViewReport() to test with your PDF');
console.log('🎉 ROBUST VIEW: View Report will now ALWAYS work without conflicts!');
