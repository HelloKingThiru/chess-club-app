"use server"

import { revalidatePath } from "next/cache"

import { assertAdminTools } from "@/lib/admin-mode"
import { requireProfile } from "@/lib/auth"
import {
  computePinnedUntil,
  shouldBulkArchive,
} from "@/lib/post-visibility"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"
import type { EventType, MiniKind, Post } from "@/lib/types/posts"

function parsePinnedUntil(formData: FormData, published: boolean) {
  if (!published) return null
  const pinMode = String(formData.get("pin_mode") ?? "none")
  const pinPreset = String(formData.get("pin_preset") ?? "1w")
  const pinUntil = String(formData.get("pin_until") ?? "")
  return computePinnedUntil(pinMode, pinPreset, pinUntil)
}

function revalidatePostPaths(kind: Post["kind"], postId?: string) {
  revalidatePath("/")
  revalidatePath("/admin")
  if (kind === "specific") {
    revalidatePath("/calendar")
    if (postId) revalidatePath(`/event/${postId}`)
  }
}

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

  const { data, error } = await supabase.from("posts").insert({
    kind: "specific",
    title,
    body,
    event_type: eventType,
    event_date: new Date(eventDate).toISOString(),
    location: location || null,
    published,
    author_id: admin.id,
  }).select("id, title, event_date, location").single()

  if (error) return { error: error.message }

  if (published && data) {
    void import("@/lib/notifications/dispatch").then(({ notifyNewEvent }) =>
      notifyNewEvent({
        id: data.id,
        title: data.title,
      })
    )
  }

  revalidatePath("/")
  revalidatePath("/calendar")
  revalidatePath("/admin")
  return { success: "Event created." }
}

export async function updateSpecificPostAction(
  postId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
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

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing || existing.kind !== "specific") {
    return { error: "Event not found." }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      body,
      event_type: eventType,
      event_date: new Date(eventDate).toISOString(),
      location: location || null,
      published,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/calendar")
  revalidatePath("/admin")
  revalidatePath(`/event/${postId}`)
  return { success: "Event updated." }
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
  const pinnedUntil = parsePinnedUntil(formData, published)

  if (!title || !body) return { error: "Title and body are required." }

  const { error } = await supabase.from("posts").insert({
    kind: "mini",
    title,
    body,
    mini_kind: miniKind,
    event_date: new Date().toISOString(),
    published,
    pinned_until: pinnedUntil,
    author_id: admin.id,
  })

  if (error) return { error: error.message }

  if (published) {
    void import("@/lib/notifications/dispatch").then(({ notifyNewAnnouncement }) =>
      notifyNewAnnouncement({ title, body })
    )
  }

  revalidatePath("/")
  revalidatePath("/admin")
  return { success: "Announcement posted." }
}

export async function updateMiniPostAction(
  postId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const title = String(formData.get("title") ?? "").trim()
  const body = String(formData.get("body") ?? "").trim()
  const miniKind = String(formData.get("mini_kind") ?? "update") as MiniKind
  const published = formData.get("published") === "on"
  const pinnedUntil = parsePinnedUntil(formData, published)

  if (!title || !body) return { error: "Title and body are required." }

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing || existing.kind !== "mini") {
    return { error: "Announcement not found." }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      title,
      body,
      mini_kind: miniKind,
      published,
      pinned_until: pinnedUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/admin")
  return { success: "Announcement updated." }
}

export async function deletePostAction(postId: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: "Post not found." }

  const { error } = await supabase.from("posts").delete().eq("id", postId)
  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/calendar")
  revalidatePath("/admin")
  if (existing.kind === "specific") {
    revalidatePath(`/event/${postId}`)
  }

  return {
    success:
      existing.kind === "specific" ? "Event deleted." : "Announcement deleted.",
  }
}

