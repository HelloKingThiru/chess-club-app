-- One-time cleanup: wipe demo data and remove every account except yours.
-- Run in Supabase SQL Editor before adding real members.
--
-- Removes:
--   - All posts (announcements + events)
--   - Event attendees, board order, game results, reminder log
--   - Chat threads/messages
--   - Every auth user except king.thirukkumaran@gmail.com
--
-- Keeps: king.thirukkumaran@gmail.com (and that profile row).

delete from public.event_notification_log;
delete from public.game_results;
delete from public.event_board_order;
delete from public.event_attendees;
delete from public.posts;

delete from public.chat_messages;
delete from public.chat_threads;

delete from auth.users
where lower(email) <> lower('king.thirukkumaran@gmail.com');

-- Clear club board order on remaining profiles.
update public.profiles
set board_number = null
where board_number is not null;
