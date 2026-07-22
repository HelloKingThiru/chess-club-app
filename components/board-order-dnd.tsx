"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Loader2, ListOrdered } from "lucide-react"
import { toast } from "sonner"

import {
  saveBoardOrderAction,
  saveEventBoardOrderAction,
} from "@/app/actions/posts"
import {
  MAX_BOARD_SLOTS,
  buildBoardOrderState,
  buildEventBoardOrderFromClubOrder,
  buildEventBoardOrderState,
  collapseUnassigned,
  lineupBoardNumbers,
  shouldShowUnassigned,
  type BoardOrderState,
  type EventBoardPlayer,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import { Button } from "@/components/ui/button"
import { BoardOrderMobileEditor } from "@/components/board-order-mobile-editor"
import {
  BoardPlayerRow,
  BoardSectionHeader,
  OpenBoardSlot,
} from "@/components/board-order-ui"
import {
  applyBoardOrderMove,
  boardOrderChanged,
  lineupToSave,
  type BoardOrderMove,
} from "@/lib/board-order-moves"
import { cn } from "@/lib/utils"

const LINEUP_CONTAINER = "lineup"
const UNASSIGNED_CONTAINER = "unassigned"

function findPlayer(state: BoardOrderState, id: UniqueIdentifier) {
  return (
    state.lineup.find((p) => p.id === id) ??
    state.unassigned.find((p) => p.id === id) ??
    null
  )
}

function findContainer(state: BoardOrderState, id: UniqueIdentifier) {
  if (state.lineup.some((p) => p.id === id)) return LINEUP_CONTAINER
  if (state.unassigned.some((p) => p.id === id)) return UNASSIGNED_CONTAINER
  if (id === LINEUP_CONTAINER) return LINEUP_CONTAINER
  if (id === UNASSIGNED_CONTAINER) return UNASSIGNED_CONTAINER
  return null
}

function StaticPlayerRow({
  player,
  boardNumber,
}: {
  player: Profile
  boardNumber: number | null
}) {
  return (
    <li className="list-none">
      <BoardPlayerRow
        player={player}
        boardNumber={boardNumber}
        href={`/profile/${player.id}`}
      />
    </li>
  )
}

function SortablePlayer({
  player,
  boardNumber,
}: {
  player: Profile
  boardNumber: number | null
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
      }}
      className="list-none"
    >
      <BoardPlayerRow
        player={player}
        boardNumber={boardNumber}
        draggable
        showEmail
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </li>
  )
}

function DropZone({
  id,
  editable,
  children,
  emptyMessage,
}: {
  id: string
  editable: boolean
  children: React.ReactNode
  emptyMessage: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !editable })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-24 rounded-xl p-2 sm:p-3",
        editable
          ? isOver
            ? "border border-dashed border-primary bg-primary/5 ring-2 ring-primary/15"
            : "border border-dashed border-primary/20 bg-muted/30"
          : "border-transparent bg-transparent p-0"
      )}
    >
      {children ? (
        children
      ) : (
        <p className="px-2 py-6 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      )}
    </div>
  )
}

