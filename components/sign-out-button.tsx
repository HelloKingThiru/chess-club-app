import { LogOut } from "lucide-react"

import { logoutAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="destructive" size="sm">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  )
}
