"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
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
import { GripVertical, UserRound } from "lucide-react"
import { toast } from "sonner"

import {
  saveBoardOrderAction,
  saveEventBoardOrderAction,
} from "@/app/actions/posts"
import {
  MAX_BOARD_SLOTS,
  buildBoardOrderState,
  buildEventBoardOrderState,
  collapseUnassigned,
  isCoach,
  lineupBoardNumbers,
  shouldShowUnassigned,
  type BoardOrderState,
  type EventBoardPlayer,
} from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import { roleLabel } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const LINEUP_CONTAINER = "lineup"
const UNASSIGNED_CONTAINER = "unassigned"

function playerName(player: Profile) {
  return player.full_name || player.email
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

function BoardBadge({ boardNumber }: { boardNumber: number | null }) {
  return (
    <div
      className={
        boardNumber == null
          ? "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed bg-muted/40 text-muted-foreground sm:size-14"
          : "flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-14"
      }
    >
      <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">
        Board
      </span>
      <span className="text-lg font-semibold leading-none sm:text-xl">
        {boardNumber ?? "—"}
      </span>
    </div>
  )
}

function PlayerCardContent({
  player,
  boardNumber,
  draggable,
}: {
  player: Profile
  boardNumber: number | null
  draggable?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card p-3 sm:p-4",
        draggable && "touch-manipulation shadow-lg ring-2 ring-primary/20"
      )}
    >
      {draggable ? (
        <span className="text-muted-foreground" aria-hidden>
          <GripVertical className="size-4 shrink-0" />
        </span>
      ) : null}
      <BoardBadge boardNumber={boardNumber} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/profile/${player.id}`}
            className="truncate font-medium hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {playerName(player)}
          </Link>
          <Badge variant="secondary" className="shrink-0">
            {player.role === "admin" ? "Coach" : roleLabel(player.role)}
          </Badge>
        </div>
        <p className="truncate text-sm text-muted-foreground">{player.email}</p>
      </div>
    </div>
  )
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
      <PlayerCardContent player={player} boardNumber={boardNumber} />
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
        opacity: isDragging ? 0.35 : 1,
      }}
      className="list-none"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab touch-manipulation active:cursor-grabbing"
      >
        <PlayerCardContent
          player={player}
          boardNumber={boardNumber}
          draggable
        />
      </div>
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
        "min-h-24 rounded-xl border border-dashed p-2 sm:p-3",
        editable
          ? isOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 bg-muted/20"
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

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            {showUnassigned ? "Lineup" : "Attendees"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {showUnassigned
              ? `${displayState.lineup.length} / ${MAX_BOARD_SLOTS} boards`
              : `${displayState.lineup.length} member${displayState.lineup.length === 1 ? "" : "s"}`}
          </p>
        </div>
        {editable ? (
          <p className="text-xs text-muted-foreground">
            {eventMode && showUnassigned
              ? `Lineup follows club board order for attending members. Drag to adjust boards 1–${MAX_BOARD_SLOTS}.`
              : showUnassigned
                ? `Drag players here to assign boards 1–${MAX_BOARD_SLOTS}. Reorder to change board numbers.`
                : "Drag to reorder attendees."}
          </p>
        ) : null}
        <DropZone
          id={LINEUP_CONTAINER}
          editable={editable}
          emptyMessage={
            editable
              ? "Drop players here to build the lineup."
              : "No board order set yet."
          }
        >
          {lineupItems.length > 0 ? (
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
              </ol>
            )
          ) : null}
        </DropZone>
      </section>

      {showUnassigned ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-medium">
              {eventMode && displayState.unassigned.every(isCoach)
                ? "Coaches"
                : eventMode
                  ? "Coaches & overflow"
                  : "Unassigned"}
            </h2>
            <span className="text-xs text-muted-foreground">
              ({displayState.unassigned.length})
            </span>
          </div>
          <DropZone
            id={UNASSIGNED_CONTAINER}
            editable={editable}
            emptyMessage={
              eventMode
                ? "Coaches stay here by default."
                : "Everyone is on the board."
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
  const showUnassigned = shouldShowUnassigned(players, eventMode)
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

  stateRef.current = state

  useEffect(() => {
    const built = buildState(players)
    setState(showUnassigned ? built : collapseUnassigned(built))
  }, [buildState, players, showUnassigned])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const activePlayer = activeId ? findPlayer(state, activeId) : null
  const displayLineup = showUnassigned
    ? state.lineup
    : collapseUnassigned(state).lineup

  function persist(lineup: Profile[]) {
    const lineupIds = lineup.map((p) => p.id)
    const save = eventId
      ? () => saveEventBoardOrderAction(eventId, lineupIds)
      : () => saveBoardOrderAction(lineupIds)

    void save().then((result) => {
      if (result.error) {
        toast.error(result.error)
        const built = buildState(players)
        setState(showUnassigned ? built : collapseUnassigned(built))
      } else if (result.success) {
        toast.success(result.success)
        if (eventId) router.refresh()
      }
    })
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)
    if (!over) return

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <BoardOrderSections
        state={state}
        editable
        showUnassigned={showUnassigned}
        eventMode={eventMode}
      />
      <DragOverlay dropAnimation={null}>
        {activePlayer ? (
          <PlayerCardContent
            player={activePlayer}
            boardNumber={
              displayLineup.findIndex((p) => p.id === activePlayer.id) >= 0
                ? displayLineup.findIndex((p) => p.id === activePlayer.id) + 1
                : null
            }
            draggable
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
