"use client"

import { useEffect } from "react"
import { RotateCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Admin page error:", error)
  }, [error])

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 py-16">
      <h1 className="text-xl font-semibold">Admin page error</h1>
      <p className="text-sm text-muted-foreground">
        Something went wrong loading the admin dashboard.
      </p>
      <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-3 text-xs whitespace-pre-wrap">
        {error.message}
        {error.digest ? `\n\nDigest: ${error.digest}` : ""}
      </pre>
      <Button type="button" onClick={reset}>
        <RotateCw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
