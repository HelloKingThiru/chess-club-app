"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import { LoadingScreen } from "@/components/loading-screen"

type AppLoadingContextValue = {
  startLoading: (label?: string) => void
  stopLoading: () => void
}

const AppLoadingContext = createContext<AppLoadingContextValue | null>(null)

export function useAppLoading() {
  const context = useContext(AppLoadingContext)
  if (!context) {
    throw new Error("useAppLoading must be used within AppLoadingProvider")
  }
  return context
}

export function AppLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false)
  const [label, setLabel] = useState("Loading…")

  const startLoading = useCallback((nextLabel = "Loading…") => {
    setLabel(nextLabel)
    setLoading(true)
  }, [])

  const stopLoading = useCallback(() => {
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!loading) {
      document.body.style.removeProperty("overflow")
      return
    }

    document.body.style.overflow = "hidden"
    const timeout = window.setTimeout(() => setLoading(false), 12_000)
    return () => {
      window.clearTimeout(timeout)
      document.body.style.removeProperty("overflow")
    }
  }, [loading])

  return (
    <AppLoadingContext.Provider value={{ startLoading, stopLoading }}>
      {children}
      {loading ? <LoadingScreen label={label} /> : null}
    </AppLoadingContext.Provider>
  )
}
