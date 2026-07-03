-- Run in Supabase SQL Editor after prior migrations.

alter table public.profiles add column if not exists grade_level integer;

alter table public.profiles drop constraint if exists profiles_grade_level_check;

alter table public.profiles
  add constraint profiles_grade_level_check
  check (grade_level is null or grade_level between 9 and 12);
