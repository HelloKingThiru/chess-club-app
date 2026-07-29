import {
  computePinnedUntil,
} from "@/lib/post-visibility"
import type { Post } from "@/lib/types/posts"

export type AnnouncementPinStrategy = "duration" | "scheduled" | "until_removed"

export type AnnouncementPinFields = {
  pinned_from: string | null
  pinned_until: string | null
  pin_indefinite: boolean
}

export function inferAnnouncementPinStrategy(
  post: Pick<Post, "pin_indefinite" | "pinned_from" | "pinned_until">
): AnnouncementPinStrategy {
  if (post.pin_indefinite ?? false) return "until_removed"
  if (post.pinned_from) return "scheduled"
  return "duration"
}

export function parseAnnouncementPin(
  formData: FormData
): AnnouncementPinFields | { error: string } {
  const strategy = String(
    formData.get("pin_strategy") ?? "duration"
  ) as AnnouncementPinStrategy

  if (strategy === "duration") {
    const preset = String(formData.get("pin_preset") ?? "1w")
    const until = computePinnedUntil("preset", preset, "")
    if (!until) return { error: "Choose a pin duration." }
    return {
      pinned_from: null,
      pinned_until: until,
      pin_indefinite: false,
    }
  }

  if (strategy === "scheduled") {
    const start = String(formData.get("pin_start") ?? "").trim()
    const end = String(formData.get("pin_end") ?? "").trim()
    if (!start || !end) {
      return { error: "Choose when the pin starts and when it ends." }
    }
    const startDate = new Date(start)
    const endDate = new Date(end)
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: "Invalid schedule times." }
    }
    if (endDate.getTime() <= startDate.getTime()) {
      return { error: "End time must be after start time." }
    }
    return {
      pinned_from: startDate.toISOString(),
      pinned_until: endDate.toISOString(),
      pin_indefinite: false,
    }
  }

  if (strategy === "until_removed") {
    return {
      pinned_from: null,
      pinned_until: null,
      pin_indefinite: true,
    }
  }

  return { error: "Choose how this announcement is pinned." }
}
