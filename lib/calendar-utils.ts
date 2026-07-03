export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function addMonths(date: Date, count: number) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

export function parseEventDate(iso: string) {
  return new Date(iso)
}

/** Sunday-start calendar grid cells for a month view. */
export function buildMonthGrid(viewMonth: Date) {
  const first = startOfMonth(viewMonth)
  const start = new Date(first)
  start.setDate(first.getDate() - first.getDay())

  const cells: Date[] = []
  for (let i = 0; i < 42; i++) {
    const day = new Date(start)
    day.setDate(start.getDate() + i)
    cells.push(day)
  }
  return cells
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" })
}

export function dayLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
}
