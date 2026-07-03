"use client"

import { useTransition } from "react"
import { Shield } from "lucide-react"

import { setAdminModeAction } from "@/app/actions/admin-mode"
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
  const [pending, startTransition] = useTransition()

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
        onCheckedChange={(checked) =>
          startTransition(async () => {
            await setAdminModeAction(checked)
          })
        }
      />
    </div>
  )
}
