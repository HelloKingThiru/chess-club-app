"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function NavLink({
  href,
  icon: Icon,
  label,
  exact,
  showNotificationDot,
}: {
  href: string
  icon: LucideIcon
  label: string
  exact?: boolean
  showNotificationDot?: boolean
}) {
  const pathname = usePathname()
  const active = exact
    ? pathname === href
    : isActivePath(pathname, href)

  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      className={cn(active && "font-medium")}
      asChild
    >
      <Link href={href} aria-current={active ? "page" : undefined} className="relative">
        <Icon className="size-4" />
        {label}
        {showNotificationDot ? (
          <span
            className="absolute top-1 right-1 size-2 rounded-full bg-primary ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </Link>
    </Button>
  )
}

export function MobileNavLink({
  href,
  icon: Icon,
  label,
  exact,
  onNavigate,
  showNotificationDot,
}: {
  href: string
  icon: LucideIcon
  label: string
  exact?: boolean
  onNavigate?: () => void
  showNotificationDot?: boolean
}) {
  const pathname = usePathname()
  const active = exact
    ? pathname === href
    : isActivePath(pathname, href)

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted active:bg-muted"
      )}
    >
      <span
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" />
        {showNotificationDot ? (
          <span
            className="absolute top-0.5 right-0.5 size-2 rounded-full bg-primary ring-2 ring-background"
            aria-hidden
          />
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}
