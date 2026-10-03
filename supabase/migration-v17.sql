-- Club match results (internal games that decide who is strongest)
-- Run in Supabase SQL Editor after migration-v16.sql

create table if not exists public.club_matches (
  id uuid primary key default gen_random_uuid(),
  played_on date not null default current_date,
  white_id uuid not null references public.profiles (id) on delete cascade,
  black_id uuid not null references public.profiles (id) on delete cascade,
  result text not null check (result in ('white', 'black', 'draw')),
  notes text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint club_matches_different_players check (white_id <> black_id),
  constraint club_matches_notes_length check (notes is null or char_length(notes) <= 500)
);

create index if not exists club_matches_played_on_idx
  on public.club_matches (played_on desc, created_at desc);

alter table public.club_matches enable row level security;

drop policy if exists "Anyone can read club matches" on public.club_matches;
create policy "Anyone can read club matches"
  on public.club_matches for select
  using (true);

drop policy if exists "Admins insert club matches" on public.club_matches;
create policy "Admins insert club matches"
  on public.club_matches for insert
  with check (public.is_admin());

drop policy if exists "Admins delete club matches" on public.club_matches;
create policy "Admins delete club matches"
  on public.club_matches for delete
  using (public.is_admin());

grant select on public.club_matches to anon, authenticated;
grant insert, delete on public.club_matches to authenticated;
