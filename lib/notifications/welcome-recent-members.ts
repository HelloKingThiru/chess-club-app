import { randomInt } from "node:crypto"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isEmailConfigured } from "@/lib/app-url"
import { accountCreatedEmail } from "@/lib/notifications/email-templates"
import { sendEmail } from "@/lib/notifications/email"

const CREATED_AFTER = "2026-09-26T00:00:00.000Z"
const MAX_RECIPIENTS = 15
const PRODUCTION_APP_URL = "https://www.nchschessclub.com"

type NameResult = { name: string }

export type WelcomeRecentResult = {
  ok: boolean
  error?: string
  emailed: NameResult[]
  skipped: NameResult[]
  failed: NameResult | null
}

function tempPassword() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
  const digits = "23456789"
  const all = letters + digits
  const chars = [
    letters[randomInt(letters.length)],
    digits[randomInt(digits.length)],
  ]
  while (chars.length < 14) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join("")
}

function ensureAppUrl() {
  const current = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ""
  if (!current || /localhost|127\.0\.0\.1/i.test(current)) {
    process.env.NEXT_PUBLIC_APP_URL = PRODUCTION_APP_URL
  }
}

async function sendWelcome(to: string, name: string, password: string) {
  const { subject, html } = accountCreatedEmail({
    memberName: name,
    email: to,
    temporaryPassword: password,
  })
  let sent = await sendEmail({ to, subject, html })
  for (let attempt = 0; attempt < 2 && !sent.ok; attempt++) {
    sent = await sendEmail({ to, subject, html })
  }
  return sent
}

export async function sendWelcomeEmailsToRecentMembers(
  admin: SupabaseClient
): Promise<WelcomeRecentResult> {
  const empty = { emailed: [] as NameResult[], skipped: [] as NameResult[], failed: null }

  if (!isEmailConfigured()) {
    return { ok: false, error: "Email is not configured", ...empty }
  }

  ensureAppUrl()

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .eq("role", "regular")
    .gte("created_at", CREATED_AFTER)

  if (error) {
    return { ok: false, error: error.message, ...empty }
  }

  const rows = data ?? []
  if (rows.length === 0) {
    return { ok: false, error: "No recent member accounts matched", ...empty }
  }
  if (rows.length > MAX_RECIPIENTS) {
    return {
      ok: false,
      error: `Refusing to email ${rows.length} accounts`,
      ...empty,
    }
  }

  const emailed: NameResult[] = []
  const skipped: NameResult[] = []

  for (const row of rows) {
    const name = row.full_name?.trim() || "there"
    const email = String(row.email ?? "").trim().toLowerCase()

    if (!email.includes("@")) {
      return {
        ok: false,
        error: `Account ${name} has no email`,
        emailed,
        skipped,
        failed: { name },
      }
    }

    if (row.role !== "regular") {
      return {
        ok: false,
        error: `Refusing to change ${name}`,
        emailed,
        skipped,
        failed: { name },
      }
    }

    const { data: userWrap, error: userError } = await admin.auth.admin.getUserById(
      row.id
    )
    if (userError || !userWrap.user) {
      return {
        ok: false,
        error: userError?.message ?? `Missing sign-in for ${name}`,
        emailed,
        skipped,
        failed: { name },
      }
    }

    const metadata = userWrap.user.user_metadata ?? {}
    if (metadata.welcome_email_sent_at) {
      skipped.push({ name })
      continue
    }

    const password = tempPassword()
    const { error: passwordError } = await admin.auth.admin.updateUserById(row.id, {
      password,
    })
    if (passwordError) {
      return {
        ok: false,
        error: passwordError.message,
        emailed,
        skipped,
        failed: { name },
      }
    }

    const sent = await sendWelcome(email, name, password)
    if (!sent.ok) {
      return {
        ok: false,
        error: "error" in sent ? sent.error : "Welcome email was not sent",
        emailed,
        skipped,
        failed: { name },
      }
    }

    const { error: flagError } = await admin.auth.admin.updateUserById(row.id, {
      user_metadata: {
        ...metadata,
        welcome_email_sent_at: new Date().toISOString(),
      },
    })
    if (flagError) {
      emailed.push({ name })
      return {
        ok: false,
        error: `Welcome email was sent, but it could not be marked sent: ${flagError.message}`,
        emailed,
        skipped,
        failed: { name },
      }
    }

    emailed.push({ name })
  }

  return { ok: true, emailed, skipped, failed: null }
}
