// Direct fix for Supabase upload issue in dashboard
// Run this in the browser console on the dashboard page

console.log('🔧 Applying Supabase upload fix...');

// 1. Fix the Supabase client initialization
window.initializeSupabaseClient = function() {
    if (!window.supabaseClient && window.supabase) {
        const supabaseUrl = 'https://fynfomhoikzpsrbghnzr.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5bmZvbWhvaWt6cHNyYmdobnpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDUwNTc5MSwiZXhwIjoyMDcwMDgxNzkxfQ.LAo0ngckbfAwplBvvQv9zhIzgvTT88H4ZKluHrV8Opo';
        
        window.supabaseClient = {
            supabase: window.supabase.createClient(supabaseUrl, supabaseKey),
            initialized: true
        };
        
        console.log('✅ Supabase client initialized for uploads');
        return true;
    }
    return !!window.supabaseClient;
};

// 2. Fix the upload function to ensure it goes to Supabase
window.handleFileUpload = async function(file) {
    console.log('🔄 Starting upload to Supabase...');
    
    try {
        // Initialize Supabase client
        window.initializeSupabaseClient();
        
        if (!window.supabaseClient) {
            throw new Error('Supabase client not available');
        }
        
        // Create upload path
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const objectPath = `uploads/anonymous/${timestamp}-${file.name}`;
        
        console.log(`📤 Uploading to Supabase: ${objectPath}`);
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await window.supabaseClient.supabase.storage
            .from('fuel-reports')
            .upload(objectPath, file, { 
                upsert: true, 
                contentType: 'application/pdf' 
            });
        
        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }
        
        console.log(`✅ Upload successful: ${uploadData.path}`);
        
        // Create report data
        const reportData = {
            name: file.name,
            size: file.size,
            uploadDate: new Date().toLocaleDateString(),
            storagePath: uploadData.path,
            source: 'Supabase',
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear()
        };
        
        // Add to uploadedReports array
        if (!window.uploadedReports) window.uploadedReports = [];
        window.uploadedReports.unshift(reportData);
        
        // Update display
        if (typeof window.showReportsNow === 'function') {
            window.showReportsNow();
        }
        
        // Update dashboard metrics if function exists
        if (typeof window.updateDashboardMetrics === 'function') {
            window.updateDashboardMetrics();
        }
        
        console.log('✅ Report added to dashboard successfully');
        
        return {
            success: true,
            data: reportData
        };
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        alert(`❌ Upload failed: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
};

// 3. Test the fix
console.log('✅ Upload fix applied!');
console.log('🧪 Testing Supabase connection...');

window.initializeSupabaseClient();
if (window.supabaseClient) {
    console.log('✅ Supabase client ready');
    
    // Test bucket access
    window.supabaseClient.supabase.storage
        .from('fuel-reports')
        .list('', { limit: 1 })
        .then(({ data, error }) => {
            if (error) {
                console.error('❌ Bucket access test failed:', error.message);
            } else {
                console.log('✅ Bucket access test successful');
                console.log(`📦 Found ${data.length} files in bucket`);
            }
        });
} else {
    console.error('❌ Supabase client initialization failed');
}

console.log('🎉 Fix complete! You can now upload files and they will go to Supabase storage.');

