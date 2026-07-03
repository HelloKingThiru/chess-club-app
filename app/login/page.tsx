import { redirect } from "next/navigation"

import { getProfile } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { SignOutButton } from "@/components/sign-out-button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const profile = await getProfile()
  if (profile) {
    redirect("/")
  }

  const { error } = await searchParams

  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-5xl flex-col items-center justify-center gap-4 px-4 py-10">
      {error === "profile" ? (
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertDescription className="space-y-3">
            <p>
              You are signed in but your profile could not be loaded. Run{" "}
              <code className="rounded bg-muted px-1">migration-v2.sql</code> in
              Supabase, or ask an admin to fix your account.
            </p>
            <SignOutButton />
          </AlertDescription>
        </Alert>
      ) : null}
      <LoginForm />
    </div>
  )
}
