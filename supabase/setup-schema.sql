-- Full database setup for NCHS Chess Club. Run once in Supabase SQL Editor.
-- Safe to re-run. After this, run: npm run seed:mock

-- ========== schema.sql ==========

-- Safe to re-run: skips objects that already exist and refreshes policies/trigger.

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

alter table public.profiles enable row level security;

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

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin());

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

-- First admin: Authentication → Users → Add user
-- User Metadata (raw JSON): {"full_name": "Your Name", "role": "admin"}


-- ========== fix-user-creation.sql ==========

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


-- ========== migration-v2.sql ==========

-- Run in Supabase SQL Editor after schema.sql / fix-user-creation.sql

alter type public.user_role add value if not exists 'regular';

update public.profiles
set role = 'regular'
where role::text = 'coach';

alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists board_number integer;

alter table public.profiles alter column role set default 'regular';

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  author_id uuid references public.profiles (id) on delete set null,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  opponent text not null,
  result text not null check (result in ('win', 'loss', 'draw')),
  event_name text,
  played_on date,
  board_number integer,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.game_results enable row level security;

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
  on public.posts for select
  using (published = true or public.is_admin());

drop policy if exists "Admins manage posts" on public.posts;
create policy "Admins manage posts"
  on public.posts for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users read own game results" on public.game_results;
create policy "Users read own game results"
  on public.game_results for select
  using (auth.uid() = player_id or public.is_admin());

drop policy if exists "Admins manage game results" on public.game_results;
create policy "Admins manage game results"
  on public.game_results for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Admins update all profiles" on public.profiles;
create policy "Admins update all profiles"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins read all profiles" on public.profiles;
create policy "Admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role public.user_role := 'regular';
  role_text text;
begin
  role_text := lower(trim(coalesce(new.raw_user_meta_data ->> 'role', '')));

  if role_text = 'admin' then
    assigned_role := 'admin';
  elsif role_text = 'coach' then
    assigned_role := 'regular';
  elsif role_text = 'regular' then
    assigned_role := 'regular';
  end if;

  insert into public.profiles (id, email, full_name, role, phone_number, board_number)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    assigned_role,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone_number', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'board_number', '')), '')::integer
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = excluded.role;

  return new;
end;
$$;


-- ========== fix-profile-loop.sql ==========

-- Fix profile/login redirect loop: allow users to create their own profile row

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);


-- ========== fix-admin-role.sql ==========

-- Fix: profiles_role_check blocks "admin"
-- Run in Supabase SQL Editor

-- 1) See current constraint (optional)
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check';

-- 2) Drop the old check constraint
alter table public.profiles drop constraint if exists profiles_role_check;

-- 3) Ensure user_role enum exists with admin
do $$
begin
  create type public.user_role as enum ('admin', 'coach');
exception
  when duplicate_object then null;
end $$;

alter type public.user_role add value if not exists 'regular';

-- 4) If role column is text, migrate to enum (safe to re-run)
do $$
begin
  alter table public.profiles
    alter column role type public.user_role
    using (
      case lower(role::text)
        when 'admin' then 'admin'::public.user_role
        when 'regular' then 'regular'::public.user_role
        else 'coach'::public.user_role
      end
    );
exception
  when others then null;
end $$;

-- 5) Make your account admin
update public.profiles
set role = 'admin'
where email = 'king.thirukkumaran@gmail.com';

-- If no row updated, create/link profile from auth user:
insert into public.profiles (id, email, full_name, role, phone_number)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', 'Thirukkumaran'),
  'admin'::public.user_role,
  nullif(raw_user_meta_data->>'phone_number', '')
from auth.users
where email = 'king.thirukkumaran@gmail.com'
on conflict (id) do update
set role = 'admin'::public.user_role;


-- ========== migration-v3.sql ==========

-- Run in Supabase SQL Editor (after prior migrations)

do $$ begin
  create type public.post_kind as enum ('specific', 'mini');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.event_type as enum ('club_meet', 'league_game', 'tournament', 'fundraiser');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.mini_kind as enum ('reminder', 'update');
exception when duplicate_object then null; end $$;

alter table public.posts add column if not exists kind public.post_kind default 'mini';
alter table public.posts add column if not exists event_type public.event_type;
alter table public.posts add column if not exists mini_kind public.mini_kind default 'update';
alter table public.posts add column if not exists event_date timestamptz;
alter table public.posts add column if not exists location text;

update public.posts set kind = 'mini' where kind is null;
update public.posts set mini_kind = 'update' where kind = 'mini' and mini_kind is null;
update public.posts set event_date = created_at where event_date is null;

create table if not exists public.event_attendees (
  event_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

create table if not exists public.event_board_order (
  event_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  board_number integer not null,
  primary key (event_id, user_id)
);

alter table public.event_attendees enable row level security;
alter table public.event_board_order enable row level security;

drop policy if exists "Anyone can read event attendees" on public.event_attendees;
create policy "Anyone can read event attendees"
  on public.event_attendees for select using (true);

drop policy if exists "Admins manage event attendees" on public.event_attendees;
create policy "Admins manage event attendees"
  on public.event_attendees for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can read event board order" on public.event_board_order;
create policy "Anyone can read event board order"
  on public.event_board_order for select using (true);

drop policy if exists "Admins manage event board order" on public.event_board_order;
create policy "Admins manage event board order"
  on public.event_board_order for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
  on public.posts for select
  using (published = true or public.is_admin());


-- ========== migration-v4.sql ==========

-- Run in Supabase SQL Editor after prior migrations.

alter table public.profiles add column if not exists grade_level integer;

alter table public.profiles drop constraint if exists profiles_grade_level_check;

alter table public.profiles
  add constraint profiles_grade_level_check
  check (grade_level is null or grade_level between 9 and 12);


-- ========== migration-v5.sql ==========

-- Admin/coach profile bio shown on their profile page.

alter table public.profiles add column if not exists bio text;

