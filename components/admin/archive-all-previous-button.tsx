"use client"

import { useState, useTransition } from "react"
import { Archive, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { archiveAllPreviousAction } from "@/app/actions/posts"
import { ConfirmAlertDialog } from "@/components/confirm-alert-dialog"
import { Button } from "@/components/ui/button"

export function ArchiveAllPreviousButton({
  variant = "outline",
  size = "sm",
}: {
  variant?: "outline" | "secondary" | "ghost"
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  function onConfirm() {
    startTransition(async () => {
      const result = await archiveAllPreviousAction()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Archived.")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Archive className="size-4" />
        )}
        Archive all previous
      </Button>
      <ConfirmAlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive all previous posts?"
        description="This hides past events and unpinned or expired announcements from members. Upcoming events and currently pinned announcements stay active."
        confirmLabel="Archive all"
        pending={pending}
        onConfirm={onConfirm}
      />
    </>
  )
}
