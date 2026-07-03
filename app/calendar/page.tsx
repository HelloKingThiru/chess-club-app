import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { ClubCalendar } from "@/components/club-calendar"
import { CreateSpecificPostDialog } from "@/components/create-specific-post-dialog"
import type { Post } from "@/lib/types/posts"

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

  const events = (posts ?? []) as Post[]

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-medium tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            See what&apos;s coming up — club meets, league games, tournaments, and
            fundraisers.
          </p>
        </div>
        {showAdmin ? <CreateSpecificPostDialog /> : null}
      </div>

      <ClubCalendar events={events} />
    </div>
  )
}
