import { createClient } from "@/lib/supabase/server"

export async function getEventAttendanceMeta(eventIds: string[], userId?: string | null) {
  if (eventIds.length === 0) {
    return {
      counts: new Map<string, number>(),
      enrolledIds: new Set<string>(),
    }
  }

  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("event_attendees")
    .select("event_id, user_id")
    .in("event_id", eventIds)

  const counts = new Map<string, number>()
  const enrolledIds = new Set<string>()

  for (const row of rows ?? []) {
    const eventId = row.event_id as string
    counts.set(eventId, (counts.get(eventId) ?? 0) + 1)
    if (userId && row.user_id === userId) {
      enrolledIds.add(eventId)
    }
  }

  return { counts, enrolledIds }
}
