"use client"

import { useEffect, useState } from "react"

import { formatThreadPreviewTime } from "@/lib/chat"

type ClientThreadPreviewTimeProps = {
  iso: string | null
  className?: string
}

/** Relative chat timestamps (depend on "now") — render after mount to avoid hydration drift. */
export function ClientThreadPreviewTime({
  iso,
  className,
}: ClientThreadPreviewTimeProps) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    setLabel(formatThreadPreviewTime(iso))
  }, [iso])

  if (!iso) return null

  return (
    <span className={className} suppressHydrationWarning>
      {label}
    </span>
  )
}
