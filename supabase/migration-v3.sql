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
