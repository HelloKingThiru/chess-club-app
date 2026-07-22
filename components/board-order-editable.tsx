"use client"

import dynamic from "next/dynamic"

import type { Profile } from "@/lib/types/auth"

const BoardOrderDnD = dynamic(
  () => import("@/components/board-order-dnd").then((mod) => mod.BoardOrderDnD),
  {
    loading: () => (
      <p className="text-sm text-muted-foreground">Loading board order…</p>
    ),
    ssr: false,
  }
)

export function BoardOrderEditable({ players }: { players: Profile[] }) {
  return <BoardOrderDnD players={players} editable />
}
