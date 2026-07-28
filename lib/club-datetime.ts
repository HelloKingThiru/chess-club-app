import { formatInTimeZone, fromZonedTime } from "date-fns-tz"

import { siteConfig } from "@/lib/site-config"

export const CLUB_TIMEZONE = siteConfig.timeZone

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/

export function clubDateKey(isoOrDate: string | Date) {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate
  if (Number.isNaN(date.getTime())) return ""
  return formatInTimeZone(date, CLUB_TIMEZONE, "yyyy-MM-dd")
}

export function formatClubDateTime(iso: string, style: "short" | "long" = "short") {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""

  if (style === "long") {
    return formatInTimeZone(date, CLUB_TIMEZONE, "EEEE, MMMM d, yyyy · h:mm a")
  }

  return formatInTimeZone(date, CLUB_TIMEZONE, "EEE, MMM d · h:mm a")
}

export function formatClubDate(date: Date) {
  return formatInTimeZone(date, CLUB_TIMEZONE, "EEEE, MMMM d, yyyy")
}

export function formatClubTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return formatInTimeZone(date, CLUB_TIMEZONE, "h:mm a")
}

export function parseClubDateTimeParts(iso: string | undefined | null) {
  if (!iso?.trim()) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null

  const stamp = formatInTimeZone(date, CLUB_TIMEZONE, "yyyy-MM-dd HH:mm")
  const [datePart, timePart] = stamp.split(" ")
  const [year, month, day] = datePart.split("-").map(Number)

  return {
    date: new Date(year, month - 1, day),
    time: timePart,
  }
}

export function clubLocalToIso(date: Date, time: string) {
  const match = TIME_PATTERN.exec(time)
  if (!match) return ""

  const datePart = formatInTimeZone(date, CLUB_TIMEZONE, "yyyy-MM-dd")
  const hour = Number(match[1])
  const minute = Number(match[2])
  const pad = (value: number) => String(value).padStart(2, "0")

  const wallClock = `${datePart}T${pad(hour)}:${pad(minute)}:00`
  const utc = fromZonedTime(wallClock, CLUB_TIMEZONE)
  if (Number.isNaN(utc.getTime())) return ""
  return utc.toISOString()
}

export function clubTodayYmd() {
  return clubDateKey(new Date())
}

export function clubDefaultIsoForDay(date: Date, hour = 15, minute = 30) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return clubLocalToIso(date, `${pad(hour)}:${pad(minute)}`)
}

export function buildClubTimeOptions(stepMinutes = 15) {
  const options: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += stepMinutes) {
      const pad = (value: number) => String(value).padStart(2, "0")
      options.push(`${pad(hour)}:${pad(minute)}`)
    }
  }
  return options
}

export function formatClubTimeOption(time24: string) {
  const match = TIME_PATTERN.exec(time24)
  if (!match) return time24
  const hour = Number(match[1])
  const minute = Number(match[2])
  const period = hour >= 12 ? "PM" : "AM"
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${hour12}:${pad(minute)} ${period}`
}
