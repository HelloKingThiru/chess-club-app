-- Fix: profiles_role_check blocks "admin"
-- Run in Supabase SQL Editor

-- 1) See current constraint (optional)
-- select conname, pg_get_constraintdef(oid)
-- from pg_constraint
-- where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check';

-- 2) Drop the old check constraint
alter table public.profiles drop constraint if exists profiles_role_check;

-- 3) Ensure user_role enum exists with admin
do $$
begin
  create type public.user_role as enum ('admin', 'coach');
exception
  when duplicate_object then null;
end $$;

alter type public.user_role add value if not exists 'regular';

-- 4) If role column is text, migrate to enum (safe to re-run)
do $$
begin
  alter table public.profiles
    alter column role type public.user_role
    using (
      case lower(role::text)
        when 'admin' then 'admin'::public.user_role
        when 'regular' then 'regular'::public.user_role
        else 'coach'::public.user_role
      end
    );
exception
  when others then null;
end $$;

-- 5) Make your account admin (replace with your sign-up email)
update public.profiles
set role = 'admin'
where email = 'YOUR_ADMIN_EMAIL@example.com';

-- If no row updated, create/link profile from auth user:
insert into public.profiles (id, email, full_name, role, phone_number)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'full_name', 'Club Admin'),
  'admin'::public.user_role,
  nullif(raw_user_meta_data->>'phone_number', '')
from auth.users
where email = 'YOUR_ADMIN_EMAIL@example.com'
on conflict (id) do update
set role = 'admin'::public.user_role;
