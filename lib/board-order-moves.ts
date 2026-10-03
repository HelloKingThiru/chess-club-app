import { arrayMove } from "@dnd-kit/sortable"

import {
  MAX_BOARD_SLOTS,
  VARSITY_BOARD_SLOTS,
  collapseUnassigned,
  type BoardOrderState,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"

export type BoardOrderMove =
  | { type: "lineup-move"; index: number; delta: -1 | 1 }
  | { type: "bench-move"; index: number; delta: -1 | 1 }
  | { type: "to-bench"; playerId: string }
  | { type: "to-lineup"; playerId: string }

export function applyBoardOrderMove(
  prev: BoardOrderState,
  move: BoardOrderMove,
  options: { showUnassigned: boolean }
): BoardOrderState | null {
  const working = options.showUnassigned ? prev : collapseUnassigned(prev)

  if (move.type === "lineup-move") {
    const nextIndex = move.index + move.delta
    if (nextIndex < 0 || nextIndex >= working.lineup.length) return null
    return {
      ...working,
      lineup: arrayMove(working.lineup, move.index, nextIndex),
    }
  }

  if (move.type === "bench-move") {
    const nextIndex = move.index + move.delta
    if (nextIndex < 0 || nextIndex >= working.unassigned.length) return null
    return {
      ...working,
      unassigned: arrayMove(working.unassigned, move.index, nextIndex),
    }
  }

  if (move.type === "to-bench") {
    const player = working.lineup.find((p) => p.id === move.playerId)
    if (!player) return null
    return {
      lineup: working.lineup.filter((p) => p.id !== move.playerId),
      unassigned: [...working.unassigned, player],
    }
  }

  if (move.type === "to-lineup") {
    if (working.lineup.length >= MAX_BOARD_SLOTS) return null
    const player = working.unassigned.find((p) => p.id === move.playerId)
    if (!player) return null
    return {
      lineup: [...working.lineup, player],
      unassigned: working.unassigned.filter((p) => p.id !== move.playerId),
    }
  }

  return null
}

export function lineupToSave(
  state: BoardOrderState,
  showUnassigned: boolean
): Profile[] {
  return showUnassigned ? state.lineup : collapseUnassigned(state).lineup
}

export function boardOrderChanged(
  prev: BoardOrderState,
  next: BoardOrderState
) {
  return (
    next.lineup.length !== prev.lineup.length ||
    next.lineup.some((p, i) => p.id !== prev.lineup[i]?.id) ||
    next.unassigned.length !== prev.unassigned.length ||
    next.unassigned.some((p, i) => p.id !== prev.unassigned[i]?.id)
  )
}

function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= items.length ||
    to >= items.length
  ) {
    return items
  }
  const next = items.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item!)
  return next
}

export function splitClubLadder(ordered: Profile[]): BoardOrderState {
  if (ordered.length <= VARSITY_BOARD_SLOTS) {
    return { lineup: ordered, unassigned: [] }
  }
  return {
    lineup: ordered.slice(0, VARSITY_BOARD_SLOTS),
    unassigned: ordered.slice(VARSITY_BOARD_SLOTS),
  }
}

/** Mobile arrows on the club ladder. Varsity stays the top 8 after every move. */
export function applyClubLadderMove(
  prev: BoardOrderState,
  move: BoardOrderMove
): BoardOrderState | null {
  const ordered = [...prev.lineup, ...prev.unassigned]
  const varsityCount = Math.min(VARSITY_BOARD_SLOTS, ordered.length)

  if (move.type === "lineup-move") {
    const nextIndex = move.index + move.delta
    if (nextIndex < 0 || nextIndex >= prev.lineup.length) return null
    return splitClubLadder(moveItem(ordered, move.index, nextIndex))
  }

  if (move.type === "bench-move") {
    const nextIndex = move.index + move.delta
    if (nextIndex < 0 || nextIndex >= prev.unassigned.length) return null
    return splitClubLadder(
      moveItem(ordered, varsityCount + move.index, varsityCount + nextIndex)
    )
  }

  if (move.type === "to-bench") {
    const from = ordered.findIndex((player) => player.id === move.playerId)
    if (from < 0 || from >= varsityCount) return null
    if (ordered.length <= VARSITY_BOARD_SLOTS) return null
    return splitClubLadder(moveItem(ordered, from, varsityCount))
  }

  if (move.type === "to-lineup") {
    const from = ordered.findIndex((player) => player.id === move.playerId)
    if (from < varsityCount) return null
    return splitClubLadder(moveItem(ordered, from, VARSITY_BOARD_SLOTS - 1))
  }

  return null
}

/** Desktop drag on the club ladder, including reordering people under varsity. */
export function applyClubLadderDrag(
  prev: BoardOrderState,
  activeId: string,
  overId: string
): BoardOrderState {
  const ordered = [...prev.lineup, ...prev.unassigned]
  const from = ordered.findIndex((player) => player.id === activeId)
  if (from < 0) return prev

  let to = -1
  if (overId === "lineup") {
    to = Math.max(0, Math.min(ordered.length, VARSITY_BOARD_SLOTS) - 1)
  } else if (overId === "unassigned") {
    to = ordered.length - 1
  } else {
    to = ordered.findIndex((player) => player.id === overId)
  }

  if (to < 0 || to === from) return prev
  const moved = moveItem(ordered, from, to)
  if (moved === ordered) return prev
  return splitClubLadder(moved)
}
