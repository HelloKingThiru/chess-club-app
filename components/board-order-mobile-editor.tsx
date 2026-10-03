"use client"

import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  UserMinus,
  UserPlus,
} from "lucide-react"

import {
  MAX_BOARD_SLOTS,
  VARSITY_BOARD_SLOTS,
  collapseUnassigned,
  lineupBoardNumbers,
  type BoardOrderState,
} from "@/lib/board-order"
import type { BoardOrderMove } from "@/lib/board-order-moves"
import { BoardPlayerRow, BoardSectionHeader } from "@/components/board-order-ui"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type BoardOrderMobileEditorProps = {
  state: BoardOrderState
  showUnassigned: boolean
  eventMode?: boolean
  clubLadder?: boolean
  disabled?: boolean
  onMove: (move: BoardOrderMove) => void
}

function MoveButtons({
  onUp,
  onDown,
  upDisabled,
  downDisabled,
  disabled,
}: {
  onUp: () => void
  onDown: () => void
  upDisabled: boolean
  downDisabled: boolean
  disabled?: boolean
}) {
  return (
    <div className="flex shrink-0 flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-9 touch-manipulation"
        onClick={onUp}
        disabled={disabled || upDisabled}
        aria-label="Move up"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-9 touch-manipulation"
        onClick={onDown}
        disabled={disabled || downDisabled}
        aria-label="Move down"
      >
        <ChevronDown className="size-4" />
      </Button>
    </div>
  )
}

export function BoardOrderMobileEditor({
  state,
  showUnassigned,
  eventMode = false,
  clubLadder = false,
  disabled = false,
  onMove,
}: BoardOrderMobileEditorProps) {
  const displayState = showUnassigned ? state : collapseUnassigned(state)
  const lineupItems = lineupBoardNumbers(displayState.lineup)
  const slotLimit = clubLadder ? VARSITY_BOARD_SLOTS : MAX_BOARD_SLOTS
  const lineupFull = !clubLadder && displayState.lineup.length >= slotLimit

  const lineupTitle = clubLadder
    ? "Varsity"
    : showUnassigned
      ? "Starting lineup"
      : eventMode
        ? "Attendees"
        : "Starting lineup"
  const lineupDescription = clubLadder
    ? `Tap the arrows to rank the top ${VARSITY_BOARD_SLOTS}.`
    : showUnassigned
      ? `Tap the arrows to reorder boards 1–${MAX_BOARD_SLOTS}.`
      : "Tap the arrows to change board order."

  const benchTitle = clubLadder ? "Under varsity" : "On the bench"
  const benchDescription = clubLadder
    ? "Tap the arrows to rank everyone below varsity. This order is saved."
    : eventMode
      ? "Move players between the lineup and bench with the buttons."
      : "Remove players from the lineup or add them back from the bench."

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <BoardSectionHeader
          title={lineupTitle}
          description={lineupDescription}
          count={
            clubLadder || showUnassigned
              ? `${displayState.lineup.length} / ${slotLimit}`
              : `${displayState.lineup.length}`
          }
        />
        <div
          className={cn(
            "min-h-24 rounded-xl border border-dashed border-primary/20 bg-muted/30 p-2 sm:p-3"
          )}
        >
          {lineupItems.length > 0 ? (
            <ol className="space-y-2">
              {lineupItems.map(({ player, boardNumber }, index) => (
                <li key={player.id} className="list-none">
                  <div className="flex items-stretch gap-2">
                    <MoveButtons
                      disabled={disabled}
                      upDisabled={index === 0}
                      downDisabled={index === lineupItems.length - 1}
                      onUp={() =>
                        onMove({ type: "lineup-move", index, delta: -1 })
                      }
                      onDown={() =>
                        onMove({ type: "lineup-move", index, delta: 1 })
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <BoardPlayerRow
                        player={player}
                        boardNumber={boardNumber}
                        showEmail
                      />
                    </div>
                    {showUnassigned ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto shrink-0 touch-manipulation px-2 py-2"
                        disabled={disabled}
                        onClick={() =>
                          onMove({ type: "to-bench", playerId: player.id })
                        }
                      >
                        <UserMinus className="size-4" />
                        <span className="sr-only">
                          {clubLadder ? "Move under varsity" : "Move to bench"}
                        </span>
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No players on the lineup yet.
            </p>
          )}
        </div>
      </section>

      {showUnassigned ? (
        <section className="space-y-3">
          <BoardSectionHeader
            title={benchTitle}
            description={benchDescription}
            count={String(displayState.unassigned.length)}
          />
          <div className="min-h-24 rounded-xl border border-dashed border-primary/20 bg-muted/30 p-2 sm:p-3">
            {displayState.unassigned.length > 0 ? (
              <ul className="space-y-2">
                {displayState.unassigned.map((player, index) => (
                  <li key={player.id} className="list-none">
                    <div className="flex items-stretch gap-2">
                      <MoveButtons
                        disabled={disabled}
                        upDisabled={index === 0}
                        downDisabled={
                          index === displayState.unassigned.length - 1
                        }
                        onUp={() =>
                          onMove({ type: "bench-move", index, delta: -1 })
                        }
                        onDown={() =>
                          onMove({ type: "bench-move", index, delta: 1 })
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <BoardPlayerRow
                          player={player}
                          boardNumber={
                            clubLadder
                              ? displayState.lineup.length + index + 1
                              : null
                          }
                          showEmail
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-auto shrink-0 touch-manipulation px-2 py-2"
                        disabled={disabled || lineupFull}
                        onClick={() =>
                          onMove({ type: "to-lineup", playerId: player.id })
                        }
                      >
                        <UserPlus className="size-4" />
                        <span className="sr-only">
                          {clubLadder ? "Move to varsity" : "Add to lineup"}
                        </span>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {clubLadder
                  ? "Everyone is on varsity."
                  : "Everyone is on a board."}
              </p>
            )}
          </div>
        </section>
      ) : null}

      <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <ArrowUp className="size-3.5" aria-hidden />
        <span>Higher on the list = stronger board</span>
        <ArrowDown className="size-3.5" aria-hidden />
      </p>
    </div>
  )
}
