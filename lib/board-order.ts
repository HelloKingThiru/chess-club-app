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

export function isCoach(player: Profile) {
  return player.role === "admin"
}

export function shouldShowUnassigned(players: Profile[], eventMode = false) {
  if (eventMode) {
    const regularCount = players.filter((player) => !isCoach(player)).length
    return players.some(isCoach) || regularCount > MAX_BOARD_SLOTS
  }
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

  unassigned.sort((a, b) => playerName(a).localeCompare(playerName(b)))

  return { lineup, unassigned }
}

export function buildBoardOrderState(players: Profile[]): BoardOrderState {
  return buildBoardOrderStateFromNumbers(
    players,
    (player) => player.board_number
  )
}

export type EventBoardPlayer = Profile & { eventBoard?: number | null }

function tryAssignSlot(
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

export function buildEventBoardOrderState(
  players: EventBoardPlayer[]
): BoardOrderState {
  const unassigned: Profile[] = []
  const slotByBoard = new Map<number, EventBoardPlayer>()
  const membersAwaitingSlot: EventBoardPlayer[] = []

  for (const player of players) {
    if (isCoach(player)) {
      if (tryAssignSlot(slotByBoard, player, player.eventBoard)) {
        continue
      }
      unassigned.push(player)
      continue
    }

    if (tryAssignSlot(slotByBoard, player, player.eventBoard)) {
      continue
    }

    if (tryAssignSlot(slotByBoard, player, player.board_number)) {
      continue
    }

    membersAwaitingSlot.push(player)
  }

  const lineup: Profile[] = []
  for (let board = 1; board <= MAX_BOARD_SLOTS; board++) {
    const player = slotByBoard.get(board)
    if (player) lineup.push(player)
  }

  const inLineup = new Set(lineup.map((player) => player.id))

  membersAwaitingSlot
    .sort(compareByBoardThenName)
    .forEach((player) => {
      if (inLineup.has(player.id)) return
      if (lineup.length < MAX_BOARD_SLOTS) {
        lineup.push(player)
        inLineup.add(player.id)
      } else {
        unassigned.push(player)
      }
    })

  unassigned.sort((a, b) => {
    const aCoach = isCoach(a)
    const bCoach = isCoach(b)
    if (aCoach !== bCoach) return aCoach ? -1 : 1
    return playerName(a).localeCompare(playerName(b))
  })

  return { lineup, unassigned }
}

export function lineupBoardNumbers(lineup: Profile[]) {
  return lineup.map((player, index) => ({
    player,
    boardNumber: index + 1,
  }))
}
