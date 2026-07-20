"use client"

import { useState, useTransition } from "react"
import { Loader2, Pin } from "lucide-react"
import { toast } from "sonner"

import { pinPostAction } from "@/app/actions/posts"
import { toDatetimeLocalValue } from "@/lib/datetime-local"
import {
  computePinnedUntil,
  pinPresetLabels,
  type PinPreset,
} from "@/lib/post-visibility"
import type { Post } from "@/lib/types/posts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

export function PinPostDialog({
  post,
  open,
  onOpenChange,
}: {
  post: Post
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [pinMode, setPinMode] = useState<"preset" | "custom">("preset")
  const [pinPreset, setPinPreset] = useState<PinPreset>("1w")
  const [pinUntil, setPinUntil] = useState(
    post.pinned_until ? toDatetimeLocalValue(post.pinned_until) : ""
  )
  const [pending, startTransition] = useTransition()

  function onSubmit() {
    const pinnedUntil = computePinnedUntil(
      pinMode,
      pinPreset,
      pinMode === "custom" ? pinUntil : ""
    )
    if (!pinnedUntil) {
      toast.error(
        pinMode === "custom"
          ? "Choose a valid pin expiry date."
          : "Choose a pin duration."
      )
      return
    }

    startTransition(async () => {
      const result = await pinPostAction(post.id, pinnedUntil)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Pinned.")
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pin announcement</DialogTitle>
          <DialogDescription>
            Members only see pinned announcements on Home until the pin expires.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pin duration</Label>
            <NativeSelect
              value={pinMode}
              onChange={(event) =>
                setPinMode(event.target.value as "preset" | "custom")
              }
            >
              <option value="preset">Preset duration</option>
              <option value="custom">Custom date & time</option>
            </NativeSelect>
          </div>
          {pinMode === "preset" ? (
            <div className="space-y-2">
              <Label htmlFor="pin-preset">Duration</Label>
              <NativeSelect
                id="pin-preset"
                value={pinPreset}
                onChange={(event) =>
                  setPinPreset(event.target.value as PinPreset)
                }
              >
                {Object.entries(pinPresetLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pin-until">Pin until</Label>
              <Input
                id="pin-until"
                type="datetime-local"
                value={pinUntil}
                onChange={(event) => setPinUntil(event.target.value)}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={onSubmit} disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Pin className="size-4" />
            )}
            {pending ? "Pinning..." : "Pin announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
