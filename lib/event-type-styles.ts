import type { EventType } from "@/lib/types/posts"

export const eventTypeColors: Record<
  EventType,
  { dot: string; bg: string; text: string; border: string }
> = {
  club_meet: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
  },
  league_game: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-500/30",
  },
  tournament: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-800 dark:text-violet-300",
    border: "border-violet-500/30",
  },
  fundraiser: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-500/30",
  },
}
