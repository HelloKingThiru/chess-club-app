import webpush from "web-push"

import { isPushConfigured } from "@/lib/app-url"

export type PushPayload = {
  title: string
  body: string
  url?: string
}

function configureVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT

  if (!publicKey || !privateKey || !subject) {
    return false
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function sendPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: PushPayload
) {
  if (!isPushConfigured() || !configureVapid()) {
    return { ok: false as const, skipped: true }
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    )
    return { ok: true as const }
  } catch (error) {
    const statusCode =
      error && typeof error === "object" && "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined

    if (statusCode === 404 || statusCode === 410) {
      return { ok: false as const, expired: true }
    }

    console.error("Web push failed:", error)
    return { ok: false as const, error: String(error) }
  }
}
