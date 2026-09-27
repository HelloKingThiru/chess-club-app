import { NextResponse } from "next/server"

import { sendWelcomeEmailsToRecentMembers } from "@/lib/notifications/welcome-recent-members"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const result = await sendWelcomeEmailsToRecentMembers(admin)
    return NextResponse.json(result, { status: result.ok ? 200 : 500 })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Welcome emails failed",
        emailed: [],
        skipped: [],
        failed: null,
      },
      { status: 500 }
    )
  }
}
