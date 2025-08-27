# Supabase Database Integration Setup Guide

## 🚀 **Complete Supabase Integration for Fuel Analytics Platform**

This guide will walk you through setting up the full Supabase database integration for persistent data storage.

## 📋 **Prerequisites**

- ✅ Supabase project already created
- ✅ OpenAI API key configured in Supabase secrets
- ✅ Supabase Edge Function deployed
- ✅ Frontend files updated with Supabase client

## 🗄️ **Step 1: Apply Database Schema**

### **Option A: Supabase Dashboard (Recommended)**

1. **Open Supabase Dashboard**
   - Go to [supabase.com](https://supabase.com)
   - Navigate to your project: `fynfomhoikzpsrbghnzr`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Database Schema**
   - Copy the entire contents of `database-schema.sql`
   - Paste into the SQL editor
   - Click "Run" to execute

### **Option B: Command Line (If you have Supabase CLI)**

```bash
# Install Supabase CLI (if not already installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref fynfomhoikzpsrbghnzr

# Apply the schema
supabase db push
```

## 🔐 **Step 2: Configure Authentication**

### **Enable Email Authentication**

1. **Go to Authentication Settings**
   - In Supabase Dashboard → Authentication → Settings
   - Enable "Email auth"
   - Set "Confirm email" to "No" (for testing)

2. **Create Test User**
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - Example: `test@fuelstation.com` / `password123`

## 🏢 **Step 3: Create Company and Profile**

### **Manual Setup (One-time)**

1. **Create Company**
   ```sql
   INSERT INTO companies (name, slug, subscription_plan, subscription_status)
   VALUES ('Test Fuel Business', 'test-fuel-business', 'basic', 'active')
   RETURNING id;
   ```

2. **Create User Profile**
   ```sql
   INSERT INTO profiles (id, company_id, role, first_name, last_name, email)
   VALUES (
     'YOUR_USER_ID_HERE', -- Get this from auth.users table
     'COMPANY_ID_HERE',   -- Get this from the companies table
     'admin',
     'Test',
     'User',
     'test@fuelstation.com'
   );
   ```

### **Automatic Setup (Recommended)**

The database schema includes triggers that will automatically:
- Create a profile when a user signs up
- Create a default company for new users
- Link the user to their company

## 🔧 **Step 4: Test the Integration**

### **1. Start Local Server**
```bash
cd /Users/moagitheledi/Desktop/fuel-analytics-website
python3 -m http.server 8000
```

### **2. Test Authentication**
- Open `http://localhost:8000`
- Click "Sign in"
- Use the test credentials you created
- Should redirect to dashboard

### **3. Test Data Persistence**
- Upload a PDF report
- Check that data appears in Supabase tables
- Refresh the page - data should persist
- Try deleting a report - should remove from database

## 📊 **Step 5: Verify Database Tables**

### **Check Tables Created**

In Supabase Dashboard → Table Editor, you should see:

- ✅ `companies` - Multi-tenant company data
- ✅ `profiles` - User profiles linked to companies
- ✅ `monthly_reports` - Report metadata and summaries
- ✅ `fuel_data` - Detailed fuel sales data
- ✅ `shop_data` - Shop/convenience store data
- ✅ `ai_insights` - AI-generated insights
- ✅ `forecast_data` - AI forecasts
- ✅ `performance_metrics` - Historical KPIs

### **Check Row Level Security (RLS)**

All tables should have RLS enabled with policies that:
- Users can only see their company's data
- Users can only modify their own data
- Proper data isolation between companies

## 🔍 **Step 6: Monitor and Debug**

### **Check Logs**

1. **Supabase Logs**
   - Go to Dashboard → Logs
   - Monitor for any errors

2. **Browser Console**
   - Open DevTools → Console
   - Look for database connection messages
   - Check for any errors

### **Common Issues**

| Issue | Solution |
|-------|----------|
| "Database not initialized" | Check user authentication |
| "RLS policy violation" | Verify user has proper permissions |
| "Table not found" | Ensure schema was applied correctly |
| "Connection failed" | Check Supabase URL and keys |

## 🎯 **Step 7: Production Deployment**

### **Environment Variables**

For production, ensure these are set:

```bash
# Supabase Configuration
SUPABASE_URL=https://fynfomhoikzpsrbghnzr.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here

# OpenAI Configuration (in Supabase secrets)
OPENAI_API_KEY=your_openai_key_here
```

### **Security Checklist**

- ✅ Row Level Security enabled
- ✅ API keys stored as secrets
- ✅ CORS properly configured
- ✅ Authentication required
- ✅ Data validation in place

## 📈 **Step 8: Data Migration (If Needed)**

### **From Local Storage to Database**

If you have existing local data:

1. **Export Local Data**
   ```javascript
   // In browser console
   console.log(JSON.stringify(uploadedReports));
   console.log(JSON.stringify(monthlyData));
   ```

2. **Import to Database**
   - Use the exported data to populate database tables
   - Ensure proper company and user associations

## 🎉 **Success Indicators**

You'll know the integration is working when:

- ✅ Users can sign in and stay authenticated
- ✅ Reports are saved to database automatically
- ✅ Data persists across browser sessions
- ✅ Multiple users can access their own data
- ✅ Reports can be deleted from database
- ✅ Monthly performance loads from database

## 🆘 **Troubleshooting**

### **Database Connection Issues**

```javascript
// Test database connection
if (window.fuelAnalyticsDB) {
  const result = await window.fuelAnalyticsDB.initialize();
  console.log('DB Init Result:', result);
}
```

### **Authentication Issues**

```javascript
// Check auth status
const isAuthenticated = await window.fuelAnalyticsDB.checkAuthStatus();
console.log('Authenticated:', isAuthenticated);
```

### **Data Loading Issues**

```javascript
// Test loading reports
const reports = await window.fuelAnalyticsDB.getMonthlyReports();
console.log('Reports:', reports);
```

## 📞 **Support**

If you encounter issues:

1. Check the browser console for error messages
2. Verify Supabase project settings
3. Ensure all environment variables are set
4. Check that the database schema was applied correctly

---

**🎯 Next Steps:**
- Test with real PDF reports
- Configure additional security policies
- Set up automated backups
- Monitor performance metrics
