-- Insert a dummy organization
INSERT INTO public.organizations (id, name, timezone)
VALUES ('00000000-0000-0000-0000-000000000001', 'FieldFlow Demo Org', 'UTC');

-- We can't easily insert into auth.users directly without using Supabase's auth helpers or pgcrypto,
-- so for local dev, it's easier to create a user through the UI or API and then add them to memberships.
-- Wait, we can insert into auth.users in seed.sql in local Supabase since it's an open Postgres instance:
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'owner@fieldflow.com',
    crypt('password123', gen_salt('bf')),
    current_timestamp,
    current_timestamp,
    current_timestamp,
    '{"provider":"email","providers":["email"]}',
    '{}',
    current_timestamp,
    current_timestamp,
    '',
    '',
    '',
    ''
);

-- Insert membership
INSERT INTO public.memberships (user_id, organization_id, role)
VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'owner');

-- Insert crew members
INSERT INTO public.crew_members (id, org_id, name, phone, hourly_rate_cents)
VALUES 
  ('22222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000001', 'Mike Builder', '555-0001', 3500),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Sarah Fixer', '555-0002', 4000);

-- Insert customers
INSERT INTO public.customers (id, org_id, name, phone, address, notes)
VALUES 
  ('33333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000001', 'John Doe', '555-0101', '123 Main St, Springfield', 'Gate code 1234'),
  ('33333333-3333-3333-3333-333333333332', '00000000-0000-0000-0000-000000000001', 'Jane Smith', '555-0102', '456 Elm St, Springfield', 'Beware of dog'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Bob Johnson', '555-0103', '789 Oak Ave, Springfield', '');

-- Insert jobs
INSERT INTO public.jobs (id, org_id, customer_id, scheduled_date, status, assigned_to, service_type, notes)
VALUES 
  ('44444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', now(), 'Scheduled', '22222222-2222-2222-2222-222222222221', 'HVAC Repair', 'AC blowing warm air.'),
  ('44444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333332', now() + interval '2 hours', 'In Progress', '22222222-2222-2222-2222-222222222222', 'Plumbing Leak', 'Kitchen sink leaking underneath.'),
  ('44444444-4444-4444-4444-444444444443', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', now() + interval '4 hours', 'Scheduled', '22222222-2222-2222-2222-222222222221', 'Electrical Outlet', 'Install new 220V outlet in garage.'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333331', now() - interval '2 days', 'Complete', '22222222-2222-2222-2222-222222222221', 'Lighting Install', 'Installed ceiling fan in living room.');

-- Insert invoices for completed jobs
INSERT INTO public.invoices (id, job_id, line_items, amount_cents, status)
VALUES 
  ('55555555-5555-5555-5555-555555555551', '44444444-4444-4444-4444-444444444444', '[{"id": "1", "type": "labor", "quantity": 1, "taxable": false, "amountCents": 25000, "description": "Lighting Install"}]'::jsonb, 25000, 'Unpaid');

-- Add some ledger balances for customers
INSERT INTO public.customer_ledger (customer_id, delta_cents, reason)
VALUES 
  ('33333333-3333-3333-3333-333333333332', 15000, 'Previous unpaid invoice');
