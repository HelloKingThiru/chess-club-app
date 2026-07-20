-- Archive and pin posts: hidden from members when archived;
-- announcements visible to members only while pinned_until > now().

alter table public.posts
  add column if not exists archived_at timestamptz,
  add column if not exists pinned_until timestamptz;

-- Grace period: keep existing published announcements visible for 7 days.
update public.posts
set pinned_until = now() + interval '7 days'
where kind = 'mini'
  and published = true
  and archived_at is null
  and pinned_until is null;

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
  on public.posts for select
  using (
    public.is_admin()
    or (
      published = true
      and archived_at is null
      and (kind != 'mini' or (pinned_until is not null and pinned_until > now()))
    )
  );

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
        and p.archived_at is null
    )
  );
