"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Megaphone, Pencil, Plus, Save } from "lucide-react"

import {
  inferAnnouncementPinStrategy,
  type AnnouncementPinStrategy,
} from "@/lib/announcement-pin"
import {
  createMiniPostAction,
  updateMiniPostAction,
} from "@/app/actions/posts"
import { ClubDateTimePicker } from "@/components/club-datetime-picker"
import type { ActionState } from "@/lib/types/auth"
import type { Post } from "@/lib/types/posts"
import { miniKindLabels } from "@/lib/types/posts"
import { pinPresetLabels, type PinPreset } from "@/lib/post-visibility"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FormSelect, SimpleSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

const pinStrategyLabels: Record<AnnouncementPinStrategy, string> = {
  duration: "Pin for a set time from now",
  scheduled: "Schedule when it pins and unpins",
  until_removed: "Pin until you remove it",
}

const miniKindOptions = Object.entries(miniKindLabels).map(([value, label]) => ({
  value,
  label,
}))

const pinPresetOptions = Object.entries(pinPresetLabels).map(([value, label]) => ({
  value,
  label,
}))

const pinStrategyOptions = (
  Object.entries(pinStrategyLabels) as [AnnouncementPinStrategy, string][]
).map(([value, label]) => ({ value, label }))

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
  const [pinStrategy, setPinStrategy] = useState<AnnouncementPinStrategy>("duration")
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
    setPinStrategy(post ? inferAnnouncementPinStrategy(post) : "duration")
    setPinPreset("1w")
  }, [open, post])

  const resolvedVariant = triggerVariant ?? (isEdit ? "outline" : "default")
  const formKey = post?.id ?? "new"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button
            size={triggerSize}
            variant={resolvedVariant}
            className={triggerClassName}
          >
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
            Choose how this announcement appears on Home. Members only see it
            while it is pinned.
          </DialogDescription>
        </DialogHeader>
        <form
          key={formKey}
          action={formAction}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mp-kind">Type</Label>
              <FormSelect
                id="mp-kind"
                name="mini_kind"
                defaultValue={post?.mini_kind ?? "reminder"}
                options={miniKindOptions}
              />
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
                rows={4}
                required
                defaultValue={post?.body ?? ""}
              />
            </div>

            <fieldset className="space-y-3 rounded-lg border p-3">
              <legend className="px-1 text-sm font-medium">Home pin</legend>
              <input type="hidden" name="pin_strategy" value={pinStrategy} />
              <input type="hidden" name="pin_preset" value={pinPreset} />
              <div className="space-y-2">
                <Label htmlFor="mp-pin-strategy">Mode</Label>
                <SimpleSelect
                  id="mp-pin-strategy"
                  value={pinStrategy}
                  onValueChange={(value) =>
                    setPinStrategy(value as AnnouncementPinStrategy)
                  }
                  options={pinStrategyOptions}
                />
              </div>

              {pinStrategy === "duration" ? (
                <div className="space-y-2">
                  <Label htmlFor="mp-pin-preset">Duration</Label>
                  <SimpleSelect
                    id="mp-pin-preset"
                    value={pinPreset}
                    onValueChange={(value) => setPinPreset(value as PinPreset)}
                    options={pinPresetOptions}
                  />
                </div>
              ) : null}

              {pinStrategy === "scheduled" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pin starts</Label>
                    <ClubDateTimePicker
                      id="mp-pin-start"
                      name="pin_start"
                      required
                      defaultIso={post?.pinned_from ?? undefined}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pin ends (unpin)</Label>
                    <ClubDateTimePicker
                      id="mp-pin-end"
                      name="pin_end"
                      required
                      defaultIso={post?.pinned_until ?? undefined}
                    />
                  </div>
                </div>
              ) : null}

              {pinStrategy === "until_removed" ? (
                <div className="space-y-2">
                  <Label>Start pinning at (optional)</Label>
                  <ClubDateTimePicker
                    id="mp-pin-start-optional"
                    name="pin_start_optional"
                    defaultIso={post?.pinned_from ?? undefined}
                  />
                </div>
              ) : null}
            </fieldset>
          </DialogBody>

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
