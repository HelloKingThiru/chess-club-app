import { redirect } from "next/navigation"

import { getProfile } from "@/lib/auth"
import { siteConfig } from "@/lib/site-config"
import { LoginForm } from "@/components/login-form"
import { SignOutButton } from "@/components/sign-out-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg flex-col items-center justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground">
          ♞
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{siteConfig.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with the email and password your admin gave you.
        </p>
      </div>

      {error === "profile" ? (
        <Alert variant="destructive" className="w-full">
          <AlertTitle>Account setup incomplete</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>
              You&apos;re signed in, but your club profile isn&apos;t ready yet. Please
              contact a club admin to finish setting up your account.
            </p>
            <SignOutButton />
          </AlertDescription>
        </Alert>
      ) : null}

      <LoginForm />
    </div>
  )
}
