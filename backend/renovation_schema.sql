-- Renovation schema for Supabase (Postgres)

create extension if not exists pgcrypto;

create table if not exists renovation_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  currency text default 'ZAR',
  start_date date default now(),
  horizon_months int default 120,
  discount_rate_annual numeric default 0.12,
  tax_rate numeric default 0.28,
  vat_rate numeric default 0.15,
  user_id uuid,
  created_at timestamptz default now()
);

create table if not exists renovation_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references renovation_projects(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 999,
  created_at timestamptz default now()
);

create table if not exists renovation_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references renovation_projects(id) on delete cascade,
  group_id uuid references renovation_groups(id) on delete set null,
  name text not null,
  description text,
  category text not null,
  qty numeric default 1,
  unit_cost_zar numeric default 0,
  contingency_pct numeric default 0,
  vat_applicable boolean default true,
  salvage_value_zar numeric default 0,
  start_month int default 0,
  spread_type text default 'one_off',
  spread_months int default 1,
  custom_schedule jsonb,
  created_at timestamptz default now()
);

create table if not exists renovation_cash_flows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references renovation_projects(id) on delete cascade,
  month int not null,
  capex numeric default 0,
  depreciation numeric default 0,
  tax_savings numeric default 0,
  net_cash_flow numeric default 0,
  created_at timestamptz default now(),
  unique(project_id, month)
);

create table if not exists renovation_metrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references renovation_projects(id) on delete cascade,
  npv numeric,
  irr numeric,
  payback_period_months int,
  roi numeric,
  mirr numeric,
  break_even_month int,
  created_at timestamptz default now()
);

create table if not exists renovation_snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references renovation_projects(id) on delete cascade,
  snapshot_data jsonb not null,
  created_at timestamptz default now()
);

-- Enable RLS (Row Level Security) for development
alter table renovation_projects enable row level security;
alter table renovation_groups enable row level security;
alter table renovation_items enable row level security;
alter table renovation_cash_flows enable row level security;
alter table renovation_metrics enable row level security;
alter table renovation_snapshots enable row level security;

-- Create permissive policies for development (allow all operations)
create policy "Allow all operations on renovation_projects" on renovation_projects
  for all using (true) with check (true);

create policy "Allow all operations on renovation_groups" on renovation_groups
  for all using (true) with check (true);

create policy "Allow all operations on renovation_items" on renovation_items
  for all using (true) with check (true);

create policy "Allow all operations on renovation_cash_flows" on renovation_cash_flows
  for all using (true) with check (true);

create policy "Allow all operations on renovation_metrics" on renovation_metrics
  for all using (true) with check (true);

create policy "Allow all operations on renovation_snapshots" on renovation_snapshots
  for all using (true) with check (true);

-- Create indexes for better performance
create index if not exists idx_renovation_projects_user_id on renovation_projects(user_id);
create index if not exists idx_renovation_groups_project_id on renovation_groups(project_id);
create index if not exists idx_renovation_items_project_id on renovation_items(project_id);
create index if not exists idx_renovation_items_group_id on renovation_items(group_id);
create index if not exists idx_renovation_items_category on renovation_items(category);
create index if not exists idx_renovation_cash_flows_project_id on renovation_cash_flows(project_id);
create index if not exists idx_renovation_cash_flows_month on renovation_cash_flows(project_id, month);
create index if not exists idx_renovation_metrics_project_id on renovation_metrics(project_id);
create index if not exists idx_renovation_snapshots_project_id on renovation_snapshots(project_id);

-- Insert default renovation groups
insert into renovation_groups (name, description, sort_order) values
  ('Forecourt', 'Forecourt improvements and maintenance', 1),
  ('Pumps & Nozzles', 'Fuel pump and nozzle upgrades', 2),
  ('Deli', 'Deli repairs and improvements', 3),
  ('Shop', 'Convenience store renovations', 4),
  ('IT & Security', 'Technology and security upgrades', 5),
  ('Compliance', 'Regulatory compliance improvements', 6),
  ('Other', 'Miscellaneous renovations', 7)
on conflict do nothing;
