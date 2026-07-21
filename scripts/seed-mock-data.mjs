/**
 * Seeds demo club data in Supabase.
 *
 * Run from app/:  npm run seed:mock
 *
 * Requires in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe to re-run — clears prior seeded users (@nchs-chess.mock) and all posts first.
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const missing = []
if (!url) missing.push("NEXT_PUBLIC_SUPABASE_URL")
if (!serviceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY")

if (missing.length > 0) {
  console.error(`Missing in app/.env.local: ${missing.join(", ")}`)
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
      console.error("Run app/supabase/setup-schema.sql in Supabase SQL Editor first.")
      process.exit(1)
    }
    if (error && error.code !== "PGRST116") {
      throw new Error(`Schema check failed on ${name}: ${error.message}`)
    }
  }
}

const MOCK_MEMBERS = [
  {
    email: `priya.sharma@${MOCK_DOMAIN}`,
    full_name: "Priya Sharma",
    board_number: 1,
    grade_level: 12,
    phone_number: "847-555-0142",
    bio: "Varsity captain. USCF 1520. State qualifier last year.",
  },
  {
    email: `daniel.reyes@${MOCK_DOMAIN}`,
    full_name: "Daniel Reyes",
    board_number: 2,
    grade_level: 11,
    phone_number: "847-555-0188",
    bio: "Aggressive e4 player. Helps run Tuesday tactics.",
  },
  {
    email: `hannah.park@${MOCK_DOMAIN}`,
    full_name: "Hannah Park",
    board_number: 3,
    grade_level: 12,
    phone_number: "847-555-0201",
  },
  {
    email: `tyler.brooks@${MOCK_DOMAIN}`,
    full_name: "Tyler Brooks",
    board_number: 4,
    grade_level: 10,
    phone_number: "847-555-0234",
  },
  {
    email: `olivia.nguyen@${MOCK_DOMAIN}`,
    full_name: "Olivia Nguyen",
    board_number: 5,
    grade_level: 11,
    phone_number: "847-555-0267",
  },
  {
    email: `caleb.morrison@${MOCK_DOMAIN}`,
    full_name: "Caleb Morrison",
    board_number: 6,
    grade_level: 9,
    phone_number: "847-555-0290",
  },
  {
    email: `nina.kowalski@${MOCK_DOMAIN}`,
    full_name: "Nina Kowalski",
    board_number: 7,
    grade_level: 10,
    phone_number: "847-555-0315",
  },
  {
    email: `jordan.lee@${MOCK_DOMAIN}`,
    full_name: "Jordan Lee",
    board_number: 8,
    grade_level: 12,
    phone_number: "847-555-0348",
  },
  {
    email: `aisha.rahman@${MOCK_DOMAIN}`,
    full_name: "Aisha Rahman",
    board_number: null,
    grade_level: 9,
    phone_number: "847-555-0371",
    bio: "Joined this spring — working toward a board spot.",
  },
  {
    email: `chris.delgado@${MOCK_DOMAIN}`,
    full_name: "Chris Delgado",
    board_number: null,
    grade_level: 11,
    phone_number: "847-555-0394",
  },
]

function eventDate(daysFromToday, hour = 15, minute = 30) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function pinUntil(daysFromNow, hour = 23, minute = 59) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function nextSaturday(hour = 8, minute = 30) {
  const d = new Date()
  const day = d.getDay()
  let daysUntil = (6 - day + 7) % 7
  if (daysUntil === 0) daysUntil = 7
  d.setDate(d.getDate() + daysUntil)
  d.setHours(hour, minute, 0, 0)
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
  const { data: mockProfiles } = await admin
    .from("profiles")
    .select("id")
    .like("email", `%@${MOCK_DOMAIN}`)

  const mockIds = (mockProfiles ?? []).map((p) => p.id)

  if (mockIds.length > 0) {
    await admin.from("game_results").delete().in("player_id", mockIds)
  }

  await admin.from("event_board_order").delete().neq("event_id", "00000000-0000-0000-0000-000000000000")
  await admin.from("event_attendees").delete().neq("event_id", "00000000-0000-0000-0000-000000000000")
  await admin.from("posts").delete().neq("id", "00000000-0000-0000-0000-000000000000")

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
    else console.log(`  Removed ${user.email}`)
  }

  const { data: legacyPosts } = await admin
    .from("posts")
    .select("id")
    .like("title", "[MOCK] %")

  if (legacyPosts?.length) {
    await admin.from("posts").delete().like("title", "[MOCK] %")
  }
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
    console.log(`  ${member.full_name}`)
  }

  return created
}

async function seedPosts(authorId) {
  const announcements = [
    {
      kind: "mini",
      title: "Varsity lineup for Saturday is posted",
      body: "Check the event page for board assignments vs. East Ridge. Bus leaves from Door 4 at 7:45 AM sharp. Wear your club polo.",
      mini_kind: "update",
      event_date: eventDate(0, 9, 0),
      pinned_until: pinUntil(10),
    },
    {
      kind: "mini",
      title: "Tuesday practice — Library B",
      body: "The media center is closed for AP testing this week. Meet in Library B right after 8th period. Bring your notation book.",
      mini_kind: "reminder",
      event_date: eventDate(0, 8, 15),
      pinned_until: pinUntil(4),
    },
    {
      kind: "mini",
      title: "County Open registration closes Wednesday",
      body: "If you plan to play on July 26, tell Coach by Wednesday so we can submit the team entry. Fee is covered for varsity boards 1–6.",
      mini_kind: "reminder",
      event_date: eventDate(-1, 14, 0),
      pinned_until: pinUntil(6),
    },
  ]

  const events = [
    {
      kind: "specific",
      title: "League match vs. Glenbrook North",
      body: "Home match. Varsity won 6.5–1.5. Strong showing on boards 1–4.",
      event_type: "league_game",
      event_date: eventDate(-10, 16, 0),
      location: "NCHS Library",
    },
    {
      kind: "specific",
      title: "Thursday practice — notation review",
      body: "Algebraic notation drills and reviewing last week's league games.",
      event_type: "club_meet",
      event_date: eventDate(-5, 15, 30),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: "Scrimmage vs. Maine South",
      body: "Unrated friendly match to prep for the East Ridge league date.",
      event_type: "league_game",
      event_date: eventDate(-3, 15, 45),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: "Tuesday club practice",
      body: "Tactics warm-up, 20 minutes of league-style G/45 skittles, then blitz if time allows. All members welcome.",
      event_type: "club_meet",
      event_date: eventDate(1, 15, 30),
      location: "Library B",
    },
    {
      kind: "specific",
      title: "Blitz & ladder night",
      body: "Five rounds of 3+2 blitz. Ladder points count toward next week's varsity consideration.",
      event_type: "club_meet",
      event_date: eventDate(4, 15, 45),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: "League match @ East Ridge",
      body: "Varsity and JV travel to East Ridge High. Bus returns around 4:30 PM. Pack water and a snack.",
      event_type: "league_game",
      event_date: nextSaturday(8, 30),
      location: "East Ridge High School",
    },
    {
      kind: "specific",
      title: "Opening workshop — Italian Game",
      body: "Coach walks through main lines for white and practical responses for black. Bring a board if you have one.",
      event_type: "club_meet",
      event_date: eventDate(11, 15, 30),
      location: "Room 214",
    },
    {
      kind: "specific",
      title: "JV home match vs. Lakeside",
      body: "Home match in the library. JV players arrive by 3:15 to set clocks. Parents welcome to watch from the back.",
      event_type: "league_game",
      event_date: eventDate(14, 16, 0),
      location: "NCHS Library",
    },
    {
      kind: "specific",
      title: "Lake County Scholastic Open",
      body: "Five-round Swiss, G/45 d5. Team bus leaves at 7:00 AM. Return expected by 6:00 PM.",
      event_type: "tournament",
      event_date: eventDate(18, 8, 0),
      location: "NCHS Gymnasium",
    },
    {
      kind: "specific",
      title: "Travel fund bake sale",
      body: "Sign up for a 30-minute shift at the table during lunch waves. All proceeds go toward state finals travel.",
      event_type: "fundraiser",
      event_date: eventDate(9, 11, 0),
      location: "Main hallway",
    },
    {
      kind: "specific",
      title: "Endgame clinic — rook endings",
      body: "Lucena, Philidor, and practical conversion practice. Recommended for anyone on boards 4–8.",
      event_type: "club_meet",
      event_date: eventDate(21, 15, 30),
      location: "Room 214",
    },
  ]

  const allPosts = [...announcements, ...events]
  const rows = allPosts.map((p) => ({
    ...p,
    published: true,
    author_id: authorId,
  }))

  let { data, error } = await admin.from("posts").insert(rows).select("id, title, kind, event_type")

  if (error?.message?.includes("pinned_until")) {
    const withoutPins = rows.map(({ pinned_until: _pin, ...rest }) => rest)
    const retry = await admin
      .from("posts")
      .insert(withoutPins)
      .select("id, title, kind, event_type")
    data = retry.data
    error = retry.error
  }

  if (error) throw new Error(`Insert posts failed: ${error.message}`)

  const inserted = data ?? []
  await applyPinnedUntilIfSupported(
    inserted.filter((p) => p.kind === "mini"),
    announcements.map((a) => a.pinned_until)
  )

  return inserted
}

async function applyPinnedUntilIfSupported(miniPosts, pinnedUntilValues = []) {
  if (miniPosts.length === 0) return

  const pinDays = [10, 4, 6]
  for (let i = 0; i < miniPosts.length; i++) {
    const pinnedUntil =
      pinnedUntilValues[i] ?? pinUntil(pinDays[i] ?? 7)
    const { error } = await admin
      .from("posts")
      .update({ pinned_until: pinnedUntil })
      .eq("id", miniPosts[i].id)

    if (error?.message?.includes("pinned_until")) {
      console.warn(
        "  pinned_until column missing — run supabase/migration-v9.sql, then npm run repair:pins"
      )
      return
    }
    if (error) throw new Error(`Pin announcements failed: ${error.message}`)
  }
}

async function seedEventExtras(posts, members) {
  const leagueMatch = posts.find(
    (p) => p.kind === "specific" && p.title === "League match @ East Ridge"
  )
  const tuesdayPractice = posts.find(
    (p) => p.kind === "specific" && p.title === "Tuesday club practice"
  )
  const countyOpen = posts.find(
    (p) => p.kind === "specific" && p.title === "Lake County Scholastic Open"
  )
  const pastLeague = posts.find(
    (p) => p.kind === "specific" && p.title === "League match vs. Glenbrook North"
  )
  const blitzNight = posts.find(
    (p) => p.kind === "specific" && p.title === "Blitz & ladder night"
  )

  if (!leagueMatch || !tuesdayPractice) return

  const topEight = members.filter((m) => m.board_number).slice(0, 8)
  const leagueAttendees = members.slice(0, 7).map((m) => m.id)
  const practiceAttendees = members.slice(0, 5).map((m) => m.id)
  const tournamentAttendees = members.slice(0, 6).map((m) => m.id)
  const blitzAttendees = members.slice(2, 9).map((m) => m.id)
  const pastLeagueAttendees = members.slice(0, 8).map((m) => m.id)

  const attendeeRows = [
    ...leagueAttendees.map((userId) => ({
      event_id: leagueMatch.id,
      user_id: userId,
    })),
    ...practiceAttendees.map((userId) => ({
      event_id: tuesdayPractice.id,
      user_id: userId,
    })),
  ]

  if (countyOpen) {
    for (const userId of tournamentAttendees) {
      attendeeRows.push({ event_id: countyOpen.id, user_id: userId })
    }
  }

  if (blitzNight) {
    for (const userId of blitzAttendees) {
      attendeeRows.push({ event_id: blitzNight.id, user_id: userId })
    }
  }

  if (pastLeague) {
    for (const userId of pastLeagueAttendees) {
      attendeeRows.push({ event_id: pastLeague.id, user_id: userId })
    }
  }

  const { error: attendeeError } = await admin
    .from("event_attendees")
    .upsert(attendeeRows, { onConflict: "event_id,user_id" })
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
      opponent: "Glenbrook North — Board 1",
      result: "win",
      event_name: "League match",
      played_on: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
      board_number: 1,
    },
    {
      player_id: members[1].id,
      opponent: "Glenbrook North — Board 2",
      result: "draw",
      event_name: "League match",
      played_on: new Date(Date.now() - 10 * 86400000).toISOString().slice(0, 10),
      board_number: 2,
    },
    {
      player_id: members[2].id,
      opponent: "Maine South — Board 3",
      result: "win",
      event_name: "League match",
      played_on: new Date(Date.now() - 17 * 86400000).toISOString().slice(0, 10),
      board_number: 3,
    },
    {
      player_id: members[3].id,
      opponent: "Maine South — Board 4",
      result: "loss",
      event_name: "League match",
      played_on: new Date(Date.now() - 17 * 86400000).toISOString().slice(0, 10),
      board_number: 4,
    },
    {
      player_id: members[4].id,
      opponent: "New Trier — Board 5",
      result: "win",
      event_name: "League match",
      played_on: new Date(Date.now() - 24 * 86400000).toISOString().slice(0, 10),
      board_number: 5,
    },
  ]

  const { error: resultsError } = await admin.from("game_results").insert(gameResults)
  if (resultsError) throw new Error(`Game results failed: ${resultsError.message}`)
}

async function main() {
  console.log("Checking database schema...")
  await assertSchema()

  console.log("Clearing old data...")
  await cleanupMockData()

  console.log("Looking up admin author...")
  const authorId = await getAdminAuthorId()

  console.log("Creating members...")
  const members = await seedMembers()

  console.log("Creating posts...")
  const posts = await seedPosts(authorId)

  console.log("Adding enrollments and results...")
  await seedEventExtras(posts, members)

  console.log("\nDone.")
  console.log(`  ${members.length} members`)
  console.log(`  ${posts.length} posts`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
