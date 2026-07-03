import dynamic from "next/dynamic"
import Link from "next/link"

import {
  MAX_BOARD_SLOTS,
  buildBoardOrderState,
  shouldShowUnassigned,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"

const BoardOrderDnD = dynamic(
  () =>
    import("@/components/board-order-dnd").then((mod) => mod.BoardOrderDnD),
  { loading: () => <p className="text-sm text-muted-foreground">Loading board order…</p> }
)

function BoardBadge({ boardNumber }: { boardNumber: number | null }) {
  return (
    <div
      className={
        boardNumber == null
          ? "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 text-muted-foreground sm:size-14"
          : "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14"
      }
    >
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        Board
      </span>
      <span className="text-lg font-semibold leading-none sm:text-xl">
        {boardNumber ?? "—"}
      </span>
    </div>
  )
}

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

  const { lineup } = buildBoardOrderState(players)

  return (
    <BoardOrderList
      entries={lineup.map((player) => ({
        id: player.id,
        name: player.full_name?.trim() || player.email,
        boardNumber: player.board_number,
        href: `/profile/${player.id}`,
      }))}
    />
  )
}

export function BoardOrderSummary({ players }: { players: Profile[] }) {
  const { lineup, unassigned } = buildBoardOrderState(players)
  const showUnassigned = shouldShowUnassigned(players)
  const total = players.length

  return (
    <p className="text-sm text-muted-foreground">
      {showUnassigned ? (
        <>
          {lineup.length} / {MAX_BOARD_SLOTS} boards filled · {unassigned.length}{" "}
          unassigned · {total} member{total === 1 ? "" : "s"} total
        </>
      ) : (
        <>
          {total} member{total === 1 ? "" : "s"}
        </>
      )}
    </p>
  )
}

export type BoardOrderEntry = {
  id: string
  name: string
  boardNumber: number | null
  href?: string
}

function BoardOrderListItem({ entry }: { entry: BoardOrderEntry }) {
  const content = (
    <>
      <BoardBadge boardNumber={entry.boardNumber} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{entry.name}</p>
        {entry.href ? (
          <p className="text-xs text-muted-foreground">Tap to view profile</p>
        ) : null}
      </div>
    </>
  )

  if (entry.href) {
    return (
      <li className="list-none">
        <Link
          href={entry.href}
          className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/30 sm:p-4"
        >
          {content}
        </Link>
      </li>
    )
  }

  return (
    <li className="flex list-none items-center gap-3 rounded-xl border bg-card p-3 sm:p-4">
      {content}
    </li>
  )
}

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
    return <p className="text-sm text-muted-foreground">No one listed yet.</p>
  }

  return (
    <div className="space-y-6">
      {assigned.length > 0 || !showUnassigned ? (
        <ol className="space-y-2">
          {(showUnassigned ? assigned : sorted).map((entry) => (
            <BoardOrderListItem key={entry.id} entry={entry} />
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted-foreground">No board order set for this event yet.</p>
      )}
      {showUnassigned && unassigned.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Unassigned ({unassigned.length})
          </p>
          <ul className="space-y-2">
            {unassigned.map((entry) => (
              <BoardOrderListItem key={entry.id} entry={entry} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
