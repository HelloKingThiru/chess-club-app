/** Central branding and domain settings. */
export const siteConfig = {
  name: "NCHS Chess Club",
  shortName: "NCHS Chess",
  /** Set NEXT_PUBLIC_APP_URL when deploying (e.g. https://nchschessclub.com). */
  plannedDomain: "nchschessclub.com",
  /** Used for event reminder scheduling (3-day / 1-day emails). */
  timeZone: "America/Chicago",
  description:
    "Announcements, events, board order, and member tools for the NCHS chess team.",
} as const
