import Link from "next/link"
import { ArrowRight, Users } from "lucide-react"

import { ArchiveAllPreviousButton } from "@/components/admin/archive-all-previous-button"
import { ComingUpSection } from "@/components/events/coming-up-section"
import { EventDialog } from "@/components/posts/event-dialog"
import { UpcomingEventCard } from "@/components/events/upcoming-event-card"
import { PageSection } from "@/components/page-shell"
import { Button } from "@/components/ui/button"
import type { Post } from "@/lib/types/posts"

type AdminEventsSectionProps = {
  upcoming: Post[]
  pastOrDraftEvents: Post[]
  archivedEvents: Post[]
  attendeeCounts: Record<string, number>
  enrolledIds: Set<string>
}

export function AdminEventsSection({
  upcoming,
  pastOrDraftEvents,
  archivedEvents,
  attendeeCounts,
  enrolledIds,
}: AdminEventsSectionProps) {
  return (
    <PageSection
      title="Manage events"
      description="Same event cards members see on Home and Calendar. Archive past events to hide them from members."
      icon={Users}
      action={
        <div className="flex flex-wrap gap-2">
          <ArchiveAllPreviousButton />
          <EventDialog />
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">
              Open calendar
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <ComingUpSection
          embedded
          events={upcoming}
          attendeeCounts={attendeeCounts}
          enrolledIds={[...enrolledIds]}
          editable
        />

        {pastOrDraftEvents.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              Past & drafts
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pastOrDraftEvents.map((event) => (
                <UpcomingEventCard
                  key={event.id}
                  event={event}
                  attendeeCount={attendeeCounts[event.id] ?? 0}
                  isEnrolled={enrolledIds.has(event.id)}
                  editable
                />
              ))}
            </div>
          </div>
        ) : null}

        {archivedEvents.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">Archived</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedEvents.map((event) => (
                <UpcomingEventCard
                  key={event.id}
                  event={event}
                  attendeeCount={attendeeCounts[event.id] ?? 0}
                  isEnrolled={enrolledIds.has(event.id)}
                  editable
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </PageSection>
  )
}
