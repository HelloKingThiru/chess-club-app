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
