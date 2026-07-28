-- Keep event enrollments visible when a member account is deleted

alter table public.event_attendees
  add column if not exists display_name text;

update public.event_attendees ea
set display_name = coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.email), ''), 'Member')
from public.profiles p
where p.id = ea.user_id
  and (ea.display_name is null or trim(ea.display_name) = '');

alter table public.event_attendees
  add column if not exists id uuid default gen_random_uuid();

update public.event_attendees
set id = gen_random_uuid()
where id is null;

alter table public.event_attendees
  alter column id set not null;

alter table public.event_attendees
  drop constraint if exists event_attendees_user_id_fkey;

alter table public.event_attendees
  drop constraint if exists event_attendees_pkey;

alter table public.event_attendees
  add constraint event_attendees_pkey primary key (id);

alter table public.event_attendees
  alter column user_id drop not null;

create unique index if not exists event_attendees_event_user_unique
  on public.event_attendees (event_id, user_id)
  where user_id is not null;

alter table public.event_attendees
  add constraint event_attendees_user_id_fkey
  foreign key (user_id) references public.profiles (id) on delete set null;
