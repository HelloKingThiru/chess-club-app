-- Game logs are for signed-in members only.
-- Run in the Supabase SQL Editor after migration-v17.sql.

revoke select on table public.game_results from anon;

drop policy if exists "Anyone can read game results" on public.game_results;
drop policy if exists "Members can read game results" on public.game_results;
create policy "Members can read game results"
  on public.game_results for select
  to authenticated
  using (auth.uid() is not null);