export async function archivePostAction(postId: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind, archived_at")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: "Post not found." }
  if (existing.archived_at) return { success: "Already archived." }

  const { error } = await supabase
    .from("posts")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePostPaths(existing.kind as Post["kind"], postId)
  return {
    success:
      existing.kind === "specific" ? "Event archived." : "Announcement archived.",
  }
}

export async function unarchivePostAction(postId: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing) return { error: "Post not found." }

  const { error } = await supabase
    .from("posts")
    .update({
      archived_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePostPaths(existing.kind as Post["kind"], postId)
  return {
    success:
      existing.kind === "specific"
        ? "Event restored."
        : "Announcement restored.",
  }
}

export async function archiveAllPreviousAction(): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { data: posts, error: fetchError } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .is("archived_at", null)

  if (fetchError) return { error: fetchError.message }

  const toArchive = ((posts ?? []) as Post[]).filter(shouldBulkArchive)
  if (toArchive.length === 0) {
    return { success: "Nothing to archive." }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("posts")
    .update({ archived_at: now, updated_at: now })
    .in(
      "id",
      toArchive.map((post) => post.id)
    )

  if (error) return { error: error.message }

  revalidatePath("/")
  revalidatePath("/calendar")
  revalidatePath("/admin")
  return {
    success: `Archived ${toArchive.length} post${toArchive.length === 1 ? "" : "s"}.`,
  }
}

export async function pinPostAction(
  postId: string,
  pinnedUntil: string
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const date = new Date(pinnedUntil)
  if (Number.isNaN(date.getTime())) {
    return { error: "Invalid pin date." }
  }
  if (date.getTime() <= Date.now()) {
    return { error: "Pin must expire in the future." }
  }

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing || existing.kind !== "mini") {
    return { error: "Announcement not found." }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      pinned_until: date.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePostPaths("mini", postId)
  return { success: "Announcement pinned." }
}

export async function unpinPostAction(postId: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }
  const supabase = await createClient()

  const { data: existing, error: existingError } = await supabase
    .from("posts")
    .select("id, kind")
    .eq("id", postId)
    .maybeSingle()

  if (existingError) return { error: existingError.message }
  if (!existing || existing.kind !== "mini") {
    return { error: "Announcement not found." }
  }

  const { error } = await supabase
    .from("posts")
    .update({
      pinned_until: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)

  if (error) return { error: error.message }

  revalidatePostPaths("mini", postId)
  return { success: "Announcement unpinned." }
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

async function validateEnrollableEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string
): Promise<ActionState | null> {
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, kind, published, event_date, archived_at")
    .eq("id", eventId)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!post || post.kind !== "specific" || !post.published || post.archived_at) {
    return { error: "This event is not available for enrollment." }
  }

  return null
}

export async function joinEventAction(eventId: string): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const validationError = await validateEnrollableEvent(supabase, eventId)
  if (validationError) return validationError

  const { data: eventPost } = await supabase
    .from("posts")
    .select("title, event_date")
    .eq("id", eventId)
    .maybeSingle()

  const { error } = await supabase.from("event_attendees").upsert({
    event_id: eventId,
    user_id: profile.id,
  })

  if (error) return { error: error.message }

  if (eventPost) {
    void import("@/lib/notifications/dispatch").then(({ notifyEnrollment }) =>
      notifyEnrollment({
        userId: profile.id,
        eventId,
        title: eventPost.title,
      })
    )
  }

  revalidatePath(`/event/${eventId}`)
  revalidatePath(`/profile/${profile.id}`)
  revalidatePath("/")
  revalidatePath("/calendar")
  return { success: "You're enrolled!" }
}

export async function leaveEventAction(eventId: string): Promise<ActionState> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { error: attendeeError } = await supabase
    .from("event_attendees")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", profile.id)

  if (attendeeError) return { error: attendeeError.message }

  await supabase
    .from("event_board_order")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", profile.id)

  revalidatePath(`/event/${eventId}`)
  revalidatePath(`/profile/${profile.id}`)
  revalidatePath("/")
  revalidatePath("/calendar")
  return { success: "You unenrolled from this event." }
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
