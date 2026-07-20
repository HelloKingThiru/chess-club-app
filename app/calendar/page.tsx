import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { filterMemberEvents } from "@/lib/post-visibility"
import { createClient } from "@/lib/supabase/server"
import { getEventAttendanceMeta } from "@/lib/event-attendance"
import { getUpcomingEvents } from "@/lib/upcoming-events"
import { ClubCalendar } from "@/components/events/club-calendar"
import { ComingUpSection } from "@/components/events/coming-up-section"
import { EventDialog } from "@/components/posts/event-dialog"
import { PageHeader, PageShell } from "@/components/page-shell"
import type { Post } from "@/lib/types/posts"
import { Calendar } from "lucide-react"

export default async function CalendarPage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("kind", "specific")
    .eq("published", true)
    .order("event_date", { ascending: true })

  const events = filterMemberEvents((posts ?? []) as Post[])
  const upcoming = getUpcomingEvents(events)
  const { counts, enrolledIds } = await getEventAttendanceMeta(
    upcoming.map((event) => event.id),
    profile?.id
  )

  return (
    <PageShell className="space-y-10">
      <PageHeader
        title="Calendar"
        description="Pick a date to see what's scheduled, then browse everything coming up below."
        icon={Calendar}
        action={showAdmin ? <EventDialog /> : null}
      />

      <ClubCalendar events={events} />

      <ComingUpSection
        events={upcoming}
        attendeeCounts={Object.fromEntries(counts)}
        enrolledIds={[...enrolledIds]}
        editable={showAdmin}
      />
    </PageShell>
  )
}
