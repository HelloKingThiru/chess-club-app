"use client"

import { useEffect } from "react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const flakyNetwork =
    error.message.toLowerCase().includes("input stream") ||
    error.message.toLowerCase().includes("fetch failed") ||
    error.message.toLowerCase().includes("network")

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground">
        {flakyNetwork
          ? "The page stream was interrupted—often caused by a slow or blocked connection to Supabase. Wait for actions to finish before navigating, or try Chrome if you are on Firefox."
          : "An unexpected error occurred while loading this page."}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
