-- Player ↔ coaching staff chat
-- Run in Supabase SQL Editor after migration-v7.sql

create table if not exists chat_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null unique references profiles (id) on delete cascade,
  last_message_body text,
  last_message_at timestamptz,
  last_message_sender_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references chat_threads (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_id_created_at_idx
  on chat_messages (thread_id, created_at);

create index if not exists chat_threads_updated_at_idx
  on chat_threads (updated_at desc);

create or replace function public.chat_message_after_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update chat_threads
  set
    updated_at = new.created_at,
    last_message_body = left(new.body, 160),
    last_message_at = new.created_at,
    last_message_sender_id = new.sender_id
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists chat_messages_after_insert on chat_messages;
create trigger chat_messages_after_insert
  after insert on chat_messages
  for each row
  execute function public.chat_message_after_insert();

alter table chat_threads enable row level security;
alter table chat_messages enable row level security;

create policy "Members read own chat thread"
  on chat_threads for select
  using (member_id = auth.uid() or public.is_admin());

create policy "Create chat threads"
  on chat_threads for insert
  with check (member_id = auth.uid() or public.is_admin());

create policy "Admins update chat threads"
  on chat_threads for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Read chat messages in accessible threads"
  on chat_messages for select
  using (
    exists (
      select 1
      from chat_threads t
      where t.id = thread_id
        and (t.member_id = auth.uid() or public.is_admin())
    )
  );

create policy "Send chat messages in accessible threads"
  on chat_messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from chat_threads t
      where t.id = thread_id
        and (t.member_id = auth.uid() or public.is_admin())
    )
  );

-- Enable realtime (safe if already added)
do $$
begin
  alter publication supabase_realtime add table chat_messages;
exception
  when duplicate_object then null;
end $$;

alter table chat_messages replica identity full;
