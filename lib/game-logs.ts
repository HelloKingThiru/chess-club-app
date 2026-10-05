import { format, parseISO } from "date-fns"

import { isLineupBoard } from "@/lib/board-order"

export const UNKNOWN_PLAYER = "unknown"

export const GAME_RESULTS = [
  { value: "1-0", label: "1-0" },
  { value: "1/2-1/2", label: "1/2-1/2" },
  { value: "0-1", label: "0-1" },
] as const

export type GameResultValue = (typeof GAME_RESULTS)[number]["value"]

const LEGACY_RESULTS: Record<string, GameResultValue> = {
  win: "1-0",
  loss: "0-1",
  draw: "1/2-1/2",
}

export type GameLog = {
  id: string
  whiteName: string
  blackName: string
  hasColors: boolean
  result: GameResultValue
  eventName: string | null
  playedOn: string | null
  boardNumber: number | null
}

export function isGameResult(value: string): value is GameResultValue {
  return GAME_RESULTS.some((result) => result.value === value)
}

export function normalizeGameResult(value: string): GameResultValue | null {
  if (isGameResult(value)) return value
  return LEGACY_RESULTS[value] ?? null
}

export function gameResultLabel(result: GameResultValue) {
  return GAME_RESULTS.find((item) => item.value === result)?.label ?? result
}

export function formatPlayedOn(value: string | null) {
  if (!value) return null
  const date = parseISO(value)
  if (Number.isNaN(date.getTime())) return null
  return format(date, "MMM d, yyyy")
}

export function memberLogName(player: {
  full_name: string | null
  board_number: number | null
}) {
  const name = player.full_name?.trim() || "Unnamed member"
  return isLineupBoard(player.board_number)
    ? `${name} · Board ${player.board_number}`
    : name
}
