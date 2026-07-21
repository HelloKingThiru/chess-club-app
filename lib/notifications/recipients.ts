import { createAdminClient } from "@/lib/supabase/admin"
import type { EmailPreferences, MemberRecipient } from "@/lib/notifications/types"

const defaultEmailPreferences: EmailPreferences = {
  email_announcements: true,
  email_events: true,
  email_enrollment: true,
}

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  notification_preferences:
    | EmailPreferences
    | EmailPreferences[]
    | null
}

function normalizePreferences(
  raw: ProfileRow["notification_preferences"]
): EmailPreferences {
  const prefs = Array.isArray(raw) ? raw[0] : raw
  return {
    email_announcements:
      prefs?.email_announcements ?? defaultEmailPreferences.email_announcements,
    email_events: prefs?.email_events ?? defaultEmailPreferences.email_events,
    email_enrollment:
      prefs?.email_enrollment ?? defaultEmailPreferences.email_enrollment,
  }
}

export async function getMemberRecipients(): Promise<MemberRecipient[]> {
  let admin
  try {
    admin = createAdminClient()
  } catch {
    return []
  }

  const { data, error } = await admin
    .from("profiles")
    .select(
      "id, email, full_name, notification_preferences(email_announcements, email_events, email_enrollment)"
    )

  if (error) {
    console.error("Failed to load member recipients:", error.message)
    return []
  }

  return ((data ?? []) as ProfileRow[])
    .filter((row) => row.email?.includes("@"))
    .map((row) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      preferences: normalizePreferences(row.notification_preferences),
    }))
}
