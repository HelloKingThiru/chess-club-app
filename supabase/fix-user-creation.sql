-- Run this in Supabase SQL Editor if Auth user creation fails with
-- "Database error creating new user"

-- 1) Ensure enum + columns exist (handles partial/old profiles tables)
do $$
begin
  create type public.user_role as enum ('admin', 'coach');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null default '',
  full_name text,
  role public.user_role not null default 'coach',
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role public.user_role default 'coach';
alter table public.profiles add column if not exists created_at timestamptz default now();

update public.profiles set email = '' where email is null;
update public.profiles set role = 'coach' where role is null;
update public.profiles set created_at = now() where created_at is null;

alter table public.profiles alter column email set default '';
alter table public.profiles alter column email set not null;
alter table public.profiles alter column role set default 'coach';
alter table public.profiles alter column role set not null;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column created_at set not null;

-- 2) Avoid RLS recursion when checking admin role
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

-- 3) Safer trigger: bad metadata won't block Auth user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role := 'coach';
  role_text text;
begin
  role_text := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', '')));

  if role_text = 'admin' then
    assigned_role := 'admin';
  else
    assigned_role := 'coach';
  end if;

  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    assigned_role
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = excluded.role;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) Optional: if Auth user already exists but profile row is missing, run:
-- insert into public.profiles (id, email, full_name, role)
-- select id, coalesce(email, ''), 'Your Name', 'admin'::public.user_role
-- from auth.users
-- where email = 'you@example.com'
-- on conflict (id) do nothing;
