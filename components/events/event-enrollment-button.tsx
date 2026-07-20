"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Check, Loader2, UserMinus, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { joinEventAction, leaveEventAction } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function EventEnrollmentButton({
  eventId,
  isAttending,
  isPast,
  className,
}: {
  eventId: string
  isAttending: boolean
  isPast: boolean
  className?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function toggleEnrollment() {
    startTransition(async () => {
      const result = isAttending
        ? await leaveEventAction(eventId)
        : await joinEventAction(eventId)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(result.success ?? (isAttending ? "Unenrolled." : "Enrolled!"))
      router.refresh()
    })
  }

  if (isPast) {
    return (
      <div
        className={cn(
          "rounded-xl border border-dashed bg-card px-4 py-4 text-sm text-muted-foreground",
          className
        )}
      >
        This event has already passed.
      </div>
    )
  }

  if (isAttending) {
    return (
      <div
        className={cn(
          "rounded-xl border border-primary/20 bg-primary/5 px-4 py-4",
          className
        )}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Check className="size-4" />
              You&apos;re enrolled
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              You&apos;ll appear on the attendee list. Changed your mind?
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={toggleEnrollment}
            className="shrink-0"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserMinus className="size-4" />
            )}
            {pending ? "Updating..." : "Unenroll"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card px-4 py-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Join this event</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Enroll to sign up and appear on the attendee list.
          </p>
        </div>
        <Button
          type="button"
          size="lg"
          disabled={pending}
          onClick={toggleEnrollment}
          className="shrink-0"
        >
          {pending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          {pending ? "Enrolling..." : "Enroll now"}
        </Button>
      </div>
    </div>
  )
}
