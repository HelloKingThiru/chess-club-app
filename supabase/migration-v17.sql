-- Club game log: anyone can read results; signed-in members can add them.
-- Run in the Supabase SQL Editor after migration-v16.sql.

grant select on table public.game_results to anon, authenticated;
grant insert, delete on table public.game_results to authenticated;

drop policy if exists "Users read own game results" on public.game_results;
drop policy if exists "Anyone can read game results" on public.game_results;
create policy "Anyone can read game results"
  on public.game_results for select
  using (true);

drop policy if exists "Members insert game results" on public.game_results;
create policy "Members insert game results"
  on public.game_results for insert
  to authenticated
  with check (auth.uid() is not null);
