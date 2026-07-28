import { ClipboardList } from "lucide-react"

import { MAX_BOARD_SLOTS } from "@/lib/board-order"
import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import {
  MEMBER_PROFILE_COLUMNS,
  PUBLIC_PROFILE_COLUMNS,
  toProfile,
} from "@/lib/guest-access"
import { createClient } from "@/lib/supabase/server"
import { BoardOrderSummary, BoardOrderTable } from "@/components/board-order-table"
import { PageHeader, PageShell } from "@/components/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function BoardOrderPage() {
  const profile = await getProfile()
  const isGuest = !profile
  const showAdmin = await canUseAdminTools(profile)
  const usePublicProfiles = isGuest || !showAdmin
  const supabase = await createClient()

  const { data: profiles } = usePublicProfiles
    ? await supabase
        .from("public_profiles")
        .select(PUBLIC_PROFILE_COLUMNS)
        .order("board_number", { ascending: true, nullsFirst: false })
    : await supabase
        .from("profiles")
        .select(MEMBER_PROFILE_COLUMNS)
        .order("board_number", { ascending: true, nullsFirst: false })

  const players = (profiles ?? []).map((row) =>
    toProfile(row as Record<string, unknown>)
  )

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
