import { redirect } from "next/navigation"

import { canUseAdminTools } from "@/lib/admin-mode"
import { requireProfile } from "@/lib/auth"
import { CreateUserForm } from "@/components/create-user-form"

export default async function NewUserPage() {
  const profile = await requireProfile()

  const allowed = await canUseAdminTools(profile)
  if (!allowed) redirect("/")

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-medium tracking-tight">New user</h1>
        <p className="text-muted-foreground">
          Create an admin or regular member account.
        </p>
      </div>
      <CreateUserForm />
    </div>
  )
}
