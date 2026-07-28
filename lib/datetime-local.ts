import { parseClubDateTimeParts } from "@/lib/club-datetime"

/** @deprecated Prefer ClubDateTimePicker and club-datetime helpers. */
export function toDatetimeLocalValue(iso: string) {
  const parts = parseClubDateTimeParts(iso)
  if (!parts) return ""
  return `${parts.date.getFullYear()}-${String(parts.date.getMonth() + 1).padStart(2, "0")}-${String(parts.date.getDate()).padStart(2, "0")}T${parts.time}`
}
