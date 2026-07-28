"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin } from "lucide-react"

import { EventDialog } from "@/components/posts/event-dialog"
import {
  addMonths,
  buildMonthGrid,
  dateKey,
  dayLabel,
  isSameDay,
  monthLabel,
  parseEventDate,
} from "@/lib/calendar-utils"
import { clubDateKey, clubDefaultIsoForDay, clubTodayYmd, formatClubDateTime, formatClubTime } from "@/lib/club-datetime"
import { eventTypeColors } from "@/lib/event-type-styles"
import { eventTypeLabels } from "@/lib/types/posts"
import type { Post } from "@/lib/types/posts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type ClubCalendarProps = {
  events: Post[]
  canCreateEvent?: boolean
  /** Club-calendar "today" from the server (yyyy-MM-dd) for stable SSR/hydration. */
  initialDayYmd?: string
}

function parseYmd(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function ClubCalendar({
  events,
  canCreateEvent = false,
  initialDayYmd,
}: ClubCalendarProps) {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  const anchorDay = useMemo(() => {
    const ymd = initialDayYmd ?? clubTodayYmd()
    return parseYmd(ymd)
  }, [initialDayYmd])

  const today = anchorDay
  const [viewMonth, setViewMonth] = useState(() => startOfMonthSafe(anchorDay))
  const [selected, setSelected] = useState(() => startOfDaySafe(anchorDay))
  const [panelFlash, setPanelFlash] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const selectedDayRef = useRef<HTMLDivElement>(null)

  function selectDay(day: Date) {
    setSelected(startOfDaySafe(day))
    setPanelFlash(false)
    requestAnimationFrame(() => {
      setPanelFlash(true)
      selectedDayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    })
  }

  useEffect(() => {
    if (!panelFlash) return
    const timeout = window.setTimeout(() => setPanelFlash(false), 700)
    return () => window.clearTimeout(timeout)
  }, [panelFlash])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    for (const event of events) {
      const key = clubDateKey(event.event_date)
      if (!key) continue
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          parseEventDate(a.event_date).getTime() -
          parseEventDate(b.event_date).getTime()
      )
    }
    return map
  }, [events])

  const monthCells = buildMonthGrid(viewMonth)
  const selectedEvents = eventsByDay.get(calendarDayKey(selected)) ?? []
  const selectedPrimaryType = selectedEvents[0]?.event_type
  const selectedFlashColor = selectedPrimaryType
    ? eventTypeFlashColor[selectedPrimaryType]
    : undefined
  const defaultEventIso = clubDefaultIsoForDay(selected, 15, 30)

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="order-2 min-h-[420px] animate-pulse bg-muted/20 lg:order-1" />
        <Card className="order-1 min-h-[320px] animate-pulse bg-muted/20 lg:order-2" />
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="order-2 overflow-hidden py-0 lg:order-1">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b py-4">
          <CardTitle className="text-lg">{monthLabel(viewMonth)}</CardTitle>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const now = startOfDaySafe(today)
                setViewMonth(startOfMonthSafe(now))
                selectDay(now)
              }}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="mb-3 grid grid-cols-7 gap-1.5 sm:gap-2">
            {WEEKDAYS.map((name) => (
              <div
                key={name}
                className="py-1 text-center text-xs font-semibold tracking-wide text-muted-foreground uppercase"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {monthCells.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth()
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, selected)
              const dayEvents = eventsByDay.get(calendarDayKey(day)) ?? []
              const hasEvents = dayEvents.length > 0
              const primaryType = dayEvents[0]?.event_type
              const eventColors = primaryType ? eventTypeColors[primaryType] : null
              const eventTypes = [
                ...new Set(
                  dayEvents
                    .map((event) => event.event_type)
                    .filter((type): type is NonNullable<typeof type> => type != null)
                ),
              ]

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-label={
                    dayEvents.length > 0
                      ? `${dayLabel(day)}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`
                      : dayLabel(day)
                  }
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex min-h-12 flex-col items-center justify-center rounded-xl border p-1.5 text-center transition-all sm:min-h-[5rem] sm:items-start sm:justify-between sm:p-2.5 sm:text-left",
                    inMonth ? "bg-card" : "bg-muted/20 opacity-50",
                    hasEvents && eventColors?.bg,
                    hasEvents && !isSelected && eventColors?.border,
                    hasEvents && eventColors?.cellAccent,
                    isSelected &&
                      (eventColors?.selected ??
                        "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/30"),
                    !isSelected && "hover:border-border hover:bg-accent/40"
                  )}
                >
                  <div className="flex w-full flex-col items-center gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <span
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full text-base font-semibold leading-none sm:size-8 sm:text-lg",
                        isToday &&
                          !isSelected &&
                          "ring-[1.5px] ring-primary/45 ring-inset",
                        !isToday && inMonth && "font-bold text-foreground",
                        !isToday && !inMonth && "font-bold text-muted-foreground",
                        isToday && inMonth && "text-foreground",
                        isToday && !inMonth && "text-muted-foreground",
                        !isToday && hasEvents && eventColors?.text
                      )}
                    >
                      {day.getDate()}
                    </span>
                  </div>

                  {hasEvents ? (
                    <>
                      <div className="mt-1 flex justify-center gap-0.5 sm:hidden">
                        {eventTypes.slice(0, 3).map((type) => (
                          <span
                            key={type}
                            className={cn(
                              "size-1.5 rounded-full",
                              eventTypeColors[type].dot
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-1 hidden w-full space-y-1 sm:block">
                        {dayEvents.length === 1 && primaryType ? (
                          <span
                            className={cn(
                              "block truncate text-[11px] font-medium leading-tight",
                              eventColors?.text
                            )}
                          >
                            {eventTypeLabels[primaryType]}
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {eventTypes.map((type) => (
                              <span
                                key={type}
                                className={cn(
                                  "size-2 rounded-full",
                                  eventTypeColors[type].dot
                                )}
                                title={eventTypeLabels[type]}
                              />
                            ))}
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {dayEvents.length} events
                            </span>
                          </div>
                        )}
                      </div>
                    </>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t pt-4">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <span
                key={type}
                className="inline-flex items-center gap-2 text-xs font-medium text-foreground"
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full",
                    eventTypeColors[type as keyof typeof eventTypeColors].dot
                  )}
                />
                {label}
              </span>
            ))}
            <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ring-[1.5px] ring-primary/45 ring-inset">
                7
              </span>
              Today
            </span>
          </div>
        </CardContent>
      </Card>

      <div ref={selectedDayRef} className="order-1 scroll-mt-16 lg:order-2">
        <Card
          className={cn(
            "transition-[box-shadow,background-color,border-color]",
            panelFlash && "calendar-panel-flash"
          )}
          style={
            panelFlash && selectedFlashColor
              ? ({ "--flash-color": selectedFlashColor } as CSSProperties)
              : undefined
          }
        >
          <CardHeader className="space-y-3 pb-2">
            <CardTitle className="text-base">
              {dayLabel(selected)}
              {selectedEvents.length > 0
                ? ` · ${selectedEvents.length} event${selectedEvents.length === 1 ? "" : "s"}`
                : ""}
            </CardTitle>
            {canCreateEvent ? (
              <>
                <EventDialog
                  hideTrigger
                  open={createOpen}
                  onOpenChange={setCreateOpen}
                  defaultEventIso={defaultEventIso}
                />
                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  <CalendarPlus className="size-4" />
                  Schedule on this day
                </Button>
              </>
            ) : null}
          </CardHeader>
          <CardContent
            key={dateKey(selected)}
            className="space-y-2 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-300"
          >
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled. Pick another day or check Coming up below.
              </p>
            ) : (
              selectedEvents.map((event) => (
                <EventChip key={event.id} event={event} />
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EventChip({ event, compact }: { event: Post; compact?: boolean }) {
  const colors = event.event_type ? eventTypeColors[event.event_type] : null
  const time = formatClubTime(event.event_date)

  return (
    <Link
      href={`/event/${event.id}`}
      className={cn(
        "block rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50",
        colors?.chipAccent
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        {event.event_type ? (
          <Badge variant="secondary" className={cn("text-xs", colors?.text)}>
            {eventTypeLabels[event.event_type]}
          </Badge>
        ) : null}
        <span className="font-medium">{event.title}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {compact
          ? formatClubDateTime(event.event_date, "short")
          : time}
        {event.location ? (
          <span className="mt-1 flex items-center gap-1">
            {!compact ? " · " : null}
            <MapPin className="inline size-3" />
            {event.location}
          </span>
        ) : null}
      </p>
    </Link>
  )
}

function calendarDayKey(day: Date) {
  const month = String(day.getMonth() + 1).padStart(2, "0")
  const date = String(day.getDate()).padStart(2, "0")
  return `${day.getFullYear()}-${month}-${date}`
}

function startOfMonthSafe(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDaySafe(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const eventTypeFlashColor: Record<
  NonNullable<Post["event_type"]>,
  string
> = {
  club_meet: "oklch(0.62 0.19 230)",
  league_game: "oklch(0.75 0.18 75)",
  tournament: "oklch(0.58 0.22 300)",
  fundraiser: "oklch(0.65 0.17 155)",
}
