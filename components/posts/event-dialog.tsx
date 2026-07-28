"use client"

import { useActionState, useEffect, useState } from "react"
import { CalendarPlus, Loader2, Pencil, Plus, Save } from "lucide-react"

import { ClubDateTimePicker } from "@/components/club-datetime-picker"
import {
  createSpecificPostAction,
  updateSpecificPostAction,
} from "@/app/actions/posts"
import type { ActionState } from "@/lib/types/auth"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels } from "@/lib/types/posts"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormSelect } from "@/components/ui/form-select"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

export function EventDialog({
  post,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
  triggerVariant,
  triggerSize = "sm",
  triggerLabel,
  triggerClassName,
  defaultEventIso,
}: {
  post?: Post
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
  triggerSize?: "sm" | "default"
  triggerLabel?: string
  triggerClassName?: string
  defaultEventIso?: string
}) {
  const isEdit = Boolean(post)
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const onOpenChange = onOpenChangeProp ?? setInternalOpen
  const action = isEdit
    ? updateSpecificPostAction.bind(null, post!.id)
    : createSpecificPostAction
  const [state, formAction, pending] = useActionState(action, initial)
  useActionToasts(state, pending)

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])

  const resolvedVariant = triggerVariant ?? (isEdit ? "outline" : "default")
  const eventDateDefault = post?.event_date ?? defaultEventIso

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
              <CalendarPlus className="size-4" />
            )}
            {triggerLabel ?? (isEdit ? "Edit event" : "New event")}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit event" : "Create event"}</DialogTitle>
          <DialogDescription>
            Club meets, league games, tournaments, and fundraisers.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
          key={eventDateDefault ?? "new"}
        >
          <DialogBody className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-title">Title</Label>
            <Input
              id="sp-title"
              name="title"
              required
              defaultValue={post?.title ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-type">Type</Label>
            <FormSelect
              id="sp-type"
              name="event_type"
              required
              defaultValue={post?.event_type ?? "club_meet"}
              options={Object.entries(eventTypeLabels).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-date">When</Label>
            <ClubDateTimePicker
              id="sp-date"
              name="event_date"
              required
              defaultIso={eventDateDefault}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-location">Location</Label>
            <Input
              id="sp-location"
              name="location"
              defaultValue={post?.location ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-body">Details</Label>
            <Textarea
              id="sp-body"
              name="body"
              rows={4}
              required
              defaultValue={post?.body ?? ""}
            />
          </div>
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
                  : "Creating..."
                : isEdit
                  ? "Save changes"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}