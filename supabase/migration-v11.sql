-- Guest browsing: public roster view + restrict enrollment data to signed-in members
-- Run in Supabase SQL Editor after migration-v10.sql

create or replace view public.public_profiles
with (security_invoker = false) as
select
  id,
  full_name,
  board_number,
  grade_level,
  bio,
  role,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

drop policy if exists "Anyone can read event attendees" on public.event_attendees;
create policy "Members can read event attendees"
  on public.event_attendees for select
  to authenticated
  using (true);

drop policy if exists "Anyone can read event board order" on public.event_board_order;
create policy "Members can read event board order"
  on public.event_board_order for select
  to authenticated
  using (true);
