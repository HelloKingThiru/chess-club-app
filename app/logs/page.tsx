import { ScrollText } from "lucide-react"

import { canUseAdminTools } from "@/lib/admin-mode"
import { requireProfile } from "@/lib/auth"
import { clubDateKey } from "@/lib/club-datetime"
import {
  formatPlayedOn,
  GAME_RESULTS,
  gameResultLabel,
  normalizeGameResult,
  type GameLog,
  type GameResultValue,
} from "@/lib/game-logs"
import { PUBLIC_PROFILE_COLUMNS, toProfile } from "@/lib/guest-access"
import { createClient } from "@/lib/supabase/server"
import { GameLogForm } from "@/components/logs/game-log-form"
import { RemoveGameButton } from "@/components/logs/remove-game-button"
import { EmptyState, PageHeader, PageSection, PageShell } from "@/components/page-shell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

const resultBadgeClass: Record<GameResultValue, string> = {
  "1-0": "bg-primary/15 text-primary",
  "0-1": "bg-destructive/10 text-destructive",
  "1/2-1/2": "bg-secondary text-secondary-foreground",
}

export default async function LogsPage() {
  const profile = await requireProfile()
  const showAdmin = await canUseAdminTools(profile)
  const supabase = await createClient()

  const [{ data: rows, error }, { data: roster }] = await Promise.all([
    supabase
      .from("game_results")
      .select(
        "id, player_id, opponent, white_name, black_name, result, event_name, played_on, board_number, created_at"
      )
      .order("played_on", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("public_profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .order("board_number", { ascending: true, nullsFirst: false }),
  ])

  const players = (roster ?? []).map((row) =>
    toProfile(row as Record<string, unknown>)
  )
  const names = new Map(
    players.map((player) => [
      player.id,
      player.full_name?.trim() || "Unnamed member",
    ])
  )

  const games: GameLog[] = (rows ?? []).flatMap((row) => {
    const result = normalizeGameResult(row.result)
    if (!result) return []
    return [
      {
        id: row.id,
        whiteName:
          row.white_name?.trim() ||
          (row.player_id ? names.get(row.player_id) ?? "Removed member" : "Unknown"),
        blackName: row.black_name?.trim() || row.opponent,
        hasColors: Boolean(row.white_name?.trim() && row.black_name?.trim()),
        result,
        eventName: row.event_name,
        playedOn: row.played_on,
        boardNumber: row.board_number,
      },
    ]
  })

  const scoreSummary = GAME_RESULTS.map((result) => {
    const count = games.filter((game) => game.result === result.value).length
    return `${count} ${result.label}`
  }).join(" · ")

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Logs"
        description="Games played at chess club, with the result of each one."
        icon={ScrollText}
      />

      {error ? (
        <Alert>
          <AlertTitle>Could not load games</AlertTitle>
          <AlertDescription>
            {error.message.toLowerCase().includes("white_name")
              ? "In Supabase, run supabase/migration-v20.sql, then refresh this page."
              : error.message}
          </AlertDescription>
        </Alert>
      ) : null}

      {showAdmin ? (
        <GameLogForm
          players={players}
          defaultPlayerId={profile.id}
          today={clubDateKey(new Date())}
        />
      ) : null}

      <PageSection
        title="Recorded games"
        description={
          games.length === 0
            ? "Nothing logged yet."
            : scoreSummary
        }
      >
        {games.length === 0 ? (
          <EmptyState
            title="No games yet"
            description="Log a game to keep a record of who played and how it finished."
          />
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
            {games.map((game) => {
              const playedOn = formatPlayedOn(game.playedOn)
              const details = [
                playedOn,
                game.eventName,
                game.boardNumber ? `Board ${game.boardNumber}` : null,
              ].filter(Boolean)

              return (
                <li
                  key={game.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {game.hasColors ? (
                        <>
                          <span className="font-normal text-muted-foreground">White </span>
                          {game.whiteName}
                          <span className="font-normal text-muted-foreground"> · Black </span>
                          {game.blackName}
                        </>
                      ) : (
                        <>
                          {game.whiteName}
                          <span className="font-normal text-muted-foreground"> vs </span>
                          {game.blackName}
                        </>
                      )}
                    </p>
                    {details.length > 0 ? (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {details.join(" · ")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={resultBadgeClass[game.result]}
                    >
                      {gameResultLabel(game.result)}
                    </Badge>
                    {showAdmin ? <RemoveGameButton id={game.id} /> : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </PageSection>
    </PageShell>
  )
}
