"use client"

import { useActionState } from "react"
import { KeyRound, Loader2, Save } from "lucide-react"

import { changePasswordAction } from "@/app/actions/password"
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

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changePasswordAction, initialState)
  useActionToasts(state, pending)

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5" />
          Change password
        </CardTitle>
        <CardDescription>
          Enter your email, current password, and a new password.
        </CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="old_password">Current password</Label>
            <Input id="old_password" name="old_password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" name="new_password" type="password" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm new password</Label>
            <Input id="confirm_password" name="confirm_password" type="password" required />
          </div>
        </CardContent>
        <CardFooter className="border-t-0 bg-transparent">
          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {pending ? "Saving..." : "Update password"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
