"use server"

import { revalidatePath } from "next/cache"
import { connection } from "next/server"
import { redirect } from "next/navigation"

import { assertAdminTools } from "@/lib/admin-mode"
import { provisionMemberAccount } from "@/lib/members/provision-member"
import { createAdminClient } from "@/lib/supabase/admin"
import { loginErrorMessage } from "@/lib/supabase/auth-errors"
import { createClient } from "@/lib/supabase/server"
import type { ActionState, UserRole } from "@/lib/types/auth"

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[loginAction]", error.message, error.cause ?? "")
    }
    return { error: loginErrorMessage(error) }
  }

  redirect("/")
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}

export async function createUserAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  const fullName = String(formData.get("full_name") ?? "").trim()
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")
  const phoneNumber = String(formData.get("phone_number") ?? "").trim()
  const gradeLevelRaw = String(formData.get("grade_level") ?? "").trim()
  const role = String(formData.get("role") ?? "regular") as UserRole

  try {
    await connection()
    const admin = createAdminClient()
    const result = await provisionMemberAccount(admin, {
      fullName,
      email,
      password,
      phoneNumber,
      gradeLevel: gradeLevelRaw ? Number(gradeLevelRaw) : null,
      role,
    })

    if (!result.ok) {
      if (result.accountKept) {
        revalidatePath("/board-order")
        revalidatePath("/", "layout")
      }
      return { error: result.error }
    }

    revalidatePath("/board-order")
    revalidatePath("/", "layout")
    const label = role === "admin" ? "Admin" : "Member"
    return {
      success: `${label} account created for ${result.email}. A welcome email was sent with a temporary password and instructions to change it.`,
    }
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not create account. Check server configuration.",
    }
  }
}
