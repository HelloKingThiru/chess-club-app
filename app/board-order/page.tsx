import Link from "next/link"
import { ClipboardList, Swords } from "lucide-react"

import { VARSITY_BOARD_SLOTS } from "@/lib/board-order"
import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { PUBLIC_PROFILE_COLUMNS, toProfile } from "@/lib/guest-access"
import { createClient } from "@/lib/supabase/server"
import {
  BoardOrderSummary,
  BoardOrderTable,
} from "@/components/board-order-table"
import { PageHeader, PageShell } from "@/components/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default async function BoardOrderPage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("public_profiles")
    .select(PUBLIC_PROFILE_COLUMNS)
    .order("board_number", { ascending: true, nullsFirst: false })

  const players = (profiles ?? []).map((row) =>
    toProfile(row as Record<string, unknown>)
  )

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="Board order"
        description={`Varsity is the top ${VARSITY_BOARD_SLOTS}. Everyone under varsity stays in the order you set. Board 1 is the strongest player.`}
        icon={ClipboardList}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href="/club-matches">
              <Swords className="size-4" />
              Club matches
            </Link>
          </Button>
        }
      />

      {profile?.role === "admin" ? (
        <Alert
          className={showAdmin ? "border-primary/30 bg-primary/5" : undefined}
        >
          <AlertTitle>{showAdmin ? "Editing lineup" : "View only"}</AlertTitle>
          <AlertDescription>
            {showAdmin
              ? "Drag to rank the club. Varsity is the top 8. The order under varsity is saved too. Hold a player near the top of the screen and the page scrolls up."
              : "Turn on admin mode in the header to drag and reorder the ladder."}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>How to read this</AlertTitle>
          <AlertDescription>
            Lower board numbers are stronger. Tap a name to open that profile.
          </AlertDescription>
        </Alert>
      )}

      <BoardOrderSummary players={players} />
      <BoardOrderTable players={players} editable={showAdmin} />
    </PageShell>
  )
}
