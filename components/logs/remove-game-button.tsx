"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { deleteGameLogAction } from "@/app/actions/games"
import { Button } from "@/components/ui/button"

export function RemoveGameButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await deleteGameLogAction(id)
          if (result.error) toast.error(result.error)
          else if (result.success) toast.success(result.success)
        })
      }}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : null}
      Remove
    </Button>
  )
}
