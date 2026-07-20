"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Megaphone, Pencil, Plus, Save } from "lucide-react"

import {
  createMiniPostAction,
  updateMiniPostAction,
} from "@/app/actions/posts"
import { toDatetimeLocalValue } from "@/lib/datetime-local"
import { isPinned, pinPresetLabels, type PinPreset } from "@/lib/post-visibility"
import type { ActionState } from "@/lib/types/auth"
import type { Post } from "@/lib/types/posts"
import { miniKindLabels } from "@/lib/types/posts"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

function defaultPinMode(post?: Post) {
  if (!post?.pinned_until) return "none"
  return "custom"
}

export function AnnouncementDialog({
  post,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
  triggerVariant,
  triggerSize = "sm",
  triggerLabel,
  triggerClassName,
}: {
  post?: Post
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
  triggerSize?: "sm" | "default" | "icon-sm"
  triggerLabel?: string
  triggerClassName?: string
}) {
  const isEdit = Boolean(post)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const onOpenChange = onOpenChangeProp ?? setInternalOpen
  const [published, setPublished] = useState(post?.published ?? true)
  const [pinMode, setPinMode] = useState<"none" | "preset" | "custom">(
    defaultPinMode(post)
  )
  const [pinPreset, setPinPreset] = useState<PinPreset>("1w")
  const action = isEdit
    ? updateMiniPostAction.bind(null, post!.id)
    : createMiniPostAction
  const [state, formAction, pending] = useActionState(action, initial)
  useActionToasts(state, pending)

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])

  useEffect(() => {
    if (!open) return
    setPublished(post?.published ?? true)
    setPinMode(defaultPinMode(post))
    setPinPreset("1w")
  }, [open, post])

  const resolvedVariant = triggerVariant ?? (isEdit ? "outline" : "default")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button size={triggerSize} variant={resolvedVariant} className={triggerClassName}>
            {isEdit ? (
              <Pencil className="size-4" />
            ) : (
              <Megaphone className="size-4" />
            )}
            {triggerLabel ?? (isEdit ? "Edit" : "New announcement")}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit announcement" : "Create announcement"}
          </DialogTitle>
          <DialogDescription>
            Members only see pinned announcements on Home. Unpinned posts stay in
            admin for your records.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp-kind">Type</Label>
            <NativeSelect
              id="mp-kind"
              name="mini_kind"
              defaultValue={post?.mini_kind ?? "reminder"}
            >
              {Object.entries(miniKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-title">Title</Label>
            <Input
              id="mp-title"
              name="title"
              required
              defaultValue={post?.title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-body">Message</Label>
            <Textarea
              id="mp-body"
              name="body"
              rows={3}
              required
              defaultValue={post?.body ?? ""}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="published"
              checked={published}
              onChange={(event) => setPublished(event.target.checked)}
              className="size-4 rounded border border-input"
            />
            Published (not a draft)
          </label>

          {published ? (
            <fieldset className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Pin on home</legend>
              <input type="hidden" name="pin_mode" value={pinMode} />
              <input type="hidden" name="pin_preset" value={pinPreset} />
              <div className="space-y-2">
                <Label htmlFor="mp-pin-mode">Visibility</Label>
                <NativeSelect
                  id="mp-pin-mode"
                  value={pinMode}
                  onChange={(event) =>
                    setPinMode(event.target.value as "none" | "preset" | "custom")
                  }
                >
                  <option value="none">Don&apos;t show on home</option>
                  <option value="preset">Preset duration</option>
                  <option value="custom">Custom date & time</option>
                </NativeSelect>
              </div>
              {pinMode === "preset" ? (
                <div className="space-y-2">
                  <Label htmlFor="mp-pin-preset">Duration</Label>
                  <NativeSelect
                    id="mp-pin-preset"
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
              ) : null}
              {pinMode === "custom" ? (
                <div className="space-y-2">
                  <Label htmlFor="mp-pin-until">Pin until</Label>
                  <Input
                    id="mp-pin-until"
                    name="pin_until"
                    type="datetime-local"
                    defaultValue={
                      post?.pinned_until && isPinned(post)
                        ? toDatetimeLocalValue(post.pinned_until)
                        : ""
                    }
                  />
                </div>
              ) : null}
              {isEdit && post?.pinned_until && isPinned(post) && pinMode === "none" ? (
                <p className="text-xs text-muted-foreground">
                  Saving without a pin will hide this from members on Home.
                </p>
              ) : null}
            </fieldset>
          ) : null}

          <DialogFooter>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : isEdit ? (
                <Save className="size-4" />
              ) : (
                <Plus className="size-4" />
              )}
              {pending
                ? isEdit
                  ? "Saving..."
                  : "Posting..."
                : isEdit
                  ? "Save changes"
                  : "Post announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}