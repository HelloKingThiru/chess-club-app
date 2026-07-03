-- Mock data for NCHS Chess Club (calendar, board order, announcements).
-- Prefer: node --env-file=.env.local scripts/seed-mock-data.mjs
-- Or run this in Supabase SQL Editor (requires pgcrypto; creates auth users).
--
-- Mock password for all *@nchs-chess.mock accounts: NchsChess2026!

create extension if not exists pgcrypto;

-- ── Cleanup (safe to re-run) ────────────────────────────────────────────────

delete from public.game_results
where player_id in (
  select id from public.profiles where email like '%@nchs-chess.mock'
);

delete from public.posts where title like '[MOCK] %';

delete from auth.users where email like '%@nchs-chess.mock';

-- ── Helper: create one auth user + profile extras ───────────────────────────

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

-- Fixed UUIDs for stable references
do $$
declare
  admin_id uuid;
  u_emma uuid := 'a1000001-0000-4000-8000-000000000001';
  u_marcus uuid := 'a1000002-0000-4000-8000-000000000002';
  u_sofia uuid := 'a1000003-0000-4000-8000-000000000003';
  u_liam uuid := 'a1000004-0000-4000-8000-000000000004';
  u_ava uuid := 'a1000005-0000-4000-8000-000000000005';
  u_noah uuid := 'a1000006-0000-4000-8000-000000000006';
  u_mia uuid := 'a1000007-0000-4000-8000-000000000007';
  u_ethan uuid := 'a1000008-0000-4000-8000-000000000008';
  ev_today uuid;
  ev_league uuid;
begin
  select id into admin_id
  from public.profiles
  where role = 'admin'
  order by created_at
  limit 1;

  if admin_id is null then
    raise exception 'No admin profile found. Create your admin account first.';
  end if;

  perform public._seed_mock_user(u_emma, 'emma.chen@nchs-chess.mock', 'Emma Chen', 1, 12, '555-0101', 'Team captain. USCF 1450.');
  perform public._seed_mock_user(u_marcus, 'marcus.johnson@nchs-chess.mock', 'Marcus Johnson', 2, 11, '555-0102');
  perform public._seed_mock_user(u_sofia, 'sofia.patel@nchs-chess.mock', 'Sofia Patel', 3, 10, '555-0103');
  perform public._seed_mock_user(u_liam, 'liam.obrien@nchs-chess.mock', 'Liam O''Brien', 4, 12, '555-0104');
  perform public._seed_mock_user(u_ava, 'ava.williams@nchs-chess.mock', 'Ava Williams', 5, 9, '555-0105');
  perform public._seed_mock_user(u_noah, 'noah.garcia@nchs-chess.mock', 'Noah Garcia', 6, 11, '555-0106');
  perform public._seed_mock_user(u_mia, 'mia.thompson@nchs-chess.mock', 'Mia Thompson', 7, 10, '555-0107');
  perform public._seed_mock_user(u_ethan, 'ethan.kim@nchs-chess.mock', 'Ethan Kim', 8, 9, '555-0108');
  perform public._seed_mock_user('a1000009-0000-4000-8000-000000000009'::uuid, 'zoe.martinez@nchs-chess.mock', 'Zoe Martinez', null, 10, '555-0109');
  perform public._seed_mock_user('a100000a-0000-4000-8000-00000000000a'::uuid, 'james.wilson@nchs-chess.mock', 'James Wilson', null, 11, '555-0110');

  insert into public.posts (title, body, kind, mini_kind, event_type, event_date, location, published, author_id)
  values
    ('[MOCK] League dues due this Friday', 'Bring $15 to Thursday practice.', 'mini', 'reminder', null, date_trunc('day', now()) + interval '8 hours', null, true, admin_id),
    ('[MOCK] Practice moved to Room 214', 'Media center is booked for testing.', 'mini', 'update', null, now() - interval '1 day', null, true, admin_id),
    ('[MOCK] Welcome new members', 'Intro night recap and next steps.', 'mini', 'update', null, now() - interval '3 days', null, true, admin_id),
    ('[MOCK] Weekly club meet', 'Open boards and blitz.', 'specific', null, 'club_meet', now() - interval '7 days', 'Room 214', true, admin_id),
    ('[MOCK] Club meet — tactics night', 'Puzzle rush and mini tournament.', 'specific', null, 'club_meet', date_trunc('day', now()) + interval '15 hours 30 minutes', 'Room 214', true, admin_id),
    ('[MOCK] Club meet — endgame study', 'Rook endings focus.', 'specific', null, 'club_meet', now() + interval '7 days', 'Room 214', true, admin_id),
    ('[MOCK] League match vs. Westview', 'Bus leaves 8:15 AM.', 'specific', null, 'league_game', date_trunc('week', now()) + interval '6 days 9 hours', 'Westview High School', true, admin_id),
    ('[MOCK] County scholastic tournament', 'Five-round Swiss, G/30.', 'specific', null, 'tournament', now() + interval '21 days', 'NCHS Gymnasium', true, admin_id),
    ('[MOCK] Bake sale fundraiser', 'Sign up for a lunch shift.', 'specific', null, 'fundraiser', now() + interval '14 days', 'Main hallway', true, admin_id);

  select id into ev_today from public.posts where title = '[MOCK] Club meet — tactics night' limit 1;
  select id into ev_league from public.posts where title = '[MOCK] League match vs. Westview' limit 1;

  insert into public.event_attendees (event_id, user_id)
  select ev_league, u from (values (u_emma), (u_marcus), (u_sofia), (u_liam), (u_ava), (u_noah)) as t(u)
  on conflict do nothing;

  insert into public.event_attendees (event_id, user_id)
  select ev_today, u from (values (u_emma), (u_marcus), (u_sofia), (u_liam), (u_ava), (u_noah)) as t(u)
  on conflict do nothing;

  insert into public.event_board_order (event_id, user_id, board_number)
  values
    (ev_league, u_emma, 1),
    (ev_league, u_marcus, 2),
    (ev_league, u_sofia, 3),
    (ev_league, u_liam, 4),
    (ev_league, u_ava, 5),
    (ev_league, u_noah, 6),
    (ev_league, u_mia, 7),
    (ev_league, u_ethan, 8)
  on conflict do nothing;

  insert into public.game_results (player_id, opponent, result, event_name, played_on, board_number)
  values
    (u_emma, 'Westview — Board 1', 'win', 'League match', current_date - 14, 1),
    (u_marcus, 'Central — Board 2', 'draw', 'League match', current_date - 14, 2),
    (u_sofia, 'Ridgeview — Board 3', 'loss', 'League match', current_date - 21, 3);
end;
$$;

drop function if exists public._seed_mock_user(uuid, text, text, integer, integer, text, text);
