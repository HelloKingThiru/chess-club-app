import { appUrl } from "@/lib/app-url"
import { announcementEmail } from "@/lib/notifications/email-templates"
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
}: {
  id: string
  title: string
}) {
  const members = await getMemberRecipients()

  await Promise.allSettled(
    members.map((member) =>
      notifyUserPush(member.id, {
        title: "New event",
        body: title,
        url: appUrl(`/event/${id}`),
      })
    )
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
