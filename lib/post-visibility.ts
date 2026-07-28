import { formatClubDateTime } from "@/lib/club-datetime"
import type { Post } from "@/lib/types/posts"

export function isArchived(post: Pick<Post, "archived_at">) {
  return post.archived_at != null
}

export function isPinned(
  post: Pick<Post, "pinned_from" | "pinned_until" | "pin_indefinite">,
  now = Date.now()
) {
  const time = now

  if (post.pin_indefinite ?? false) {
    if (post.pinned_from && new Date(post.pinned_from).getTime() > time) {
      return false
    }
    return true
  }

  if (!post.pinned_until) return false
  if (new Date(post.pinned_until).getTime() <= time) return false
  if (post.pinned_from && new Date(post.pinned_from).getTime() > time) {
    return false
  }
  return true
}

export function isVisibleToMembers(post: Post, now = Date.now()) {
  if (!post.published || isArchived(post)) return false
  if (post.kind === "mini") return isPinned(post, now)
  return true
}

export function filterMemberAnnouncements(posts: Post[], now = Date.now()) {
  return posts
    .filter((post) => post.kind === "mini" && isVisibleToMembers(post, now))
    .sort((a, b) => {
      const pinDiff =
        new Date(b.pinned_until ?? b.pinned_from ?? 0).getTime() -
        new Date(a.pinned_until ?? a.pinned_from ?? 0).getTime()
      if (pinDiff !== 0) return pinDiff
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
}

export function filterMemberEvents(posts: Post[], now = Date.now()) {
  return posts.filter(
    (post) => post.kind === "specific" && isVisibleToMembers(post, now)
  )
}

export function formatPinnedUntil(pinnedUntil: string) {
  const formatted = formatClubDateTime(pinnedUntil, "short")
  return formatted || "soon"
}

export function describeAnnouncementPin(
  post: Pick<
    Post,
    "pin_indefinite" | "pinned_from" | "pinned_until"
  >,
  now = Date.now()
) {
  const active = isPinned(post, now)

  if (post.pin_indefinite ?? false) {
    if (post.pinned_from && new Date(post.pinned_from).getTime() > now) {
      return {
        active: false,
        label: `Pins ${formatClubDateTime(post.pinned_from)}`,
      }
    }
    return { active: true, label: "Pinned until removed" }
  }

  if (post.pinned_from && post.pinned_until) {
    if (!active && new Date(post.pinned_from).getTime() > now) {
      return {
        active: false,
        label: `Pins ${formatClubDateTime(post.pinned_from)}`,
      }
    }
    if (!active) {
      return { active: false, label: "Not on home" }
    }
    return {
      active: true,
      label: `Pinned until ${formatClubDateTime(post.pinned_until)}`,
    }
  }

  if (post.pinned_until) {
    if (!active) return { active: false, label: "Not on home" }
    return {
      active: true,
      label: `Pinned until ${formatClubDateTime(post.pinned_until)}`,
    }
  }

  return { active: false, label: "Not on home" }
}

export type PinPreset = "1d" | "3d" | "1w" | "2w"

export const pinPresetLabels: Record<PinPreset, string> = {
  "1d": "1 day",
  "3d": "3 days",
  "1w": "1 week",
  "2w": "2 weeks",
}

export function computePinnedUntil(
  pinMode: string,
  pinPreset: string,
  pinUntil: string
): string | null {
  if (pinMode === "none") return null
  if (pinMode === "custom") {
    if (!pinUntil.trim()) return null
    const date = new Date(pinUntil)
    if (Number.isNaN(date.getTime())) return null
    return date.toISOString()
  }
  if (pinMode === "preset") {
    const preset = pinPreset as PinPreset
    const now = Date.now()
    const offsets: Record<PinPreset, number> = {
      "1d": 24 * 60 * 60 * 1000,
      "3d": 3 * 24 * 60 * 60 * 1000,
      "1w": 7 * 24 * 60 * 60 * 1000,
      "2w": 14 * 24 * 60 * 60 * 1000,
    }
    const offset = offsets[preset]
    if (!offset) return null
    return new Date(now + offset).toISOString()
  }
  return null
}

export function shouldBulkArchive(post: Post, now = Date.now()) {
  if (!post.published || isArchived(post)) return false
  if (post.kind === "specific") {
    return new Date(post.event_date).getTime() < now
  }
  if (post.kind === "mini") {
    return !isPinned(post, now)
  }
  return false
}
