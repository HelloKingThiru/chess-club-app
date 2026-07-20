-- Notification preferences and push subscriptions
-- Run in Supabase SQL Editor after migration-v6.sql

create table if not exists notification_preferences (
  user_id uuid primary key references profiles (id) on delete cascade,
  email_announcements boolean not null default true,
  email_events boolean not null default true,
  email_enrollment boolean not null default true,
  push_announcements boolean not null default false,
  push_events boolean not null default false,
  push_enrollment boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table notification_preferences enable row level security;
alter table push_subscriptions enable row level security;

create policy "Users read own notification preferences"
  on notification_preferences for select
  using (auth.uid() = user_id);

create policy "Users insert own notification preferences"
  on notification_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users update own notification preferences"
  on notification_preferences for update
  using (auth.uid() = user_id);

create policy "Users read own push subscriptions"
  on push_subscriptions for select
  using (auth.uid() = user_id);

create policy "Users insert own push subscriptions"
  on push_subscriptions for insert
  with check (auth.uid() = user_id);

create policy "Users delete own push subscriptions"
  on push_subscriptions for delete
  using (auth.uid() = user_id);

-- Default preferences for existing members
insert into notification_preferences (user_id)
select id from profiles
on conflict (user_id) do nothing;
