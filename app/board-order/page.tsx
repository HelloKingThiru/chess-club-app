import { ClipboardList } from "lucide-react"

import { MAX_BOARD_SLOTS } from "@/lib/board-order"
import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { BoardOrderSummary, BoardOrderTable } from "@/components/board-order-table"
import { PageHeader, PageShell } from "@/components/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { Profile } from "@/lib/types/auth"

export default async function BoardOrderPage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone_number, board_number, grade_level, bio, role, created_at")
    .order("board_number", { ascending: true, nullsFirst: false })

  const players = (profiles ?? []) as Profile[]

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="Board order"
        description={`The club league ladder — up to ${MAX_BOARD_SLOTS} boards. Board 1 is the strongest player.`}
        icon={ClipboardList}
      />

      {profile?.role === "admin" ? (
        <Alert className={showAdmin ? "border-primary/30 bg-primary/5" : undefined}>
          <AlertTitle>{showAdmin ? "Editing lineup" : "View only"}</AlertTitle>
          <AlertDescription>
            {showAdmin
              ? "Drag players to change board numbers. Board 1 is strongest. Changes save automatically."
              : "Turn on admin mode in the header to drag and reorder the lineup."}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>How to read this</AlertTitle>
          <AlertDescription>
            Lower board numbers are stronger. Tap a player to open their profile.
          </AlertDescription>
        </Alert>
      )}

      <BoardOrderSummary players={players} />
      <BoardOrderTable players={players} editable={showAdmin} />
    </PageShell>
  )
}
