import Link from "next/link"
import { LogIn } from "lucide-react"

import { getProfile } from "@/lib/auth"
import { getAdminMode } from "@/lib/admin-mode"
import { siteConfig } from "@/lib/site-config"
import { SiteNav } from "@/components/site-nav"
import { Button } from "@/components/ui/button"

export async function SiteHeader() {
  const profile = await getProfile()
  const adminMode = profile?.role === "admin" ? await getAdminMode() : false

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground">
            ♞
          </span>
          <span className="hidden sm:inline">{siteConfig.name}</span>
          <span className="sm:hidden">{siteConfig.shortName}</span>
        </Link>

        {profile ? (
          <SiteNav
            profileId={profile.id}
            isAdmin={profile.role === "admin"}
            adminMode={adminMode}
          />
        ) : (
          <Button variant="default" size="sm" asChild>
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
