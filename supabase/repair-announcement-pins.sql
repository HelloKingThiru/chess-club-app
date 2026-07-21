-- Pin published announcements that members cannot see yet.
-- Run in Supabase SQL Editor after migration-v9.sql.

update public.posts
set pinned_until = now() + interval '7 days'
where kind = 'mini'
  and published = true
  and archived_at is null
  and (pinned_until is null or pinned_until <= now());
