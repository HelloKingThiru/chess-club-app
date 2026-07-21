import { createAdminClient } from "@/lib/supabase/admin"
import {
  enrollmentOneDayReminderEmail,
  eventThreeDayReminderEmail,
} from "@/lib/notifications/email-templates"
import { sendEmail } from "@/lib/notifications/email"
import {
  clubDateKeyDaysFromToday,
  eventClubDateKey,
} from "@/lib/notifications/club-time"
import { getMemberRecipients } from "@/lib/notifications/recipients"
import type { EventReminderKind } from "@/lib/notifications/types"

type EventRow = {
  id: string
  title: string
  event_date: string
  location: string | null
}

function getAdminClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function getUpcomingEventsOnClubDay(dayKey: string) {
  const admin = getAdminClient()
  if (!admin) return []

  const { data, error } = await admin
    .from("posts")
    .select("id, title, event_date, location")
    .eq("kind", "specific")
    .eq("published", true)
    .is("archived_at", null)
    .gte("event_date", new Date().toISOString())

  if (error) {
    console.error("Failed to load events for reminders:", error.message)
    return []
  }

  return ((data ?? []) as EventRow[]).filter(
    (event) => eventClubDateKey(event.event_date) === dayKey
  )
}

async function getEnrolledUserIds(eventId: string) {
  const admin = getAdminClient()
  if (!admin) return []

  const { data, error } = await admin
    .from("event_attendees")
    .select("user_id")
    .eq("event_id", eventId)

  if (error) {
    console.error("Failed to load enrollments:", error.message)
    return []
  }

  return (data ?? []).map((row) => row.user_id as string)
}

async function wasReminderSent(
  eventId: string,
  userId: string,
  reminderKind: EventReminderKind
) {
  const admin = getAdminClient()
  if (!admin) return false

  const { data, error } = await admin
    .from("event_notification_log")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("reminder_kind", reminderKind)
    .maybeSingle()

  if (error) {
    if (error.message.includes("event_notification_log")) {
      console.error(
        "event_notification_log table missing — run supabase/migration-v10.sql"
      )
      return true
    }
    console.error("Failed to check reminder log:", error.message)
    return true
  }

  return Boolean(data)
}

async function logReminderSent(
  eventId: string,
  userId: string,
  reminderKind: EventReminderKind
) {
  const admin = getAdminClient()
  if (!admin) return

  const { error } = await admin.from("event_notification_log").insert({
    event_id: eventId,
    user_id: userId,
    reminder_kind: reminderKind,
  })

  if (error && !error.message.includes("duplicate")) {
    console.error("Failed to log reminder:", error.message)
  }
}

export async function runEventReminders() {
  const members = await getMemberRecipients()
  const membersById = new Map(members.map((member) => [member.id, member]))

  const threeDayKey = clubDateKeyDaysFromToday(3)
  const oneDayKey = clubDateKeyDaysFromToday(1)

  const threeDayEvents = await getUpcomingEventsOnClubDay(threeDayKey)
  const oneDayEvents = await getUpcomingEventsOnClubDay(oneDayKey)

  let sent = 0
  let skipped = 0

  for (const event of threeDayEvents) {
    for (const member of members) {
      if (!member.preferences.email_events) {
        skipped++
        continue
      }

      if (await wasReminderSent(event.id, member.id, "event_3day")) {
        skipped++
        continue
      }

      const { subject, html } = eventThreeDayReminderEmail({
        title: event.title,
        eventDate: event.event_date,
        location: event.location,
        eventId: event.id,
      })

      const result = await sendEmail({
        to: member.email,
        subject,
        html,
      })

      if (result.ok) {
        await logReminderSent(event.id, member.id, "event_3day")
        sent++
      } else if (result.skipped) {
        skipped++
      }
    }
  }

  for (const event of oneDayEvents) {
    const enrolledIds = await getEnrolledUserIds(event.id)

    for (const userId of enrolledIds) {
      const member = membersById.get(userId)
      if (!member?.preferences.email_enrollment) {
        skipped++
        continue
      }

      if (await wasReminderSent(event.id, userId, "enrollment_1day")) {
        skipped++
        continue
      }

      const { subject, html } = enrollmentOneDayReminderEmail({
        title: event.title,
        eventDate: event.event_date,
        location: event.location,
        eventId: event.id,
      })

      const result = await sendEmail({
        to: member.email,
        subject,
        html,
      })

      if (result.ok) {
        await logReminderSent(event.id, userId, "enrollment_1day")
        sent++
      } else if (result.skipped) {
        skipped++
      }
    }
  }

  return {
    sent,
    skipped,
    threeDayEvents: threeDayEvents.length,
    oneDayEvents: oneDayEvents.length,
    threeDayKey,
    oneDayKey,
  }
}
