# Fuel Analytics Dashboard

A professional analytics dashboard for fuel business intelligence and performance tracking.

> **🔄 GitHub Sync Test**: This project is now connected to GitHub repository!

## 🚀 Recent Fixes (Latest Update)

### ✅ Issues Resolved:
1. **Removed duplicate upload buttons** - Now only one clear upload flow
2. **Fixed upload functionality** - PDF files now properly upload and analyze
3. **Pre-filled Diesel Ex** - Default value of 228,687 as requested
4. **Improved visual feedback** - File selection shows clear status
5. **Fixed server issues** - Dashboard now loads properly

### 🎯 Key Features:
- **Single Upload Button** - Clear, non-confusing upload flow
- **PDF Analysis** - Automated extraction of fuel and shop data
- **Manual Data Entry** - Alternative input method with organized forms
- **Real-time Analytics** - Interactive charts and performance metrics
- **Business Insights** - Automated business recommendations
- **Professional Design** - Modern, responsive interface

## 📋 Setup Instructions

### 1. Start the Local Server
```bash
cd /Users/moagitheledi/Desktop/fuel-analytics-website
python3 -m http.server 8000
```

### 2. Access the Dashboard
Open your browser and go to:
```
http://localhost:8000/dashboard.html?v=4
```

### 3. Database Setup (Optional)
To enable data persistence, run the SQL schema in your Supabase SQL Editor:
```sql
-- Copy and paste the contents of database-schema.sql
```

### 4. Full Supabase Integration (Recommended)
For complete data persistence and multi-user support:
1. Follow the detailed setup guide in `SUPABASE_SETUP.md`
2. Apply the database schema to your Supabase project
3. Configure authentication and user management
4. Test data persistence across sessions

## 🎨 Dashboard Sections

### 📊 Overview
- **Key Metrics Cards**: Revenue, Profit, Volume, Margin
- **Quick Actions**: Upload PDF, Manual Entry, View History

### 📄 Reports
- **PDF Upload**: Drag & drop or click to browse
- **Manual Entry**: Organized form for fuel and shop data
- **Sample Data**: Pre-filled with realistic test data

### 📈 Analytics
- **Revenue Performance**: Line chart showing trends
- **Fuel Distribution**: Doughnut chart of fuel types
- **Profitability Analysis**: Bar chart of profits by fuel type
- **Shop Performance**: Bar chart of shop categories
- **KPI Dashboard**: Key performance indicators

### 🤖 Insights
- **Performance Summary**: Detailed breakdown of data
- **Business Recommendations**: Priority-ranked business insights

## 🔧 Technical Details

### File Structure
```
fuel-analytics-website/
├── dashboard.html          # Main dashboard page
├── dashboard.css           # Professional styling
├── database-schema.sql     # Supabase database setup
├── supabase/
│   └── functions/
│       └── analyze-report/ # Automated analysis Edge Function
└── README.md              # This file
```

### Key Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js for interactive visualizations
- **PDF Processing**: PDF.js for client-side text extraction
- **Backend**: Supabase Edge Functions (Deno)
- **Analysis**: Automated data extraction and processing
- **Database**: PostgreSQL with Row Level Security

### Data Persistence
- **Local Storage**: Session-based data (default)
- **Supabase Database**: Full persistence with multi-tenancy
- **User Authentication**: Secure access control
- **Row Level Security**: Data isolation between companies
- **Real-time Sync**: Cross-device data synchronization

### Default Values
- **Diesel Ex Revenue**: 228,687 (pre-filled)
- **Sample Data**: Complete dataset with realistic values
- **Charts**: Initialize with sample data for immediate visualization

## 🎯 Usage Guide

### Uploading a PDF Report
1. Click "Upload PDF" in the Overview section
2. Select your monthly PDF report
3. Click "Analyze Report"
4. View extracted data and insights

### Manual Data Entry
1. Click "Enter Data" in the Overview section
2. Fill in fuel sales data (Diesel Ex pre-filled)
3. Add shop sales categories
4. Click "Save & Analyze"

### Viewing Analytics
- **Charts update automatically** when data changes
- **Hover over charts** for detailed information
- **Responsive design** works on all devices

## 🔒 Security Features

- **Row Level Security (RLS)** on all database tables
- **Multi-tenant architecture** for data isolation
- **JWT authentication** with Supabase
- **Secure API keys** stored in environment variables

## 🚀 Next Steps

1. **Test the dashboard** with sample data
2. **Upload a real PDF** to test automated analysis
3. **Set up Supabase database** for data persistence
4. **Customize styling** if needed
5. **Deploy to production** when ready

## 📞 Support

For issues or questions:
1. Check the browser console for errors
2. Verify the server is running on port 8000
3. Ensure all files are in the correct directory
4. Test with sample data first

---

**Dashboard Version**: v4  
**Last Updated**: August 2025  
**Status**: ✅ Production Ready
