"use server"

import { revalidatePath } from "next/cache"
import { connection } from "next/server"

import { assertAdminTools } from "@/lib/admin-mode"
import { requireProfile } from "@/lib/auth"
import { isValidGradeLevel } from "@/lib/grade-level"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

function parseProfileForm(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim()
  const phoneNumber = String(formData.get("phone_number") ?? "").trim()
  const includePhone = formData.get("include_phone") === "true"
  const gradeLevelRaw = String(formData.get("grade_level") ?? "").trim()
  const gradeLevel = gradeLevelRaw ? Number(gradeLevelRaw) : null
  const bio = String(formData.get("bio") ?? "").trim()
  const includeBio = formData.get("include_bio") === "true"
  const includeAdminFields = formData.get("include_admin_fields") === "true"
  const email = String(formData.get("email") ?? "").trim().toLowerCase()

  return {
    fullName,
    phoneNumber,
    includePhone,
    gradeLevelRaw,
    gradeLevel,
    bio,
    includeBio,
    includeAdminFields,
    email,
  }
}

async function applyProfileUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  updateId: string,
  parsed: ReturnType<typeof parseProfileForm>
): Promise<ActionState> {
  const {
    fullName,
    phoneNumber,
    includePhone,
    gradeLevelRaw,
    gradeLevel,
    bio,
    includeBio,
    includeAdminFields,
    email,
  } = parsed

  if (!fullName) {
    return { error: "Full name is required." }
  }

  if (gradeLevelRaw && Number.isNaN(gradeLevel)) {
    return { error: "Grade level must be a number." }
  }

  if (!isValidGradeLevel(gradeLevel)) {
    return { error: "Grade level must be 9, 10, 11, or 12." }
  }

  if (includeAdminFields) {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { error: "A valid email is required." }
    }
  }

  const payload: {
    full_name: string
    phone_number?: string | null
    grade_level?: number | null
    bio?: string | null
    email?: string
  } = {
    full_name: fullName,
    grade_level: gradeLevel,
  }

  if (includePhone) {
    payload.phone_number = phoneNumber || null
  }

  if (includeBio) {
    payload.bio = bio || null
  }

  if (includeAdminFields) {
    payload.email = email
  }

  if (includeAdminFields) {
    try {
      await connection()
      const admin = createAdminClient()
      const { data: existingProfile } = await admin
        .from("profiles")
        .select("role")
        .eq("id", updateId)
        .maybeSingle()

      const { error: authError } = await admin.auth.admin.updateUserById(updateId, {
        email,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: existingProfile?.role ?? "regular",
          phone_number: includePhone ? phoneNumber || null : undefined,
        },
      })

      if (authError) {
        return { error: authError.message }
      }
    } catch (syncError) {
      return {
        error:
          syncError instanceof Error
            ? syncError.message
            : "Could not update sign-in email. Check server configuration.",
      }
    }
  }

  let { error } = await supabase.from("profiles").update(payload).eq("id", updateId)

  if (error?.message.includes("phone_number") && includePhone) {
    const fallback = { full_name: fullName, grade_level: gradeLevel }
    if (includeBio) Object.assign(fallback, { bio: bio || null })
    if (includeAdminFields) Object.assign(fallback, { email })
    ;({ error } = await supabase.from("profiles").update(fallback).eq("id", updateId))

    if (!error && phoneNumber) {
      return {
        error:
          "Phone could not be saved. Run migration-v2.sql in Supabase SQL Editor.",
      }
    }
  }

  if (error?.message.includes("grade_level")) {
    ;({ error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        ...(includePhone ? { phone_number: phoneNumber || null } : {}),
        ...(includeBio ? { bio: bio || null } : {}),
        ...(includeAdminFields ? { email } : {}),
      })
      .eq("id", updateId))

    if (!error) {
      return {
        error:
          "Grade level could not be saved. Run migration-v4.sql in Supabase SQL Editor.",
      }
    }
  }

  if (error?.message.includes("bio") && includeBio) {
    ;({ error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        grade_level: gradeLevel,
        ...(includePhone ? { phone_number: phoneNumber || null } : {}),
        ...(includeAdminFields ? { email } : {}),
      })
      .eq("id", updateId))

    if (!error) {
      return {
        error:
          "Bio could not be saved. Run migration-v5.sql in Supabase SQL Editor.",
      }
    }
  }

  if (error) {
    return { error: error.message }
  }

  return { success: "Profile updated." }
}

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()
  const parsed = parseProfileForm(formData)

  const targetId = String(formData.get("profile_id") ?? "").trim() || profile.id

  if (targetId !== profile.id) {
    const auth = await assertAdminTools()
    if (!auth.ok) return { error: auth.error }
    if (parsed.includeAdminFields !== true) {
      return { error: "Invalid profile update." }
    }
  } else if (parsed.includeAdminFields) {
    return { error: "Invalid profile update." }
  }

  const result = await applyProfileUpdate(supabase, targetId, parsed)
  if (result.error) return result

  revalidatePath("/profile")
  revalidatePath(`/profile/${targetId}`)
  revalidatePath("/board-order")
  return result
}

export async function deleteProfileAction(profileId: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  const trimmedId = profileId.trim()
  if (!trimmedId) {
    return { error: "Profile not found." }
  }

  if (trimmedId === auth.profile.id) {
    return { error: "You cannot delete your own account here." }
  }

  try {
    await connection()
    const admin = createAdminClient()

    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email, full_name")
      .eq("id", trimmedId)
      .maybeSingle()

    const recipientEmail = targetProfile?.email?.trim() ?? ""
    const memberName =
      targetProfile?.full_name?.trim() ||
      recipientEmail ||
      "Member"

    await admin
      .from("event_attendees")
      .update({ display_name: memberName })
      .eq("user_id", trimmedId)

    await admin.from("event_board_order").delete().eq("user_id", trimmedId)

    const { error } = await admin.auth.admin.deleteUser(trimmedId)

    if (error) {
      return { error: error.message }
    }

    if (recipientEmail.includes("@")) {
      void import("@/lib/notifications/dispatch").then(({ notifyAccountDeleted }) =>
        notifyAccountDeleted({ to: recipientEmail, memberName })
      )
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not delete account. Check server configuration.",
    }
  }

  revalidatePath("/board-order")
  revalidatePath("/calendar")
  revalidatePath("/", "layout")
  return { success: "Account deleted." }
}
