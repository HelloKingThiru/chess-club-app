"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

type ActionResult = {
  error?: string
  success?: string
}

export function useActionToasts(result: ActionResult, pending: boolean) {
  const wasPending = useRef(false)

  useEffect(() => {
    if (wasPending.current && !pending) {
      if (result.error) toast.error(result.error)
      else if (result.success) toast.success(result.success)
    }
    wasPending.current = pending
  }, [pending, result.error, result.success])
}
