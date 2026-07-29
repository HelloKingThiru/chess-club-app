-- Fix public roster view so members see the full board order (not only their own row).
-- Run in Supabase SQL Editor after migration-v14.sql

create or replace view public.public_profiles
with (security_invoker = false) as
select
  id,
  full_name,
  board_number,
  grade_level,
  bio,
  role,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;
