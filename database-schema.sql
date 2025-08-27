-- Fuel Analytics Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (for multi-tenancy)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    subscription_plan TEXT DEFAULT 'basic',
    subscription_status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Monthly reports table
CREATE TABLE monthly_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    file_name TEXT NOT NULL,
    file_path TEXT,
    report_month INTEGER NOT NULL CHECK (report_month BETWEEN 1 AND 12),
    report_year INTEGER NOT NULL CHECK (report_year >= 2000),
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0,
    avg_margin DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, report_month, report_year)
);

-- Fuel data table
CREATE TABLE fuel_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE,
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('diesel_ex', 'vpower_95', 'vpower_diesel')),
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    quantity_liters DECIMAL(15,2) NOT NULL DEFAULT 0,
    selling_price_per_liter DECIMAL(8,2),
    cost_price_per_liter DECIMAL(8,2),
    margin_percent DECIMAL(5,2),
    profit_zar DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop data table
CREATE TABLE shop_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    quantity_units INTEGER NOT NULL DEFAULT 0,
    margin_percent DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI insights table
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE,
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    insight_type TEXT DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Forecast data table
CREATE TABLE forecast_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE,
    forecast_month INTEGER NOT NULL CHECK (forecast_month BETWEEN 1 AND 12),
    forecast_year INTEGER NOT NULL CHECK (forecast_year >= 2000),
    method TEXT NOT NULL,
    assumptions TEXT,
    predicted_revenue DECIMAL(15,2),
    predicted_profit DECIMAL(15,2),
    confidence_score DECIMAL(3,2) CHECK (confidence_score BETWEEN 0 AND 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table (for historical tracking)
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type TEXT NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_monthly_reports_company_date ON monthly_reports(company_id, report_year, report_month);
CREATE INDEX idx_fuel_data_report ON fuel_data(monthly_report_id);
CREATE INDEX idx_shop_data_report ON shop_data(monthly_report_id);
CREATE INDEX idx_ai_insights_report ON ai_insights(monthly_report_id);
CREATE INDEX idx_forecast_data_report ON forecast_data(monthly_report_id);
CREATE INDEX idx_performance_metrics_company_date ON performance_metrics(company_id, metric_date);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update their company" ON companies
    FOR UPDATE USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Profiles policies
CREATE POLICY "Users can view profiles in their company" ON profiles
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Monthly reports policies
CREATE POLICY "Users can view reports in their company" ON monthly_reports
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert reports in their company" ON monthly_reports
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update reports in their company" ON monthly_reports
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Fuel data policies
CREATE POLICY "Users can view fuel data in their company" ON fuel_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert fuel data in their company" ON fuel_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Shop data policies
CREATE POLICY "Users can view shop data in their company" ON shop_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert shop data in their company" ON shop_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- AI insights policies
CREATE POLICY "Users can view insights in their company" ON ai_insights
    FOR SELECT USING (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert insights in their company" ON ai_insights
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Forecast data policies
CREATE POLICY "Users can view forecasts in their company" ON forecast_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert forecasts in their company" ON forecast_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT id FROM monthly_reports WHERE company_id IN (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    ));

-- Performance metrics policies
CREATE POLICY "Users can view metrics in their company" ON performance_metrics
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert metrics in their company" ON performance_metrics
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Functions for automatic profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion function
CREATE OR REPLACE FUNCTION insert_sample_data(company_uuid UUID)
RETURNS VOID AS $$
DECLARE
    report_id UUID;
BEGIN
    -- Insert sample monthly report
    INSERT INTO monthly_reports (company_id, file_name, report_month, report_year, processing_status, total_revenue, total_profit, total_volume, avg_margin)
    VALUES (company_uuid, 'Sample Report - April 2024', 4, 2024, 'completed', 588462.00, 45678.50, 22500.00, 7.75)
    RETURNING id INTO report_id;

    -- Insert fuel data
    INSERT INTO fuel_data (monthly_report_id, fuel_type, total_revenue, quantity_liters, selling_price_per_liter, cost_price_per_liter, margin_percent, profit_zar)
    VALUES 
        (report_id, 'diesel_ex', 228687.00, 8800.00, 26.00, 24.10, 7.31, 16717.00),
        (report_id, 'vpower_95', 185000.00, 7000.00, 26.43, 24.90, 5.79, 10710.00),
        (report_id, 'vpower_diesel', 174775.00, 6700.00, 26.08, 25.60, 1.84, 3216.00);

    -- Insert shop data
    INSERT INTO shop_data (monthly_report_id, category, total_revenue, quantity_units, margin_percent)
    VALUES 
        (report_id, 'Deli Onsite', 359775.00, 1250, 15.50),
        (report_id, 'Beverages', 125000.00, 2500, 25.00),
        (report_id, 'Snacks', 85000.00, 1800, 20.00);

    -- Insert AI insights
    INSERT INTO ai_insights (monthly_report_id, priority, title, description)
    VALUES 
        (report_id, 'high', 'Diesel Ex is your top performer', 'Generating 38.8% of fuel revenue with strong margins'),
        (report_id, 'medium', 'Shop sales show strong growth', 'Deli Onsite leads with R 359,775 in revenue'),
        (report_id, 'low', 'V-Power Diesel margins need attention', 'Consider reviewing pricing strategy for better profitability');

    -- Insert forecast data
    INSERT INTO forecast_data (monthly_report_id, forecast_month, forecast_year, method, assumptions, predicted_revenue, predicted_profit, confidence_score)
    VALUES (report_id, 5, 2024, 'trend-based', 'Based on current performance and seasonal patterns', 605000.00, 48000.00, 0.75);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
