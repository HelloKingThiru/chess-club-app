import { appUrl } from "@/lib/app-url"
import { siteConfig } from "@/lib/site-config"
import { formatEventDateTime } from "@/lib/upcoming-events"

function layout(title: string, bodyHtml: string, footerNote?: string) {
  const footer =
    footerNote ??
    `You are receiving this because email notifications are enabled on your ${siteConfig.name} account.`

  return `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.5; color: #111827;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <p style="margin: 0 0 16px; font-size: 12px; letter-spacing: 0.04em; text-transform: uppercase; color: #6b7280;">
        ${siteConfig.name}
      </p>
      <h1 style="margin: 0 0 16px; font-size: 22px;">${title}</h1>
      ${bodyHtml}
      <p style="margin: 24px 0 0; font-size: 12px; color: #6b7280;">
        ${footer}
      </p>
    </div>
  </body>
</html>`
}

function button(label: string, href: string) {
  return `<p style="margin: 24px 0 0;">
    <a href="${href}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">
      ${label}
    </a>
  </p>`
}

export function announcementEmail({
  title,
  body,
}: {
  title: string
  body: string
}) {
  const subject = `New announcement: ${title}`
  const html = layout(
    title,
    `<p style="margin: 0 0 12px; white-space: pre-wrap;">${escapeHtml(body)}</p>
     ${button("View on club site", appUrl("/"))}`
  )

  return { subject, html }
}

export function newEventEmail({
  title,
  body,
  eventDate,
  location,
  eventId,
}: {
  title: string
  body: string
  eventDate: string
  location: string | null
  eventId: string
}) {
  const when = formatEventDateTime(eventDate, "long")
  const subject = `New event: ${title}`
  const locationLine = location
    ? `<p style="margin: 0 0 8px;"><strong>Location:</strong> ${escapeHtml(location)}</p>`
    : ""

  const html = layout(
    title,
    `<p style="margin: 0 0 12px; white-space: pre-wrap;">${escapeHtml(body)}</p>
     <p style="margin: 0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>
     ${locationLine}
     ${button("View event", appUrl(`/event/${eventId}`))}`
  )

  return { subject, html }
}

export function eventThreeDayReminderEmail({
  title,
  eventDate,
  location,
  eventId,
}: {
  title: string
  eventDate: string
  location: string | null
  eventId: string
}) {
  const when = formatEventDateTime(eventDate, "long")
  const subject = `Reminder: ${title} in 3 days`
  const locationLine = location
    ? `<p style="margin: 0 0 8px;"><strong>Location:</strong> ${escapeHtml(location)}</p>`
    : ""

  const html = layout(
    `${title} is coming up`,
    `<p style="margin: 0 0 12px;">This event is in three days:</p>
     <p style="margin: 0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>
     ${locationLine}
     ${button("View event", appUrl(`/event/${eventId}`))}`
  )

  return { subject, html }
}

export function enrollmentOneDayReminderEmail({
  title,
  eventDate,
  location,
  eventId,
}: {
  title: string
  eventDate: string
  location: string | null
  eventId: string
}) {
  const when = formatEventDateTime(eventDate, "long")
  const subject = `Tomorrow: ${title}`
  const locationLine = location
    ? `<p style="margin: 0 0 8px;"><strong>Location:</strong> ${escapeHtml(location)}</p>`
    : ""

  const html = layout(
    `You're enrolled for tomorrow`,
    `<p style="margin: 0 0 12px;"><strong>${escapeHtml(title)}</strong> is tomorrow. You're signed up to attend.</p>
     <p style="margin: 0 0 8px;"><strong>When:</strong> ${escapeHtml(when)}</p>
     ${locationLine}
     ${button("View event details", appUrl(`/event/${eventId}`))}`
  )

  return { subject, html }
}

export function chatMessageEmail({
  senderName,
  body,
  threadId,
  recipientKind,
}: {
  senderName: string
  body: string
  threadId: string
  recipientKind: "admin" | "member"
}) {
  const preview =
    body.length > 500 ? `${body.slice(0, 500).trimEnd()}…` : body
  const subject =
    recipientKind === "admin"
      ? `New chat message from ${senderName}`
      : `Message from ${senderName}`
  const title =
    recipientKind === "admin"
      ? `${senderName} messaged you`
      : `New message from ${senderName}`
  const footerNote =
    recipientKind === "admin"
      ? `You received this because a member sent you a message in ${siteConfig.name} chat.`
      : `An admin chose to email you about this chat message on ${siteConfig.name}.`

  const html = layout(
    title,
    `<p style="margin: 0 0 12px;"><strong>${escapeHtml(senderName)}</strong> wrote:</p>
     <p style="margin: 0 0 12px; white-space: pre-wrap; padding: 12px; background: #f3f4f6; border-radius: 8px;">${escapeHtml(preview)}</p>
     ${button("Open chat", appUrl(`/chat?thread=${threadId}`))}`,
    footerNote
  )

  return { subject, html }
}

export function accountDeletedEmail({ memberName }: { memberName: string }) {
  const subject = `Your ${siteConfig.name} account was removed`
  const html = layout(
    "Account removed",
    `<p style="margin: 0 0 12px;">Hi ${escapeHtml(memberName)},</p>
     <p style="margin: 0 0 12px;">A club administrator removed your ${escapeHtml(siteConfig.name)} account. You will no longer be able to sign in with that account.</p>
     <p style="margin: 0;">If you believe this was a mistake, contact a club officer or coach.</p>`,
    `This message was sent because your account was deleted from ${siteConfig.name}.`
  )

  return { subject, html }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
