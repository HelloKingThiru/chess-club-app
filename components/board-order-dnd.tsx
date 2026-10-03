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
  type DragMoveEvent,
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
  VARSITY_BOARD_SLOTS,
  buildBoardOrderState,
  buildEventBoardOrderFromClubOrder,
  buildEventBoardOrderState,
  collapseUnassigned,
  displayBoardOrderState,
  lineupBoardNumbers,
  shouldShowUnassigned,
  type BoardOrderState,
  type EventBoardPlayer,
} from "@/lib/board-order"
import { isDeletedMemberPlayer } from "@/lib/deleted-member"
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
  applyClubLadderDrag,
  applyClubLadderMove,
  boardOrderChanged,
  type BoardOrderMove,
} from "@/lib/board-order-moves"
import { cn } from "@/lib/utils"

const LINEUP_CONTAINER = "lineup"
const UNASSIGNED_CONTAINER = "unassigned"

function clientYFromActivator(activatorEvent: Event, deltaY = 0) {
  let y: number | null = null
  if (
    typeof TouchEvent !== "undefined" &&
    activatorEvent instanceof TouchEvent
  ) {
    const touch = activatorEvent.touches[0] ?? activatorEvent.changedTouches[0]
    y = touch ? touch.clientY : null
  } else if (activatorEvent instanceof MouseEvent) {
    y = activatorEvent.clientY
  }
  if (y == null) return null
  return y + deltaY
}

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

function profileHrefForPlayer(player: Profile | EventBoardPlayer) {
  if (isDeletedMemberPlayer(player) || player.id.startsWith("deleted:")) {
    return undefined
  }
  return `/profile/${player.id}`
}

function StaticPlayerRow({
  player,
  boardNumber,
}: {
  player: Profile | EventBoardPlayer
  boardNumber: number | null
}) {
  return (
    <li className="list-none">
      <BoardPlayerRow
        player={player}
        boardNumber={boardNumber}
        href={profileHrefForPlayer(player)}
      />
    </li>
  )
}

