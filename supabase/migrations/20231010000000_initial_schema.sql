-- Create organizations table
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text default 'UTC',
  created_at timestamptz default now()
);

-- Create memberships table (server-managed roles, not in user_metadata)
create table public.memberships (
  user_id uuid references auth.users(id) primary key,
  organization_id uuid references public.organizations(id) not null,
  role text not null default 'crew', -- 'owner' | 'crew'
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;

-- Policies for memberships
create policy "read own membership" on public.memberships
  for select using (user_id = auth.uid());

-- Secure function to get the current user's org id
create or replace function public.get_auth_org_id()
returns uuid as $$
  select organization_id from public.memberships where user_id = auth.uid();
$$ language sql stable security definer;

-- Create customers table
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.get_auth_org_id() references public.organizations(id),
  name text not null,
  phone text,
  address text,
  notes text,
  tags text[],
  created_at timestamptz default now()
);

-- Create crew_members table
create table public.crew_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.get_auth_org_id() references public.organizations(id),
  name text not null,
  phone text,
  hourly_rate_cents integer,
  active boolean default true,
  created_at timestamptz default now()
);

-- Create jobs table
create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default public.get_auth_org_id() references public.organizations(id),
  customer_id uuid references public.customers(id),
  scheduled_date timestamptz not null,
  status text not null default 'Scheduled', -- Scheduled, En Route, In Progress, Complete, Paid
  assigned_to uuid references public.crew_members(id),
  service_type text,
  notes text,
  created_at timestamptz default now()
);

-- Create job_photos table
create table public.job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id),
  url text not null,
  taken_at timestamptz default now(),
  before_after_flag text -- 'before' | 'after'
);

-- Create invoices table
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id),
  line_items jsonb not null default '[]'::jsonb,
  amount_cents integer not null,
  status text not null default 'Unpaid', -- Unpaid, Paid
  paid_at timestamptz,
  payment_method text, -- Card, Cash, Tab
  created_at timestamptz default now()
);

-- Create customer_ledger table
create table public.customer_ledger (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id),
  delta_cents integer not null, -- negative for charges, positive for payments
  reason text,
  related_invoice_id uuid references public.invoices(id),
  created_at timestamptz default now()
);

-- Create sync_queue table (for offline-first writes)
create table public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  entity_type text not null,
  entity_id text not null,
  payload jsonb not null,
  user_id uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now(),
  synced_at timestamptz
);

-- Enable RLS on all tenant tables
alter table public.customers enable row level security;
alter table public.crew_members enable row level security;
alter table public.jobs enable row level security;
alter table public.job_photos enable row level security;
alter table public.invoices enable row level security;
alter table public.customer_ledger enable row level security;
alter table public.sync_queue enable row level security;

-- Tenant isolation policies
create policy "tenant isolation" on public.organizations
  for all using (id = public.get_auth_org_id());

create policy "tenant isolation" on public.customers
  for all using (org_id = public.get_auth_org_id());

create policy "tenant isolation" on public.crew_members
  for all using (org_id = public.get_auth_org_id());

create policy "tenant isolation" on public.jobs
  for all using (org_id = public.get_auth_org_id());

create policy "tenant isolation" on public.job_photos
  for all using (
    job_id in (select id from public.jobs where org_id = public.get_auth_org_id())
  );

create policy "tenant isolation" on public.invoices
  for all using (
    job_id in (select id from public.jobs where org_id = public.get_auth_org_id())
  );

create policy "tenant isolation" on public.customer_ledger
  for all using (
    customer_id in (select id from public.customers where org_id = public.get_auth_org_id())
  );

-- Sync queue isolation
create policy "user isolation" on public.sync_queue
  for all using (user_id = auth.uid());
