"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  KeyRound,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react"

import { deleteProfileAction, updateProfileAction } from "@/app/actions/profile"
import type { ActionState, Profile } from "@/lib/types/auth"
import { formatGradeLevel, GRADE_LEVELS, gradeLevelOptionLabel } from "@/lib/grade-level"
import { roleLabel } from "@/lib/roles"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { SignOutButton } from "@/components/sign-out-button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormSelect } from "@/components/ui/form-select"
import { ConfirmAlertDialog } from "@/components/confirm-alert-dialog"
import { toast } from "sonner"
import {
  formatPhoneDisplay,
  PhoneInput,
  phoneInputValue,
} from "@/components/phone-input"

const initialState: ActionState = {}

function initials(name: string | null, email: string) {
  const source = name || email
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

type ProfileInfoCardProps = {
  profile: Profile
  canEditPhone: boolean
  variant?: "self" | "managed"
}

export function ProfileInfoCard({
  profile,
  canEditPhone,
  variant = "self",
}: ProfileInfoCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const managed = variant === "managed"

  const [state, submitProfile, pending] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const result = await updateProfileAction(prev, formData)
      if (result.success) {
        setEditing(false)
        router.refresh()
      }
      return result
    },
    initialState
  )
  useActionToasts(state, pending)

  const isAdminProfile = profile.role === "admin"
  const editPhone = managed ? true : canEditPhone

  async function handleDelete() {
    setDeletePending(true)
    const result = await deleteProfileAction(profile.id)
    setDeletePending(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(result.success ?? "Account deleted.")
    setDeleteOpen(false)
    router.push("/board-order")
    router.refresh()
  }

  const fields = [
    {
      id: "full_name",
      label: "Full name",
      icon: User,
      editable: true,
      value: profile.full_name ?? "",
      display: profile.full_name || "Not set",
      type: "text" as const,
      kind: "text" as const,
    },
    {
      id: "email",
      label: "Email",
      icon: Mail,
      editable: managed,
      value: profile.email ?? "",
      display: profile.email,
      type: "email" as const,
      kind: "text" as const,
    },
    {
      id: "phone_number",
      label: "Phone",
      icon: Phone,
      editable: editPhone,
      value: profile.phone_number ?? "",
      display: formatPhoneDisplay(profile.phone_number),
      type: "tel" as const,
      kind: "phone" as const,
    },
    {
      id: "grade_level",
      label: "Grade level",
      icon: GraduationCap,
      editable: true,
      value: profile.grade_level?.toString() ?? "",
      display: formatGradeLevel(profile.grade_level),
      type: "text" as const,
      kind: "grade" as const,
    },
  ] as const

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>
              {initials(profile.full_name, profile.email)}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-xl">
              {profile.full_name || "Club member"}
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Shield className="size-3" />
                {roleLabel(profile.role)}
              </Badge>
              {profile.board_number ? (
                <Badge variant="outline">Board {profile.board_number}</Badge>
              ) : null}
            </div>
            {!editing && isAdminProfile && profile.bio ? (
              <p className="mt-3 max-w-prose text-sm text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="size-4" />
              {managed ? "Edit member" : "Edit profile"}
            </Button>
          ) : null}
          {managed ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" />
              Delete account
            </Button>
          ) : (
            <SignOutButton />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {editing ? (
          <form action={submitProfile} className="space-y-4">
            {managed ? (
              <input type="hidden" name="profile_id" value={profile.id} />
            ) : null}
            <input
              type="hidden"
              name="include_phone"
              value={editPhone ? "true" : "false"}
            />
            <input
              type="hidden"
              name="include_bio"
              value={isAdminProfile ? "true" : "false"}
            />
            <input
              type="hidden"
              name="include_admin_fields"
              value={managed ? "true" : "false"}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map(({ id, label, icon: Icon, editable, value, display, type, kind }) => (
                <div
                  key={id}
                  className="flex items-start gap-3 rounded-lg border p-3"
                >
                  <Icon className="mt-2 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor={id}>{label}</Label>
                    {editable ? (
                      kind === "phone" ? (
                        <PhoneInput
                          id={id}
                          name={id}
                          defaultValue={phoneInputValue(value)}
                          placeholder="5551234567"
                        />
                      ) : kind === "grade" ? (
                        <FormSelect
                          id={id}
                          name={id}
                          className="w-full"
                          defaultValue={value || "__none__"}
                          emptyValue="__none__"
                          options={[
                            { value: "__none__", label: "Not set" },
                            ...GRADE_LEVELS.map((grade) => ({
                              value: String(grade),
                              label: gradeLevelOptionLabel(grade),
                            })),
                          ]}
                        />
                      ) : (
                        <Input
                          id={id}
                          name={id}
                          type={type}
                          defaultValue={value}
                          required={id === "full_name" || (managed && id === "email")}
                        />
                      )
                    ) : (
                      <p className="flex h-8 items-center text-sm">{display}</p>
                    )}
                  </div>
                </div>
              ))}
              {managed && isAdminProfile ? (
                <div className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                  <User className="mt-2 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="bio">About</Label>
                    <Input
                      id="bio"
                      name="bio"
                      type="text"
                      defaultValue={profile.bio ?? ""}
                      placeholder="Role, availability, or how members can reach this admin..."
                    />
                  </div>
                </div>
              ) : isAdminProfile && !managed ? (
                <div className="flex items-start gap-3 rounded-lg border p-3 sm:col-span-2">
                  <User className="mt-2 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="bio">About</Label>
                    <Input
                      id="bio"
                      name="bio"
                      type="text"
                      defaultValue={profile.bio ?? ""}
                      placeholder="Your role, availability, or how members can reach you..."
                    />
                  </div>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Button type="submit" size="lg" disabled={pending}>
                  {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  {pending ? "Saving..." : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => setEditing(false)}
                >
                  <X className="size-4" />
                  Cancel
                </Button>
              </div>
              {!managed ? (
                <Button variant="link" asChild className="h-8 shrink-0 px-2 text-sm">
                  <Link href="/change-password">
                    <KeyRound className="size-4" />
                    Change password
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ id, label, icon: Icon, display }) => (
              <div
                key={id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Icon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{display}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <ConfirmAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this account?"
        description={`This permanently removes ${profile.full_name || profile.email} and their sign-in. Chat history and enrollments tied to this user may be removed as well.`}
        confirmLabel="Delete account"
        destructive
        pending={deletePending}
        onConfirm={() => {
          void handleDelete()
        }}
      />
    </Card>
  )
}
