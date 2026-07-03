"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"

const ADMIN_MODE_COOKIE = "chess_admin_mode"

export async function setAdminModeAction(enabled: boolean) {
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_MODE_COOKIE, enabled ? "1" : "0", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
  revalidatePath("/", "layout")
}
