import {
  MAX_BOARD_SLOTS,
  displayBoardOrderState,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import { BoardOrderRoster } from "@/components/board-order-client"
import {
  BoardOrderStats,
  BoardPlayerRow,
  BoardSectionHeader,
} from "@/components/board-order-ui"

export function BoardOrderTable({
  players,
  editable = false,
}: {
  players: Profile[]
  editable?: boolean
}) {
  return <BoardOrderRoster players={players} editable={editable} />
}

export function BoardOrderSummary({ players }: { players: Profile[] }) {
  const { lineup, unassigned, showUnassigned } = displayBoardOrderState(players)

  return (
    <BoardOrderStats
      filled={lineup.length}
      unassigned={unassigned.length}
      total={players.length}
      showUnassigned={showUnassigned}
    />
  )
}

export type BoardOrderEntry = {
  id: string
  name: string
  boardNumber: number | null
  href?: string
}

/** Used by event attendee views that only have id/name/board. */
export function BoardOrderList({ entries }: { entries: BoardOrderEntry[] }) {
  const sorted = [...entries].sort((a, b) => {
    if (a.boardNumber == null && b.boardNumber == null) {
      return a.name.localeCompare(b.name)
    }
    if (a.boardNumber == null) return 1
    if (b.boardNumber == null) return -1
    if (a.boardNumber !== b.boardNumber) return a.boardNumber - b.boardNumber
    return a.name.localeCompare(b.name)
  })

  const assigned = sorted.filter(
    (entry) =>
      entry.boardNumber != null &&
      entry.boardNumber >= 1 &&
      entry.boardNumber <= MAX_BOARD_SLOTS
  )
  const unassigned = sorted.filter(
    (entry) =>
      entry.boardNumber == null ||
      entry.boardNumber < 1 ||
      entry.boardNumber > MAX_BOARD_SLOTS
  )
  const showUnassigned = entries.length > MAX_BOARD_SLOTS

  if (sorted.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
        No one listed yet.
      </div>
    )
  }

  const list = showUnassigned ? assigned : sorted

  return (
    <div className="space-y-6">
      <ol className="space-y-2">
        {list.map((entry) => (
          <li key={entry.id} className="list-none">
            <LegacyEntryRow entry={entry} />
          </li>
        ))}
      </ol>
      {showUnassigned && unassigned.length > 0 ? (
        <div className="space-y-2">
          <BoardSectionHeader
            title="On the bench"
            count={String(unassigned.length)}
          />
          <ul className="space-y-2">
            {unassigned.map((entry) => (
              <li key={entry.id} className="list-none">
                <LegacyEntryRow entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function LegacyEntryRow({ entry }: { entry: BoardOrderEntry }) {
  const pseudo: Profile = {
    id: entry.id,
    email: entry.name.includes("@") ? entry.name : `${entry.id}@local`,
    full_name: entry.name,
    phone_number: null,
    board_number: entry.boardNumber,
    grade_level: null,
    bio: null,
    role: "regular",
    created_at: "",
  }

  return (
    <BoardPlayerRow
      player={pseudo}
      boardNumber={entry.boardNumber}
      href={entry.href}
    />
  )
}
