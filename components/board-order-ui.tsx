import type { HTMLAttributes } from "react"
import Link from "next/link"
import { ChevronRight, GripVertical, Trophy } from "lucide-react"

import { MAX_BOARD_SLOTS } from "@/lib/board-order"
import { formatGradeLevel } from "@/lib/grade-level"
import { roleLabel } from "@/lib/roles"
import type { Profile } from "@/lib/types/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function playerDisplayName(player: Profile) {
  return player.full_name?.trim() || player.email
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function boardRankMeta(boardNumber: number | null) {
  if (boardNumber === 1) {
    return {
      label: "Top board",
      hint: "Strongest player",
      badgeClass:
        "bg-amber-500 text-white shadow-sm shadow-amber-500/30 ring-2 ring-amber-400/40",
      rowClass: "border-amber-500/25 bg-amber-500/[0.06]",
      accentClass: "border-l-amber-500",
    }
  }
  if (boardNumber === 2) {
    return {
      label: "Board 2",
      hint: "Second board",
      badgeClass:
        "bg-slate-400 text-white shadow-sm shadow-slate-400/30 ring-2 ring-slate-300/40",
      rowClass: "border-slate-400/25 bg-slate-400/[0.06]",
      accentClass: "border-l-slate-400",
    }
  }
  if (boardNumber === 3) {
    return {
      label: "Board 3",
      hint: "Third board",
      badgeClass:
        "bg-orange-700 text-white shadow-sm shadow-orange-700/30 ring-2 ring-orange-600/30",
      rowClass: "border-orange-700/20 bg-orange-700/[0.05]",
      accentClass: "border-l-orange-700",
    }
  }
  if (boardNumber != null) {
    return {
      label: `Board ${boardNumber}`,
      hint: `League board ${boardNumber}`,
      badgeClass: "bg-primary text-primary-foreground shadow-sm",
      rowClass: "bg-card",
      accentClass: "border-l-primary/40",
    }
  }
  return {
    label: "Bench",
    hint: "Not on a board yet",
    badgeClass:
      "border border-dashed border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    rowClass: "bg-card",
    accentClass: "border-l-muted-foreground/20",
  }
}

export function BoardRankBadge({
  boardNumber,
  size = "default",
}: {
  boardNumber: number | null
  size?: "default" | "sm"
}) {
  const meta = boardRankMeta(boardNumber)
  const isTop = boardNumber === 1

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-col items-center justify-center rounded-xl font-semibold",
        meta.badgeClass,
        size === "sm" ? "size-11" : "size-14 sm:size-16"
      )}
    >
      {isTop ? (
        <Trophy
          className={cn(
            "absolute -top-1.5 text-amber-200",
            size === "sm" ? "size-3" : "size-3.5"
          )}
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "font-bold leading-none tracking-tight",
          size === "sm" ? "text-lg" : "text-xl sm:text-2xl"
        )}
      >
        {boardNumber ?? "—"}
      </span>
      <span
        className={cn(
          "mt-0.5 font-medium uppercase tracking-wide opacity-90",
          size === "sm" ? "text-[8px]" : "text-[9px] sm:text-[10px]"
        )}
      >
        {boardNumber == null ? "Bench" : "Board"}
      </span>
    </div>
  )
}

