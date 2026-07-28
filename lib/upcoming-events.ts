import { formatClubDateTime } from "@/lib/club-datetime"
import type { Post } from "@/lib/types/posts"

export function isEventPast(eventDate: string, now = Date.now()) {
  return new Date(eventDate).getTime() < now
}

export function getUpcomingEvents(events: Post[], now = Date.now()) {
  return events
    .filter(
      (event) =>
        !event.archived_at &&
        new Date(event.event_date).getTime() >= now
    )
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
}

export function formatEventDateTime(date: string, style: "short" | "long" = "short") {
  return formatClubDateTime(date, style)
}
