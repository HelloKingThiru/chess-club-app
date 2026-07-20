"use client"

import Link from "next/link"
import { ArrowRight, Check, MapPin, Users } from "lucide-react"

import { eventTypeColors } from "@/lib/event-type-styles"
import { isArchived } from "@/lib/post-visibility"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels } from "@/lib/types/posts"
import { formatEventDateTime, isEventPast } from "@/lib/upcoming-events"
import { PostActionsMenu } from "@/components/posts/post-actions-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type UpcomingEventCardProps = {
  event: Post
  attendeeCount?: number
  isEnrolled?: boolean
  compact?: boolean
  editable?: boolean
}

export function UpcomingEventCard({
  event,
  attendeeCount = 0,
  isEnrolled = false,
  compact = false,
  editable = false,
}: UpcomingEventCardProps) {
  const colors = event.event_type ? eventTypeColors[event.event_type] : null
  const archived = isArchived(event)
  const isPast = isEventPast(event.event_date)

  if (compact) {
    return (
      <Link
        href={`/event/${event.id}`}
        className={cn(
          "group block rounded-xl border bg-card p-3 transition-colors hover:bg-accent/50",
          colors && "border-l-4",
          colors?.accent
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          {event.event_type ? (
            <Badge variant="secondary" className={cn("text-xs", colors?.text)}>
              {eventTypeLabels[event.event_type]}
            </Badge>
          ) : null}
          {isEnrolled ? (
            <Badge variant="outline" className="gap-1 text-xs text-primary">
              <Check className="size-3" />
              Enrolled
            </Badge>
          ) : null}
          <span className="font-medium">{event.title}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatEventDateTime(event.event_date)}
        </p>
        <UpcomingEventMeta
          location={event.location}
          attendeeCount={attendeeCount}
          className="mt-1 text-xs"
        />
      </Link>
    )
  }

  return (
    <Card
      className={cn(
        "flex h-full flex-col transition-colors hover:bg-accent/30",
        colors && "border-l-4",
        colors?.accent,
        archived && editable && "opacity-75"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {event.event_type ? (
                <Badge variant="secondary" className={cn(colors?.text)}>
                  {eventTypeLabels[event.event_type]}
                </Badge>
              ) : null}
              {isEnrolled ? (
                <Badge variant="outline" className="gap-1 text-primary">
                  <Check className="size-3" />
                  You&apos;re enrolled
                </Badge>
              ) : null}
              {editable && !event.published ? (
                <Badge variant="outline">Draft</Badge>
              ) : null}
              {editable && archived ? (
                <Badge variant="outline">Archived</Badge>
              ) : null}
              {editable && isPast && event.published && !archived ? (
                <Badge variant="outline">Past</Badge>
              ) : null}
            </div>
            <CardTitle className="text-lg leading-snug">{event.title}</CardTitle>
            <CardDescription>
              {formatEventDateTime(event.event_date, "long")}
            </CardDescription>
          </div>
          {editable ? <PostActionsMenu post={event} kind="specific" /> : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <UpcomingEventMeta location={event.location} attendeeCount={attendeeCount} />
      </CardContent>
      <CardFooter className="flex w-full flex-col items-stretch gap-2 sm:flex-row">
        <Button className="w-full sm:flex-1" variant="default" size="sm" asChild>
          <Link href={`/event/${event.id}`}>
            {editable
              ? "Open event"
              : isEnrolled
                ? "View event details"
                : "View"}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function UpcomingEventMeta({
  location,
  attendeeCount,
  className,
}: {
  location: string | null
  attendeeCount: number
  className?: string
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-sm text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1">
        <Users className="size-3.5" />
        {attendeeCount} attending
      </span>
      {location ? (
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {location}
        </span>
      ) : null}
    </div>
  )
}
