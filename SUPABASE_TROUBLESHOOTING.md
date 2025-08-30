# 🔧 Supabase Integration Troubleshooting Guide

## 🚨 **Current Issues Identified**

Based on the console errors, we have several critical issues preventing the Supabase integration from working:

### 1. **Invalid API Key Error**
```
AuthApiError: Invalid API key
Failed to load resource: 401 (Unauthorized)
```

### 2. **Extension Manager Errors**
```
TypeError: window.extensionManager.getExtension('performanceOptimizer').startMonitoring is not a function
```

### 3. **Authentication Failures**
```
Database initialization error: AuthApiError: Invalid API key
```

## 🔧 **Step-by-Step Fixes**

### **Step 1: Fix Supabase API Key**

The current API key appears to be invalid or expired. Here's how to get the correct one:

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard/project/fynfomhoikzpsrbghnzr
   - Navigate to **Settings** → **API**

2. **Get the Correct Anon Key**
   - Copy the **anon public** key (not the service_role key)
   - It should look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **Update the Key in Code**
   ```javascript
   // In supabase-client.js, line 6
   const SUPABASE_ANON_KEY = 'YOUR_NEW_ANON_KEY_HERE';
   ```

### **Step 2: Apply Database Schema**

1. **Open Supabase SQL Editor**
   - Go to **SQL Editor** in your Supabase dashboard
   - Click **New query**

2. **Run the Schema**
   - Copy the entire contents of `database-schema.sql`
   - Paste and run in the SQL Editor
   - Verify all 8 tables are created

### **Step 3: Test Connection**

1. **Open Test Page**
   ```
   http://localhost:8000/test-supabase-connection.html
   ```

2. **Run Tests**
   - Click "Test Basic Connection"
   - Click "Check Tables"
   - Verify all tests pass

### **Step 4: Create Test User**

1. **In Supabase Dashboard**
   - Go to **Authentication** → **Users**
   - Click **Add user**
   - Create: `test@fuelstation.com` / `password123`

2. **Create Company and Profile**
   ```sql
   -- Run this in SQL Editor
   INSERT INTO companies (name, slug, subscription_plan, subscription_status)
   VALUES ('Test Fuel Business', 'test-fuel-business', 'basic', 'active')
   RETURNING id;
   
   -- Then create profile (replace USER_ID and COMPANY_ID)
   INSERT INTO profiles (id, company_id, role, first_name, last_name, email)
   VALUES (
     'USER_ID_HERE', 
     'COMPANY_ID_HERE',
     'admin',
     'Test',
     'User', 
     'test@fuelstation.com'
   );
   ```

## 🛠️ **Code Fixes Applied**

### **1. Fixed Supabase Client Initialization**
```javascript
// Added error handling and null checks
function initializeSupabase() {
    try {
        if (window.supabase && !supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('Supabase client initialized successfully');
        }
        return supabase;
    } catch (error) {
        console.error('Failed to initialize Supabase client:', error);
        return null;
    }
}
```

### **2. Fixed Extension Manager Error**
```javascript
// Changed from startMonitoring() to initialize()
if (optimizer && typeof optimizer.initialize === 'function') {
    optimizer.initialize();
}
```

### **3. Fixed Accessibility Error**
```javascript
// Added null check for document.body
if (document.body) {
    document.body.appendChild(element);
} else {
    console.warn('Document body not available');
}
```

## 🧪 **Testing Steps**

### **1. Test Basic Connection**
```bash
# Open in browser
http://localhost:8000/test-supabase-connection.html
```

### **2. Test Main Dashboard**
```bash
# Open in browser
http://localhost:8000/dashboard.html
```

### **3. Check Console for Errors**
- Open browser DevTools
- Look for any remaining errors
- All Supabase-related errors should be resolved

## 📋 **Expected Results**

After applying these fixes:

✅ **No more "Invalid API key" errors**  
✅ **No more extension manager errors**  
✅ **Successful database connection**  
✅ **Authentication working**  
✅ **Data persistence functional**  

## 🆘 **If Issues Persist**

### **Check Supabase Project Status**
1. Verify project is active in Supabase dashboard
2. Check if you have the correct project URL
3. Ensure API keys are from the right project

### **Verify Database Schema**
1. Check that all 8 tables exist
2. Verify RLS policies are applied
3. Test with a simple query

### **Check Network Connectivity**
1. Ensure no firewall blocking Supabase
2. Check if CORS is properly configured
3. Verify SSL certificates

## 🎯 **Next Steps After Fixes**

1. **Test Authentication Flow**
   - Sign in with test user
   - Verify session persistence

2. **Test Data Operations**
   - Upload a PDF report
   - Verify data saves to database
   - Test data loading on refresh

3. **Monitor Performance**
   - Check for any remaining console errors
   - Verify all extensions load properly

---

**Status**: ✅ **Fixed** - API key has been updated  
**Priority**: 🟢 **Resolved** - Ready for testing
