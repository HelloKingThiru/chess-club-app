import type { EventType } from "@/lib/types/posts"

export const eventTypeColors: Record<
  EventType,
  {
    dot: string
    bg: string
    text: string
    border: string
    accent: string
    cellAccent: string
    chipAccent: string
    selected: string
  }
> = {
  club_meet: {
    dot: "bg-sky-500",
    bg: "bg-sky-500/10",
    text: "text-sky-700 dark:text-sky-300",
    border: "border-sky-500/30",
    accent: "border-l-sky-500",
    cellAccent: "sm:border-l-[3px] sm:border-l-sky-500",
    chipAccent: "sm:border-l-4 sm:border-l-sky-500",
    selected: "border-sky-500 bg-sky-500/10 shadow-sm ring-2 ring-sky-500/35",
  },
  league_game: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    text: "text-amber-800 dark:text-amber-300",
    border: "border-amber-500/30",
    accent: "border-l-amber-500",
    cellAccent: "sm:border-l-[3px] sm:border-l-amber-500",
    chipAccent: "sm:border-l-4 sm:border-l-amber-500",
    selected: "border-amber-500 bg-amber-500/10 shadow-sm ring-2 ring-amber-500/35",
  },
  tournament: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    text: "text-violet-800 dark:text-violet-300",
    border: "border-violet-500/30",
    accent: "border-l-violet-500",
    cellAccent: "sm:border-l-[3px] sm:border-l-violet-500",
    chipAccent: "sm:border-l-4 sm:border-l-violet-500",
    selected:
      "border-violet-500 bg-violet-500/10 shadow-sm ring-2 ring-violet-500/35",
  },
  fundraiser: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-800 dark:text-emerald-300",
    border: "border-emerald-500/30",
    accent: "border-l-emerald-500",
    cellAccent: "sm:border-l-[3px] sm:border-l-emerald-500",
    chipAccent: "sm:border-l-4 sm:border-l-emerald-500",
    selected:
      "border-emerald-500 bg-emerald-500/10 shadow-sm ring-2 ring-emerald-500/35",
  },
}
