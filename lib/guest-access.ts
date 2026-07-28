import type { Profile } from "@/lib/types/auth"

export const MEMBER_PROFILE_COLUMNS =
  "id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at"

export const PUBLIC_PROFILE_COLUMNS =
  "id, full_name, board_number, grade_level, bio, role, created_at"

export function isAuthRequiredPath(pathname: string) {
  if (pathname === "/profile") return true
  return ["/chat", "/admin", "/change-password"].some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

export function profileTable(isGuest: boolean) {
  return isGuest ? "public_profiles" : "profiles"
}

export function profileColumns(isGuest: boolean) {
  return isGuest ? PUBLIC_PROFILE_COLUMNS : MEMBER_PROFILE_COLUMNS
}

export function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    email: (row.email as string | undefined) ?? "",
    full_name: row.full_name as string | null,
    phone_number: (row.phone_number as string | null | undefined) ?? null,
    board_number: row.board_number as number | null,
    grade_level: row.grade_level as number | null,
    bio: row.bio as string | null,
    role: row.role as Profile["role"],
    created_at: row.created_at as string,
  }
}
