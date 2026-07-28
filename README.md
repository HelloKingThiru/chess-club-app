# NCHS Chess Club

Next.js app for club announcements, events, board order, chat, and member profiles.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (auth, database, RLS)
- **Tailwind CSS** + shadcn/ui
- **Web push** notifications (optional)
- **Resend** email notifications (announcements, events, chat, account lifecycle)

## Automated checks (local)

From the `app/` folder:

```bash
npm run typecheck   # TypeScript — should exit 0
npm run build       # Production build — should complete without errors
npm run lint        # ESLint — may report react-hooks/set-state-in-effect on some UI files; build still passes
```

There are **no automated end-to-end or unit tests** in this repo yet. Use the manual checklist below before go-live.

## Pre-launch verification checklist

Run through these on **production-like** env (`npm run build && npm run start`) with real Supabase + Resend configured.

### Auth & roles

- [ ] Member can log in and log out
- [ ] Wrong password shows a clear error (not a generic crash)
- [ ] Admin can enable **admin mode** and open `/admin`
- [ ] Guest can view public home/board order without login (if `migration-v11` guest access is applied)

### Database

- [ ] `setup-schema.sql` applied on a fresh project, **or** migrations through **v13** on an existing one (v12 = announcement pins, v13 = per-admin chat)
- [ ] Supabase Auth → URL config includes your `NEXT_PUBLIC_APP_URL` and redirect URLs
- [ ] **migration-v14** applied so deleted members still appear on event rosters as “Removed”

### Announcements & events

- [ ] Post announcement (pin modes: duration, schedule, until removed)
- [ ] Post event; appears on home and calendar
- [ ] Member enrolls / unenrolls on event page
- [ ] Admin edits or deletes posts with admin mode on

### Board order

- [ ] Reorder lineup on `/board-order` (admin mode); refresh persists
- [ ] Profile edit does **not** change board number (only board-order page)

### Chat (`migration-v8` + **v13**)

- [ ] Member picks an admin and sends a message
- [ ] That admin sees the thread; other admins do not
- [ ] Member message emails assigned admin (if Resend configured)
- [ ] Admin reply with “email member” toggle sends optional email

### Profiles (admin mode)

- [ ] Admin edits another member: name, email, phone, grade, role
- [ ] Admin deletes test account → user removed + **account deleted** email sent
- [ ] Cannot delete own account from profile page

### Notifications

- [ ] Profile → email toggles save (`migration-v7`)
- [ ] New announcement/event emails (opt-in members)
- [ ] Cron: `GET /api/cron/event-reminders` with `Authorization: Bearer <CRON_SECRET>` returns 200 (GitHub Action or manual curl)

### Optional

- [ ] Browser push subscribe on profile (VAPID keys set)
- [ ] Change password flow for logged-in user

### Known limitations

- **School or restrictive networks** may block or timeout Supabase; login failures are often network, not bad passwords.
- **Email** is skipped silently if `RESEND_API_KEY` / `RESEND_FROM_EMAIL` are missing.
- **Create/delete user and chat admin emails** need `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` locally and the same name in **Vercel → Environment Variables** for production (then deploy a new build).
- **Chat live updates** need Realtime enabled for `chat_messages` in Supabase (see `migration-v8.sql`).
- No guard preventing deletion of the **last** admin account—avoid removing all admins.

## Getting started

```bash
cd app
npm install
cp .env.example .env.local
# Fill in Supabase keys, then:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — admin client |
| `NEXT_PUBLIC_APP_URL` | Public site URL (set to `https://nchschessclub.com` in production) |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `RESEND_FROM_EMAIL` | Sender, e.g. `NCHS Chess Club <notifications@nchschessclub.com>` |
| `CRON_SECRET` | Random string — secures `/api/cron/event-reminders` (GitHub Actions + Vercel) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push (optional) |
| `VAPID_PRIVATE_KEY` | Web push (optional) |
| `VAPID_SUBJECT` | Web push contact, e.g. `mailto:you@nchschessclub.com` |

### Email notifications

- **New announcement** — emails members who opted in (default on)
- **New event** — email when an event is posted
- **3 days / 1 day before events** — cron reminders (event + enrollment preferences)
- **Chat** — admin emailed when a member messages them; optional email when admin notifies member
- **Account deleted** — email to the removed member’s address

Reminders run daily at **9:00 AM US Central** via **GitHub Actions** (free). See [`.github/workflows/event-reminders.yml`](.github/workflows/event-reminders.yml).

Other free cron options: [cron-job.org](https://cron-job.org) or [Uptime Robot](https://uptimerobot.com) — ping `GET /api/cron/event-reminders` with header `Authorization: Bearer <CRON_SECRET>`.

### GitHub Actions cron setup

1. Push the repo (includes `.github/workflows/event-reminders.yml`).
2. GitHub → **Settings → Secrets and variables → Actions → New repository secret**
3. Add `CRON_SECRET` with the same value as in Vercel env vars.
4. Optionally add `APP_URL` = `https://www.nchschessclub.com`.
5. Test manually: **Actions → Event email reminders → Run workflow**.

## Database

1. Run [`supabase/setup-schema.sql`](supabase/setup-schema.sql) in the Supabase SQL editor.
2. If upgrading an existing project, apply incremental migrations (`migration-v6.sql` … `migration-v14.sql`) in order as needed.
3. To wipe demo data and remove all accounts except yours, run [`supabase/cleanup-mock-data.sql`](supabase/cleanup-mock-data.sql) once in the SQL editor.
4. Create member accounts from **Admin → Members**.

## Project layout

```
app/
  app/              # Routes, layouts, server actions
  components/
    admin/          # Admin dashboard sections
    events/         # Calendar, event cards, enrollment
    members/        # Member management dialogs
    posts/          # Announcements & event post dialogs
    chat/           # Messaging UI
    ui/             # shadcn primitives
  hooks/            # Client hooks
  lib/              # Auth, Supabase, helpers, types
  supabase/         # SQL schema & migrations
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |

## Deployment

1. Set `NEXT_PUBLIC_APP_URL=https://nchschessclub.com` (after DNS is pointed).
2. Deploy to Vercel or similar with the env vars above.
3. Add the production URL to Supabase Auth → URL configuration.
