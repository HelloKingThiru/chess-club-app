"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react"

import {
  addMonths,
  buildMonthGrid,
  dateKey,
  dayLabel,
  isSameDay,
  monthLabel,
  parseEventDate,
} from "@/lib/calendar-utils"
import { eventTypeColors } from "@/lib/event-type-styles"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels } from "@/lib/types/posts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

type ClubCalendarProps = {
  events: Post[]
}

export function ClubCalendar({ events }: ClubCalendarProps) {
  const today = useMemo(() => new Date(), [])
  const [viewMonth, setViewMonth] = useState(() => startOfMonthSafe(today))
  const [selected, setSelected] = useState(() => startOfDaySafe(today))

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Post[]>()
    for (const event of events) {
      const day = startOfDaySafe(parseEventDate(event.event_date))
      const key = dateKey(day)
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
  const selectedEvents = eventsByDay.get(dateKey(selected)) ?? []

  const upcoming = useMemo(() => {
    const now = startOfDaySafe(today).getTime()
    return [...events]
      .filter((e) => parseEventDate(e.event_date).getTime() >= now)
      .sort(
        (a, b) =>
          parseEventDate(a.event_date).getTime() -
          parseEventDate(b.event_date).getTime()
      )
      .slice(0, 5)
  }, [events, today])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="overflow-hidden py-0">
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
                setSelected(now)
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
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((name) => (
              <div
                key={name}
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {name}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((day) => {
              const inMonth = day.getMonth() === viewMonth.getMonth()
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, selected)
              const dayEvents = eventsByDay.get(dateKey(day)) ?? []

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => setSelected(startOfDaySafe(day))}
                  className={cn(
                    "flex min-h-14 flex-col items-center rounded-lg border p-1.5 text-left transition-colors sm:min-h-16",
                    inMonth ? "bg-card" : "bg-muted/20 text-muted-foreground",
                    isSelected && "border-primary ring-2 ring-primary/20",
                    !isSelected && "border-transparent hover:bg-muted/50",
                    isToday && !isSelected && "border-primary/40"
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 flex size-6 items-center justify-center rounded-full text-xs font-medium",
                      isToday && "bg-primary text-primary-foreground"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex w-full flex-wrap justify-center gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <span
                        key={event.id}
                        className={cn(
                          "size-1.5 rounded-full",
                          event.event_type
                            ? eventTypeColors[event.event_type].dot
                            : "bg-primary"
                        )}
                      />
                    ))}
                    {dayEvents.length > 3 ? (
                      <span className="text-[10px] text-muted-foreground">
                        +{dayEvents.length - 3}
                      </span>
                    ) : null}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-3 border-t pt-4 text-xs text-muted-foreground">
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <span key={type} className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    eventTypeColors[type as keyof typeof eventTypeColors].dot
                  )}
                />
                {label}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{dayLabel(selected)}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              selectedEvents.map((event) => (
                <EventChip key={event.id} event={event} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Coming up</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events.</p>
            ) : (
              upcoming.map((event) => (
                <EventChip key={event.id} event={event} compact />
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
  const time = parseEventDate(event.event_date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <Link
      href={`/event/${event.id}`}
      className={cn(
        "block rounded-xl border p-3 transition-colors hover:bg-muted/40",
        colors?.border,
        colors?.bg
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
          ? parseEventDate(event.event_date).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
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

function startOfMonthSafe(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function startOfDaySafe(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