export function BoardOrderStats({
  filled,
  unassigned,
  total,
  showUnassigned,
}: {
  filled: number
  unassigned: number
  total: number
  showUnassigned: boolean
}) {
  const stats = showUnassigned
    ? [
        {
          label: "Boards filled",
          value: `${filled}/${MAX_BOARD_SLOTS}`,
          hint: "Starting lineup",
        },
        {
          label: "On the bench",
          value: String(unassigned),
          hint: "Not assigned yet",
        },
        {
          label: "Club members",
          value: String(total),
          hint: "Total roster",
        },
      ]
    : [
        {
          label: "On the lineup",
          value: String(total),
          hint: `Boards 1–${Math.min(total, MAX_BOARD_SLOTS)}`,
        },
      ]

  return (
    <div
      className={cn(
        "grid gap-3",
        showUnassigned ? "sm:grid-cols-3" : "sm:grid-cols-1 sm:max-w-xs"
      )}
    >
      {stats.map((stat) => (
        <Card key={stat.label} size="sm">
          <CardContent className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </p>
              <p className="text-xs text-muted-foreground/80">{stat.hint}</p>
            </div>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function BoardSectionHeader({
  title,
  description,
  count,
}: {
  title: string
  description?: string
  count?: string
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {count ? (
        <Badge variant="secondary" className="tabular-nums">
          {count}
        </Badge>
      ) : null}
    </div>
  )
}

type BoardPlayerRowProps = {
  player: Profile
  boardNumber: number | null
  href?: string
  draggable?: boolean
  showEmail?: boolean
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>
  isDragOverlay?: boolean
}

export function BoardPlayerRow({
  player,
  boardNumber,
  href,
  draggable = false,
  showEmail = false,
  dragHandleProps,
  isDragOverlay = false,
}: BoardPlayerRowProps) {
  const name = playerDisplayName(player)
  const meta = boardRankMeta(boardNumber)
  const grade =
    player.grade_level != null ? formatGradeLevel(player.grade_level) : null
  const role = roleLabel(player.role)
  const { className: dragHandleClassName, ...dragHandleRest } =
    dragHandleProps ?? {}

  const body = (
    <>
      {draggable ? (
        <button
          type="button"
          {...dragHandleRest}
          className={cn(
            "flex size-10 shrink-0 touch-none items-center justify-center rounded-lg bg-muted text-muted-foreground select-none",
            "cursor-grab active:cursor-grabbing",
            dragHandleClassName
          )}
          aria-label={`Drag ${name}`}
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}

      <BoardRankBadge boardNumber={boardNumber} />

      <Avatar className="size-11 shrink-0 sm:size-12">
        <AvatarFallback className="bg-muted text-sm font-medium">
          {initials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {draggable ? (
            <Link
              href={`/profile/${player.id}`}
              className="truncate text-base font-semibold tracking-tight hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              {name}
            </Link>
          ) : (
            <p className="truncate text-base font-semibold tracking-tight">
              {name}
            </p>
          )}
          {player.role === "admin" ? (
            <Badge variant="secondary">{role}</Badge>
          ) : null}
        </div>
        <p className="mt-0.5 text-sm font-medium text-primary/90">
          {meta.label}
          {boardNumber === 1 ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              · {meta.hint}
            </span>
          ) : null}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {grade && grade !== "Not set" ? <span>{grade}</span> : null}
          {showEmail ? (
            <>
              {grade && grade !== "Not set" ? <span aria-hidden>·</span> : null}
              <span className="truncate">{player.email}</span>
            </>
          ) : href ? (
            <>
              {grade && grade !== "Not set" ? <span aria-hidden>·</span> : null}
              <span>View profile</span>
            </>
          ) : null}
        </div>
      </div>

      {href && !draggable ? (
        <ChevronRight
          className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
          aria-hidden
        />
      ) : null}
    </>
  )

  const rowClass = cn(
    "group flex items-center gap-3 rounded-xl border border-l-4 p-3 transition-colors sm:gap-4 sm:p-4",
    meta.rowClass,
    meta.accentClass,
    isDragOverlay && "shadow-lg ring-2 ring-primary/20",
    href && !draggable && "hover:bg-accent/40"
  )

  if (href && !draggable) {
    return (
      <Link href={href} className={rowClass}>
        {body}
      </Link>
    )
  }

  return <div className={rowClass}>{body}</div>
}

export function OpenBoardSlot({ boardNumber }: { boardNumber: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-muted-foreground/25 bg-muted/20 p-3 sm:gap-4 sm:p-4">
      <BoardRankBadge boardNumber={boardNumber} />
      <div>
        <p className="text-sm font-medium text-muted-foreground">
          Board {boardNumber} open
        </p>
        <p className="text-xs text-muted-foreground/80">
          Waiting for a player assignment
        </p>
      </div>
    </div>
  )
}
