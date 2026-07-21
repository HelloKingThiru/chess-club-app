import { NextResponse } from "next/server"

import { runEventReminders } from "@/lib/notifications/event-reminders"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await runEventReminders()
  return NextResponse.json({ ok: true, ...result })
}
