-- Reports pipeline schema (Option A)
-- Run in Supabase SQL Editor

-- Tables
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  storage_path text not null,
  status text not null default 'processing', -- processing | ready | error
  ai_insights jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.report_extracted (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  raw jsonb not null default '{}'::jsonb,
  status text not null default 'processing', -- processing | ready | error
  errors jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.report_metrics (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  totals jsonb not null default '{}'::jsonb,
  variances jsonb,
  status text not null default 'processing', -- processing | ready | error
  errors jsonb,
  created_at timestamptz not null default now()
);

-- Triggers to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_reports_updated_at on public.reports;
create trigger trg_reports_updated_at
before update on public.reports
for each row execute function public.set_updated_at();

-- RLS
alter table public.reports enable row level security;
alter table public.report_extracted enable row level security;
alter table public.report_metrics enable row level security;

-- Policies: each user accesses only their own reports via join
drop policy if exists reports_owner_all on public.reports;
create policy reports_owner_all on public.reports
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists extracted_owner_all on public.report_extracted;
create policy extracted_owner_all on public.report_extracted
  for all
  using (report_id in (select id from public.reports where user_id = auth.uid()))
  with check (report_id in (select id from public.reports where user_id = auth.uid()));

drop policy if exists metrics_owner_all on public.report_metrics;
create policy metrics_owner_all on public.report_metrics
  for all
  using (report_id in (select id from public.reports where user_id = auth.uid()))
  with check (report_id in (select id from public.reports where user_id = auth.uid()));

-- Helpful indexes
create index if not exists idx_reports_user_created on public.reports(user_id, created_at desc);
create index if not exists idx_extracted_report on public.report_extracted(report_id);
create index if not exists idx_metrics_report on public.report_metrics(report_id);


