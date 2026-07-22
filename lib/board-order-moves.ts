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

export function boardOrderChanged(prev: BoardOrderState, next: BoardOrderState) {
  return (
    next.lineup.length !== prev.lineup.length ||
    next.lineup.some((p, i) => p.id !== prev.lineup[i]?.id) ||
    next.unassigned.some((p, i) => p.id !== prev.unassigned[i]?.id)
  )
}
