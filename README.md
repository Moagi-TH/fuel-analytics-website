# Fuel Analytics Platform

A comprehensive web-based analytics platform for fuel station management, featuring PDF report analysis, data visualization, and Supabase integration.

## 🚀 Features

- **PDF Report Analysis**: Upload and analyze monthly fuel station reports
- **Data Visualization**: Interactive charts and graphs for fuel sales, shop performance, and trends
- **Supabase Integration**: Cloud database and storage for data persistence
- **Real-time Analytics**: Live dashboard with performance metrics
- **Multi-tenant Architecture**: Support for multiple fuel stations
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
fuel-analytics-website/
├── dashboard.html              # Main application dashboard
├── index.html                  # Landing page
├── supabase-client.js          # Supabase integration
├── database-schema.sql         # Database schema
├── extensions-config.js        # Extension management
├── utils/                      # Utility modules
│   ├── logger-fixed.js         # Logging system
│   ├── stateManager.js         # State management
│   ├── errorHandler.js         # Error handling
│   └── ...                     # Other utilities
├── test-*.html                 # Test pages for debugging
└── README.md                   # This file
```

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.x (for local development server)
- Modern web browser
- Supabase account

### Local Development
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd fuel-analytics-website
   ```

2. Start the local development server:
   ```bash
   python3 -m http.server 8001
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:8001/dashboard.html
   ```

### Supabase Setup
1. Create a Supabase project
2. Run the database schema:
   ```sql
   -- Execute database-schema.sql in Supabase SQL Editor
   ```
3. Configure authentication settings
4. Update `supabase-client.js` with your project credentials

## 🔧 Configuration

### Supabase Configuration
Update the following in `supabase-client.js`:
```javascript
const SUPABASE_URL = 'your-supabase-url';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';
```

### Database Schema
The platform uses the following main tables:
- `companies`: Fuel station information
- `profiles`: User profiles and company associations
- `monthly_reports`: Uploaded PDF reports
- `fuel_data`: Fuel sales data
- `shop_data`: Shop sales data

## 📊 Features Overview

### Dashboard
- **Overview**: Key performance indicators
- **Monthly Reports**: Upload and manage PDF reports
- **Analytics**: Interactive charts and visualizations
- **Personnel**: Staff management and performance tracking

### Data Processing
- **PDF Analysis**: Automatic extraction of fuel and shop data
- **Data Validation**: Error checking and data integrity
- **Performance Metrics**: Revenue, volume, and efficiency calculations

### Storage
- **Supabase Storage**: Secure file storage for PDF reports
- **Database**: Structured data storage with RLS policies
- **Local Storage**: Fallback for offline functionality

## 🧪 Testing

The project includes several test pages for debugging:
- `test-upload.html`: File upload testing
- `bucket-check.html`: Storage bucket verification
- `check-database-reports.html`: Database connectivity testing
- `final-upload-test.html`: Complete upload workflow testing

## 🔒 Security

- **Row Level Security (RLS)**: Database-level access control
- **Authentication**: Supabase Auth integration
- **File Access Control**: Storage bucket policies
- **Input Validation**: Client and server-side validation

## 📈 Performance

- **Caching**: Browser and service worker caching
- **Optimization**: Lazy loading and code splitting
- **Compression**: Asset optimization
- **CDN**: External library loading

## 🐛 Troubleshooting

### Common Issues
1. **Authentication Errors**: Check Supabase Auth settings
2. **Storage Access**: Verify RLS policies
3. **Database Connectivity**: Confirm schema and permissions
4. **File Uploads**: Check storage bucket configuration

### Debug Tools
- Browser Developer Tools
- Supabase Dashboard
- Test pages in `/test-*.html`

## 📝 Development Notes

### Recent Updates
- **Supabase Integration**: Complete cloud backend setup
- **Storage Implementation**: PDF file upload and management
- **Authentication**: User management and company associations
- **Database Schema**: Comprehensive data structure

### Pending Work
- **Dashboard Sync**: Connect uploaded reports to dashboard display
- **User Profile Management**: Complete company association workflow
- **Error Handling**: Enhanced error recovery and user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Check the troubleshooting section
- Review test pages for debugging
- Examine browser console for errors
- Verify Supabase configuration

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Status**: Development (Supabase Integration Complete)
