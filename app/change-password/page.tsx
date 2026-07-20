import { KeyRound } from "lucide-react"

import { requireProfile } from "@/lib/auth"
import { ChangePasswordForm } from "@/components/change-password-form"
import { PageHeader, PageShell } from "@/components/page-shell"

export default async function ChangePasswordPage() {
  const profile = await requireProfile()

  return (
    <PageShell className="max-w-lg">
      <PageHeader
        title="Change password"
        description="Pick a new password for your club account."
        icon={KeyRound}
      />
      <ChangePasswordForm email={profile.email} />
    </PageShell>
  )
}
