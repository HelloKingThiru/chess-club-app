"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Archive,
  ArchiveRestore,
  Loader2,
  MoreVertical,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import {
  archivePostAction,
  deletePostAction,
  unarchivePostAction,
  unpinPostAction,
} from "@/app/actions/posts"
import { isArchived, isPinned } from "@/lib/post-visibility"
import { AnnouncementDialog } from "@/components/posts/announcement-dialog"
import { EventDialog } from "@/components/posts/event-dialog"
import { PinPostDialog } from "@/components/posts/pin-post-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Post } from "@/lib/types/posts"

export function PostActionsMenu({
  post,
  kind,
  redirectTo,
}: {
  post: Post
  kind: "mini" | "specific"
  redirectTo?: string
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const noun = kind === "specific" ? "event" : "announcement"
  const archived = isArchived(post)
  const pinned = isPinned(post)

  function refreshAfterAction() {
    if (redirectTo) {
      router.push(redirectTo)
    } else {
      router.refresh()
    }
  }

  function onArchiveToggle() {
    startTransition(async () => {
      const result = archived
        ? await unarchivePostAction(post.id)
        : await archivePostAction(post.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Updated.")
      refreshAfterAction()
    })
  }

  function onUnpin() {
    startTransition(async () => {
      const result = await unpinPostAction(post.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(result.success ?? "Unpinned.")
      refreshAfterAction()
    })
  }

  function onDelete() {
    const confirmed = window.confirm(
      `Delete this ${noun}? This cannot be undone.`
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deletePostAction(post.id)
      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.success ?? "Deleted.")
      refreshAfterAction()
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="-mr-2 shrink-0"
            aria-label={`${noun} options`}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreVertical className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          {kind === "mini" ? (
            <>
              <DropdownMenuItem onSelect={() => setPinOpen(true)}>
                <Pin />
                {pinned ? "Extend pin" : "Pin on home"}
              </DropdownMenuItem>
              {pinned ? (
                <DropdownMenuItem onSelect={onUnpin}>
                  <PinOff />
                  Unpin
                </DropdownMenuItem>
              ) : null}
            </>
          ) : null}
          <DropdownMenuItem onSelect={onArchiveToggle}>
            {archived ? <ArchiveRestore /> : <Archive />}
            {archived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {kind === "mini" ? (
        <>
          <AnnouncementDialog
            post={post}
            open={editOpen}
            onOpenChange={setEditOpen}
            hideTrigger
          />
          <PinPostDialog post={post} open={pinOpen} onOpenChange={setPinOpen} />
        </>
      ) : (
        <EventDialog
          post={post}
          open={editOpen}
          onOpenChange={setEditOpen}
          hideTrigger
        />
      )}
    </>
  )
}
