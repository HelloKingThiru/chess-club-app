-- One-time cleanup: remove seeded demo data from Supabase.
-- Run in Supabase SQL Editor before adding real members.
--
-- Removes:
--   - All posts (announcements + events)
--   - Event attendees, board order, game results, reminder log
--   - Chat threads/messages
--   - Mock users (@nchs-chess.mock)
--
-- Keeps: your real admin account(s) and any other non-mock users.

delete from public.event_notification_log;
delete from public.game_results;
delete from public.event_board_order;
delete from public.event_attendees;
delete from public.posts;

delete from public.chat_messages;
delete from public.chat_threads;

delete from auth.users
where email like '%@nchs-chess.mock';

-- Clear club board order on remaining profiles (from seeded lineup).
update public.profiles
set board_number = null
where board_number is not null;
