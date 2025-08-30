-- Fix RLS Policies for Fuel Analytics Platform
-- Run this in your Supabase SQL Editor to fix the RLS issues

-- Drop existing policies that are causing issues
DROP POLICY IF EXISTS "Users can view their own company" ON companies;
DROP POLICY IF EXISTS "Users can update their own company" ON companies;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- Create FIXED RLS Policies for companies - Allow authenticated users to create companies
CREATE POLICY "Authenticated users can create companies" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view their own company" ON companies
    FOR SELECT USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ) OR auth.uid() IS NULL);

CREATE POLICY "Users can update their own company" ON companies
    FOR UPDATE USING (id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

-- Create FIXED RLS Policies for profiles - Allow authenticated users to create profiles
CREATE POLICY "Authenticated users can create their own profile" ON profiles
    FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (id = auth.uid());

-- Add DELETE policy for monthly_reports if it doesn't exist
DROP POLICY IF EXISTS "Users can delete reports from their company" ON monthly_reports;
CREATE POLICY "Users can delete reports from their company" ON monthly_reports
    FOR DELETE USING (company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
    ));

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
