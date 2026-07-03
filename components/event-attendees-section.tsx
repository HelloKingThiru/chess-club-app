"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { addEventAttendeeAction } from "@/app/actions/posts"
import { BoardOrderDnD } from "@/components/board-order-dnd"
import type { EventBoardPlayer } from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import { inlineFieldButtonClassName, inlineFieldRowClassName } from "@/lib/field-styles"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

export function EventAttendeesSection({
  eventId,
  attendees,
  allProfiles,
  editable,
}: {
  eventId: string
  attendees: EventBoardPlayer[]
  allProfiles: Profile[]
  editable: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedUserId, setSelectedUserId] = useState("")

  const attendingIds = new Set(attendees.map((a) => a.id))
  const available = allProfiles.filter((p) => !attendingIds.has(p.id))

  function addAttendee() {
    if (!selectedUserId) return
    startTransition(async () => {
      const result = await addEventAttendeeAction(eventId, selectedUserId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Attendee added.")
      setSelectedUserId("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {editable ? (
        <div className="space-y-2">
          <Label htmlFor="add-attendee">Add attendee</Label>
          <div className={inlineFieldRowClassName}>
            <NativeSelect
              id="add-attendee"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="min-w-0 flex-1"
            >
              <option value="">Select member...</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </NativeSelect>
            <Button
              type="button"
              className={inlineFieldButtonClassName}
              disabled={pending || !selectedUserId}
              onClick={addAttendee}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UserPlus className="size-4" />
              )}
              Add
            </Button>
          </div>
        </div>
      ) : null}

      {attendees.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one attending yet.</p>
      ) : (
        <BoardOrderDnD
          players={attendees}
          editable={editable}
          eventId={eventId}
        />
      )}
    </div>
  )
}
