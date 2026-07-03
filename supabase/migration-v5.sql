-- Admin/coach profile bio shown on their profile page.

alter table public.profiles add column if not exists bio text;
