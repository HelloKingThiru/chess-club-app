import { requireProfile } from "@/lib/auth"
import { ChangePasswordForm } from "@/components/change-password-form"

export default async function ChangePasswordPage() {
  const profile = await requireProfile()

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">Password</h1>
        <p className="text-muted-foreground">Update your account password.</p>
      </div>
      <ChangePasswordForm email={profile.email} />
    </div>
  )
}
