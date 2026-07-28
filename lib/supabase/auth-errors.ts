import type { AuthError } from "@supabase/supabase-js"

function isNetworkFailure(error: AuthError) {
  const message = error.message.toLowerCase()
  const cause = String(error.cause ?? "").toLowerCase()

  return (
    message.includes("fetch failed") ||
    message.includes("aborted") ||
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("failed to fetch") ||
    cause.includes("timeout") ||
    cause.includes("connect") ||
    cause.includes("econnrefused") ||
    cause.includes("enotfound")
  )
}

export function loginErrorMessage(error: AuthError) {
  if (isNetworkFailure(error)) {
    return "Could not reach the login server. Your network may be blocking Supabase—try another connection (for example a phone hotspot) or turn off VPN/firewall filters."
  }

  if (error.status === 429) {
    return "Too many sign-in attempts. Wait a minute and try again."
  }

  const message = error.message.toLowerCase()
  if (
    message.includes("email not confirmed") ||
    message.includes("email_not_confirmed")
  ) {
    return "Your email is not confirmed yet. Ask a club admin to verify your account in Supabase."
  }

  return "Invalid email or password."
}

export function passwordVerifyErrorMessage(error: AuthError) {
  if (isNetworkFailure(error)) {
    return "Could not reach the login server. Check your internet connection and try again."
  }
  return "Current password is incorrect."
}
