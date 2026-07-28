-- Member ↔ specific admin chat (one thread per member + admin pair)

alter table public.chat_threads
  add column if not exists admin_id uuid references public.profiles (id) on delete cascade;

update public.chat_threads
set admin_id = (
  select p.id
  from public.profiles p
  where p.role = 'admin'
  order by p.created_at
  limit 1
)
where admin_id is null;

alter table public.chat_threads
  alter column admin_id set not null;

alter table public.chat_threads
  drop constraint if exists chat_threads_member_id_key;

create unique index if not exists chat_threads_member_admin_unique
  on public.chat_threads (member_id, admin_id);

drop policy if exists "Members read own chat thread" on public.chat_threads;
drop policy if exists "Read chat threads for participants" on public.chat_threads;
drop policy if exists "Create chat threads" on public.chat_threads;
drop policy if exists "Admins update chat threads" on public.chat_threads;
drop policy if exists "Read chat messages in accessible threads" on public.chat_messages;
drop policy if exists "Send chat messages in accessible threads" on public.chat_messages;

create policy "Read chat threads for participants"
  on public.chat_threads for select
  using (
    member_id = auth.uid()
    or (public.is_admin() and admin_id = auth.uid())
  );

create policy "Create chat threads"
  on public.chat_threads for insert
  with check (
    (
      member_id = auth.uid()
      and admin_id is not null
      and exists (
        select 1 from public.profiles p
        where p.id = admin_id and p.role = 'admin'
      )
    )
    or (
      public.is_admin()
      and admin_id = auth.uid()
      and member_id is not null
    )
  );

create policy "Admins update chat threads"
  on public.chat_threads for update
  using (public.is_admin() and admin_id = auth.uid())
  with check (public.is_admin() and admin_id = auth.uid());

create policy "Read chat messages in accessible threads"
  on public.chat_messages for select
  using (
    exists (
      select 1
      from public.chat_threads t
      where t.id = thread_id
        and (
          t.member_id = auth.uid()
          or (public.is_admin() and t.admin_id = auth.uid())
        )
    )
  );

create policy "Send chat messages in accessible threads"
  on public.chat_messages for insert
  with check (
    sender_id = auth.uid()
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