function SortablePlayer({
  player,
  boardNumber,
}: {
  player: Profile | EventBoardPlayer
  boardNumber: number | null
}) {
  const deleted = isDeletedMemberPlayer(player)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id, disabled: deleted })

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
        draggable={!deleted}
        showEmail={false}
        href={profileHrefForPlayer(player)}
        dragHandleProps={deleted ? undefined : { ...attributes, ...listeners }}
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
  clubLadder = false,
}: {
  state: BoardOrderState
  editable: boolean
  showUnassigned: boolean
  eventMode?: boolean
  clubLadder?: boolean
}) {
  const displayState = showUnassigned ? state : collapseUnassigned(state)
  const lineupItems = lineupBoardNumbers(displayState.lineup)
  const slotLimit = clubLadder ? VARSITY_BOARD_SLOTS : MAX_BOARD_SLOTS

  const openSlots =
    !editable &&
    displayState.lineup.length < slotLimit &&
    (clubLadder || showUnassigned)
      ? Array.from(
          { length: slotLimit - displayState.lineup.length },
          (_, index) => displayState.lineup.length + index + 1
        )
      : []

  const lineupTitle = clubLadder
    ? "Varsity"
    : showUnassigned
      ? "Starting lineup"
      : eventMode
        ? "Attendees"
        : "Starting lineup"
  const lineupDescription = clubLadder
    ? editable
      ? "Drag to rank the top 8. Board 1 is the strongest. Hold a player near the top of the screen to scroll up."
      : "Top 8 players. Board 1 is the strongest."
    : editable
      ? eventMode && showUnassigned
        ? `Drag players to set boards 1–${MAX_BOARD_SLOTS}. Board 1 is the strongest.`
        : showUnassigned
          ? `Drag players between the lineup and bench. Up to ${MAX_BOARD_SLOTS} boards.`
          : "Drag to reorder the list."
      : "Board 1 is the strongest player. Lower numbers play higher boards."

  const benchTitle = clubLadder ? "Under varsity" : "On the bench"
  const benchDescription = clubLadder
    ? editable
      ? "Drag to rank everyone below varsity. This order is saved."
      : "Ranked below the top 8, strongest first."
    : editable
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
            clubLadder || showUnassigned
              ? `${displayState.lineup.length} / ${slotLimit}`
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
                : clubLadder
                  ? "Everyone is on varsity."
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
                    {displayState.unassigned.map((player, index) => (
                      <SortablePlayer
                        key={player.id}
                        player={player}
                        boardNumber={
                          clubLadder
                            ? displayState.lineup.length + index + 1
                            : null
                        }
                      />
                    ))}
                  </ul>
                </SortableContext>
              ) : (
                <ul className="space-y-2">
                  {displayState.unassigned.map((player, index) => (
                    <StaticPlayerRow
                      key={player.id}
                      player={player}
                      boardNumber={
                        clubLadder
                          ? displayState.lineup.length + index + 1
                          : null
                      }
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

export function BoardOrderDnD({
  players,
  editable,
  eventId,
}: BoardOrderDnDProps) {
  const router = useRouter()
  const eventMode = Boolean(eventId)
  const eventPlayers = players as EventBoardPlayer[]
  const clubDisplay = useMemo(
    () => (eventMode ? null : displayBoardOrderState(players as Profile[])),
    [eventMode, players]
  )
  const showUnassigned = eventMode
    ? shouldShowUnassigned(players)
    : (clubDisplay?.showUnassigned ?? false)
  const buildState = useMemo(
    () => (eventId ? buildEventBoardOrderState : buildBoardOrderState),
    [eventId]
  )
  const seed = useMemo(() => {
    if (clubDisplay) {
      return { lineup: clubDisplay.lineup, unassigned: clubDisplay.unassigned }
    }
    const built = buildState(players)
    return showUnassigned ? built : collapseUnassigned(built)
  }, [buildState, clubDisplay, players, showUnassigned])
  const [state, setState] = useState(seed)
  const stateRef = useRef(state)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  stateRef.current = state

  useEffect(() => {
    if (clubDisplay) {
      setState({
        lineup: clubDisplay.lineup,
        unassigned: clubDisplay.unassigned,
      })
      return
    }
    const built = buildState(players)
    setState(showUnassigned ? built : collapseUnassigned(built))
  }, [buildState, clubDisplay, players, showUnassigned])

  const dragPointerY = useRef<number | null>(null)
  const dragScrolling = useRef(false)
  const autoScrollFrame = useRef<number | null>(null)
  const dragScrollGuard = useRef({ y: 0, startedAt: 0, moved: false })

  useEffect(() => {
    return () => {
      dragScrolling.current = false
      if (autoScrollFrame.current != null) {
        cancelAnimationFrame(autoScrollFrame.current)
      }
    }
  }, [])

  function stopDragAutoScroll() {
    dragScrolling.current = false
    dragPointerY.current = null
    if (autoScrollFrame.current != null) {
      cancelAnimationFrame(autoScrollFrame.current)
      autoScrollFrame.current = null
    }
  }

  function runDragAutoScroll() {
    if (!dragScrolling.current) {
      autoScrollFrame.current = null
      return
    }

    const pointerY = dragPointerY.current
    const guard = dragScrollGuard.current
    if (
      !guard.moved &&
      performance.now() - guard.startedAt < 250 &&
      guard.y > 80 &&
      window.scrollY + 40 < guard.y
    ) {
      window.scrollTo(0, guard.y)
    }

    if (pointerY != null) {
      const edge = 120
      const maxStep = 24
      if (pointerY < edge) {
        const intensity = (edge - pointerY) / edge
        window.scrollBy(
          0,
          -Math.max(2, Math.round(maxStep * intensity * intensity))
        )
        guard.moved = true
      } else {
        const gap = window.innerHeight - pointerY
        if (gap < edge) {
          const intensity = (edge - gap) / edge
          window.scrollBy(
            0,
            Math.max(2, Math.round(maxStep * intensity * intensity))
          )
          guard.moved = true
        }
      }
    }

    autoScrollFrame.current = requestAnimationFrame(runDragAutoScroll)
  }

  function startDragAutoScroll(clientY: number | null) {
    dragScrolling.current = true
    dragScrollGuard.current = {
      y: window.scrollY,
      startedAt: performance.now(),
      moved: false,
    }
    dragPointerY.current = clientY
    if (autoScrollFrame.current == null) {
      autoScrollFrame.current = requestAnimationFrame(runDragAutoScroll)
    }
  }

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

  async function arrangeByClubOrder() {
    const arranged = buildEventBoardOrderFromClubOrder(eventPlayers)
    const next = showUnassigned ? arranged : collapseUnassigned(arranged)
    setState(next)
    await persist(next)
  }

  async function persist(next: BoardOrderState) {
    const source = eventMode
      ? next.lineup
      : [...next.lineup, ...next.unassigned]
    const orderedIds = source
      .filter((p) => !isDeletedMemberPlayer(p) && !p.id.startsWith("deleted:"))
      .map((p) => p.id)
    const save = eventId
      ? () => saveEventBoardOrderAction(eventId, orderedIds)
      : () => saveBoardOrderAction(orderedIds)

    setIsSaving(true)
    try {
      const result = await save()
      if (result.error) {
        toast.error(result.error)
        if (clubDisplay) {
          setState({
            lineup: clubDisplay.lineup,
            unassigned: clubDisplay.unassigned,
          })
        } else {
          const built = buildState(players)
          setState(showUnassigned ? built : collapseUnassigned(built))
        }
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

    if (
      overContainer === LINEUP_CONTAINER &&
      prev.lineup.length >= MAX_BOARD_SLOTS
    ) {
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

    if (
      activeContainer === overContainer &&
      activeContainer === LINEUP_CONTAINER
    ) {
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
      const moved = moveBetweenContainers(
        working,
        activeId,
        overId,
        overContainer
      )
      if (moved) return moved
    }

    return prev
  }

  function handleMobileMove(move: BoardOrderMove) {
    if (isSaving) return

    const prev = stateRef.current
    const next = eventMode
      ? applyBoardOrderMove(prev, move, { showUnassigned })
      : applyClubLadderMove(prev, move)
    if (!next) {
      if (eventMode && move.type === "to-lineup") {
        toast.error(`Maximum ${MAX_BOARD_SLOTS} boards.`)
      }
      return
    }

    setState(next)

    if (boardOrderChanged(prev, next)) {
      void persist(next)
    }
  }

  function handleDragStart(event: DragStartEvent) {
    if (isSaving) return
    setActiveId(event.active.id)
    startDragAutoScroll(clientYFromActivator(event.activatorEvent))
  }

  function handleDragMove(event: DragMoveEvent) {
    dragPointerY.current = clientYFromActivator(
      event.activatorEvent,
      event.delta.y
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    stopDragAutoScroll()
    if (isSaving || !over) return

    const prev = stateRef.current
    const next = eventMode
      ? applyDragEnd(prev, active.id, over.id)
      : applyClubLadderDrag(prev, String(active.id), String(over.id))

    if (next === prev) return

    setState(next)

    if (boardOrderChanged(prev, next)) {
      void persist(next)
    }
  }

  function handleDragCancel() {
    setActiveId(null)
    stopDragAutoScroll()
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
        clubLadder={!eventMode}
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
              clubLadder={!eventMode}
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
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
              onDragCancel={handleDragCancel}
            >
              <BoardOrderSections
                state={state}
                editable
                showUnassigned={showUnassigned}
                eventMode={eventMode}
                clubLadder={!eventMode}
              />
              <DragOverlay dropAnimation={null} className="touch-none">
                {activePlayer ? (
                  <BoardPlayerRow
                    player={activePlayer}
                    boardNumber={(() => {
                      const lineupIndex = state.lineup.findIndex(
                        (player) => player.id === activePlayer.id
                      )
                      if (lineupIndex >= 0) return lineupIndex + 1
                      if (!eventMode) {
                        const underIndex = state.unassigned.findIndex(
                          (player) => player.id === activePlayer.id
                        )
                        if (underIndex >= 0) {
                          return state.lineup.length + underIndex + 1
                        }
                      }
                      return null
                    })()}
                    draggable
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