function BoardOrderSections({
  state,
  editable,
  showUnassigned,
  eventMode = false,
}: {
  state: BoardOrderState
  editable: boolean
  showUnassigned: boolean
  eventMode?: boolean
}) {
  const displayState = showUnassigned ? state : collapseUnassigned(state)
  const lineupItems = lineupBoardNumbers(displayState.lineup)

  const openSlots =
    showUnassigned && !editable && displayState.lineup.length < MAX_BOARD_SLOTS
      ? Array.from(
          { length: MAX_BOARD_SLOTS - displayState.lineup.length },
          (_, index) => displayState.lineup.length + index + 1
        )
      : []

  const lineupTitle = showUnassigned
    ? "Starting lineup"
    : eventMode
      ? "Attendees"
      : "Starting lineup"
  const lineupDescription = editable
    ? eventMode && showUnassigned
      ? `Drag players to set boards 1–${MAX_BOARD_SLOTS}. Board 1 is the strongest.`
      : showUnassigned
        ? `Drag players between the lineup and bench. Up to ${MAX_BOARD_SLOTS} boards.`
        : "Drag to reorder the list."
    : "Board 1 is the strongest player. Lower numbers play higher boards."

  const benchTitle = "On the bench"
  const benchDescription = editable
    ? eventMode
      ? "Members not on a board for this event. Drag here to remove from the lineup."
      : "Drag members here to remove them from the lineup."
    : eventMode
      ? "Not assigned to a board for this event."
      : "These members are not assigned to a board right now."

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <BoardSectionHeader
          title={lineupTitle}
          description={lineupDescription}
          count={
            showUnassigned
              ? `${displayState.lineup.length} / ${MAX_BOARD_SLOTS}`
              : `${displayState.lineup.length}`
          }
        />
        <DropZone
          id={LINEUP_CONTAINER}
          editable={editable}
          emptyMessage={
            editable
              ? "Drop players here to build the lineup."
              : "No board order set yet."
          }
        >
          {lineupItems.length > 0 || openSlots.length > 0 ? (
            editable ? (
              <SortableContext
                items={displayState.lineup.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ol className="space-y-2">
                  {lineupItems.map(({ player, boardNumber }) => (
                    <SortablePlayer
                      key={player.id}
                      player={player}
                      boardNumber={boardNumber}
                    />
                  ))}
                </ol>
              </SortableContext>
            ) : (
              <ol className="space-y-2">
                {lineupItems.map(({ player, boardNumber }) => (
                  <StaticPlayerRow
                    key={player.id}
                    player={player}
                    boardNumber={boardNumber}
                  />
                ))}
                {openSlots.map((boardNumber) => (
                  <li key={`open-${boardNumber}`} className="list-none">
                    <OpenBoardSlot boardNumber={boardNumber} />
                  </li>
                ))}
              </ol>
            )
          ) : null}
        </DropZone>
      </section>

      {showUnassigned ? (
        <section className="space-y-3">
          <BoardSectionHeader
            title={benchTitle}
            description={benchDescription}
            count={String(displayState.unassigned.length)}
          />
          <DropZone
            id={UNASSIGNED_CONTAINER}
            editable={editable}
            emptyMessage={
              eventMode
                ? "No one on the bench."
                : "Everyone is on a board."
            }
          >
            {displayState.unassigned.length > 0 ? (
              editable ? (
                <SortableContext
                  items={displayState.unassigned.map((p) => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-2">
                    {displayState.unassigned.map((player) => (
                      <SortablePlayer
                        key={player.id}
                        player={player}
                        boardNumber={null}
                      />
                    ))}
                  </ul>
                </SortableContext>
              ) : (
                <ul className="space-y-2">
                  {displayState.unassigned.map((player) => (
                    <StaticPlayerRow
                      key={player.id}
                      player={player}
                      boardNumber={null}
                    />
                  ))}
                </ul>
              )
            ) : null}
          </DropZone>
        </section>
      ) : null}
    </div>
  )
}

type BoardOrderDnDProps = {
  players: Profile[] | EventBoardPlayer[]
  editable: boolean
  eventId?: string
}

export function BoardOrderDnD({ players, editable, eventId }: BoardOrderDnDProps) {
  const router = useRouter()
  const eventMode = Boolean(eventId)
  const eventPlayers = players as EventBoardPlayer[]
  const showUnassigned = shouldShowUnassigned(players)
  const buildState = useMemo(
    () => (eventId ? buildEventBoardOrderState : buildBoardOrderState),
    [eventId]
  )
  const seed = useMemo(() => {
    const built = buildState(players)
    return showUnassigned ? built : collapseUnassigned(built)
  }, [buildState, players, showUnassigned])
  const [state, setState] = useState(seed)
  const stateRef = useRef(state)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  stateRef.current = state

  useEffect(() => {
    const built = buildState(players)
    setState(showUnassigned ? built : collapseUnassigned(built))
  }, [buildState, players, showUnassigned])

  useEffect(() => {
    if (!activeId) return

    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevHtmlOverflow = documentElement.style.overflow
    const prevBodyTouchAction = body.style.touchAction

    body.style.overflow = "hidden"
    documentElement.style.overflow = "hidden"
    body.style.touchAction = "none"

    return () => {
      body.style.overflow = prevBodyOverflow
      documentElement.style.overflow = prevHtmlOverflow
      body.style.touchAction = prevBodyTouchAction
    }
  }, [activeId])

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activePlayer = activeId ? findPlayer(state, activeId) : null
  const displayLineup = showUnassigned
    ? state.lineup
    : collapseUnassigned(state).lineup

  async function arrangeByClubOrder() {
    const arranged = buildEventBoardOrderFromClubOrder(eventPlayers)
    const next = showUnassigned ? arranged : collapseUnassigned(arranged)
    setState(next)
    await persist(arranged.lineup)
  }

  async function persist(lineup: Profile[]) {
    const lineupIds = lineup.map((p) => p.id)
    const save = eventId
      ? () => saveEventBoardOrderAction(eventId, lineupIds)
      : () => saveBoardOrderAction(lineupIds)

    setIsSaving(true)
    try {
      const result = await save()
      if (result.error) {
        toast.error(result.error)
        const built = buildState(players)
        setState(showUnassigned ? built : collapseUnassigned(built))
      } else if (result.success) {
        toast.success(result.success)
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  function moveBetweenContainers(
    prev: BoardOrderState,
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier,
    overContainer: string
  ): BoardOrderState | null {
    const player = findPlayer(prev, activeId)
    if (!player) return null

    const activeContainer = findContainer(prev, activeId)
    if (!activeContainer || activeContainer === overContainer) return null

    if (overContainer === LINEUP_CONTAINER && prev.lineup.length >= MAX_BOARD_SLOTS) {
      toast.error(`Maximum ${MAX_BOARD_SLOTS} boards.`)
      return null
    }

    const lineup = prev.lineup.filter((p) => p.id !== activeId)
    const unassigned = prev.unassigned.filter((p) => p.id !== activeId)

    if (overContainer === LINEUP_CONTAINER) {
      const overIndex = lineup.findIndex((p) => p.id === overId)
      if (overIndex >= 0) lineup.splice(overIndex, 0, player)
      else lineup.push(player)
    } else {
      const overIndex = unassigned.findIndex((p) => p.id === overId)
      if (overIndex >= 0) unassigned.splice(overIndex, 0, player)
      else unassigned.push(player)
    }

    return { lineup, unassigned }
  }

  function applyDragEnd(
    prev: BoardOrderState,
    activeId: UniqueIdentifier,
    overId: UniqueIdentifier
  ): BoardOrderState {
    const working = showUnassigned ? prev : collapseUnassigned(prev)
    const activeContainer = findContainer(working, activeId)
    const overContainer =
      findContainer(working, overId) ??
      (overId === LINEUP_CONTAINER || overId === UNASSIGNED_CONTAINER
        ? String(overId)
        : null)

    if (!activeContainer || !overContainer) return prev

    if (!showUnassigned) {
      const oldIndex = working.lineup.findIndex((p) => p.id === activeId)
      const newIndex = working.lineup.findIndex((p) => p.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        return {
          lineup: arrayMove(working.lineup, oldIndex, newIndex),
          unassigned: [],
        }
      }
      if (oldIndex !== -1 && overId === LINEUP_CONTAINER) {
        return prev
      }
      return prev
    }

    if (activeContainer === overContainer && activeContainer === LINEUP_CONTAINER) {
      const oldIndex = working.lineup.findIndex((p) => p.id === activeId)
      const newIndex = working.lineup.findIndex((p) => p.id === overId)
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        return {
          ...working,
          lineup: arrayMove(working.lineup, oldIndex, newIndex),
        }
      }
      return prev
    }

    if (activeContainer !== overContainer) {
      const moved = moveBetweenContainers(working, activeId, overId, overContainer)
      if (moved) return moved
    }

    return prev
  }

  function handleMobileMove(move: BoardOrderMove) {
    if (isSaving) return

    const prev = stateRef.current
    const next = applyBoardOrderMove(prev, move, { showUnassigned })
    if (!next) {
      if (move.type === "to-lineup") {
        toast.error(`Maximum ${MAX_BOARD_SLOTS} boards.`)
      }
      return
    }

    setState(next)

    if (boardOrderChanged(prev, next)) {
      void persist(lineupToSave(next, showUnassigned))
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (isSaving) return
    setActiveId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (isSaving || !over) return

    const prev = stateRef.current
    const next = applyDragEnd(prev, active.id, over.id)

    if (next === prev) return

    setState(next)

    const changed =
      next.lineup.length !== prev.lineup.length ||
      next.lineup.some((p, i) => p.id !== prev.lineup[i]?.id) ||
      next.unassigned.some((p, i) => p.id !== prev.unassigned[i]?.id)

    if (changed) {
      const lineupToSave = showUnassigned
        ? next.lineup
        : collapseUnassigned(next).lineup
      persist(lineupToSave)
    }
  }

  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
        No members yet.
      </div>
    )
  }

  if (!editable) {
    return (
      <BoardOrderSections
        state={state}
        editable={false}
        showUnassigned={showUnassigned}
        eventMode={eventMode}
      />
    )
  }

  return (
    <>
      {eventMode && editable ? (
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={() => void arrangeByClubOrder()}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ListOrdered className="size-4" />
            )}
            Arrange by current order
          </Button>
        </div>
      ) : null}
      <div className="relative">
        {isSaving ? (
          <div
            className="absolute inset-0 z-20 flex items-start justify-center rounded-xl bg-background/50 pt-16 backdrop-blur-[1px]"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium shadow-sm">
              <Loader2 className="size-4 animate-spin text-primary" />
              Saving board order…
            </div>
          </div>
        ) : null}
        <div
          className={cn(
            "transition-opacity",
            isSaving && "pointer-events-none opacity-60"
          )}
        >
          <div className="md:hidden">
            <BoardOrderMobileEditor
              state={state}
              showUnassigned={showUnassigned}
              eventMode={eventMode}
              disabled={isSaving}
              onMove={handleMobileMove}
            />
          </div>
          <div className="hidden md:block">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              autoScroll={false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <BoardOrderSections
                state={state}
                editable
                showUnassigned={showUnassigned}
                eventMode={eventMode}
              />
              <DragOverlay dropAnimation={null} className="touch-none">
                {activePlayer ? (
                  <BoardPlayerRow
                    player={activePlayer}
                    boardNumber={
                      displayLineup.findIndex((p) => p.id === activePlayer.id) >=
                      0
                        ? displayLineup.findIndex(
                            (p) => p.id === activePlayer.id
                          ) + 1
                        : null
                    }
                    draggable
                    showEmail
                    isDragOverlay
                  />
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>
    </>
  )
}
