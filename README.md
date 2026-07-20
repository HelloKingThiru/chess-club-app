# NCHS Chess Club

Next.js app for club announcements, events, board order, chat, and member profiles.

## Stack

- **Next.js 16** (App Router)
- **Supabase** (auth, database, RLS)
- **Tailwind CSS** + shadcn/ui
- **Web push** notifications (optional)

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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push (optional) |
| `VAPID_PRIVATE_KEY` | Web push (optional) |
| `VAPID_SUBJECT` | Web push contact, e.g. `mailto:you@nchschessclub.com` |

Email notifications (Resend) are not wired up yet — only push is active when VAPID keys are set.

## Database

1. Run [`supabase/setup-schema.sql`](supabase/setup-schema.sql) in the Supabase SQL editor.
2. If upgrading an existing project, apply incremental migrations (`migration-v6.sql` … `migration-v9.sql`) as needed.
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
