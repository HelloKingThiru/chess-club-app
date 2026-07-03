"use server"

import { revalidatePath } from "next/cache"

import { assertAdminTools } from "@/lib/admin-mode"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"
import type { EventType, MiniKind } from "@/lib/types/posts"

export async function createSpecificPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const admin = auth.profile
  const supabase = await createClient()

  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const eventType = String(formData.get("event_type") ?? "") as EventType
  const eventDate = String(formData.get("event_date") ?? "").trim()
  const location = String(formData.get("location") ?? "").trim()
  const published = formData.get("published") === "on"

  if (!title || !body || !eventDate || !eventType) {
    return { error: "Title, type, date, and description are required." }
  }

  const { error } = await supabase.from("posts").insert({
    kind: "specific",
    title,
    body,
    event_type: eventType,
    event_date: new Date(eventDate).toISOString(),
    location: location || null,
    published,
    author_id: admin.id,
  })

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/calendar")
  return { success: "Event created." }
}

export async function createMiniPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const admin = auth.profile
  const supabase = await createClient()

  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const miniKind = String(formData.get("mini_kind") ?? "update") as MiniKind
  const published = formData.get("published") === "on"

  if (!title || !body) return { error: "Title and body are required." }

  const { error } = await supabase.from("posts").insert({
    kind: "mini",
    title,
    body,
    mini_kind: miniKind,
    event_date: new Date().toISOString(),
    published,
    author_id: admin.id,
  })

  if (error) return { error: error.message }

  revalidatePath("/")
  return { success: "Announcement posted." }
}

export async function addEventAttendeeAction(
  eventId: string,
  userId: string
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()
  const { error } = await supabase
    .from("event_attendees")
    .upsert({ event_id: eventId, user_id: userId })

  if (error) return { error: error.message }
  revalidatePath(`/event/${eventId}`)
  revalidatePath(`/profile/${userId}`)
  return { success: "Attendee added." }
}

export async function saveEventBoardOrderAction(
  eventId: string,
  lineupIds: string[]
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  if (lineupIds.length > 10) {
    return { error: "Maximum 10 boards." }
  }

  const supabase = await createClient()

  const { error: deleteError } = await supabase
    .from("event_board_order")
    .delete()
    .eq("event_id", eventId)

  if (deleteError) return { error: deleteError.message }

  if (lineupIds.length > 0) {
    const { error: insertError } = await supabase
      .from("event_board_order")
      .insert(
        lineupIds.map((userId, index) => ({
          event_id: eventId,
          user_id: userId,
          board_number: index + 1,
        }))
      )

    if (insertError) return { error: insertError.message }
  }

  revalidatePath(`/event/${eventId}`)
  revalidatePath("/calendar")
  return { success: "Event board order updated." }
}

export async function saveBoardOrderAction(
  lineupIds: string[]
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  if (lineupIds.length > 10) {
    return { error: "Maximum 10 boards." }
  }

  const supabase = await createClient()
  const { data: profiles, error: fetchError } = await supabase
    .from("profiles")
    .select("id")

  if (fetchError) return { error: fetchError.message }

  for (const profile of profiles ?? []) {
    const index = lineupIds.indexOf(profile.id)
    const board_number = index === -1 ? null : index + 1
    const { error } = await supabase
      .from("profiles")
      .update({ board_number })
      .eq("id", profile.id)
    if (error) return { error: error.message }
  }

  revalidatePath("/board-order")
  return { success: "Board order updated." }
}
