"use client"

import { useActionState } from "react"
import { Loader2, LogIn } from "lucide-react"

import { loginAction } from "@/app/actions/auth"
import type { ActionState } from "@/lib/types/auth"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ActionState = {}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState)
  useActionToasts(state, pending)

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader className="text-center sm:text-left">
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your school email and the password from your welcome email.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </CardContent>
        <CardFooter className="border-t-0 bg-transparent">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
