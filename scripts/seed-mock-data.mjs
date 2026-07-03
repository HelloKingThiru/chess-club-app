/**
 * Seeds mock members, events, and announcements in Supabase.
 *
 * Run from app/:  npm run seed:mock
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Supabase → Settings → API → secret key)
 *
 * Mock logins (all use the same password):
 *   Password: NchsChess2026!
 *   Emails:   *@nchs-chess.mock (see MOCK_MEMBERS below)
 *
 * Safe to re-run — removes prior mock users/posts first.
 */

import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createClient } from "@supabase/supabase-js"

function loadEnvFile() {
  const appDir = join(dirname(fileURLToPath(import.meta.url)), "..")
  const envPath = join(appDir, ".env.local")

  try {
    const contents = readFileSync(envPath, "utf8")
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const eq = trimmed.indexOf("=")
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const value = trimmed.slice(eq + 1).trim()
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch {
    // .env.local is optional if vars are already in the environment
  }
}

loadEnvFile()

const MOCK_DOMAIN = "nchs-chess.mock"
const MOCK_PASSWORD = "NchsChess2026!"
const MOCK_POST_PREFIX = "[MOCK] "

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const missing = []
if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

if (missing.length > 0) {
  console.error(`Missing in app/.env.local: ${missing.join(", ")}`)
  if (missing.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    console.error("")
    console.error("Add your secret key from:")
    console.error("  Supabase Dashboard → Project Settings → API → secret key")
    console.error("")
    console.error("Example line in .env.local:")
    console.error("  SUPABASE_SERVICE_ROLE_KEY=sb_secret_...")
    console.error("")
    console.error("Or run app/supabase/seed-mock-data.sql in the SQL Editor instead.")
  }
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const REQUIRED_TABLES = [
  { name: "profiles", column: "id" },
  { name: "posts", column: "id" },
  { name: "event_attendees", column: "event_id" },
  { name: "event_board_order", column: "event_id" },
  { name: "game_results", column: "id" },
]

function isMissingTableError(error) {
  const msg = error?.message ?? ""
  return (
    msg.includes("schema cache") ||
    error?.code === "PGRST205" ||
    /relation .* does not exist/i.test(msg)
  )
}

async function assertSchema() {
  for (const { name, column } of REQUIRED_TABLES) {
    const { error } = await admin.from(name).select(column).limit(1)
    if (error && isMissingTableError(error)) {
      console.error(`Table public.${name} does not exist yet.`)
      console.error("")
      console.error("Set up the database first in Supabase SQL Editor:")
      console.error("  1. Open app/supabase/setup-schema.sql")
      console.error("  2. Paste and run the full file")
      console.error("  3. Run npm run seed:mock again")
      process.exit(1)
    }
    if (error && error.code !== "PGRST116") {
      throw new Error(`Schema check failed on ${name}: ${error.message}`)
    }
  }
}

const MOCK_MEMBERS = [
  {
    email: `emma.chen@${MOCK_DOMAIN}`,
    full_name: "Emma Chen",
    board_number: 1,
    grade_level: 12,
    phone_number: "555-0101",
    bio: "Team captain. USCF 1450. Specializes in Sicilian Defense.",
  },
  {
    email: `marcus.johnson@${MOCK_DOMAIN}`,
    full_name: "Marcus Johnson",
    board_number: 2,
    grade_level: 11,
    phone_number: "555-0102",
  },
  {
    email: `sofia.patel@${MOCK_DOMAIN}`,
    full_name: "Sofia Patel",
    board_number: 3,
    grade_level: 10,
    phone_number: "555-0103",
  },
  {
    email: `liam.obrien@${MOCK_DOMAIN}`,
    full_name: "Liam O'Brien",
    board_number: 4,
    grade_level: 12,
    phone_number: "555-0104",
  },
  {
    email: `ava.williams@${MOCK_DOMAIN}`,
    full_name: "Ava Williams",
    board_number: 5,
    grade_level: 9,
    phone_number: "555-0105",
  },
  {
    email: `noah.garcia@${MOCK_DOMAIN}`,
    full_name: "Noah Garcia",
    board_number: 6,
    grade_level: 11,
    phone_number: "555-0106",
  },
  {
    email: `mia.thompson@${MOCK_DOMAIN}`,
    full_name: "Mia Thompson",
    board_number: 7,
    grade_level: 10,
    phone_number: "555-0107",
  },
  {
    email: `ethan.kim@${MOCK_DOMAIN}`,
    full_name: "Ethan Kim",
    board_number: 8,
    grade_level: 9,
    phone_number: "555-0108",
  },
  {
    email: `zoe.martinez@${MOCK_DOMAIN}`,
    full_name: "Zoe Martinez",
    board_number: null,
    grade_level: 10,
    phone_number: "555-0109",
  },
  {
    email: `james.wilson@${MOCK_DOMAIN}`,
    full_name: "James Wilson",
    board_number: null,
    grade_level: 11,
    phone_number: "555-0110",
  },
]

function eventDate(daysFromToday, hour = 15, minute = 30) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function nextSaturday(hour = 9) {
  const d = new Date()
  const day = d.getDay()
  const daysUntil = day === 6 ? 7 : (6 - day + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntil)
  d.setHours(hour, 0, 0, 0)
  return d.toISOString()
}

async function getAdminAuthorId() {
  const { data, error } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(`Admin lookup failed: ${error.message}`)
  if (!data?.id) throw new Error("No admin profile found. Create your admin account first.")
  return data.id
}

async function cleanupMockData() {
  const { data: usersData, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })
  if (listError) throw new Error(`List users failed: ${listError.message}`)

  const mockUsers = (usersData?.users ?? []).filter((u) =>
    u.email?.endsWith(`@${MOCK_DOMAIN}`)
  )

  for (const user of mockUsers) {
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) console.warn(`  Could not delete ${user.email}: ${error.message}`)
    else console.log(`  Removed mock user ${user.email}`)
  }

  const { error: postsError } = await admin
    .from("posts")
    .delete()
    .like("title", `${MOCK_POST_PREFIX}%`)

  if (postsError) throw new Error(`Delete mock posts failed: ${postsError.message}`)
}

