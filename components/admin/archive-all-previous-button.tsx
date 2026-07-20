"use client"

import { useTransition } from "react"
import { Archive, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { archiveAllPreviousAction } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"

export function ArchiveAllPreviousButton({
  variant = "outline",
  size = "sm",
}: {
  variant?: "outline" | "secondary" | "ghost"
  size?: "sm" | "default"
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onArchiveAll() {
    const confirmed = window.confirm(
      "Archive all previous posts? This hides past events and unpinned/expired announcements from members. Upcoming events and currently pinned announcements will stay active."
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await archiveAllPreviousAction()
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Archived.")
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={onArchiveAll}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Archive className="size-4" />
      )}
      Archive all previous
    </Button>
  )
}
