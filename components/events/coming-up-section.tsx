import Link from "next/link"
import { Calendar } from "lucide-react"

import type { Post } from "@/lib/types/posts"
import { EmptyState, PageSection } from "@/components/page-shell"
import { UpcomingEventCard } from "@/components/events/upcoming-event-card"
import { Button } from "@/components/ui/button"

type ComingUpSectionProps = {
  events: Post[]
  attendeeCounts: Record<string, number>
  enrolledIds: Iterable<string>
  showCalendarLink?: boolean
  editable?: boolean
  embedded?: boolean
}

export function ComingUpSection({
  events,
  attendeeCounts,
  enrolledIds,
  showCalendarLink = false,
  editable = false,
  embedded = false,
}: ComingUpSectionProps) {
  const enrolledSet = new Set(enrolledIds)

  const content =
    events.length === 0 ? (
      <EmptyState
        title="No events scheduled yet"
        description="Check back soon, or open the calendar to browse the full schedule."
        action={
          showCalendarLink ? (
            <Button variant="outline" asChild>
              <Link href="/calendar">Go to calendar</Link>
            </Button>
          ) : undefined
        }
      />
    ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <UpcomingEventCard
            key={event.id}
            event={event}
            attendeeCount={attendeeCounts[event.id] ?? 0}
            isEnrolled={enrolledSet.has(event.id)}
            editable={editable}
          />
        ))}
      </div>
    )

  if (embedded) return content

  return (
    <PageSection
      title="Coming up"
      description={
        editable
          ? "Edit events here, or open one to manage attendees."
          : "Tap an event to see details and enroll."
      }
      icon={Calendar}
      action={
        showCalendarLink ? (
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">
              <Calendar className="size-4" />
              Open full calendar
            </Link>
          </Button>
        ) : undefined
      }
    >
      {content}
    </PageSection>
  )
}
