import { cache } from "react"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import type { Profile, UserRole } from "@/lib/types/auth"
import { createClient } from "@/lib/supabase/server"

const profileSelect =
  "id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at"

const basicProfileSelect = "id, email, full_name, role, created_at"

function normalizeRole(role: string): UserRole {
  return role === "admin" ? "admin" : "regular"
}

function normalizeProfile(
  profile: Record<string, unknown>,
  extended = true
): Profile {
  return {
    id: profile.id as string,
    email: profile.email as string,
    full_name: (profile.full_name as string | null) ?? null,
    phone_number: extended
      ? ((profile.phone_number as string | null) ?? null)
      : null,
    board_number: extended
      ? ((profile.board_number as number | null) ?? null)
      : null,
    grade_level: extended
      ? ((profile.grade_level as number | null) ?? null)
      : null,
    bio: extended ? ((profile.bio as string | null) ?? null) : null,
    role: normalizeRole(profile.role as string),
    created_at: profile.created_at as string,
  }
}

function roleFromUser(user: User): UserRole {
  const role = String(user.user_metadata?.role ?? "").toLowerCase()
  return role === "admin" ? "admin" : "regular"
}

async function fetchProfileRow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const full = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", userId)
    .maybeSingle()

  if (!full.error && full.data) {
    return normalizeProfile(full.data, true)
  }

  const basic = await supabase
    .from("profiles")
    .select(basicProfileSelect)
    .eq("id", userId)
    .maybeSingle()

  if (!basic.error && basic.data) {
    return normalizeProfile(basic.data, false)
  }

  return null
}

async function ensureProfileForUser(user: User) {
  const supabase = await createClient()
  const existing = await fetchProfileRow(supabase, user.id)
  if (existing) return existing

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? "",
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: roleFromUser(user),
    })
    .select(basicProfileSelect)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return normalizeProfile(data, false)
}

export const getSessionUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
})

export const getProfile = cache(async () => {
  const user = await getSessionUser()
  if (!user) {
    return null
  }

  const supabase = await createClient()
  const profile = await fetchProfileRow(supabase, user.id)
  if (profile) {
    return profile
  }

  return ensureProfileForUser(user)
})

export async function requireProfile() {
  const user = await getSessionUser()
  if (!user) {
    redirect("/login")
  }

  const profile = await getProfile()
  if (!profile) {
    redirect("/login?error=profile")
  }

  return profile
}

export async function requireAdmin() {
  const profile = await requireProfile()

  if (profile.role !== "admin") {
    redirect("/profile")
  }

  return profile
}

export { roleLabel } from "@/lib/roles"
