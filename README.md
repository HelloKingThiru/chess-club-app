# NCHS Chess Club

Next.js app for club announcements, events, board order, chat, and member profiles.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (auth, database, RLS)
- **Tailwind CSS** + shadcn/ui
- **Web push** notifications (optional)
- **Resend** email notifications (announcements + event reminders)

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
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only — seed script, admin client |
| `NEXT_PUBLIC_APP_URL` | Public site URL (set to `https://nchschessclub.com` in production) |
| `RESEND_API_KEY` | Resend API key for email notifications |
| `RESEND_FROM_EMAIL` | Sender, e.g. `NCHS Chess Club <notifications@nchschessclub.com>` |
| `CRON_SECRET` | Random string — secures `/api/cron/event-reminders` (GitHub Actions + Vercel) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push (optional) |
| `VAPID_PRIVATE_KEY` | Web push (optional) |
| `VAPID_SUBJECT` | Web push contact, e.g. `mailto:you@nchschessclub.com` |

### Email notifications

- **New announcement** — emails all members who opted in (default on)
- **3 days before an event** — reminder to members who opted into event emails
- **1 day before an enrolled event** — reminder to members signed up for that event

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
2. If upgrading an existing project, apply incremental migrations (`migration-v6.sql` … `migration-v10.sql`) as needed.
3. Seed demo data: `npm run seed:mock`

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
  scripts/          # Seed & tooling
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run seed:mock` | Reset & seed demo club data |

## Deployment

1. Set `NEXT_PUBLIC_APP_URL=https://nchschessclub.com` (after DNS is pointed).
2. Deploy to Vercel or similar with the env vars above.
3. Add the production URL to Supabase Auth → URL configuration.
