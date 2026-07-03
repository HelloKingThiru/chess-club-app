import { cookies } from "next/headers"

import { requireProfile } from "@/lib/auth"
import type { Profile } from "@/lib/types/auth"

const ADMIN_MODE_COOKIE = "chess_admin_mode"

export async function getAdminMode() {
  const cookieStore = await cookies()
  return cookieStore.get(ADMIN_MODE_COOKIE)?.value === "1"
}

export async function canUseAdminTools(profile: Profile | null) {
  if (!profile || profile.role !== "admin") return false
  return getAdminMode()
}

export async function assertAdminTools(): Promise<
  { ok: true; profile: Profile } | { ok: false; error: string }
> {
  const profile = await requireProfile()
  if (profile.role !== "admin") return { ok: false, error: "Admins only." }
  if (!(await getAdminMode())) return { ok: false, error: "Enable admin mode first." }
  return { ok: true, profile }
}
