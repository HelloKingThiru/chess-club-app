"use client"

import { useActionState, useEffect, useState } from "react"
import { CalendarPlus, Loader2, Plus } from "lucide-react"

import { createSpecificPostAction } from "@/app/actions/posts"
import type { ActionState } from "@/lib/types/auth"
import { eventTypeLabels } from "@/lib/types/posts"
import { useActionToasts } from "@/lib/use-action-toasts"
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

export function CreateSpecificPostDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createSpecificPostAction, initial)
  useActionToasts(state, pending)

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CalendarPlus className="size-4" />
          New event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create event</DialogTitle>
          <DialogDescription>
            Club meets, league games, tournaments, and fundraisers.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sp-title">Title</Label>
            <Input id="sp-title" name="title" required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sp-type">Type</Label>
              <NativeSelect id="sp-type" name="event_type" required defaultValue="club_meet">
                {Object.entries(eventTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-date">Date</Label>
              <Input id="sp-date" name="event_date" type="datetime-local" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-location">Location</Label>
            <Input id="sp-location" name="location" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-body">Details</Label>
            <Textarea id="sp-body" name="body" rows={4} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked className="size-4 rounded border border-input" />
            Publish now
          </label>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {pending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
