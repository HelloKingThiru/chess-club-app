import Link from "next/link"
import { ClipboardList, Swords } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { getProfile } from "@/lib/auth"
import {
  clubStandings,
  formatMatchDate,
  formatMatchPoints,
  matchScoreLabel,
  matchWinnerLabel,
  type ClubMatch,
  type ClubMatchPlayer,
  type ClubMatchResult,
} from "@/lib/club-matches"
import { PUBLIC_PROFILE_COLUMNS, toProfile } from "@/lib/guest-access"
import { createClient } from "@/lib/supabase/server"
import { ClubMatchDialog } from "@/components/club-match-dialog"
import { DeleteClubMatchButton } from "@/components/delete-club-match-button"
import {
  EmptyState,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function removedPlayerName() {
  return "Removed player"
}

export default async function ClubMatchesPage() {
  const profile = await getProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const [{ data: profileRows }, { data: matchRows, error: matchError }] =
    await Promise.all([
      supabase
        .from("public_profiles")
        .select(PUBLIC_PROFILE_COLUMNS)
        .order("board_number", { ascending: true, nullsFirst: false }),
      supabase
        .from("club_matches")
        .select("id, played_on, white_id, black_id, result, notes, created_at")
        .order("played_on", { ascending: false })
        .order("created_at", { ascending: false }),
    ])

  const roster = (profileRows ?? []).map((row) =>
    toProfile(row as Record<string, unknown>)
  )
  const names = new Map(
    roster.map((player) => [
      player.id,
      player.full_name?.trim() || "Unnamed member",
    ])
  )

  const players: ClubMatchPlayer[] = [...roster]
    .sort((a, b) => {
      const aBoard = a.board_number ?? 999
      const bBoard = b.board_number ?? 999
      if (aBoard !== bBoard) return aBoard - bBoard
      return (names.get(a.id) ?? "").localeCompare(names.get(b.id) ?? "")
    })
    .map((player) => ({
      id: player.id,
      name: names.get(player.id) ?? "Unnamed member",
      boardNumber: player.board_number,
    }))

  const matches: ClubMatch[] = (matchRows ?? []).map((row) => {
    const whiteId = row.white_id as string
    const blackId = row.black_id as string
    return {
      id: row.id as string,
      playedOn: row.played_on as string,
      whiteId,
      blackId,
      whiteName: names.get(whiteId) ?? removedPlayerName(),
      blackName: names.get(blackId) ?? removedPlayerName(),
      result: row.result as ClubMatchResult,
      notes: (row.notes as string | null) ?? null,
    }
  })

  const standings = matchError ? [] : clubStandings(matches, players)
  const tableMissing = Boolean(
    matchError &&
    (matchError.message.includes("club_matches") ||
      matchError.message.toLowerCase().includes("schema cache"))
  )

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Club matches"
        description="Internal games that decide who is the strongest player in the club. Record every result here, then update the board order when the ladder should change."
        icon={Swords}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/board-order">
                <ClipboardList className="size-4" />
                Board order
              </Link>
            </Button>
            {showAdmin ? <ClubMatchDialog players={players} /> : null}
          </div>
        }
      />

      {tableMissing ? (
        <Alert>
          <AlertTitle>Club matches are not set up yet</AlertTitle>
          <AlertDescription>
            Run supabase/migration-v17.sql in the Supabase SQL editor, then
            reload this page.
          </AlertDescription>
        </Alert>
      ) : matchError ? (
        <Alert>
          <AlertTitle>Could not load results</AlertTitle>
          <AlertDescription>{matchError.message}</AlertDescription>
        </Alert>
      ) : profile?.role === "admin" ? (
        <Alert
          className={showAdmin ? "border-primary/30 bg-primary/5" : undefined}
        >
          <AlertTitle>
            {showAdmin ? "Recording results" : "View only"}
          </AlertTitle>
          <AlertDescription>
            {showAdmin
              ? "Add a result after a club game. Wins are 1 point and draws are half a point. The list below is the full record."
              : "Turn on admin mode in the header to record or remove match results."}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTitle>How to read this</AlertTitle>
          <AlertDescription>
            Standings add up every saved club game. A win is 1 point and a draw
            is half a point.
          </AlertDescription>
        </Alert>
      )}

      {matchError ? null : (
        <PageSection
          title="Standings"
          description="Sorted by points from club matches. Board numbers are the current ladder, not the match record."
        >
          {standings.length === 0 ? (
            <EmptyState
              title="No club matches yet"
              description={
                showAdmin
                  ? "Record the first result to start the club record."
                  : "Results show up here after a coach saves them."
              }
            />
          ) : (
            <ol className="space-y-2">
              {standings.map((row, index) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-3 sm:p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-6 shrink-0 text-sm font-semibold text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/profile/${row.id}`}
                        className="truncate text-base font-semibold tracking-tight hover:underline"
                      >
                        {row.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {row.boardNumber
                          ? `Board ${row.boardNumber}`
                          : "No board yet"}
                        {" · "}
                        {row.wins}-{row.losses}-{row.draws} W-L-D
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {formatMatchPoints(row.points)}
                    </p>
                    <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                      Pts
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </PageSection>
      )}

      {matches.length > 0 ? (
        <PageSection
          title="All results"
          description="Newest games first. White is listed first."
        >
          <ul className="space-y-2">
            {matches.map((match) => {
              const summary = `${match.whiteName} vs ${match.blackName} on ${formatMatchDate(match.playedOn)}`
              return (
                <li
                  key={match.id}
                  className="rounded-xl border bg-card p-3 sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-muted-foreground">
                        {formatMatchDate(match.playedOn)}
                      </p>
                      <p className="text-base font-semibold tracking-tight">
                        <Link
                          href={`/profile/${match.whiteId}`}
                          className="hover:underline"
                        >
                          {match.whiteName}
                        </Link>
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          vs{" "}
                        </span>
                        <Link
                          href={`/profile/${match.blackId}`}
                          className="hover:underline"
                        >
                          {match.blackName}
                        </Link>
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="secondary" className="tabular-nums">
                          {matchScoreLabel(match.result)}
                        </Badge>
                        <span className="text-muted-foreground">
                          {match.whiteName} white · {match.blackName} black
                        </span>
                      </div>
                      <p className="text-sm font-medium text-primary">
                        {matchWinnerLabel(match)}
                      </p>
                      {match.notes ? (
                        <p className="text-sm text-muted-foreground">
                          {match.notes}
                        </p>
                      ) : null}
                    </div>
                    {showAdmin ? (
                      <DeleteClubMatchButton
                        matchId={match.id}
                        summary={summary}
                      />
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        </PageSection>
      ) : null}
    </PageShell>
  )
}
