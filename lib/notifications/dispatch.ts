import { appUrl } from "@/lib/app-url"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendPush } from "@/lib/notifications/push"

type MemberRow = {
  id: string
}

function getAdminClient() {
  try {
    return createAdminClient()
  } catch {
    return null
  }
}

async function getMemberIds() {
  const admin = getAdminClient()
  if (!admin) return []

  const { data, error } = await admin.from("profiles").select("id")

  if (error) {
    console.error("Failed to load members for notifications:", error.message)
    return []
  }

  return (data ?? []) as MemberRow[]
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

export async function notifyNewAnnouncement({ title }: { title: string }) {
  const members = await getMemberIds()

  await Promise.allSettled(
    members.map((member) =>
      notifyUserPush(member.id, {
        title: "New announcement",
        body: title,
        url: appUrl("/"),
      })
    )
  )
}

export async function notifyNewEvent({
  id,
  title,
}: {
  id: string
  title: string
}) {
  const members = await getMemberIds()

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
