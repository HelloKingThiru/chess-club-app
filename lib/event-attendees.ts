import {
  deletedMemberPlaceholder,
  unwrapJoinedProfile,
} from "@/lib/deleted-member"
import type { EventBoardPlayer } from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import { createClient } from "@/lib/supabase/server"

type AttendeeRow = {
  id?: string
  user_id: string | null
  display_name?: string | null
  profiles: Profile | Profile[] | null
}

export function eventBoardPlayerFromAttendeeRow(
  row: AttendeeRow,
  eventBoard: number | null
): EventBoardPlayer {
  const profile = unwrapJoinedProfile(row.profiles)
  if (profile) {
    return {
      ...profile,
      eventBoard,
      memberDeleted: false,
    }
  }

  const stableKey = row.id ?? row.user_id ?? `unknown-${eventBoard ?? 0}`
  return {
    ...deletedMemberPlaceholder(stableKey, row.display_name),
    eventBoard,
  }
}

export async function memberDisplayNameForProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", userId)
    .maybeSingle()

  return data?.full_name?.trim() || data?.email?.trim() || "Member"
}
