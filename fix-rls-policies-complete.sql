-- Complete RLS Policy Fix for Fuel Analytics Platform
-- This script will fix all RLS issues by recreating policies properly

-- First, let's disable RLS temporarily to clean up
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_data DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_data DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete reports from their company" ON monthly_reports;

-- Re-enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_data ENABLE ROW LEVEL SECURITY;

-- Create NEW RLS Policies for companies
CREATE POLICY "companies_insert_policy" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "companies_select_policy" ON companies
    FOR SELECT USING (
        auth.uid() IS NULL OR 
        id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "companies_update_policy" ON companies
    FOR UPDATE USING (
        id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

-- Create NEW RLS Policies for profiles
CREATE POLICY "profiles_insert_policy" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_select_policy" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_policy" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Create RLS Policies for monthly_reports
CREATE POLICY "monthly_reports_select_policy" ON monthly_reports
    FOR SELECT USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "monthly_reports_insert_policy" ON monthly_reports
    FOR INSERT WITH CHECK (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "monthly_reports_update_policy" ON monthly_reports
    FOR UPDATE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

CREATE POLICY "monthly_reports_delete_policy" ON monthly_reports
    FOR DELETE USING (
        company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid())
    );

-- Create RLS Policies for fuel_data
CREATE POLICY "fuel_data_select_policy" ON fuel_data
    FOR SELECT USING (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "fuel_data_insert_policy" ON fuel_data
    FOR INSERT WITH CHECK (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

-- Create RLS Policies for shop_data
CREATE POLICY "shop_data_select_policy" ON shop_data
    FOR SELECT USING (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "shop_data_insert_policy" ON shop_data
    FOR INSERT WITH CHECK (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

-- Create RLS Policies for ai_insights
CREATE POLICY "ai_insights_select_policy" ON ai_insights
    FOR SELECT USING (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "ai_insights_insert_policy" ON ai_insights
    FOR INSERT WITH CHECK (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

-- Create RLS Policies for forecast_data
CREATE POLICY "forecast_data_select_policy" ON forecast_data
    FOR SELECT USING (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "forecast_data_insert_policy" ON forecast_data
    FOR INSERT WITH CHECK (
        monthly_report_id IN (
            SELECT mr.id FROM monthly_reports mr
            JOIN profiles p ON mr.company_id = p.company_id
            WHERE p.id = auth.uid()
        )
    );

-- Grant ALL necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Grant specific permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON companies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON monthly_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON fuel_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop_data TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON forecast_data TO authenticated;

-- Insert a sample company for testing (only if it doesn't exist)
INSERT INTO companies (name, address, phone, email) VALUES 
('Test Fuel Station', '123 Test Street, Test City', '+27 123 456 789', 'test@fuelstation.com')
ON CONFLICT DO NOTHING;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
