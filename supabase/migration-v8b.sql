-- Let coaches create threads when messaging players first
-- Run if you already applied migration-v8.sql

drop policy if exists "Members create own chat thread" on chat_threads;

create policy "Create chat threads"
  on chat_threads for insert
  with check (member_id = auth.uid() or public.is_admin());
