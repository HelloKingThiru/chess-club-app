"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useTransition } from "react"
import { Shield } from "lucide-react"

import { setAdminModeAction } from "@/app/actions/admin-mode"
import { useAppLoading } from "@/components/app-loading-provider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

export function AdminModeToggle({
  enabled,
  className,
  compact = false,
}: {
  enabled: boolean
  className?: string
  compact?: boolean
}) {
  const router = useRouter()
  const { startLoading, stopLoading } = useAppLoading()
  const [pending, startTransition] = useTransition()
  const pendingValue = useRef<boolean | null>(null)

  useEffect(() => {
    if (pendingValue.current !== null && enabled === pendingValue.current) {
      pendingValue.current = null
      stopLoading()
    }
  }, [enabled, stopLoading])

  useEffect(() => {
    if (pendingValue.current === null) return

    const timeout = window.setTimeout(() => {
      pendingValue.current = null
      stopLoading()
    }, 12_000)

    return () => window.clearTimeout(timeout)
  }, [pending, stopLoading])

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        compact ? "justify-between" : "",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Shield className="size-4 shrink-0 text-muted-foreground" />
        <Label htmlFor="admin-mode" className="cursor-pointer text-sm font-normal">
          Admin mode
        </Label>
      </div>
      <Switch
        id="admin-mode"
        checked={enabled}
        disabled={pending}
        onCheckedChange={(checked) => {
          pendingValue.current = checked
          startLoading("Updating admin mode…")
          startTransition(async () => {
            await setAdminModeAction(checked)
            router.refresh()
          })
        }}
      />
    </div>
  )
}
