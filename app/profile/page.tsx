import { redirect } from "next/navigation"

import { requireProfile } from "@/lib/auth"

export default async function ProfileRedirectPage() {
  const profile = await requireProfile()
  redirect(`/profile/${profile.id}`)
}
