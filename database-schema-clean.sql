-- Fuel Analytics Platform Database Schema (Clean Version)
-- Run this in your Supabase SQL Editor

-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view reports from their company" ON monthly_reports;
DROP POLICY IF EXISTS "Users can insert reports for their company" ON monthly_reports;
DROP POLICY IF EXISTS "Users can update reports from their company" ON monthly_reports;
DROP POLICY IF EXISTS "Users can view fuel data from their company" ON fuel_data;
DROP POLICY IF EXISTS "Users can insert fuel data for their company" ON fuel_data;
DROP POLICY IF EXISTS "Users can view shop data from their company" ON shop_data;
DROP POLICY IF EXISTS "Users can insert shop data for their company" ON shop_data;
DROP POLICY IF EXISTS "Users can view insights from their company" ON ai_insights;
DROP POLICY IF EXISTS "Users can insert insights for their company" ON ai_insights;
DROP POLICY IF EXISTS "Users can view forecasts from their company" ON forecast_data;
DROP POLICY IF EXISTS "Users can insert forecasts for their company" ON forecast_data;

-- Drop existing triggers (if they exist)
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_monthly_reports_updated_at ON monthly_reports;

-- Drop existing function (if it exists)
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS forecast_data CASCADE;
DROP TABLE IF EXISTS ai_insights CASCADE;
DROP TABLE IF EXISTS shop_data CASCADE;
DROP TABLE IF EXISTS fuel_data CASCADE;
DROP TABLE IF EXISTS monthly_reports CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- Create companies table
CREATE TABLE companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create monthly_reports table
CREATE TABLE monthly_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    report_month INTEGER NOT NULL CHECK (report_month >= 1 AND report_month <= 12),
    report_year INTEGER NOT NULL,
    processing_status VARCHAR(50) DEFAULT 'pending',
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_volume DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fuel_data table
CREATE TABLE fuel_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE NOT NULL,
    fuel_type VARCHAR(50) NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    quantity_liters DECIMAL(15,2) DEFAULT 0,
    margin_percent DECIMAL(5,2) DEFAULT 0,
    profit_zar DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shop_data table
CREATE TABLE shop_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE NOT NULL,
    category VARCHAR(255) NOT NULL,
    total_revenue DECIMAL(15,2) DEFAULT 0,
    quantity_units INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_insights table
CREATE TABLE ai_insights (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    description TEXT,
    insight_type VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forecast_data table
CREATE TABLE forecast_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    monthly_report_id UUID REFERENCES monthly_reports(id) ON DELETE CASCADE NOT NULL,
    forecast_month INTEGER NOT NULL CHECK (forecast_month >= 1 AND forecast_month <= 12),
    forecast_year INTEGER NOT NULL,
    method VARCHAR(100),
    assumptions TEXT,
    predicted_revenue DECIMAL(15,2) DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_monthly_reports_company ON monthly_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_reports_date ON monthly_reports(report_year, report_month);
CREATE INDEX IF NOT EXISTS idx_fuel_data_report ON fuel_data(monthly_report_id);
CREATE INDEX IF NOT EXISTS idx_shop_data_report ON shop_data(monthly_report_id);
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company_id);

-- Enable Row Level Security (RLS)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update their own company" ON companies
    FOR UPDATE USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- RLS Policies for monthly_reports
CREATE POLICY "Users can view reports from their company" ON monthly_reports
    FOR SELECT USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert reports for their company" ON monthly_reports
    FOR INSERT WITH CHECK (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update reports from their company" ON monthly_reports
    FOR UPDATE USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- RLS Policies for fuel_data
CREATE POLICY "Users can view fuel data from their company" ON fuel_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can insert fuel data for their company" ON fuel_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

-- RLS Policies for shop_data
CREATE POLICY "Users can view shop data from their company" ON shop_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can insert shop data for their company" ON shop_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

-- RLS Policies for ai_insights
CREATE POLICY "Users can view insights from their company" ON ai_insights
    FOR SELECT USING (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can insert insights for their company" ON ai_insights
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

-- RLS Policies for forecast_data
CREATE POLICY "Users can view forecasts from their company" ON forecast_data
    FOR SELECT USING (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

CREATE POLICY "Users can insert forecasts for their company" ON forecast_data
    FOR INSERT WITH CHECK (monthly_report_id IN (
        SELECT mr.id FROM monthly_reports mr
        JOIN profiles p ON mr.company_id = p.company_id
        WHERE p.id = auth.uid()
    ));

-- Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON monthly_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a sample company for testing
INSERT INTO companies (name, address, phone, email) VALUES 
('Test Fuel Station', '123 Test Street, Test City', '+27 123 456 789', 'test@fuelstation.com')
ON CONFLICT DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Verify tables were created
SELECT 'Tables created successfully' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('companies', 'profiles', 'monthly_reports', 'fuel_data', 'shop_data', 'ai_insights', 'forecast_data');
