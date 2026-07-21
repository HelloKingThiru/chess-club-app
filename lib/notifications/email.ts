import { Resend } from "resend"

import { isEmailConfigured } from "@/lib/app-url"

let resendClient: Resend | null = null

function getResend() {
  if (!isEmailConfigured()) return null
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY)
  }
  return resendClient
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const resend = getResend()
  const from = process.env.RESEND_FROM_EMAIL

  if (!resend || !from) {
    return { ok: false as const, skipped: true }
  }

  try {
    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    })

    if (error) {
      console.error("Resend email failed:", error.message)
      return { ok: false as const, error: error.message }
    }

    return { ok: true as const }
  } catch (error) {
    console.error("Resend email failed:", error)
    return { ok: false as const, error: String(error) }
  }
}
