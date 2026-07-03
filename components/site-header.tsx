import Link from "next/link"
import {
  Calendar,
  ClipboardList,
  Home,
  LogIn,
  User,
  UserPlus,
} from "lucide-react"

import { getProfile } from "@/lib/auth"
import { getAdminMode } from "@/lib/admin-mode"
import { AdminModeToggle } from "@/components/admin-mode-toggle"
import { MobileNavSheet } from "@/components/mobile-nav-sheet"
import { Button } from "@/components/ui/button"

function NavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: typeof Home
  label: string
}) {
  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>
        <Icon className="size-4" />
        {label}
      </Link>
    </Button>
  )
}

export async function SiteHeader() {
  const profile = await getProfile()
  const adminMode = profile?.role === "admin" ? await getAdminMode() : false
  const showAdminNav = profile?.role === "admin" && adminMode

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="font-medium">
          NCHS Chess Club
        </Link>

        {profile ? (
          <>
            <nav className="hidden items-center gap-1 lg:flex">
              <NavLink href="/" icon={Home} label="Home" />
              <NavLink href="/calendar" icon={Calendar} label="Calendar" />
              <NavLink href="/board-order" icon={ClipboardList} label="Board order" />
              <NavLink href={`/profile/${profile.id}`} icon={User} label="Profile" />
              {showAdminNav ? (
                <NavLink href="/users/new" icon={UserPlus} label="New user" />
              ) : null}
              {profile.role === "admin" ? (
                <AdminModeToggle enabled={adminMode} className="ml-2 border-l pl-3" />
              ) : null}
            </nav>
            <MobileNavSheet
              profileId={profile.id}
              isAdmin={profile.role === "admin"}
              adminMode={adminMode}
              showAdminNav={showAdminNav}
            />
          </>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
