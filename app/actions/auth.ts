"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { assertAdminTools } from "@/lib/admin-mode"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import type { ActionState, UserRole } from "@/lib/types/auth"

export async function loginAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Email and password are required." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "Invalid email or password." }
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
  const boardNumberRaw = String(formData.get("board_number") ?? "").trim()
  const role = String(formData.get("role") ?? "regular") as UserRole

  if (!fullName || !email || !password) {
    return { error: "Name, email, and password are required." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  if (role !== "admin" && role !== "regular") {
    return { error: "Invalid role selected." }
  }

  const boardNumber = boardNumberRaw ? Number(boardNumberRaw) : null
  if (boardNumberRaw && Number.isNaN(boardNumber)) {
    return { error: "Board number must be a number." }
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
        phone_number: phoneNumber || null,
        board_number: boardNumber,
      },
    })

    if (error) {
      return { error: error.message }
    }

    if (data.user && (phoneNumber || boardNumber)) {
      await admin.from("profiles").update({
        phone_number: phoneNumber || null,
        board_number: boardNumber,
      }).eq("id", data.user.id)
    }

    revalidatePath("/board-order")
    revalidatePath("/", "layout")
    return {
      success: `${role === "admin" ? "Admin" : "Member"} account created for ${email}.`,
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
