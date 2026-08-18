-- ClinPharm Hospital initial staging schema
-- Source of truth: supabase/schema.sql

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role text not null default 'clinical_pharmacist' check (role in ('admin','clinical_pharmacist','pharmacy_student','supervisor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_patients (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  initials text not null check (char_length(initials) between 1 and 8),
  name text not null,
  ward text not null default 'Unassigned',
  issue text not null default 'New clinical assessment',
  status text not null default 'Needs review',
  color text not null default 'bg-teal-100 text-teal-700',
  sync_state text not null default 'synced' check (sync_state in ('synced','pending','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id text references public.clinical_patients(id) on delete set null,
  title text not null,
  current_step integer not null default 0 check (current_step between 0 and 9),
  source_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medication_reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id text references public.clinical_patients(id) on delete set null,
  indication text not null,
  effectiveness text,
  safety text,
  status text not null default 'draft' check (status in ('draft','submitted','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_interventions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  patient_id text references public.clinical_patients(id) on delete set null,
  intervention_type text not null,
  soap_note text,
  evidence_url text,
  evidence_level text,
  status text not null default 'draft' check (status in ('draft','submitted','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.guidelines (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  title text not null,
  year integer,
  tier text not null check (tier in ('Tier 1','Tier 2','Tier 3')),
  source_url text not null,
  status text not null default 'CURRENT',
  created_at timestamptz not null default now()
);

create table if not exists public.sync_queue (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation text not null check (operation in ('create','update','delete')),
  table_name text not null,
  payload jsonb not null,
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists clinical_patients_owner_updated_idx on public.clinical_patients(owner_id, updated_at desc);
create index if not exists clinical_cases_owner_updated_idx on public.clinical_cases(owner_id, updated_at desc);
create index if not exists clinical_interventions_owner_created_idx on public.clinical_interventions(owner_id, created_at desc);
create index if not exists medication_reviews_owner_updated_idx on public.medication_reviews(owner_id, updated_at desc);

alter table public.profiles enable row level security;
alter table public.clinical_patients enable row level security;
alter table public.clinical_cases enable row level security;
alter table public.clinical_interventions enable row level security;
alter table public.medication_reviews enable row level security;
alter table public.guidelines enable row level security;
alter table public.sync_queue enable row level security;

drop policy if exists "profiles are owner readable" on public.profiles;
create policy "profiles are owner readable" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles are owner writable" on public.profiles;
create policy "profiles are owner writable" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles are owner editable" on public.profiles;
create policy "profiles are owner editable" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "patients are owner isolated" on public.clinical_patients;
create policy "patients are owner isolated" on public.clinical_patients for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "cases are owner isolated" on public.clinical_cases;
create policy "cases are owner isolated" on public.clinical_cases for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "interventions are owner isolated" on public.clinical_interventions;
create policy "interventions are owner isolated" on public.clinical_interventions for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "medication reviews are owner isolated" on public.medication_reviews;
create policy "medication reviews are owner isolated" on public.medication_reviews for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "guidelines are shared readable" on public.guidelines;
create policy "guidelines are shared readable" on public.guidelines for select using (true);
drop policy if exists "sync queue is owner isolated" on public.sync_queue;
create policy "sync queue is owner isolated" on public.sync_queue for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
