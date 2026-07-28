import Link from "next/link"
import { notFound } from "next/navigation"
import { Calendar, GraduationCap, Mail, MapPin, Phone, Shield, User } from "lucide-react"

import { getProfile } from "@/lib/auth"
import { canUseAdminTools } from "@/lib/admin-mode"
import {
  MEMBER_PROFILE_COLUMNS,
  PUBLIC_PROFILE_COLUMNS,
  toProfile,
} from "@/lib/guest-access"
import { createClient } from "@/lib/supabase/server"
import { formatGradeLevel } from "@/lib/grade-level"
import { roleLabel } from "@/lib/roles"
import type { Profile } from "@/lib/types/auth"
import { getNotificationPreferences } from "@/app/actions/notifications"
import { NotificationSettingsCard } from "@/components/notification-settings-card"
import { ProfileInfoCard } from "@/components/profile-info-card"
import { formatPhoneDisplay } from "@/components/phone-input"
import {
  EmptyState,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-shell"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Post } from "@/lib/types/posts"
import { eventTypeLabels } from "@/lib/types/posts"
import { formatClubDateTime } from "@/lib/club-datetime"
import { cn } from "@/lib/utils"

function initials(name: string | null, email: string) {
  const source = name || email
  return source
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function ProfileViewCard({
  profile,
  showContact,
}: {
  profile: Profile
  showContact: boolean
}) {
  const fields = [
    { label: "Full name", icon: User, value: profile.full_name || "Not set" },
    ...(showContact
      ? [
          { label: "Email", icon: Mail, value: profile.email },
          {
            label: "Phone",
            icon: Phone,
            value: formatPhoneDisplay(profile.phone_number),
          },
        ]
      : []),
    {
      label: "Grade level",
      icon: GraduationCap,
      value: formatGradeLevel(profile.grade_level),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarFallback>{initials(profile.full_name, profile.email)}</AvatarFallback>
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
            {profile.role === "admin" && profile.bio ? (
              <p className="mt-3 max-w-prose text-sm text-muted-foreground whitespace-pre-wrap">
                {profile.bio}
              </p>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map(({ label, icon: Icon, value }) => (
            <div
              key={label}
              className="flex items-start gap-3 rounded-lg border p-3"
            >
              <Icon className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type ProfilePageProps = {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const currentUser = await getProfile()
  const isGuest = !currentUser
  const isOwnProfile = currentUser?.id === id
  const usePublicProfile =
    !isOwnProfile && (!currentUser || currentUser.role !== "admin")
  const supabase = await createClient()

  const { data: profileRow } = usePublicProfile
    ? await supabase
        .from("public_profiles")
        .select(PUBLIC_PROFILE_COLUMNS)
        .eq("id", id)
        .maybeSingle()
    : await supabase
        .from("profiles")
        .select(MEMBER_PROFILE_COLUMNS)
        .eq("id", id)
        .maybeSingle()

  if (!profileRow) notFound()

  const profile = toProfile(profileRow as Record<string, unknown>)
  const showContact = Boolean(currentUser) && (isOwnProfile || currentUser?.role === "admin")
  const canManageProfile =
    Boolean(currentUser) &&
    currentUser!.role === "admin" &&
    !isOwnProfile &&
    (await canUseAdminTools(currentUser))
  const notificationPreferences = isOwnProfile
    ? await getNotificationPreferences()
    : null

  let events: Array<
    Pick<Post, "id" | "title" | "event_type" | "event_date" | "location" | "kind"> & {
      status: "active" | "archived"
    }
  > = []

  if (!isGuest) {
    const { data: attendance } = await supabase
      .from("event_attendees")
      .select(
        "posts(id, title, event_type, event_date, location, kind, archived_at)"
      )
      .eq("user_id", id)

    type AttendanceRow = {
      posts:
        | (Pick<
            Post,
            | "id"
            | "title"
            | "event_type"
            | "event_date"
            | "location"
            | "kind"
            | "archived_at"
          >)
        | Pick<
            Post,
            | "id"
            | "title"
            | "event_type"
            | "event_date"
            | "location"
            | "kind"
            | "archived_at"
          >[]
        | null
    }

    function unwrapPost(value: AttendanceRow["posts"]) {
      if (!value) return null
      return Array.isArray(value) ? value[0] ?? null : value
    }

    events = ((attendance ?? []) as AttendanceRow[])
      .map((row) => unwrapPost(row.posts))
      .filter((post): post is NonNullable<typeof post> => post?.kind === "specific")
      .map((post) => ({
        id: post.id,
        title: post.title,
        event_type: post.event_type,
        event_date: post.event_date,
        location: post.location,
        kind: post.kind,
        status: post.archived_at ? ("archived" as const) : ("active" as const),
      }))
      .sort(
        (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
      )
  }


  return (
    <PageShell className="space-y-8">
      <PageHeader
        title={isOwnProfile ? "My profile" : profile.full_name || "Member profile"}
        description={
          isOwnProfile
            ? "Update your contact info and see events you've attended."
            : canManageProfile
              ? "Edit or remove this member's account (admin mode)."
              : isGuest
              ? "Public club profile."
              : "Contact info and events this member has joined."
        }
        icon={User}
      />

      {isOwnProfile ? (
        <>
          <ProfileInfoCard
            profile={profile}
            canEditPhone={profile.role === "admin"}
          />
          <NotificationSettingsCard
            initialPreferences={{
              email_announcements: notificationPreferences!.email_announcements,
              email_events: notificationPreferences!.email_events,
              email_enrollment: notificationPreferences!.email_enrollment,
            }}
          />
        </>
      ) : canManageProfile ? (
        <ProfileInfoCard
          profile={profile}
          canEditPhone
          variant="managed"
        />
      ) : (
        <ProfileViewCard profile={profile} showContact={showContact} />
      )}

      {!isGuest ? (
        <PageSection
          title="Events attended"
          description="Tournaments and club events this member enrolled in."
          icon={Calendar}
        >
          {events.length === 0 ? (
            <EmptyState
              title="No events yet"
              description={
                isOwnProfile
                  ? "Enroll in an upcoming event from the home page or calendar."
                  : "This member hasn't enrolled in any events yet."
              }
            />
          ) : (
            <div className="grid gap-3">
              {events.map((event) => {
                const archived = event.status === "archived"
                const card = (
                  <Card
                    className={cn(
                      "transition-colors",
                      archived
                        ? "border-dashed opacity-75"
                        : "hover:bg-accent/40"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {archived ? (
                          <Badge variant="outline">Archived</Badge>
                        ) : null}
                        {event.event_type ? (
                          <Badge>{eventTypeLabels[event.event_type]}</Badge>
                        ) : null}
                        <CardTitle className="text-base">{event.title}</CardTitle>
                      </div>
                      <CardDescription className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {formatClubDateTime(event.event_date, "long")}
                        </span>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3.5" />
                            {event.location}
                          </span>
                        ) : null}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )

                return (
                  <Link key={event.id} href={`/event/${event.id}`}>
                    {card}
                  </Link>
                )
              })}
            </div>
          )}
        </PageSection>
      ) : null}
    </PageShell>
  )
}
