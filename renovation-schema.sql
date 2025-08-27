-- ========================================
-- RENOVATION PLANNING DATABASE SCHEMA
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Renovation Projects Table
CREATE TABLE IF NOT EXISTS renovation_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'ZAR',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    horizon_months INTEGER NOT NULL DEFAULT 120,
    discount_rate_annual NUMERIC(9,6) NOT NULL DEFAULT 0.12,
    tax_rate NUMERIC(5,4) NOT NULL DEFAULT 0.28,
    vat_rate NUMERIC(5,4) NOT NULL DEFAULT 0.15,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Renovation Groups Table
CREATE TABLE IF NOT EXISTS renovation_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES renovation_projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Renovation Items Table
CREATE TABLE IF NOT EXISTS renovation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES renovation_projects(id) ON DELETE CASCADE,
    group_id UUID REFERENCES renovation_groups(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('forecourt', 'pumps', 'canopy', 'shop', 'security', 'compliance', 'other')),
    qty NUMERIC(18,4) NOT NULL DEFAULT 1,
    unit_cost_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    contingency_pct NUMERIC(7,4) NOT NULL DEFAULT 0.00,
    vat_applicable BOOLEAN NOT NULL DEFAULT true,
    salvage_value_zar NUMERIC(18,2) DEFAULT 0,
    start_month INTEGER NOT NULL DEFAULT 0,
    spread_type TEXT NOT NULL CHECK (spread_type IN ('one_off', 'even', 'custom')),
    spread_months INTEGER NOT NULL DEFAULT 1,
    custom_schedule JSONB,
    status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Cash Flow Tracking Table
CREATE TABLE IF NOT EXISTS renovation_cash_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES renovation_projects(id) ON DELETE CASCADE,
    month_index INTEGER NOT NULL,
    capex_renovations_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    revenue_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    opex_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    tax_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    net_cashflow_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    cumulative_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, month_index)
);

-- 5. Project Metrics Table
CREATE TABLE IF NOT EXISTS renovation_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES renovation_projects(id) ON DELETE CASCADE,
    npv_zar NUMERIC(18,2),
    irr_monthly NUMERIC(9,6),
    irr_annual NUMERIC(9,6),
    payback_months NUMERIC(9,2),
    payback_years NUMERIC(9,2),
    total_budget_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    total_spent_zar NUMERIC(18,2) NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id)
);

-- 6. Project Snapshots Table (for audit trail)
CREATE TABLE IF NOT EXISTS renovation_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES renovation_projects(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Renovation projects indexes
CREATE INDEX IF NOT EXISTS idx_renovation_projects_status ON renovation_projects(status);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_created_by ON renovation_projects(created_by);
CREATE INDEX IF NOT EXISTS idx_renovation_projects_created_at ON renovation_projects(created_at);

-- Renovation items indexes
CREATE INDEX IF NOT EXISTS idx_renovation_items_project_id ON renovation_items(project_id);
CREATE INDEX IF NOT EXISTS idx_renovation_items_group_id ON renovation_items(group_id);
CREATE INDEX IF NOT EXISTS idx_renovation_items_category ON renovation_items(category);
CREATE INDEX IF NOT EXISTS idx_renovation_items_status ON renovation_items(status);
CREATE INDEX IF NOT EXISTS idx_renovation_items_start_month ON renovation_items(start_month);

-- Cash flow indexes
CREATE INDEX IF NOT EXISTS idx_renovation_cash_flows_project_id ON renovation_cash_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_renovation_cash_flows_month_index ON renovation_cash_flows(month_index);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_renovation_metrics_project_id ON renovation_metrics(project_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE renovation_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE renovation_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for renovation_projects
CREATE POLICY "Users can view their own renovation projects" ON renovation_projects
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own renovation projects" ON renovation_projects
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own renovation projects" ON renovation_projects
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own renovation projects" ON renovation_projects
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for renovation_groups
CREATE POLICY "Users can view groups for their projects" ON renovation_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_groups.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert groups for their projects" ON renovation_groups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_groups.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update groups for their projects" ON renovation_groups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_groups.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete groups for their projects" ON renovation_groups
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_groups.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

-- RLS Policies for renovation_items
CREATE POLICY "Users can view items for their projects" ON renovation_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_items.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert items for their projects" ON renovation_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_items.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update items for their projects" ON renovation_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_items.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can delete items for their projects" ON renovation_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_items.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

-- RLS Policies for renovation_cash_flows
CREATE POLICY "Users can view cash flows for their projects" ON renovation_cash_flows
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_cash_flows.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert cash flows for their projects" ON renovation_cash_flows
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_cash_flows.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update cash flows for their projects" ON renovation_cash_flows
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_cash_flows.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

-- RLS Policies for renovation_metrics
CREATE POLICY "Users can view metrics for their projects" ON renovation_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_metrics.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert metrics for their projects" ON renovation_metrics
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_metrics.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can update metrics for their projects" ON renovation_metrics
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_metrics.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

-- RLS Policies for renovation_snapshots
CREATE POLICY "Users can view snapshots for their projects" ON renovation_snapshots
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_snapshots.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can insert snapshots for their projects" ON renovation_snapshots
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM renovation_projects 
            WHERE renovation_projects.id = renovation_snapshots.project_id 
            AND renovation_projects.created_by = auth.uid()
        )
    );

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_renovation_projects_updated_at 
    BEFORE UPDATE ON renovation_projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renovation_items_updated_at 
    BEFORE UPDATE ON renovation_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_renovation_cash_flows_updated_at 
    BEFORE UPDATE ON renovation_cash_flows 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate monthly discount rate
CREATE OR REPLACE FUNCTION fn_monthly_rate(annual_rate NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql AS $$
BEGIN
    RETURN POWER(1 + COALESCE(annual_rate, 0), 1.0/12.0) - 1;
END; $$;

-- Function to generate month series
CREATE OR REPLACE FUNCTION fn_project_months(p_id UUID)
RETURNS TABLE(month_index INTEGER) LANGUAGE sql STABLE AS $$
    SELECT generate_series(0, (SELECT horizon_months FROM renovation_projects WHERE id = p_id))::INTEGER AS month_index;
$$;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert default renovation groups for new projects
INSERT INTO renovation_groups (project_id, name, description, sort_order) VALUES
    (uuid_generate_v4(), 'Forecourt', 'Forecourt improvements and maintenance', 1),
    (uuid_generate_v4(), 'Pumps & Nozzles', 'Fuel pump and nozzle upgrades', 2),
    (uuid_generate_v4(), 'Canopy', 'Canopy repairs and improvements', 3),
    (uuid_generate_v4(), 'Shop Fit-out', 'Convenience store renovations', 4),
    (uuid_generate_v4(), 'IT & Security', 'Technology and security upgrades', 5),
    (uuid_generate_v4(), 'Compliance', 'Regulatory compliance improvements', 6),
    (uuid_generate_v4(), 'Other', 'Miscellaneous renovations', 7)
ON CONFLICT DO NOTHING;
