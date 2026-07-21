import { appUrl } from "@/lib/app-url"
import { siteConfig } from "@/lib/site-config"
import { formatEventDateTime } from "@/lib/upcoming-events"

function layout(title: string, bodyHtml: string) {
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
        You are receiving this because email notifications are enabled on your ${siteConfig.name} account.
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}
