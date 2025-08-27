# 🏗️ Renovation Planning System - Database Setup Guide

## 📋 **Phase 2 Implementation: Database Schema & Data Persistence**

This guide will help you set up the renovation planning database in your Supabase project.

### **🎯 What's Been Built:**

#### **1. Complete Database Schema**
- **6 Tables**: Projects, Groups, Items, Cash Flows, Metrics, Snapshots
- **Row Level Security (RLS)**: Secure data isolation per user
- **Indexes**: Optimized for performance
- **Triggers**: Automatic timestamp updates
- **Helper Functions**: Financial calculations

#### **2. Supabase Client Integration**
- **Full CRUD Operations**: Create, Read, Update, Delete
- **Financial Calculations**: NPV, IRR, Payback Period
- **Cash Flow Management**: Monthly projections
- **Metrics Tracking**: Real-time updates

#### **3. Professional Features**
- **Project Management**: Multiple renovation projects
- **Group Organization**: Categorized renovation items
- **Phasing Controls**: One-off, even spread, custom schedules
- **Audit Trail**: Version snapshots for tracking changes

---

## 🚀 **Setup Instructions**

### **Step 1: Apply Database Schema**

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to **SQL Editor**

2. **Run the Schema Script**
   - Copy the contents of `renovation-schema.sql`
   - Paste into the SQL Editor
   - Click **Run** to execute

3. **Verify Tables Created**
   - Go to **Table Editor**
   - You should see these new tables:
     - `renovation_projects`
     - `renovation_groups`
     - `renovation_items`
     - `renovation_cash_flows`
     - `renovation_metrics`
     - `renovation_snapshots`

### **Step 2: Verify RLS Policies**

1. **Check Row Level Security**
   - Go to **Authentication > Policies**
   - Verify RLS is enabled on all renovation tables
   - Confirm policies are created for each table

2. **Test User Access**
   - Ensure authenticated users can only see their own data
   - Verify data isolation between users

### **Step 3: Test the Integration**

1. **Refresh Your Dashboard**
   - Hard refresh the page (Cmd+Shift+R)
   - Check browser console for any errors

2. **Navigate to Renovation Section**
   - Click "Renovation" in the header
   - The system should automatically create a default project

3. **Add Renovation Items**
   - Click "+ Add Renovation Item"
   - Fill in the form and save
   - Verify data appears in Supabase

---

## 📊 **Database Schema Overview**

### **Core Tables:**

#### **1. renovation_projects**
```sql
- id (UUID, Primary Key)
- name (TEXT)
- description (TEXT)
- currency (TEXT, default 'ZAR')
- start_date (DATE)
- horizon_months (INTEGER, default 120)
- discount_rate_annual (NUMERIC, default 0.12)
- tax_rate (NUMERIC, default 0.28)
- vat_rate (NUMERIC, default 0.15)
- status (TEXT, 'active'|'completed'|'cancelled')
- created_by (UUID, references auth.users)
```

#### **2. renovation_items**
```sql
- id (UUID, Primary Key)
- project_id (UUID, references renovation_projects)
- group_id (UUID, references renovation_groups)
- name (TEXT)
- category (TEXT, 'forecourt'|'pumps'|'canopy'|'shop'|'security'|'compliance'|'other')
- qty (NUMERIC)
- unit_cost_zar (NUMERIC)
- contingency_pct (NUMERIC)
- vat_applicable (BOOLEAN)
- salvage_value_zar (NUMERIC)
- start_month (INTEGER)
- spread_type (TEXT, 'one_off'|'even'|'custom')
- spread_months (INTEGER)
- custom_schedule (JSONB)
- status (TEXT, 'planned'|'in_progress'|'completed'|'cancelled')
```

#### **3. renovation_cash_flows**
```sql
- id (UUID, Primary Key)
- project_id (UUID, references renovation_projects)
- month_index (INTEGER)
- capex_renovations_zar (NUMERIC)
- revenue_zar (NUMERIC)
- opex_zar (NUMERIC)
- tax_zar (NUMERIC)
- net_cashflow_zar (NUMERIC)
- cumulative_zar (NUMERIC)
```

#### **4. renovation_metrics**
```sql
- id (UUID, Primary Key)
- project_id (UUID, references renovation_projects)
- npv_zar (NUMERIC)
- irr_monthly (NUMERIC)
- irr_annual (NUMERIC)
- payback_months (NUMERIC)
- payback_years (NUMERIC)
- total_budget_zar (NUMERIC)
- total_spent_zar (NUMERIC)
- completion_rate (NUMERIC)
```

---

## 🔧 **Key Features Implemented**

### **1. Financial Calculations**
- **NPV (Net Present Value)**: Discounted cash flow analysis
- **IRR (Internal Rate of Return)**: Newton-Raphson method
- **Payback Period**: Time to recover investment
- **Monthly Cash Flows**: Detailed projections

### **2. Data Persistence**
- **Automatic Saving**: All changes saved to database
- **Real-time Updates**: Metrics recalculated instantly
- **Fallback System**: localStorage backup if database unavailable
- **Version Control**: Snapshot system for audit trail

### **3. Security & Performance**
- **Row Level Security**: Users only see their own data
- **Optimized Indexes**: Fast queries on large datasets
- **Automatic Triggers**: Timestamp updates and data validation
- **Error Handling**: Graceful fallbacks and user feedback

---

## 🎯 **Next Steps (Phase 3)**

Once the database is set up and working:

### **1. Calculation Engine Enhancement**
- **Revenue Integration**: Connect with existing fuel/shop data
- **Advanced Metrics**: Sensitivity analysis, scenario modeling
- **Performance Optimization**: Caching and query optimization

### **2. Advanced Features**
- **Excel Import/Export**: Migration tools for existing data
- **Reporting**: PDF generation with professional layouts
- **Collaboration**: Multi-user project management

### **3. Integration**
- **Dashboard Charts**: Visual representation of cash flows
- **Real-time Updates**: Live metrics and notifications
- **Mobile Optimization**: Responsive design improvements

---

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Permission denied" errors**
   - Check RLS policies are properly configured
   - Verify user authentication is working

2. **Tables not created**
   - Check SQL script execution in Supabase
   - Verify no syntax errors in the schema

3. **Data not saving**
   - Check browser console for errors
   - Verify Supabase connection is working
   - Check network connectivity

4. **Metrics not calculating**
   - Verify cash flow calculation is running
   - Check for null values in calculations
   - Review error logs in browser console

### **Support:**
- Check browser console for detailed error messages
- Verify Supabase project settings and API keys
- Test with simple data first before complex scenarios

---

## ✅ **Success Indicators**

You'll know Phase 2 is working when:

1. ✅ **Database tables created** in Supabase
2. ✅ **Renovation items save** to database (not just localStorage)
3. ✅ **Metrics update** in real-time when items are added/modified
4. ✅ **Cash flows calculate** automatically
5. ✅ **Data persists** between browser sessions
6. ✅ **No console errors** related to database operations

**Ready to proceed with Phase 3: Calculation Engine & Integration!** 🚀
