-- Announcement pin scheduling: start time, indefinite pin, and updated visibility rules.

alter table public.posts
  add column if not exists pinned_from timestamptz,
  add column if not exists pin_indefinite boolean not null default false;

drop policy if exists "Anyone can read published posts" on public.posts;
create policy "Anyone can read published posts"
  on public.posts for select
  using (
    public.is_admin()
    or (
      published = true
      and archived_at is null
      and (
        kind != 'mini'
        or (
          (pinned_from is null or pinned_from <= now())
          and (
            pin_indefinite = true
            or (pinned_until is not null and pinned_until > now())
          )
        )
      )
    )
  );
