"use client"

import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"

import { hasChatUnreadMessages } from "@/app/actions/chat"
import { MobileNavLink, NavLink } from "@/components/nav-link"

const CHAT_READ_EVENT = "chat-read-state-changed"

export function dispatchChatReadStateChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHAT_READ_EVENT))
  }
}

export function MessagesNavLink({
  initialUnread,
  href,
  icon,
  label,
}: {
  initialUnread: boolean
  href: string
  icon: LucideIcon
  label: string
}) {
  const [unread, setUnread] = useState(initialUnread)

  useEffect(() => {
    setUnread(initialUnread)
  }, [initialUnread])

  useEffect(() => {
    const refresh = () => {
      void hasChatUnreadMessages().then(setUnread)
    }
    window.addEventListener(CHAT_READ_EVENT, refresh)
    return () => window.removeEventListener(CHAT_READ_EVENT, refresh)
  }, [])

  return (
    <NavLink
      href={href}
      icon={icon}
      label={label}
      showNotificationDot={unread}
    />
  )
}

export function MessagesMobileNavLink({
  initialUnread,
  href,
  icon,
  label,
  onNavigate,
}: {
  initialUnread: boolean
  href: string
  icon: LucideIcon
  label: string
  onNavigate?: () => void
}) {
  const [unread, setUnread] = useState(initialUnread)

  useEffect(() => {
    setUnread(initialUnread)
  }, [initialUnread])

  useEffect(() => {
    const refresh = () => {
      void hasChatUnreadMessages().then(setUnread)
    }
    window.addEventListener(CHAT_READ_EVENT, refresh)
    return () => window.removeEventListener(CHAT_READ_EVENT, refresh)
  }, [])

  return (
    <MobileNavLink
      href={href}
      icon={icon}
      label={label}
      onNavigate={onNavigate}
      showNotificationDot={unread}
    />
  )
}
