"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

import type { ActionState } from "@/lib/types/auth"

export function useActionToasts(result: ActionState, pending: boolean) {
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (result.error) toast.error(result.error)
      else if (result.success) toast.success(result.success)
    }
    wasPending.current = pending
  }, [pending, result.error, result.success])
}
