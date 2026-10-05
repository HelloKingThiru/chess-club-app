import { arrayMove } from "@dnd-kit/sortable"

import {
  MAX_BOARD_SLOTS,
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
    const player = working.unassigned.find((p) => p.id === move.playerId)
    if (!player) return null
    return placeOnLineup(
      working.lineup,
      working.unassigned,
      player,
      working.lineup.length
    )
  }

  return null
}

/** Put a player on the lineup. Past board 8, the last lineup player moves to the bench. */
export function placeOnLineup(
  lineup: Profile[],
  unassigned: Profile[],
  player: Profile,
  insertAt: number
): BoardOrderState {
  const bench = unassigned.filter((person) => person.id !== player.id)
  const next = lineup.filter((person) => person.id !== player.id)
  const index = Math.max(0, Math.min(insertAt, next.length))
  next.splice(index, 0, player)

  if (next.length <= MAX_BOARD_SLOTS) {
    return { lineup: next, unassigned: bench }
  }

  let kept = next.slice(0, MAX_BOARD_SLOTS)
  let overflow = next.slice(MAX_BOARD_SLOTS)

  if (
    overflow.length === 1 &&
    overflow[0]?.id === player.id &&
    kept.length === MAX_BOARD_SLOTS
  ) {
    const bumped = kept[MAX_BOARD_SLOTS - 1]
    if (bumped) {
      kept = [...kept.slice(0, MAX_BOARD_SLOTS - 1), player]
      overflow = [bumped]
    }
  }

  const overflowIds = new Set(overflow.map((person) => person.id))
  return {
    lineup: kept,
    unassigned: [
      ...overflow,
      ...bench.filter((person) => !overflowIds.has(person.id)),
    ],
  }
}

export function lineupToSave(
  state: BoardOrderState,
  showUnassigned: boolean
): Profile[] {
  return showUnassigned ? state.lineup : collapseUnassigned(state).lineup
}

export function boardOrderChanged(prev: BoardOrderState, next: BoardOrderState) {
  return (
    next.lineup.length !== prev.lineup.length ||
    next.lineup.some((p, i) => p.id !== prev.lineup[i]?.id) ||
    next.unassigned.some((p, i) => p.id !== prev.unassigned[i]?.id)
  )
}
