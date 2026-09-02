-- BuildTrack — Auth, profiles and role helpers
-- Document module 1: JWT authentication, profile management, role-based access.
--
-- Roles are stored in public.profiles (the source of truth for authorization),
-- NOT in JWT user_metadata, which is user-editable and unsafe for authz.

-- ---------------------------------------------------------------------------
-- Enums (from the reference document's role and status lists)
-- ---------------------------------------------------------------------------
create type public.user_role as enum (
  'Administrator',
  'Project Manager',
  'Site Engineer',
  'Contractor',
  'Worker',
  'Client'
);

create type public.account_status as enum ('Active', 'Inactive', 'Suspended');

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles — one row per auth.users record
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text not null default '',
  email        text not null,
  phone        text not null default '',
  role         public.user_role not null default 'Worker',
  employee_id  text,
  department   text not null default 'Pending assignment',
  status       public.account_status not null default 'Active',
  last_login   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when a new auth user signs up.
-- Reads full_name / phone / role from the signup metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'Worker')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER, own-row only, pinned search_path)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'Administrator'
  );
$$;

-- Roles allowed to create/edit operational data (everyone except Worker/Client).
create or replace function public.can_manage()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('Administrator', 'Project Manager', 'Site Engineer', 'Contractor')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-level security on profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- A user can read their own profile; administrators can read every profile.
create policy profiles_select
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

-- A user can update their own profile (but not reassign it to someone else).
create policy profiles_update_own
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Administrators (module 9: User Management) can manage every profile.
create policy profiles_admin_manage
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
