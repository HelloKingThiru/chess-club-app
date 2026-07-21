export type NotificationPreferences = {
  email_announcements: boolean
  email_events: boolean
  email_enrollment: boolean
  push_announcements: boolean
  push_events: boolean
  push_enrollment: boolean
}

export const defaultNotificationPreferences: NotificationPreferences = {
  email_announcements: true,
  email_events: true,
  email_enrollment: true,
  push_announcements: false,
  push_events: false,
  push_enrollment: false,
}
