"use server"

import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"
import {
  defaultNotificationPreferences,
  type NotificationPreferences,
} from "@/lib/types/notifications"

function isMissingPreferencesTable(errorMessage: string) {
  return errorMessage.includes("notification_preferences")
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notification_preferences")
    .select(
      "email_announcements, email_events, email_enrollment, push_announcements, push_events, push_enrollment"
    )
    .eq("user_id", profile.id)
    .maybeSingle()

  if (error) {
    if (isMissingPreferencesTable(error.message)) {
      return defaultNotificationPreferences
    }
    throw new Error(error.message)
  }

  if (!data) {
    return defaultNotificationPreferences
  }

  return {
    email_announcements:
      data.email_announcements ?? defaultNotificationPreferences.email_announcements,
    email_events: data.email_events ?? defaultNotificationPreferences.email_events,
    email_enrollment:
      data.email_enrollment ?? defaultNotificationPreferences.email_enrollment,
    push_announcements:
      data.push_announcements ?? defaultNotificationPreferences.push_announcements,
    push_events: data.push_events ?? defaultNotificationPreferences.push_events,
    push_enrollment:
      data.push_enrollment ?? defaultNotificationPreferences.push_enrollment,
  }
}

export async function saveNotificationPreferencesAction(
  preferences: Pick<
    NotificationPreferences,
    "email_announcements" | "email_events" | "email_enrollment"
  >
): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase.from("notification_preferences").upsert(
    {
      user_id: profile.id,
      email_announcements: preferences.email_announcements,
      email_events: preferences.email_events,
      email_enrollment: preferences.email_enrollment,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error?.message && isMissingPreferencesTable(error.message)) {
    return {
      error:
        "Notification preferences could not be saved. Run migration-v7.sql in Supabase SQL Editor.",
    }
  }

  if (error) {
    return { error: error.message }
  }

  return { success: "Email notification preferences saved." }
}

export async function savePushSubscriptionAction(subscription: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: profile.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    { onConflict: "user_id,endpoint" }
  )

  if (error?.message.includes("push_subscriptions")) {
    return {
      error:
        "Push subscription could not be saved. Run migration-v7.sql in Supabase SQL Editor.",
    }
  }

  if (error) {
    return { error: error.message }
  }

  return { success: "Push notifications enabled." }
}

export async function removePushSubscriptionAction(
  endpoint: string
): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", profile.id)
    .eq("endpoint", endpoint)

  if (error) {
    return { error: error.message }
  }

  return { success: "Push notifications disabled." }
}
