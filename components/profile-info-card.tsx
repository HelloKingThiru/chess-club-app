"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import {
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Save,
  Shield,
  User,
  X,
} from "lucide-react"

import { updateProfileAction } from "@/app/actions/profile"
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
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
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
}

export function ProfileInfoCard({ profile, canEditPhone }: ProfileInfoCardProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)

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

  const isAdmin = profile.role === "admin"

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
      editable: false,
      value: profile.email ?? "",
      display: profile.email,
      type: "email" as const,
      kind: "text" as const,
    },
    {
      id: "phone_number",
      label: "Phone",
      icon: Phone,
      editable: canEditPhone,
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
            {!editing && isAdmin && profile.bio ? (
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
              Edit profile
            </Button>
          ) : null}
          <SignOutButton />
        </div>
      </CardHeader>

      <CardContent>
        {editing ? (
          <form action={submitProfile} className="space-y-4">
            <input
              type="hidden"
              name="include_phone"
              value={canEditPhone ? "true" : "false"}
            />
            <input
              type="hidden"
              name="include_bio"
              value={isAdmin ? "true" : "false"}
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
                        <NativeSelect
                          id={id}
                          name={id}
                          defaultValue={value}
                        >
                          <option value="">Not set</option>
                          {GRADE_LEVELS.map((grade) => (
                            <option key={grade} value={grade}>
                              {gradeLevelOptionLabel(grade)}
                            </option>
                          ))}
                        </NativeSelect>
                      ) : (
                        <Input
                          id={id}
                          name={id}
                          type={type}
                          defaultValue={value}
                          required={id === "full_name"}
                        />
                      )
                    ) : (
                      <p className="flex h-8 items-center text-sm">{display}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {isAdmin ? (
              <div className="space-y-2 rounded-lg border p-3">
                <Label htmlFor="bio">About</Label>
                <Textarea
                  id="bio"
                  name="bio"
                  rows={4}
                  defaultValue={profile.bio ?? ""}
                  placeholder="Your role, availability, or how members can reach you..."
                />
              </div>
            ) : null}
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
              <Button variant="link" asChild className="h-8 shrink-0 px-2 text-sm">
                <Link href="/change-password">Change Password?</Link>
              </Button>
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
    </Card>
  )
}