async function seedMembers() {
  const created = []

  for (const member of MOCK_MEMBERS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: member.email,
      password: MOCK_PASSWORD,
      email_confirm: true,
      user_metadata: {
        full_name: member.full_name,
        role: "regular",
        phone_number: member.phone_number,
        board_number: member.board_number,
      },
    })

    if (error) throw new Error(`Create ${member.email}: ${error.message}`)

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        phone_number: member.phone_number,
        board_number: member.board_number,
        grade_level: member.grade_level,
        bio: member.bio ?? null,
        role: "regular",
        full_name: member.full_name,
      })
      .eq("id", data.user.id)

    if (profileError) throw new Error(`Profile ${member.email}: ${profileError.message}`)

    created.push({ ...member, id: data.user.id })
    console.log(`  Created ${member.full_name}`)
  }

  return created
}

async function seedPosts(authorId, members) {
  const announcements = [
    {
      kind: "mini",
      title: `${MOCK_POST_PREFIX}League dues due this Friday`,
      body: "Bring $15 to Thursday practice or pay via the club treasurer. Receipts go in the folder by the door.",
      mini_kind: "reminder",
      event_date: eventDate(0, 8, 0),
    },
    {
      kind: "mini",
      title: `${MOCK_POST_PREFIX}Practice moved to Room 214`,
      body: "The media center is booked for state testing. We meet in Room 214 after school until further notice.",
      mini_kind: "update",
      event_date: eventDate(-1, 12, 0),
    },
    {
      kind: "mini",
      title: `${MOCK_POST_PREFIX}Welcome new members`,
      body: "Thanks to everyone who came to intro night. Pick up a rules sheet and pair with a board buddy at the next club meet.",
      mini_kind: "update",
      event_date: eventDate(-3, 16, 0),
    },
  ]

  const events = [
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}Weekly club meet`,
      body: "Open boards, tactics warm-up, and blitz at the end. All skill levels welcome.",
      event_type: "club_meet",
      event_date: eventDate(-7),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}Club meet — tactics night`,
      body: "Coach-led puzzle rush and mini tournament. Top 3 boards get first pick for league lineup.",
      event_type: "club_meet",
      event_date: eventDate(0),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}Club meet — endgame study`,
      body: "Rook endings and king activity. Bring your league notebooks.",
      event_type: "club_meet",
      event_date: eventDate(7),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}League match vs. Westview`,
      body: "Varsity travels to Westview High. Bus leaves at 8:15 AM from the front circle. Dress code: club polo.",
      event_type: "league_game",
      event_date: nextSaturday(9),
      location: "Westview High School",
    },
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}County scholastic tournament`,
      body: "Five-round Swiss, G/30. Register by Wednesday. Fee covered by the booster club.",
      event_type: "tournament",
      event_date: eventDate(21, 8, 0),
      location: "NCHS Gymnasium",
    },
    {
      kind: "specific",
      title: `${MOCK_POST_PREFIX}Bake sale fundraiser`,
      body: "Help fund nationals travel. Sign up for a shift at the table during lunch waves.",
      event_type: "fundraiser",
      event_date: eventDate(14, 11, 0),
      location: "Main hallway",
    },
  ]

  const allPosts = [...announcements, ...events]
  const { data, error } = await admin
    .from("posts")
    .insert(
      allPosts.map((p) => ({
        ...p,
        published: true,
        author_id: authorId,
      }))
    )
    .select("id, title, kind, event_type")

  if (error) throw new Error(`Insert posts failed: ${error.message}`)

  return data ?? []
}

async function seedEventExtras(posts, members) {
  const leagueMatch = posts.find(
    (p) => p.kind === "specific" && p.event_type === "league_game"
  )
  const todayMeet = posts.find(
    (p) => p.kind === "specific" && p.title.includes("tactics night")
  )

  if (!leagueMatch || !todayMeet) return

  const topEight = members.filter((m) => m.board_number).slice(0, 8)
  const attendeeIds = members.slice(0, 6).map((m) => m.id)

  const { error: attendeeError } = await admin.from("event_attendees").upsert(
    attendeeIds.flatMap((userId) => [
      { event_id: leagueMatch.id, user_id: userId },
      { event_id: todayMeet.id, user_id: userId },
    ]),
    { onConflict: "event_id,user_id" }
  )
  if (attendeeError) throw new Error(`Attendees failed: ${attendeeError.message}`)

  const { error: boardError } = await admin.from("event_board_order").upsert(
    topEight.map((m) => ({
      event_id: leagueMatch.id,
      user_id: m.id,
      board_number: m.board_number,
    })),
    { onConflict: "event_id,user_id" }
  )
  if (boardError) throw new Error(`Board order failed: ${boardError.message}`)

  const gameResults = [
    {
      player_id: members[0].id,
      opponent: "Westview — Board 1",
      result: "win",
      event_name: "League match",
      played_on: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
      board_number: 1,
    },
    {
      player_id: members[1].id,
      opponent: "Central — Board 2",
      result: "draw",
      event_name: "League match",
      played_on: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
      board_number: 2,
    },
    {
      player_id: members[2].id,
      opponent: "Ridgeview — Board 3",
      result: "loss",
      event_name: "League match",
      played_on: new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10),
      board_number: 3,
    },
  ]

  for (const row of gameResults) {
    await admin.from("game_results").delete().eq("player_id", row.player_id).eq("opponent", row.opponent)
  }

  const { error: resultsError } = await admin.from("game_results").insert(gameResults)
  if (resultsError) throw new Error(`Game results failed: ${resultsError.message}`)
}

async function main() {
  console.log("Checking database schema...")
  await assertSchema()

  console.log("Cleaning up previous mock data...")
  await cleanupMockData()

  console.log("Looking up admin author...")
  const authorId = await getAdminAuthorId()

  console.log("Creating mock members...")
  const members = await seedMembers()

  console.log("Creating mock posts...")
  const posts = await seedPosts(authorId, members)

  console.log("Adding attendees, board order, and game results...")
  await seedEventExtras(posts, members)

  console.log("\nDone!")
  console.log(`  ${members.length} members (@${MOCK_DOMAIN})`)
  console.log(`  ${posts.length} posts (${MOCK_POST_PREFIX} prefix)`)
  console.log(`  Password for all mock accounts: ${MOCK_PASSWORD}`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
