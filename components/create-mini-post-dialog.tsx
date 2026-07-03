"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Megaphone, Plus } from "lucide-react"

import { createMiniPostAction } from "@/app/actions/posts"
import type { ActionState } from "@/lib/types/auth"
import { miniKindLabels } from "@/lib/types/posts"
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

export function CreateMiniPostDialog() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(createMiniPostAction, initial)
  useActionToasts(state, pending)

  useEffect(() => {
    if (state.success) setOpen(false)
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Megaphone className="size-4" />
          Announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create announcement</DialogTitle>
          <DialogDescription>
            Reminders and updates shown at the top of the home feed.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mp-kind">Type</Label>
            <NativeSelect id="mp-kind" name="mini_kind" defaultValue="reminder">
              {Object.entries(miniKindLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-title">Title</Label>
            <Input id="mp-title" name="title" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mp-body">Message</Label>
            <Textarea id="mp-body" name="body" rows={3} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="published" defaultChecked className="size-4 rounded border border-input" />
            Publish now
          </label>
          <DialogFooter>
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {pending ? "Posting..." : "Post announcement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
