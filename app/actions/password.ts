"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const email = String(formData.get("email") ?? "").trim()
  const oldPassword = String(formData.get("old_password") ?? "")
  const newPassword = String(formData.get("new_password") ?? "")
  const confirmPassword = String(formData.get("confirm_password") ?? "")

  if (email !== profile.email) {
    return { error: "Email must match your account email." }
  }
  if (!oldPassword || !newPassword) {
    return { error: "All password fields are required." }
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." }
  }
  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." }
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: oldPassword,
  })
  if (signInError) return { error: "Current password is incorrect." }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  revalidatePath("/change-password")
  return { success: "Password updated." }
}
