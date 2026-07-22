import Link from "next/link"
import { redirect } from "next/navigation"
import {
  ArrowRight,
  CalendarPlus,
  ClipboardList,
  Megaphone,
  Shield,
  UserPlus,
} from "lucide-react"

import { getAdminMode } from "@/lib/admin-mode"
import { requireProfile } from "@/lib/auth"
import { filterMemberEvents, isArchived } from "@/lib/post-visibility"
import { createClient } from "@/lib/supabase/server"
import { getEventAttendanceMeta } from "@/lib/event-attendance"
import { getUpcomingEvents, isEventPast } from "@/lib/upcoming-events"
import { AdminActionCard } from "@/components/admin/admin-action-card"
import { AdminAnnouncementsSection } from "@/components/admin/admin-announcements-section"
import { AdminEventsSection } from "@/components/admin/admin-events-section"
import { AdminModeToggle } from "@/components/admin-mode-toggle"
import { BoardOrderTable } from "@/components/board-order-table"
import { AnnouncementDialog } from "@/components/posts/announcement-dialog"
import { EventDialog } from "@/components/posts/event-dialog"
import { CreateUserDialog } from "@/components/members/create-user-dialog"
import { PageHeader, PageSection, PageShell } from "@/components/page-shell"
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

export default async function AdminPage() {
  const profile = await requireProfile()
  if (profile.role !== "admin") redirect("/")

  const adminMode = await getAdminMode()

  if (!adminMode) {
    return (
      <PageShell className="max-w-lg space-y-6">
        <PageHeader
          title="Admin"
          description="Club management tools are protected behind admin mode."
          icon={Shield}
        />
        <Card>
          <CardHeader>
            <CardTitle>Enable admin mode</CardTitle>
            <CardDescription>
              Turn on admin mode to create posts, manage members, edit board order,
              and manage events. Only admins can access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminModeToggle enabled={false} />
          </CardContent>
        </Card>
        <Button variant="outline" asChild>
          <Link href="/">Back to home</Link>
        </Button>
      </PageShell>
    )
  }

  const supabase = await createClient()

  const [profilesResult, postsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at"
      )
      .order("board_number", { ascending: true, nullsFirst: false }),
    supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false }),
  ])

  if (profilesResult.error) {
    console.error("Admin profiles query failed:", profilesResult.error.message)
  }
  if (postsResult.error) {
    console.error("Admin posts query failed:", postsResult.error.message)
  }

  const players = (profilesResult.data ?? []) as Profile[]
  const allPosts = (postsResult.data ?? []) as Post[]
  const announcements = allPosts.filter((post) => post.kind === "mini")
  const events = allPosts.filter((post) => post.kind === "specific")
  const memberEvents = filterMemberEvents(events)
  const upcoming = getUpcomingEvents(memberEvents)
  const pastOrDraftEvents = events.filter(
    (event) =>
      !isArchived(event) &&
      (!event.published || isEventPast(event.event_date))
  )
  const archivedEvents = events.filter((event) => isArchived(event))

  const allManagedEventIds = [
    ...upcoming,
    ...pastOrDraftEvents,
    ...archivedEvents,
  ].map((event) => event.id)
  const { counts, enrolledIds } = await getEventAttendanceMeta(
    allManagedEventIds,
    profile.id
  )

  const dataError = profilesResult.error?.message ?? postsResult.error?.message

  return (
    <PageShell className="space-y-10">
      <PageHeader
        title="Admin"
        description="Everything you need to run the club — announcements, events, members, and board order."
        icon={Shield}
      />

      {dataError ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle>Could not load all admin data</CardTitle>
            <CardDescription>
              {dataError.includes("archived_at") || dataError.includes("pinned_until")
                ? "Run supabase/migration-v9.sql in the Supabase SQL editor, then reload this page."
                : dataError.includes("grade_level") || dataError.includes("bio")
                  ? "Run supabase/migration-v4.sql and migration-v5.sql in Supabase, then reload."
                  : dataError}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Admin mode
              <Badge>On</Badge>
            </CardTitle>
            <CardDescription>
              You can create posts, add members, edit board order, and manage
              event attendees. Turn off when you&apos;re done.
            </CardDescription>
          </div>
          <AdminModeToggle enabled={adminMode} className="shrink-0" />
        </CardHeader>
      </Card>

      <PageSection
        title="Quick actions"
        description="Common tasks you can do right here."
      >
        <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
          <AdminActionCard
            icon={Megaphone}
            title="Post announcement"
            description="Pin announcements to show them on Home. Unpinned posts stay here for your records."
            pageHref="/"
            pageLabel="Open Home"
            action={<AnnouncementDialog triggerClassName="w-full" />}
          />
          <AdminActionCard
            icon={CalendarPlus}
            title="Create event"
            description="Club meets, league games, tournaments, and fundraisers."
            pageHref="/calendar"
            pageLabel="Open Calendar"
            action={<EventDialog triggerClassName="w-full" />}
          />
          <AdminActionCard
            icon={UserPlus}
            title="Create member"
            description="Add a member account with email and password."
            action={<CreateUserDialog triggerClassName="w-full" />}
          />
        </div>
      </PageSection>

      <AdminAnnouncementsSection announcements={announcements} />

      <PageSection
        title="Board order"
        description="League ladder — board 1 is the strongest player."
        icon={ClipboardList}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/board-order">
              Open board order page
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        }
      >
        <BoardOrderTable players={players} editable />
      </PageSection>

      <AdminEventsSection
        upcoming={upcoming}
        pastOrDraftEvents={pastOrDraftEvents}
        archivedEvents={archivedEvents}
        attendeeCounts={Object.fromEntries(counts)}
        enrolledIds={enrolledIds}
      />
    </PageShell>
  )
}
