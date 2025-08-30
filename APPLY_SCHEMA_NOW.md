# 🗄️ **Apply Database Schema - Fix 500 Error**

## 🚨 **Current Status**
- ✅ **API Key**: Working correctly
- ✅ **Supabase Connection**: Established successfully  
- ❌ **Database Tables**: Missing (causing 500 errors)
- ❌ **Schema**: Not applied yet

## 🔧 **Step-by-Step Fix**

### **Step 1: Open Supabase Dashboard**
1. Go to: https://supabase.com/dashboard/project/fynfomhoikzpsrbghnzr
2. Sign in to your Supabase account
3. Navigate to your project

### **Step 2: Open SQL Editor**
1. Click **"SQL Editor"** in the left sidebar
2. Click **"New query"** button
3. You'll see a blank SQL editor

### **Step 3: Apply the Schema**
1. **Copy the entire contents** of `database-schema.sql`
2. **Paste it** into the SQL editor
3. **Click "Run"** to execute the schema

### **Step 4: Verify Tables Created**
After running the schema, you should see these tables in **Table Editor**:
- ✅ `companies`
- ✅ `profiles` 
- ✅ `monthly_reports`
- ✅ `fuel_data`
- ✅ `shop_data`
- ✅ `ai_insights`
- ✅ `forecast_data`
- ✅ `performance_metrics`

### **Step 5: Test Again**
1. Go back to: http://localhost:8000/test-supabase-connection.html
2. Click **"Test Basic Connection"**
3. Should now show **✅ Connection Successful!**

## 📋 **Quick Copy-Paste Instructions**

### **1. Copy Schema**
```bash
# In your terminal, copy the schema content
cat database-schema.sql | pbcopy
```

### **2. Paste in Supabase**
- Open SQL Editor in Supabase Dashboard
- Paste the copied content
- Click "Run"

### **3. Verify Success**
- Check Table Editor for 8 tables
- Run the connection test again

## 🎯 **Expected Results**

After applying the schema:
- ✅ **No more 500 errors**
- ✅ **Connection test passes**
- ✅ **All 8 tables exist**
- ✅ **RLS policies configured**
- ✅ **Ready for data operations**

## 🆘 **If You Get Errors**

### **Common Issues:**
1. **"Permission denied"** - Make sure you're using the correct project
2. **"Table already exists"** - Tables may already be created, that's OK
3. **"Syntax error"** - Check that the entire schema was copied

### **Troubleshooting:**
1. **Check project URL** - Ensure you're in the right project
2. **Verify permissions** - You need admin access to create tables
3. **Try running in parts** - Split the schema if it's too large

---

**Status**: 🔧 **Ready to Apply Schema**  
**Priority**: 🚨 **High** - This will fix the 500 error
