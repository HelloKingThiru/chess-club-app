export type EmailPreferences = {
  email_announcements: boolean
  email_events: boolean
  email_enrollment: boolean
}

export type MemberRecipient = {
  id: string
  email: string
  full_name: string | null
  preferences: EmailPreferences
}

export type EventReminderKind = "event_3day" | "enrollment_1day"
