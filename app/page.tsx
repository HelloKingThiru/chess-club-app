import { Calendar, Megaphone } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { filterMemberAnnouncements, filterMemberEvents } from "@/lib/post-visibility"
import { createClient } from "@/lib/supabase/server"
import { getEventAttendanceMeta } from "@/lib/event-attendance"
import { getUpcomingEvents } from "@/lib/upcoming-events"
import { siteConfig } from "@/lib/site-config"
import { AnnouncementCard } from "@/components/posts/announcement-card"
import { AnnouncementDialog } from "@/components/posts/announcement-dialog"
import { ComingUpSection } from "@/components/events/coming-up-section"
import { PageHeader, PageSection, PageShell } from "@/components/page-shell"
import type { Post } from "@/lib/types/posts"

export default async function HomePage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  let postsQuery = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (!showAdmin) {
    postsQuery = postsQuery.eq("published", true)
  }

  const { data: posts } = await postsQuery

  const all = (posts ?? []) as Post[]
  const allAnnouncements = all.filter((p) => p.kind === "mini")
  const announcements = showAdmin
    ? allAnnouncements
    : filterMemberAnnouncements(allAnnouncements)
  const events = filterMemberEvents(all.filter((p) => p.kind === "specific"))
  const upcoming = getUpcomingEvents(events)
  const { counts, enrolledIds } = await getEventAttendanceMeta(
    upcoming.map((event) => event.id),
    profile?.id
  )

  const firstName = profile?.full_name?.split(" ")[0]

  return (
    <PageShell className="space-y-10">
      <PageHeader
        eyebrow={siteConfig.name}
        title={firstName ? `Welcome back, ${firstName}` : "Welcome"}
        description="Read club announcements, browse upcoming events, and enroll in tournaments."
        icon={Calendar}
        action={showAdmin ? <AnnouncementDialog /> : null}
      />

      {announcements.length > 0 || (showAdmin && allAnnouncements.length > 0) ? (
        <PageSection
          title="Announcements"
          description={
            showAdmin
              ? "Pinned announcements appear here for members. Unpinned and archived posts are admin-only."
              : "News and updates from club leadership."
          }
          icon={Megaphone}
        >
          <div className="grid gap-3">
            {(showAdmin ? allAnnouncements : announcements).map((post) => (
              <AnnouncementCard
                key={post.id}
                post={post}
                editable={showAdmin}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      <ComingUpSection
        events={upcoming}
        attendeeCounts={Object.fromEntries(counts)}
        enrolledIds={[...enrolledIds]}
        showCalendarLink
        editable={showAdmin}
      />
    </PageShell>
  )
}
