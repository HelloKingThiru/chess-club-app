-- Chat read receipts (per user per thread)
-- Run in Supabase SQL Editor after migration-v15.sql

create table if not exists public.chat_thread_reads (
  thread_id uuid not null references public.chat_threads (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create index if not exists chat_thread_reads_user_id_idx
  on public.chat_thread_reads (user_id);

alter table public.chat_thread_reads enable row level security;

drop policy if exists "Users read own thread reads" on public.chat_thread_reads;
create policy "Users read own thread reads"
  on public.chat_thread_reads for select
  using (user_id = auth.uid());

drop policy if exists "Users insert own thread reads" on public.chat_thread_reads;
create policy "Users insert own thread reads"
  on public.chat_thread_reads for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.chat_threads t
      where t.id = thread_id
        and (
          t.member_id = auth.uid()
          or (public.is_admin() and t.admin_id = auth.uid())
        )
    )
  );

drop policy if exists "Users update own thread reads" on public.chat_thread_reads;
create policy "Users update own thread reads"
  on public.chat_thread_reads for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
