import { notFound } from "next/navigation"
import { Calendar, MapPin, Users } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { eventBoardPlayerFromAttendeeRow } from "@/lib/event-attendees"
import { PostActionsMenu } from "@/components/posts/post-actions-menu"
import { EventAttendeesSection } from "@/components/events/event-attendees-section"
import { EventEnrollmentButton } from "@/components/events/event-enrollment-button"
import { PageBreadcrumb, PageSection, PageShell } from "@/components/page-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Profile } from "@/lib/types/auth"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels } from "@/lib/types/posts"
import { isEventPast } from "@/lib/upcoming-events"
import { formatClubDateTime } from "@/lib/club-datetime"
import type { EventBoardPlayer } from "@/lib/board-order"

type EventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const currentUser = await getProfile()
  const showAdmin = await canUseAdminTools(currentUser)
  const showMemberFeatures = Boolean(currentUser)
  const supabase = await createClient()

  const { data: postRow } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!postRow || postRow.kind !== "specific") notFound()
  const post = postRow as Post

  let attendees: EventBoardPlayer[] = []
  let allProfiles: Profile[] = []

  if (showMemberFeatures) {
    const { data: attendeeRows } = await supabase
      .from("event_attendees")
      .select(
        "id, user_id, display_name, profiles(id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at)"
      )
      .eq("event_id", id)

    const { data: boardRows } = await supabase
      .from("event_board_order")
      .select("user_id, board_number")
      .eq("event_id", id)

    const boardByUser = new Map(
      (boardRows ?? []).map((row) => [row.user_id as string, row.board_number as number])
    )

    type AttendeeRow = {
      id: string
      user_id: string | null
      display_name: string | null
      profiles: Profile | Profile[] | null
    }

    attendees = ((attendeeRows ?? []) as AttendeeRow[]).map((row) =>
      eventBoardPlayerFromAttendeeRow(
        row,
        row.user_id ? (boardByUser.get(row.user_id) ?? null) : null
      )
    )
      .sort((a, b) => {
        const aBoard = a.eventBoard ?? a.board_number ?? 999
        const bBoard = b.eventBoard ?? b.board_number ?? 999
        if (aBoard !== bBoard) return aBoard - bBoard
        const aName = a.full_name || a.email || ""
        const bName = b.full_name || b.email || ""
        return aName.localeCompare(bName)
      })
  }

  if (showAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at"
      )
      .order("full_name")
    allProfiles = (data ?? []) as Profile[]
  }

  const isAttending = currentUser
    ? attendees.some(
        (attendee) =>
          !attendee.memberDeleted && attendee.id === currentUser.id
      )
    : false
  const isPast = isEventPast(post.event_date)

  return (
    <PageShell className="space-y-8">
      <PageBreadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Calendar", href: "/calendar" },
          { label: post.title },
        ]}
      />

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {post.event_type ? (
                <Badge>{eventTypeLabels[post.event_type]}</Badge>
              ) : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" />
                {formatClubDateTime(post.event_date, "long")}
              </span>
              {post.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  {post.location}
                </span>
              ) : null}
              {showMemberFeatures ? (
                <span className="inline-flex items-center gap-1.5">
                  <Users className="size-4 text-primary" />
                  {attendees.length} attending
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-start gap-2">
            {showAdmin ? (
              <PostActionsMenu
                post={post}
                kind="specific"
                redirectTo="/calendar"
              />
            ) : null}
            {currentUser && !showAdmin ? (
              <EventEnrollmentButton
                eventId={id}
                isAttending={isAttending}
                isPast={isPast}
              />
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>About this event</CardTitle>
            <CardDescription>What to expect and any extra details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {post.body}
            </p>
          </CardContent>
        </Card>

        {showMemberFeatures ? (
          <PageSection
            title="Who's attending"
            description={
              showAdmin
                ? "Manage the attendee list and board assignments."
                : "Club members signed up for this event."
            }
            icon={Users}
          >
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>
                  {attendees.length} member{attendees.length === 1 ? "" : "s"} enrolled
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EventAttendeesSection
                  eventId={id}
                  attendees={attendees}
                  allProfiles={allProfiles}
                  editable={showAdmin}
                />
              </CardContent>
            </Card>
          </PageSection>
        ) : null}
      </div>
    </PageShell>
  )
}
