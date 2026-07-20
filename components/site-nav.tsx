"use client"

import {
  Calendar,
  ClipboardList,
  Home,
  MessageSquare,
  Shield,
  User,
} from "lucide-react"

import { AdminModeToggle } from "@/components/admin-mode-toggle"
import { MobileNavSheet } from "@/components/mobile-nav-sheet"
import { NavLink } from "@/components/nav-link"
import { ThemeToggle } from "@/components/theme-toggle"

type SiteNavProps = {
  profileId: string
  isAdmin: boolean
  adminMode: boolean
}

export function SiteNav({
  profileId,
  isAdmin,
  adminMode,
}: SiteNavProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
        <NavLink href="/" icon={Home} label="Home" exact />
        <NavLink href="/calendar" icon={Calendar} label="Calendar" />
        <NavLink href="/chat" icon={MessageSquare} label="Messages" />
        <NavLink href="/board-order" icon={ClipboardList} label="Board order" />
        <NavLink href={`/profile/${profileId}`} icon={User} label="Profile" />
      </nav>

      {isAdmin ? (
        <div className="hidden items-center gap-2 border-l pl-3 lg:flex">
          <AdminModeToggle enabled={adminMode} />
          {adminMode ? (
            <NavLink href="/admin" icon={Shield} label="Admin" />
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <MobileNavSheet
        profileId={profileId}
        isAdmin={isAdmin}
        adminMode={adminMode}
      />
      </div>
    </div>
  )
}
