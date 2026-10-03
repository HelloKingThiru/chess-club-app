"use client"

import { useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteClubMatchAction } from "@/app/actions/club-matches"
import { ConfirmAlertDialog } from "@/components/confirm-alert-dialog"
import { Button } from "@/components/ui/button"

export function DeleteClubMatchButton({
  matchId,
  summary,
}: {
  matchId: string
  summary: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await deleteClubMatchAction(matchId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Match result removed.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label={`Remove result: ${summary}`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
      </Button>
      <ConfirmAlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Remove this result?"
        description={`This deletes ${summary} from the club match record.`}
        confirmLabel="Remove result"
        onConfirm={onConfirm}
        destructive
        pending={pending}
      />
    </>
  )
}
