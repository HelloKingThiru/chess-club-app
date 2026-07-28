import { readFileSync } from "node:fs"
import { join } from "node:path"

import { createClient } from "@supabase/supabase-js"
import "server-only"

import { supabaseFetch } from "@/lib/supabase/fetch"

/** Built at runtime so build cannot bake in `undefined` when secrets are build-time hidden on Vercel. */
const SERVICE_ROLE_ENV = ["SUPABASE", "SERVICE", "ROLE", "KEY"].join("_")

function normalizeEnvValue(value: string): string {
  let v = value.trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim()
  }
  return v
}

function serviceRoleKeyFromProcess(): string | undefined {
  const raw = process.env[SERVICE_ROLE_ENV]
  if (!raw) return undefined
  const normalized = normalizeEnvValue(raw)
  return normalized || undefined
}

function serviceRoleKeyFromEnvLocalFile(): string | undefined {
  try {
    const text = readFileSync(join(process.cwd(), ".env.local"), "utf8")
    for (const line of text.split(/\r?\n/)) {
      if (!line.startsWith(`${SERVICE_ROLE_ENV}=`)) continue
      const value = line.slice(`${SERVICE_ROLE_ENV}=`.length)
      const normalized = normalizeEnvValue(value)
      return normalized || undefined
    }
  } catch {
    // .env.local missing on Vercel
  }
  return undefined
}

function getServiceRoleKey(): string | undefined {
  const fromProcess = serviceRoleKeyFromProcess()
  if (fromProcess) return fromProcess

  if (process.env.NODE_ENV === "development") {
    const fromFile = serviceRoleKeyFromEnvLocalFile()
    if (fromFile) {
      process.env[SERVICE_ROLE_ENV] = fromFile
      return fromFile
    }
  }

  return undefined
}

function missingServiceRoleMessage(): string {
  if (process.env.VERCEL) {
    return (
      "Missing SUPABASE_SERVICE_ROLE_KEY on Vercel. In Project → Settings → Environment Variables, " +
      "set the Supabase service_role secret for Production (value must match .env.local). " +
      "If the variable is marked Sensitive, save it and deploy a new production build (not only Redeploy). " +
      "Then hard-refresh the site."
    )
  }
  return (
    "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to app/.env.local (Supabase → Settings → API → secret key), " +
    "save the file, delete the .next folder, and restart npm run dev from the app folder."
  )
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceRoleKey = getServiceRoleKey()

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (Supabase → Settings → API)."
    )
  }
  if (!serviceRoleKey) {
    throw new Error(missingServiceRoleMessage())
  }

  return createClient(url, serviceRoleKey, {
    global: { fetch: supabaseFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
