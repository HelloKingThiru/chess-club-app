"use client"

import Link from "next/link"
import {
  Calendar,
  ChevronRight,
  ClipboardList,
  Home,
  Menu,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react"

import { AdminModeToggle } from "@/components/admin-mode-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

type MobileNavSheetProps = {
  profileId: string
  isAdmin: boolean
  adminMode: boolean
  showAdminNav: boolean
}

export function MobileNavSheet({
  profileId,
  isAdmin,
  adminMode,
  showAdminNav,
}: MobileNavSheetProps) {
  const items: NavItem[] = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/calendar", icon: Calendar, label: "Calendar" },
    { href: "/board-order", icon: ClipboardList, label: "Board order" },
    { href: `/profile/${profileId}`, icon: User, label: "Profile" },
  ]

  if (showAdminNav) {
    items.push({ href: "/users/new", icon: UserPlus, label: "New user" })
  }

  return (
    <Sheet>
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
          <SheetTitle className="text-lg">NCHS Chess Club</SheetTitle>
          <SheetDescription className="sr-only">
            Main navigation
          </SheetDescription>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {items.map(({ href, icon: Icon, label }) => (
              <li key={href}>
                <SheetClose asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex min-h-12 items-center gap-3 rounded-xl px-3 py-3",
                      "text-base font-medium transition-colors",
                      "hover:bg-muted active:bg-muted"
                    )}
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Icon className="size-5 text-muted-foreground" />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </SheetClose>
              </li>
            ))}
          </ul>
        </nav>

        {isAdmin ? (
          <div className="mt-auto border-t bg-muted/30 px-4 py-4">
            <AdminModeToggle enabled={adminMode} compact className="w-full" />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
