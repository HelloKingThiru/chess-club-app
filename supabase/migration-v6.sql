-- Allow members to enroll/unenroll themselves in published events.
-- Run in Supabase SQL Editor after prior migrations.

drop policy if exists "Users enroll themselves" on public.event_attendees;
create policy "Users enroll themselves"
  on public.event_attendees for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.posts p
      where p.id = event_id
        and p.kind = 'specific'
        and p.published = true
    )
  );

drop policy if exists "Users unenroll themselves" on public.event_attendees;
create policy "Users unenroll themselves"
  on public.event_attendees for delete
  using (auth.uid() = user_id);
