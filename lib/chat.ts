import { formatInTimeZone } from "date-fns-tz"

import { formatGradeLevel } from "@/lib/grade-level"
import { CLUB_TIMEZONE } from "@/lib/club-datetime"

function clubDayKey(date: Date) {
  return formatInTimeZone(date, CLUB_TIMEZONE, "yyyy-MM-dd")
}

function clubNow() {
  return new Date()
}

export function chatInitials(name: string | null, email: string) {
  const source = name?.trim() || email
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function formatMessageTime(iso: string) {
  const date = new Date(iso)
  const now = clubNow()

  if (clubDayKey(date) === clubDayKey(now)) {
    return formatInTimeZone(date, CLUB_TIMEZONE, "h:mm a")
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (clubDayKey(date) === clubDayKey(yesterday)) {
    return `Yesterday ${formatInTimeZone(date, CLUB_TIMEZONE, "h:mm a")}`
  }

  return formatInTimeZone(date, CLUB_TIMEZONE, "MMM d, h:mm a")
}

export function formatThreadPreviewTime(iso: string | null) {
  if (!iso) return ""

  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "Now"
  if (diffMin < 60) return `${diffMin}m`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d`

  return formatInTimeZone(date, CLUB_TIMEZONE, "MMM d")
}

export function formatDayDivider(iso: string) {
  const date = new Date(iso)
  const now = clubNow()

  if (clubDayKey(date) === clubDayKey(now)) return "Today"

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (clubDayKey(date) === clubDayKey(yesterday)) return "Yesterday"

  return formatInTimeZone(date, CLUB_TIMEZONE, "EEEE, MMMM d")
}

export function memberSubtitle({
  gradeLevel,
  boardNumber,
}: {
  gradeLevel: number | null
  boardNumber: number | null
}) {
  const parts: string[] = []
  const grade = formatGradeLevel(gradeLevel)
  if (grade !== "Not set") parts.push(grade)
  if (boardNumber) parts.push(`Board ${boardNumber}`)
  return parts.join(" · ") || "Club member"
}

export function adminThreadSubtitle(adminName?: string | null) {
  if (adminName?.trim()) {
    return `Direct line to ${adminName.trim()}`
  }
  return "Club admin"
}

/** Unread when someone else sent the latest message after the user last opened the thread. */
export function isChatThreadUnread(
  thread: {
    lastMessageAt: string | null
    lastMessageSenderId: string | null
    lastReadAt?: string | null
  },
  userId: string
): boolean {
  if (!thread.lastMessageAt || !thread.lastMessageSenderId) return false
  if (thread.lastMessageSenderId === userId) return false
  if (!thread.lastReadAt) return true
  return (
    new Date(thread.lastMessageAt).getTime() >
    new Date(thread.lastReadAt).getTime()
  )
}
