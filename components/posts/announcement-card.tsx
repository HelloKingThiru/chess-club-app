import type { Post } from "@/lib/types/posts"
import { miniKindLabels } from "@/lib/types/posts"
import {
  describeAnnouncementPin,
  isArchived,
} from "@/lib/post-visibility"
import { PostActionsMenu } from "@/components/posts/post-actions-menu"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AnnouncementCard({
  post,
  editable = false,
}: {
  post: Post
  editable?: boolean
}) {
  const archived = isArchived(post)
  const pin = describeAnnouncementPin(post)

  return (
    <Card className={archived ? "opacity-75" : undefined}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {post.mini_kind ? miniKindLabels[post.mini_kind] : "Announcement"}
              </Badge>
              {archived ? <Badge variant="outline">Archived</Badge> : null}
              {!archived ? (
                <Badge variant={pin.active ? "default" : "outline"}>
                  {pin.label}
                </Badge>
              ) : null}
              <CardTitle className="text-base">{post.title}</CardTitle>
            </div>
          </div>
          {editable ? <PostActionsMenu post={post} kind="mini" /> : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap text-muted-foreground">
          {post.body}
        </p>
      </CardContent>
    </Card>
  )
}
