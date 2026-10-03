import { format, parseISO } from "date-fns"

export type ClubMatchResult = "white" | "black" | "draw"

export type ClubMatchPlayer = {
  id: string
  name: string
  boardNumber: number | null
}

export type ClubMatch = {
  id: string
  playedOn: string
  whiteId: string
  blackId: string
  whiteName: string
  blackName: string
  result: ClubMatchResult
  notes: string | null
}

export type ClubStanding = {
  id: string
  name: string
  boardNumber: number | null
  wins: number
  losses: number
  draws: number
  points: number
}

export function formatMatchDate(playedOn: string) {
  const date = parseISO(playedOn)
  if (Number.isNaN(date.getTime())) return playedOn
  return format(date, "EEE, MMM d, yyyy")
}

export function formatMatchPoints(points: number) {
  return Number.isInteger(points) ? String(points) : points.toFixed(1)
}

export function matchScoreLabel(result: ClubMatchResult) {
  if (result === "white") return "1–0"
  if (result === "black") return "0–1"
  return "½–½"
}

export function matchWinnerLabel(
  match: Pick<ClubMatch, "result" | "whiteName" | "blackName">
) {
  if (match.result === "draw") return "Draw"
  if (match.result === "white") return `${match.whiteName} won`
  return `${match.blackName} won`
}

export function clubStandings(
  matches: ClubMatch[],
  players: ClubMatchPlayer[]
): ClubStanding[] {
  const byId = new Map(players.map((player) => [player.id, player]))
  const rows = new Map<string, ClubStanding>()

  function rowFor(id: string, fallbackName: string) {
    const existing = rows.get(id)
    if (existing) return existing
    const player = byId.get(id)
    const created: ClubStanding = {
      id,
      name: player?.name || fallbackName,
      boardNumber: player?.boardNumber ?? null,
      wins: 0,
      losses: 0,
      draws: 0,
      points: 0,
    }
    rows.set(id, created)
    return created
  }

  for (const match of matches) {
    const white = rowFor(match.whiteId, match.whiteName)
    const black = rowFor(match.blackId, match.blackName)
    if (match.result === "draw") {
      white.draws += 1
      black.draws += 1
      white.points += 0.5
      black.points += 0.5
    } else if (match.result === "white") {
      white.wins += 1
      white.points += 1
      black.losses += 1
    } else {
      black.wins += 1
      black.points += 1
      white.losses += 1
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.wins !== b.wins) return b.wins - a.wins
    if (a.losses !== b.losses) return a.losses - b.losses
    const aBoard = a.boardNumber ?? 999
    const bBoard = b.boardNumber ?? 999
    if (aBoard !== bBoard) return aBoard - bBoard
    return a.name.localeCompare(b.name)
  })
}
