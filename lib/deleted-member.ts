import type { Profile } from "@/lib/types/auth"
import type { EventBoardPlayer } from "@/lib/board-order"

export const DELETED_MEMBER_LABEL = "Deleted member"

export function deletedMemberPlaceholder(
  stableKey: string,
  displayName?: string | null
): EventBoardPlayer {
  const name = displayName?.trim() || DELETED_MEMBER_LABEL
  return {
    id: `deleted:${stableKey}`,
    email: "",
    full_name: name,
    phone_number: null,
    board_number: null,
    grade_level: null,
    bio: null,
    role: "regular",
    created_at: "",
    memberDeleted: true,
  }
}

export function isDeletedMemberPlayer(
  player: Profile | EventBoardPlayer
): player is EventBoardPlayer & { memberDeleted: true } {
  return (
    "memberDeleted" in player &&
    player.memberDeleted === true
  )
}

export function unwrapJoinedProfile<T extends Profile>(
  value: T | T[] | null
): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}
