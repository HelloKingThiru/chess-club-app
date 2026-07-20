"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { addEventAttendeeAction } from "@/app/actions/posts"
import { BoardOrderDnD } from "@/components/board-order-dnd"
import type { EventBoardPlayer } from "@/lib/board-order"
import type { Profile } from "@/lib/types/auth"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupNativeSelect,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"

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
          <InputGroup className="h-9">
            <InputGroupNativeSelect
              id="add-attendee"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select member...</option>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name || p.email}
                </option>
              ))}
            </InputGroupNativeSelect>
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="default"
                size="sm"
                disabled={pending || !selectedUserId}
                onClick={addAttendee}
              >
                {pending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Add
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
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
