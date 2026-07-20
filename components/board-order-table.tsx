import dynamic from "next/dynamic"

import {
  MAX_BOARD_SLOTS,
  buildBoardOrderState,
  shouldShowUnassigned,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import {
  BoardOrderStats,
  BoardPlayerRow,
  BoardSectionHeader,
  OpenBoardSlot,
  playerDisplayName,
} from "@/components/board-order-ui"

const BoardOrderDnD = dynamic(
  () =>
    import("@/components/board-order-dnd").then((mod) => mod.BoardOrderDnD),
  {
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading board order…</p>
    ),
  }
)

export function BoardOrderTable({
  players,
  editable = false,
}: {
  players: Profile[]
  editable?: boolean
}) {
  if (editable) {
    return <BoardOrderDnD players={players} editable />
  }

  const { lineup, unassigned } = buildBoardOrderState(players)
  const showUnassigned = shouldShowUnassigned(players)

  return (
    <BoardOrderRoster
      lineup={lineup}
      unassigned={unassigned}
      showUnassigned={showUnassigned}
    />
  )
}

export function BoardOrderSummary({ players }: { players: Profile[] }) {
  const { lineup, unassigned } = buildBoardOrderState(players)
  const showUnassigned = shouldShowUnassigned(players)

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

function BoardOrderRoster({
  lineup,
  unassigned,
  showUnassigned,
}: {
  lineup: Profile[]
  unassigned: Profile[]
  showUnassigned: boolean
}) {
  if (lineup.length === 0 && unassigned.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-center">
        <p className="font-medium">No one listed yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Members will show up here once accounts are created.
        </p>
      </div>
    )
  }

  const openSlots =
    showUnassigned && lineup.length < MAX_BOARD_SLOTS
      ? Array.from(
          { length: MAX_BOARD_SLOTS - lineup.length },
          (_, index) => lineup.length + index + 1
        )
      : []

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <BoardSectionHeader
          title="Starting lineup"
          description="Board 1 is the strongest player. Lower numbers play higher boards."
          count={`${lineup.length} / ${MAX_BOARD_SLOTS}`}
        />
        {lineup.length > 0 || openSlots.length > 0 ? (
          <ol className="space-y-2">
            {lineup.map((player, index) => (
              <li key={player.id} className="list-none">
                <BoardPlayerRow
                  player={player}
                  boardNumber={index + 1}
                  href={`/profile/${player.id}`}
                />
              </li>
            ))}
            {openSlots.map((boardNumber) => (
              <li key={`open-${boardNumber}`} className="list-none">
                <OpenBoardSlot boardNumber={boardNumber} />
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No board order set yet.
          </div>
        )}
      </section>

      {showUnassigned ? (
        <section className="space-y-3">
          <BoardSectionHeader
            title="On the bench"
            description="These members are not assigned to a board right now."
            count={String(unassigned.length)}
          />
          {unassigned.length > 0 ? (
            <ul className="space-y-2">
              {unassigned.map((player) => (
                <li key={player.id} className="list-none">
                  <BoardPlayerRow
                    player={player}
                    boardNumber={null}
                    href={`/profile/${player.id}`}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              Everyone is on a board.
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
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
