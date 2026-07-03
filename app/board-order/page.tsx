import { MAX_BOARD_SLOTS } from "@/lib/board-order"
import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { BoardOrderSummary, BoardOrderTable } from "@/components/board-order-table"
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
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Board order</h1>
        <p className="text-muted-foreground">
          League lineup — up to {MAX_BOARD_SLOTS} boards. Drag to reorder when admin mode is on.
        </p>
        <div className="mt-2">
          <BoardOrderSummary players={players} />
        </div>
      </div>
      <BoardOrderTable players={players} editable={showAdmin} />
    </div>
  )
}
