"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import {
  Calendar,
  ClipboardList,
  Home,
  Menu,
  MessageSquare,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react"

import Link from "next/link"
import { siteConfig } from "@/lib/site-config"
import { AdminModeToggle } from "@/components/admin-mode-toggle"
import { MobileNavLink } from "@/components/nav-link"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

type MobileNavSheetProps = {
  profileId: string
  isAdmin: boolean
  adminMode: boolean
}

export function MobileNavSheet({
  profileId,
  isAdmin,
  adminMode,
}: MobileNavSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const items: NavItem[] = [
    { href: "/", icon: Home, label: "Home", exact: true },
    { href: "/calendar", icon: Calendar, label: "Calendar" },
    { href: "/chat", icon: MessageSquare, label: "Messages" },
    { href: "/board-order", icon: ClipboardList, label: "Board order" },
    { href: `/profile/${profileId}`, icon: User, label: "Profile" },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="lg:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
              ♞
            </span>
            {siteConfig.name}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation
          </SheetDescription>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main">
          <ul className="space-y-1">
            {items.map(({ href, icon, label, exact }) => (
              <li key={href}>
                <MobileNavLink
                  href={href}
                  icon={icon}
                  label={label}
                  exact={exact}
                  onNavigate={() => setOpen(false)}
                />
              </li>
            ))}
          </ul>
        </nav>

        {isAdmin ? (
          <div className="mt-auto space-y-3 border-t bg-muted/30 px-4 py-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Admin
            </p>
            <AdminModeToggle enabled={adminMode} compact className="w-full" />
            {adminMode ? (
              <Button
                variant="secondary"
                className="w-full"
                asChild
                onClick={() => setOpen(false)}
              >
                <Link href="/admin">
                  <Shield className="size-4" />
                  Admin
                </Link>
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="border-t px-4 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Appearance
          </p>
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  )
}
