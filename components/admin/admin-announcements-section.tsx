import { Megaphone } from "lucide-react"

import { AnnouncementCard } from "@/components/posts/announcement-card"
import { AnnouncementDialog } from "@/components/posts/announcement-dialog"
import { ArchiveAllPreviousButton } from "@/components/admin/archive-all-previous-button"
import { PageSection } from "@/components/page-shell"
import { Card, CardContent } from "@/components/ui/card"
import { isArchived } from "@/lib/post-visibility"
import type { Post } from "@/lib/types/posts"

type AdminAnnouncementsSectionProps = {
  announcements: Post[]
}

export function AdminAnnouncementsSection({
  announcements,
}: AdminAnnouncementsSectionProps) {
  const activeAnnouncements = announcements.filter((post) => !isArchived(post))
  const archivedAnnouncements = announcements.filter((post) => isArchived(post))

  return (
    <PageSection
      title="Announcements"
      description="Pin announcements to show them on Home. Archive old posts to hide them from members."
      icon={Megaphone}
      action={
        <div className="flex flex-wrap gap-2">
          <ArchiveAllPreviousButton />
          <AnnouncementDialog />
        </div>
      }
    >
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No announcements yet. Create one above.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeAnnouncements.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Active</h3>
              <div className="grid gap-3">
                {activeAnnouncements.map((post) => (
                  <AnnouncementCard key={post.id} post={post} editable />
                ))}
              </div>
            </div>
          ) : null}
          {archivedAnnouncements.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Archived</h3>
              <div className="grid gap-3">
                {archivedAnnouncements.map((post) => (
                  <AnnouncementCard key={post.id} post={post} editable />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </PageSection>
  )
}
