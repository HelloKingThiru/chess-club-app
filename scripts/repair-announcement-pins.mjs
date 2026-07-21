/**
 * Pins published announcements that are missing or expired pinned_until.
 * Safe to re-run — does not delete any data.
 *
 * Run from app/:  npm run repair:pins
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
    // optional if vars are already in the environment
  }
}

function pinUntil(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(23, 59, 0, 0)
  return d.toISOString()
}

loadEnvFile()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  const now = new Date().toISOString()
  const { data: posts, error } = await admin
    .from("posts")
    .select("id, title, pinned_until")
    .eq("kind", "mini")
    .eq("published", true)
    .is("archived_at", null)
    .or(`pinned_until.is.null,pinned_until.lte.${now}`)
    .order("created_at", { ascending: true })

  if (error) {
    if (error.message.includes("pinned_until")) {
      console.error("pinned_until column missing. Run supabase/migration-v9.sql first.")
      process.exit(1)
    }
    throw new Error(error.message)
  }

  if (!posts?.length) {
    console.log("No announcements need pinning.")
    return
  }

  const pinDays = [10, 4, 6, 7, 7, 7]
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i]
    const pinnedUntil = pinUntil(pinDays[i] ?? 7)
    const { error: updateError } = await admin
      .from("posts")
      .update({ pinned_until: pinnedUntil })
      .eq("id", post.id)

    if (updateError) throw new Error(updateError.message)
    console.log(`  Pinned: ${post.title}`)
  }

  console.log(`\nDone. Pinned ${posts.length} announcement(s).`)
}

main().catch((err) => {
  console.error(err.message ?? err)
  process.exit(1)
})
