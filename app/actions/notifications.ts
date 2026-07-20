"use server"

import { requireProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

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
