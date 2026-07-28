import { appUrl } from "@/lib/app-url"
import {
  announcementEmail,
  accountDeletedEmail,
  chatMessageEmail,
  newEventEmail,
} from "@/lib/notifications/email-templates"
import { sendEmail } from "@/lib/notifications/email"
import { getMemberRecipients } from "@/lib/notifications/recipients"
import { sendPush } from "@/lib/notifications/push"
import { createAdminClient } from "@/lib/supabase/admin"

function getAdminClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function getUserSubscriptions(userId: string) {
  const admin = getAdminClient()
  if (!admin) return []

  const { data, error } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId)

  if (error) {
    console.error("Failed to load push subscriptions:", error.message)
    return []
  }

  return data ?? []
}

async function removeSubscription(id: string) {
  const admin = getAdminClient()
  if (!admin) return
  await admin.from("push_subscriptions").delete().eq("id", id)
}

async function notifyUserPush(
  userId: string,
  payload: { title: string; body: string; url?: string }
) {
  const subscriptions = await getUserSubscriptions(userId)
  for (const sub of subscriptions) {
    const result = await sendPush(sub, payload)
    if (result.expired) {
      await removeSubscription(sub.id)
    }
  }
}

export async function notifyNewAnnouncement({
  title,
  body,
}: {
  title: string
  body: string
}) {
  const members = await getMemberRecipients()
  const { subject, html } = announcementEmail({ title, body })

  await Promise.allSettled(
    members.map(async (member) => {
      const tasks: Promise<unknown>[] = [
        notifyUserPush(member.id, {
          title: "New announcement",
          body: title,
          url: appUrl("/"),
        }),
      ]

      if (member.preferences.email_announcements) {
        tasks.push(sendEmail({ to: member.email, subject, html }))
      }

      await Promise.allSettled(tasks)
    })
  )
}

export async function notifyNewEvent({
  id,
  title,
  body,
  eventDate,
  location,
}: {
  id: string
  title: string
  body: string
  eventDate: string
  location: string | null
}) {
  const members = await getMemberRecipients()
  const { subject, html } = newEventEmail({
    title,
    body,
    eventDate,
    location,
    eventId: id,
  })

  await Promise.allSettled(
    members.map(async (member) => {
      const tasks: Promise<unknown>[] = [
        notifyUserPush(member.id, {
          title: "New event",
          body: title,
          url: appUrl(`/event/${id}`),
        }),
      ]

      if (member.preferences.email_events) {
        tasks.push(sendEmail({ to: member.email, subject, html }))
      }

      await Promise.allSettled(tasks)
    })
  )
}

export async function notifyEnrollment({
  userId,
  eventId,
  title,
}: {
  userId: string
  eventId: string
  title: string
}) {
  await notifyUserPush(userId, {
    title: "Enrollment confirmed",
    body: title,
    url: appUrl(`/event/${eventId}`),
  })
}

export async function notifyChatMessage({
  recipientUserId,
  senderName,
  body,
  threadId,
  recipientKind,
}: {
  recipientUserId: string
  senderName: string
  body: string
  threadId: string
  recipientKind: "admin" | "member"
}) {
  const admin = getAdminClient()
  if (!admin) return

  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("id", recipientUserId)
    .maybeSingle()

  if (error) {
    console.error("Failed to load chat email recipient:", error.message)
    return
  }

  const email = data?.email?.trim()
  if (!email?.includes("@")) return

  const { subject, html } = chatMessageEmail({
    senderName,
    body,
    threadId,
    recipientKind,
  })

  await sendEmail({ to: email, subject, html })
}

export async function notifyAccountDeleted({
  to,
  memberName,
}: {
  to: string
  memberName: string
}) {
  const { subject, html } = accountDeletedEmail({ memberName })
  await sendEmail({ to, subject, html })
}
