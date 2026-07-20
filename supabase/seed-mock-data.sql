-- Demo club data for NCHS Chess Club.
-- Prefer: npm run seed:mock  (from app/)
-- Or run this in Supabase SQL Editor (requires pgcrypto).

create extension if not exists pgcrypto;

delete from public.game_results
where player_id in (
  select id from public.profiles where email like '%@nchs-chess.mock'
);

delete from public.event_board_order;
delete from public.event_attendees;
delete from public.posts where title like '[MOCK] %' or author_id is not null;
delete from public.posts;
delete from auth.users where email like '%@nchs-chess.mock';

create or replace function public._seed_mock_user(
  p_id uuid,
  p_email text,
  p_full_name text,
  p_board integer,
  p_grade integer,
  p_phone text,
  p_bio text default null
) returns uuid
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    p_id,
    'authenticated',
    'authenticated',
    p_email,
    crypt('NchsChess2026!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object(
      'full_name', p_full_name,
      'role', 'regular',
      'phone_number', p_phone,
      'board_number', p_board
    ),
    now(),
    now(),
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    p_id,
    p_id,
    jsonb_build_object('sub', p_id::text, 'email', p_email),
    'email',
    p_id::text,
    now(),
    now(),
    now()
  );

  update public.profiles
  set
    full_name = p_full_name,
    phone_number = p_phone,
    board_number = p_board,
    grade_level = p_grade,
    bio = p_bio,
    role = 'regular'
  where id = p_id;

  return p_id;
end;
$$;

