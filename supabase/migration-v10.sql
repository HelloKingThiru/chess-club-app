-- Event email reminder log (prevents duplicate sends from daily cron)
-- Run in Supabase SQL Editor after migration-v9.sql

create table if not exists event_notification_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reminder_kind text not null check (reminder_kind in ('event_3day', 'enrollment_1day')),
  sent_at timestamptz not null default now(),
  unique (event_id, user_id, reminder_kind)
);

create index if not exists event_notification_log_event_id_idx
  on event_notification_log (event_id);

create index if not exists event_notification_log_user_id_idx
  on event_notification_log (user_id);

alter table event_notification_log enable row level security;
