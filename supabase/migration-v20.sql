-- Let either side of a logged game be someone outside the club.
-- Run in the Supabase SQL Editor after migration-v19.sql.

alter table public.game_results alter column player_id drop not null;
alter table public.game_results add column if not exists white_name text;
alter table public.game_results add column if not exists black_name text;
