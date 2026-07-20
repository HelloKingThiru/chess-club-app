import type { Profile } from "@/lib/types/auth"

export const MAX_BOARD_SLOTS = 10

export type BoardOrderState = {
  lineup: Profile[]
  unassigned: Profile[]
}

function playerName(player: Profile) {
  return player.full_name || player.email
}

function compareByBoardThenName(
  a: Profile & { board_number?: number | null },
  b: Profile & { board_number?: number | null }
) {
  const aBoard = a.board_number ?? 999
  const bBoard = b.board_number ?? 999
  if (aBoard !== bBoard) return aBoard - bBoard
  return playerName(a).localeCompare(playerName(b))
}

export function shouldShowUnassigned(players: Profile[]) {
  return players.length > MAX_BOARD_SLOTS
}

export function collapseUnassigned(state: BoardOrderState): BoardOrderState {
  if (state.unassigned.length === 0) return state
  return {
    lineup: [...state.lineup, ...state.unassigned],
    unassigned: [],
  }
}

function buildBoardOrderStateFromNumbers(
  players: Profile[],
  boardFor: (player: Profile) => number | null | undefined
): BoardOrderState {
  const unassigned: Profile[] = []
  const slotByBoard = new Map<number, Profile>()

  for (const player of players) {
    const board = boardFor(player)
    if (
      board != null &&
      board >= 1 &&
      board <= MAX_BOARD_SLOTS &&
      !slotByBoard.has(board)
    ) {
      slotByBoard.set(board, player)
    } else {
      unassigned.push(player)
    }
  }

  const lineup: Profile[] = []
  for (let board = 1; board <= MAX_BOARD_SLOTS; board++) {
    const player = slotByBoard.get(board)
    if (player) lineup.push(player)
  }

  unassigned.sort(compareByBoardThenName)

  return { lineup, unassigned }
}

export function buildBoardOrderState(players: Profile[]): BoardOrderState {
  return buildBoardOrderStateFromNumbers(
    players,
    (player) => player.board_number
  )
}

export type EventBoardPlayer = Profile & { eventBoard?: number | null }

export function hasSavedEventBoardOrder(players: EventBoardPlayer[]) {
  return players.some((player) => player.eventBoard != null)
}

/** Arrange event attendees using each member's club board_number. */
export function buildEventBoardOrderFromClubOrder(
  players: EventBoardPlayer[]
): BoardOrderState {
  return buildBoardOrderState(players)
}

function tryAssignEventBoardSlot(
  slotByBoard: Map<number, EventBoardPlayer>,
  player: EventBoardPlayer,
  board: number | null | undefined
) {
  if (
    board != null &&
    board >= 1 &&
    board <= MAX_BOARD_SLOTS &&
    !slotByBoard.has(board)
  ) {
    slotByBoard.set(board, player)
    return true
  }
  return false
}

/** Use saved per-event boards when present; otherwise fall back to club board order. */
export function buildEventBoardOrderState(
  players: EventBoardPlayer[]
): BoardOrderState {
  if (!hasSavedEventBoardOrder(players)) {
    return buildEventBoardOrderFromClubOrder(players)
  }

  const unassigned: EventBoardPlayer[] = []
  const slotByBoard = new Map<number, EventBoardPlayer>()

  for (const player of players) {
    if (!tryAssignEventBoardSlot(slotByBoard, player, player.eventBoard)) {
      unassigned.push(player)
    }
  }

  const lineup: Profile[] = []
  for (let board = 1; board <= MAX_BOARD_SLOTS; board++) {
    const player = slotByBoard.get(board)
    if (player) lineup.push(player)
  }

  unassigned.sort(compareByBoardThenName)

  return { lineup, unassigned }
}

export function lineupBoardNumbers(lineup: Profile[]) {
  return lineup.map((player, index) => ({
    player,
    boardNumber: index + 1,
  }))
}
