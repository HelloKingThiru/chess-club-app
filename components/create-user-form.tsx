"use client"

import { useActionState } from "react"
import { Loader2, UserPlus } from "lucide-react"

import { createUserAction } from "@/app/actions/auth"
import type { ActionState } from "@/lib/types/auth"
import { useActionToasts } from "@/lib/use-action-toasts"
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
import { NativeSelect } from "@/components/ui/native-select"
import { PhoneInput } from "@/components/phone-input"

const initialState: ActionState = {}

type CreateUserFormProps = {
  embedded?: boolean
  onSuccess?: () => void
}

export function CreateUserForm({ embedded, onSuccess }: CreateUserFormProps) {
  const [state, submit, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await createUserAction(prev, formData)
      if (result.success) onSuccess?.()
      return result
    },
    initialState
  )
  useActionToasts(state, pending)

  const fields = (
    <>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" name="full_name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone</Label>
        <PhoneInput id="phone_number" name="phone_number" placeholder="5551234567" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" minLength={8} required />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="role">Role</Label>
        <NativeSelect id="role" name="role" defaultValue="regular">
          <option value="regular">Regular member</option>
          <option value="admin">Admin (coach/captain)</option>
        </NativeSelect>
      </div>
    </>
  )

  if (embedded) {
    return (
      <form action={submit}>
        <div className="grid gap-4 px-4 sm:grid-cols-2">{fields}</div>
        <div className="mt-6 flex px-4 pb-4">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {pending ? "Creating..." : "Create account"}
          </Button>
        </div>
      </form>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>Add admins or regular members.</CardDescription>
      </CardHeader>
      <form action={submit}>
        <CardContent className="grid gap-4 sm:grid-cols-2">{fields}</CardContent>
        <CardFooter>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
            {pending ? "Creating..." : "Create account"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
