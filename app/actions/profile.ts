"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth"
import { isValidGradeLevel } from "@/lib/grade-level"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

export async function updateProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const fullName = String(formData.get("full_name") ?? "").trim()
  const phoneNumber = String(formData.get("phone_number") ?? "").trim()
  const includePhone = formData.get("include_phone") === "true"
  const gradeLevelRaw = String(formData.get("grade_level") ?? "").trim()
  const gradeLevel = gradeLevelRaw ? Number(gradeLevelRaw) : null
  const bio = String(formData.get("bio") ?? "").trim()
  const includeBio = formData.get("include_bio") === "true"

  if (!fullName) {
    return { error: "Full name is required." }
  }

  if (gradeLevelRaw && Number.isNaN(gradeLevel)) {
    return { error: "Grade level must be a number." }
  }

  if (!isValidGradeLevel(gradeLevel)) {
    return { error: "Grade level must be 9, 10, 11, or 12." }
  }

  const payload: {
    full_name: string
    phone_number?: string | null
    grade_level?: number | null
    bio?: string | null
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

  let { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", profile.id)

  if (error?.message.includes("phone_number") && includePhone) {
    const fallback = { full_name: fullName, grade_level: gradeLevel }
    if (includeBio) Object.assign(fallback, { bio: bio || null })
    ;({ error } = await supabase.from("profiles").update(fallback).eq("id", profile.id))

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
      })
      .eq("id", profile.id))

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
      })
      .eq("id", profile.id))

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

  revalidatePath("/profile")
  revalidatePath(`/profile/${profile.id}`)
  return { success: "Profile updated." }
}
