"use client"

import { useActionState, useEffect, useState } from "react"
import { Loader2, Plus, UserPlus } from "lucide-react"

import { createUserAction } from "@/app/actions/auth"
import type { ActionState } from "@/lib/types/auth"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"
import { PhoneInput } from "@/components/phone-input"

const initial: ActionState = {}

export function CreateUserDialog({
  open: openProp,
  onOpenChange: onOpenChangeProp,
  hideTrigger = false,
  triggerVariant = "default",
  triggerSize = "sm",
  triggerLabel,
  triggerClassName,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  triggerVariant?: "default" | "outline" | "secondary" | "ghost"
  triggerSize?: "sm" | "default"
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const onOpenChange = onOpenChangeProp ?? setInternalOpen
  const [state, formAction, pending] = useActionState(createUserAction, initial)
  useActionToasts(state, pending)

  useEffect(() => {
    if (state.success) onOpenChange(false)
  }, [state.success, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger ? (
        <DialogTrigger asChild>
          <Button
            size={triggerSize}
            variant={triggerVariant}
            className={triggerClassName}
          >
            <UserPlus className="size-4" />
            {triggerLabel ?? "New member"}
          </Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create member</DialogTitle>
          <DialogDescription>
            Add a member account with email and password.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cu-full_name">Full name</Label>
              <Input id="cu-full_name" name="full_name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-email">Email</Label>
              <Input id="cu-email" name="email" type="email" required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cu-phone_number">Phone</Label>
              <PhoneInput
                id="cu-phone_number"
                name="phone_number"
                placeholder="5551234567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-password">Password</Label>
              <Input
                id="cu-password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cu-role">Role</Label>
              <NativeSelect id="cu-role" name="role" defaultValue="regular">
                <option value="regular">Member</option>
                <option value="admin">Admin</option>
              </NativeSelect>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {pending ? "Creating..." : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
