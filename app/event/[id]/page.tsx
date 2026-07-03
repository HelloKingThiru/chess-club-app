import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { EventAttendeesSection } from "@/components/event-attendees-section"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
      const aBoard = a.eventBoard ?? 999
      const bBoard = b.eventBoard ?? 999
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

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/calendar">
          <ArrowLeft className="size-4" />
          Back to calendar
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {post.event_type ? (
            <Badge>{eventTypeLabels[post.event_type]}</Badge>
          ) : null}
          <h1 className="text-3xl font-medium tracking-tight">{post.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-sm">
            <Calendar className="size-4" />
            {new Date(post.event_date).toLocaleString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
          {post.location ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <MapPin className="size-4" />
              {post.location}
            </span>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{post.body}</p>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="size-5" />
          <h2 className="text-lg font-medium">Attendees</h2>
        </div>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {attendees.length} member{attendees.length === 1 ? "" : "s"} attending
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
      </section>
    </div>
  )
}
