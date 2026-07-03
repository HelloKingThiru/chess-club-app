import Link from "next/link"
import { ArrowRight, Calendar, Megaphone } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { CreateMiniPostDialog } from "@/components/create-mini-post-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels, miniKindLabels } from "@/lib/types/posts"

export default async function HomePage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })

  const all = (posts ?? []) as Post[]
  const announcements = all.filter((p) => p.kind === "mini")
  const events = all
    .filter((p) => p.kind === "specific")
    .sort(
      (a, b) =>
        new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
    )
  const upcoming = events.filter(
    (e) => new Date(e.event_date).getTime() >= Date.now()
  ).slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Home</h1>
          <p className="text-muted-foreground">
            Club announcements and a quick look at what&apos;s next.
          </p>
        </div>
        {showAdmin ? <CreateMiniPostDialog /> : null}
      </div>

      {announcements.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Megaphone className="size-5 text-primary" />
            <h2 className="text-lg font-medium">Announcements</h2>
          </div>
          <div className="grid gap-3">
            {announcements.map((post) => (
              <Card key={post.id} size="sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {post.mini_kind ? miniKindLabels[post.mini_kind] : "Announcement"}
                    </Badge>
                    <CardTitle className="text-base">{post.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {post.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="size-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Coming up</h2>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link href="/calendar">
              <Calendar className="size-4" />
              Full calendar
            </Link>
          </Button>
        </div>
        {upcoming.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-muted-foreground">
              No upcoming events. Check the{" "}
              <Link href="/calendar" className="text-primary hover:underline">
                calendar
              </Link>
              .
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {upcoming.map((post) => (
              <Card key={post.id}>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {post.event_type ? (
                      <Badge>{eventTypeLabels[post.event_type]}</Badge>
                    ) : null}
                    <CardTitle className="text-base">{post.title}</CardTitle>
                  </div>
                  <CardDescription>
                    {new Date(post.event_date).toLocaleString(undefined, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" variant="ghost" className="h-auto p-0" asChild>
                    <Link href={`/event/${post.id}`}>
                      View details
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