do $$
declare
  admin_id uuid;
  u_priya uuid := 'b2000001-0000-4000-8000-000000000001';
  u_daniel uuid := 'b2000002-0000-4000-8000-000000000002';
  u_hannah uuid := 'b2000003-0000-4000-8000-000000000003';
  u_tyler uuid := 'b2000004-0000-4000-8000-000000000004';
  u_olivia uuid := 'b2000005-0000-4000-8000-000000000005';
  u_caleb uuid := 'b2000006-0000-4000-8000-000000000006';
  u_nina uuid := 'b2000007-0000-4000-8000-000000000007';
  u_jordan uuid := 'b2000008-0000-4000-8000-000000000008';
  u_aisha uuid := 'b2000009-0000-4000-8000-000000000009';
  u_chris uuid := 'b200000a-0000-4000-8000-00000000000a';
  ev_practice uuid;
  ev_league uuid;
  ev_county uuid;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if admin_id is null then
    raise exception 'No admin profile found. Create your admin account first.';
  end if;

  perform public._seed_mock_user(u_priya, 'priya.sharma@nchs-chess.mock', 'Priya Sharma', 1, 12, '847-555-0142', 'Varsity captain. USCF 1520.');
  perform public._seed_mock_user(u_daniel, 'daniel.reyes@nchs-chess.mock', 'Daniel Reyes', 2, 11, '847-555-0188');
  perform public._seed_mock_user(u_hannah, 'hannah.park@nchs-chess.mock', 'Hannah Park', 3, 12, '847-555-0201');
  perform public._seed_mock_user(u_tyler, 'tyler.brooks@nchs-chess.mock', 'Tyler Brooks', 4, 10, '847-555-0234');
  perform public._seed_mock_user(u_olivia, 'olivia.nguyen@nchs-chess.mock', 'Olivia Nguyen', 5, 11, '847-555-0267');
  perform public._seed_mock_user(u_caleb, 'caleb.morrison@nchs-chess.mock', 'Caleb Morrison', 6, 9, '847-555-0290');
  perform public._seed_mock_user(u_nina, 'nina.kowalski@nchs-chess.mock', 'Nina Kowalski', 7, 10, '847-555-0315');
  perform public._seed_mock_user(u_jordan, 'jordan.lee@nchs-chess.mock', 'Jordan Lee', 8, 12, '847-555-0348');
  perform public._seed_mock_user(u_aisha, 'aisha.rahman@nchs-chess.mock', 'Aisha Rahman', null, 9, '847-555-0371');
  perform public._seed_mock_user(u_chris, 'chris.delgado@nchs-chess.mock', 'Chris Delgado', null, 11, '847-555-0394');

  insert into public.posts (title, body, kind, mini_kind, event_type, event_date, location, published, pinned_until, author_id)
  values
    ('Varsity lineup for Saturday is posted', 'Check the event page for board assignments vs. East Ridge.', 'mini', 'update', null, now(), null, true, now() + interval '10 days', admin_id),
    ('Tuesday practice — Library B', 'Meet in Library B after 8th period this week.', 'mini', 'reminder', null, now(), null, true, now() + interval '4 days', admin_id),
    ('County Open registration closes Wednesday', 'Tell Coach by Wednesday if you plan to play.', 'mini', 'reminder', null, now() - interval '1 day', null, true, now() + interval '6 days', admin_id),
    ('Tuesday club practice', 'Tactics warm-up and G/45 skittles.', 'specific', null, 'club_meet', now() + interval '1 day 15 hours 30 minutes', 'Library B', true, null, admin_id),
    ('Blitz & ladder night', 'Five rounds of 3+2 blitz.', 'specific', null, 'club_meet', now() + interval '4 days 15 hours 45 minutes', 'Room 214', true, null, admin_id),
    ('League match @ East Ridge', 'Varsity and JV travel. Bus leaves 7:45 AM.', 'specific', null, 'league_game', date_trunc('week', now()) + interval '6 days 8 hours 30 minutes', 'East Ridge High School', true, null, admin_id),
    ('Opening workshop — Italian Game', 'Main lines for white and practical responses for black.', 'specific', null, 'club_meet', now() + interval '11 days 15 hours 30 minutes', 'Room 214', true, null, admin_id),
    ('JV home match vs. Lakeside', 'Home match in the library. Arrive by 3:15.', 'specific', null, 'league_game', now() + interval '14 days 16 hours', 'NCHS Library', true, null, admin_id),
    ('Lake County Scholastic Open', 'Five-round Swiss, G/45 d5.', 'specific', null, 'tournament', now() + interval '18 days 8 hours', 'NCHS Gymnasium', true, null, admin_id),
    ('Travel fund bake sale', 'Sign up for a lunch shift.', 'specific', null, 'fundraiser', now() + interval '9 days 11 hours', 'Main hallway', true, null, admin_id),
    ('Endgame clinic — rook endings', 'Lucena, Philidor, and conversion practice.', 'specific', null, 'club_meet', now() + interval '21 days 15 hours 30 minutes', 'Room 214', true, null, admin_id);

  select id into ev_practice from public.posts where title = 'Tuesday club practice' limit 1;
  select id into ev_league from public.posts where title = 'League match @ East Ridge' limit 1;
  select id into ev_county from public.posts where title = 'Lake County Scholastic Open' limit 1;

  insert into public.event_attendees (event_id, user_id)
  select ev_league, u from (values (u_priya), (u_daniel), (u_hannah), (u_tyler), (u_olivia), (u_caleb), (u_nina)) as t(u)
  on conflict do nothing;

  insert into public.event_attendees (event_id, user_id)
  select ev_practice, u from (values (u_priya), (u_daniel), (u_hannah), (u_tyler), (u_olivia)) as t(u)
  on conflict do nothing;

  insert into public.event_attendees (event_id, user_id)
  select ev_county, u from (values (u_priya), (u_daniel), (u_hannah), (u_tyler), (u_olivia), (u_caleb)) as t(u)
  on conflict do nothing;

  insert into public.event_board_order (event_id, user_id, board_number)
  values
    (ev_league, u_priya, 1),
    (ev_league, u_daniel, 2),
    (ev_league, u_hannah, 3),
    (ev_league, u_tyler, 4),
    (ev_league, u_olivia, 5),
    (ev_league, u_caleb, 6),
    (ev_league, u_nina, 7),
    (ev_league, u_jordan, 8)
  on conflict do nothing;

  insert into public.game_results (player_id, opponent, result, event_name, played_on, board_number)
  values
    (u_priya, 'Glenbrook North — Board 1', 'win', 'League match', current_date - 10, 1),
    (u_daniel, 'Glenbrook North — Board 2', 'draw', 'League match', current_date - 10, 2),
    (u_hannah, 'Maine South — Board 3', 'win', 'League match', current_date - 17, 3),
    (u_tyler, 'Maine South — Board 4', 'loss', 'League match', current_date - 17, 4),
    (u_olivia, 'New Trier — Board 5', 'win', 'League match', current_date - 24, 5);
end;
$$;

drop function if exists public._seed_mock_user(uuid, text, text, integer, integer, text, text);
