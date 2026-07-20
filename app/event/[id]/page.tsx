import { notFound } from "next/navigation"
import { Calendar, MapPin, Users } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
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

type EventPageProps = {
  params: Promise<{ id: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { id } = await params
  const currentUser = await getProfile()
  const showAdmin = await canUseAdminTools(currentUser)
  const supabase = await createClient()

  const { data: postRow } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (!postRow || postRow.kind !== "specific") notFound()
  const post = postRow as Post

  const { data: attendeeRows } = await supabase
    .from("event_attendees")
    .select("user_id, profiles(id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at)")
    .eq("event_id", id)

  const { data: boardRows } = await supabase
    .from("event_board_order")
    .select("user_id, board_number")
    .eq("event_id", id)

  const boardByUser = new Map(
    (boardRows ?? []).map((row) => [row.user_id as string, row.board_number as number])
  )

  type AttendeeRow = {
    profiles: Profile | Profile[] | null
  }

  function unwrapProfile(value: Profile | Profile[] | null) {
    if (!value) return null
    return Array.isArray(value) ? value[0] ?? null : value
  }

  const attendees = ((attendeeRows ?? []) as AttendeeRow[])
    .map((row) => unwrapProfile(row.profiles))
    .filter((p): p is Profile => p != null)
    .map((profile) => ({
      ...profile,
      eventBoard: boardByUser.get(profile.id) ?? null,
    }))
    .sort((a, b) => {
      const aBoard = a.eventBoard ?? a.board_number ?? 999
      const bBoard = b.eventBoard ?? b.board_number ?? 999
      if (aBoard !== bBoard) return aBoard - bBoard
      return (a.full_name || a.email).localeCompare(b.full_name || b.email)
    })

  let allProfiles: Profile[] = []
  if (showAdmin) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at")
      .order("full_name")
    allProfiles = (data ?? []) as Profile[]
  }

  const isAttending = currentUser
    ? attendees.some((attendee) => attendee.id === currentUser.id)
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
              {!post.published ? <Badge variant="outline">Draft</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-4 text-primary" />
                {new Date(post.event_date).toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              {post.location ? (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-primary" />
                  {post.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-4 text-primary" />
                {attendees.length} attending
              </span>
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
      </div>
    </PageShell>
  )
}
