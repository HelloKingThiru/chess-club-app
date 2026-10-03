"use client"

import { useActionState, useMemo, useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { recordClubMatchAction } from "@/app/actions/club-matches"
import { clubDateKey } from "@/lib/club-datetime"
import type { ClubMatchPlayer } from "@/lib/club-matches"
import type { ActionState } from "@/lib/types/auth"
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
import { SimpleSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initial: ActionState = {}

const resultOptions = [
  { value: "white", label: "White won" },
  { value: "black", label: "Black won" },
  { value: "draw", label: "Draw" },
]

function playerOptions(players: ClubMatchPlayer[], excludeId?: string) {
  return players
    .filter((player) => player.id !== excludeId)
    .map((player) => ({
      value: player.id,
      label: player.boardNumber
        ? `${player.name} · Board ${player.boardNumber}`
        : player.name,
    }))
}

export function ClubMatchDialog({ players }: { players: ClubMatchPlayer[] }) {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const [whiteId, setWhiteId] = useState("")
  const [blackId, setBlackId] = useState("")
  const [result, setResult] = useState("white")
  const [state, formAction, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await recordClubMatchAction(prev, formData)
      if (result.success) {
        setOpen(false)
        setWhiteId("")
        setBlackId("")
        setResult("white")
      }
      return result
    },
    initial
  )
  useActionToasts(state, pending)

  function resetForm() {
    setWhiteId("")
    setBlackId("")
    setResult("white")
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setFormKey((key) => key + 1)
      return
    }
    resetForm()
  }

  const whiteOptions = useMemo(
    () => playerOptions(players, blackId),
    [players, blackId]
  )
  const blackOptions = useMemo(
    () => playerOptions(players, whiteId),
    [players, whiteId]
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          Record result
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a club match</DialogTitle>
          <DialogDescription>
            Save an internal game. These results are how the club tracks who is
            strongest.
          </DialogDescription>
        </DialogHeader>
        <form
          key={formKey}
          action={formAction}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <DialogBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="match-white">White</Label>
              <SimpleSelect
                id="match-white"
                value={whiteId}
                onValueChange={setWhiteId}
                options={whiteOptions}
                placeholder="Choose white"
              />
              <input type="hidden" name="white_id" value={whiteId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match-black">Black</Label>
              <SimpleSelect
                id="match-black"
                value={blackId}
                onValueChange={setBlackId}
                options={blackOptions}
                placeholder="Choose black"
              />
              <input type="hidden" name="black_id" value={blackId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match-result">Result</Label>
              <SimpleSelect
                id="match-result"
                value={result}
                onValueChange={setResult}
                options={resultOptions}
              />
              <input type="hidden" name="result" value={result} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match-date">Date</Label>
              <Input
                id="match-date"
                name="played_on"
                type="date"
                required
                defaultValue={clubDateKey(new Date())}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="match-notes">Notes</Label>
              <Textarea
                id="match-notes"
                name="notes"
                rows={3}
                maxLength={500}
                placeholder="Optional. Time control, upset, or anything else to remember."
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || players.length < 2}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              Save result
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
