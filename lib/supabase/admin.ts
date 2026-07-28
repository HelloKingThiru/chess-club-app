import { createClient } from "@supabase/supabase-js"

import { supabaseFetch } from "@/lib/supabase/fetch"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (Supabase → Settings → API)."
    )
  }
  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local from Supabase → Settings → API → secret key, then restart npm run dev."
    )
  }

  return createClient(url, serviceRoleKey, {
    global: { fetch: supabaseFetch },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
