import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { isAuthRequiredPath } from "@/lib/guest-access"
import { isSupabaseFetchFailure, supabaseFetch } from "@/lib/supabase/fetch"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { fetch: supabaseFetch },
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl
    const isPublic =
      pathname.startsWith("/login") || !isAuthRequiredPath(pathname)

    if (!user && !isPublic) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    if (user && pathname.startsWith("/login")) {
      // Keep users on /login when their profile is missing so they can sign out.
      if (request.nextUrl.searchParams.get("error") === "profile") {
        return supabaseResponse
      }

      const url = request.nextUrl.clone()
      url.pathname = "/"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    if (process.env.NODE_ENV === "development" && isSupabaseFetchFailure(error)) {
      console.warn("[middleware] Supabase unreachable; continuing as guest.")
    }
    return supabaseResponse
  }
}
