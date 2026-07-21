import { siteConfig } from "@/lib/site-config"

/** Calendar date key (YYYY-MM-DD) in the club timezone. */
export function clubDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: siteConfig.timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function clubDateKeyDaysFromToday(daysFromToday: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return clubDateKey(date)
}

export function eventClubDateKey(eventDateIso: string) {
  return clubDateKey(new Date(eventDateIso))
}
