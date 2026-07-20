"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef } from "react"

import { useAppLoading } from "@/components/app-loading-provider"

function isInternalNavigation(anchor: HTMLAnchorElement, pathname: string) {
  if (anchor.target && anchor.target !== "_self") return false
  if (anchor.hasAttribute("download")) return false

  const href = anchor.getAttribute("href")
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false
  }

  let url: URL
  try {
    url = new URL(href, window.location.href)
  } catch {
    return false
  }

  if (url.origin !== window.location.origin) return false

  const nextKey = `${url.pathname}${url.search}`
  const currentKey = `${pathname}${window.location.search}`
  return nextKey !== currentKey
}

function NavigationLoadingInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { startLoading, stopLoading } = useAppLoading()
  const routeKey = `${pathname}?${searchParams.toString()}`
  const routeKeyRef = useRef(routeKey)

  useEffect(() => {
    if (routeKeyRef.current !== routeKey) {
      routeKeyRef.current = routeKey
      stopLoading()
    }
  }, [routeKey, stopLoading])

  useEffect(() => {
    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (event instanceof MouseEvent) {
        if (event.button !== 0) return
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest("a")
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!isInternalNavigation(anchor, pathname)) return

      startLoading()
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target
      if (!(form instanceof HTMLFormElement)) return
      if (form.target && form.target !== "_self") return
      if (form.dataset.noNavLoading === "true") return

      const action = form.getAttribute("action")
      if (!action || action.startsWith("#")) return

      try {
        const url = new URL(action, window.location.href)
        if (url.origin !== window.location.origin) return
        const nextKey = `${url.pathname}${url.search}`
        const currentKey = `${pathname}${window.location.search}`
        if (nextKey === currentKey && form.method.toLowerCase() === "get") return
      } catch {
        return
      }

      startLoading()
    }

    function onPopState() {
      startLoading()
    }

    document.addEventListener("click", onPointerDown, true)
    document.addEventListener("submit", onSubmit, true)
    window.addEventListener("popstate", onPopState)

    return () => {
      document.removeEventListener("click", onPointerDown, true)
      document.removeEventListener("submit", onSubmit, true)
      window.removeEventListener("popstate", onPopState)
    }
  }, [pathname, startLoading])

  return null
}

export function NavigationLoading() {
  return (
    <Suspense fallback={null}>
      <NavigationLoadingInner />
    </Suspense>
  )
}
