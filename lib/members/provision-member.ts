import type { SupabaseClient } from "@supabase/supabase-js"

import { isValidGradeLevel } from "@/lib/grade-level"
import { accountCreatedEmail } from "@/lib/notifications/email-templates"
import { sendEmail } from "@/lib/notifications/email"
import type { UserRole } from "@/lib/types/auth"

export type ProvisionMemberInput = {
  fullName: string
  email: string
  password: string
  phoneNumber?: string | null
  gradeLevel?: number | null
  role: UserRole
}

export type ProvisionMemberResult =
  | {
      ok: true
      userId: string
      email: string
      emailSent: true
    }
  | {
      ok: false
      code: "validation" | "create_failed" | "profile_failed" | "email_failed"
      error: string
      userId?: string
      email?: string
      /** True when the auth user was left in place after a failed welcome email. */
      accountKept?: boolean
    }

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isExistingAccountError(message: string) {
  return /already (been )?registered|already exists|duplicate/i.test(message)
}

export function normalizePhoneNumber(value: string | null | undefined) {
  const raw = (value ?? "").trim()
  if (!raw) return { ok: true as const, phone: null }

  const digits = raw.replace(/\D/g, "")
  const local =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits

  if (local.length !== 10) {
    return { ok: false as const, error: "Phone number must be 10 digits." }
  }

  return { ok: true as const, phone: local }
}

async function deleteAuthUser(admin: SupabaseClient, userId: string) {
  const { error } = await admin.auth.admin.deleteUser(userId)
  return error?.message ?? null
}

export async function provisionMemberAccount(
  admin: SupabaseClient,
  input: ProvisionMemberInput,
  options?: { rollbackOnEmailFailure?: boolean }
): Promise<ProvisionMemberResult> {
  const fullName = input.fullName.trim()
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const role = input.role
  const gradeLevel = input.gradeLevel ?? null

  if (!fullName || !email || !password) {
    return {
      ok: false,
      code: "validation",
      error: "Name, email, and password are required.",
    }
  }

  if (!EMAIL_PATTERN.test(email)) {
    return {
      ok: false,
      code: "validation",
      error: "A valid email is required.",
    }
  }

  if (password.length < 8) {
    return {
      ok: false,
      code: "validation",
      error: "Password must be at least 8 characters.",
    }
  }

  if (role !== "admin" && role !== "regular") {
    return { ok: false, code: "validation", error: "Invalid role selected." }
  }

  if (
    gradeLevel != null &&
    (Number.isNaN(gradeLevel) || !isValidGradeLevel(gradeLevel))
  ) {
    return {
      ok: false,
      code: "validation",
      error: "Grade level must be 9, 10, 11, or 12.",
    }
  }

  const phoneResult = normalizePhoneNumber(input.phoneNumber)
  if (!phoneResult.ok) {
    return { ok: false, code: "validation", error: phoneResult.error }
  }
  const phoneNumber = phoneResult.phone

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
      phone_number: phoneNumber,
    },
  })

  if (error || !data.user) {
    return {
      ok: false,
      code: "create_failed",
      error: error?.message ?? "Could not create account.",
      email,
    }
  }

  const userId = data.user.id

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .update({
      phone_number: phoneNumber,
      grade_level: gradeLevel,
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle()

  if (profileError || !profile) {
    const deleteError = await deleteAuthUser(admin, userId)
    const detail = profileError?.message ?? "Profile was not created."
    return {
      ok: false,
      code: "profile_failed",
      email,
      error: deleteError
        ? `${detail} The new sign-in could not be removed (${deleteError}).`
        : `${detail} The new sign-in was removed.`,
    }
  }

  const { subject, html } = accountCreatedEmail({
    memberName: fullName,
    email,
    temporaryPassword: password,
  })
  const sent = await sendEmail({ to: email, subject, html })

  if (!sent.ok) {
    if (options?.rollbackOnEmailFailure) {
      const deleteError = await deleteAuthUser(admin, userId)
      return {
        ok: false,
        code: "email_failed",
        userId,
        email,
        accountKept: Boolean(deleteError),
        error: deleteError
          ? `Welcome email was not sent, and the new sign-in could not be removed (${deleteError}).`
          : "Welcome email was not sent. The new sign-in was removed.",
      }
    }

    return {
      ok: false,
      code: "email_failed",
      userId,
      email,
      accountKept: true,
      error: `Account created for ${email}, but the welcome email could not be sent. Share the password with them directly.`,
    }
  }

  return { ok: true, userId, email, emailSent: true }
}
