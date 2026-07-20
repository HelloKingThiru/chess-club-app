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
  if (style === "long") {
    return new Date(date).toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  return new Date(date).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}
