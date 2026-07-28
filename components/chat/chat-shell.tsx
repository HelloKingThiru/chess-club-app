"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { ArrowLeft, MessageSquare, Shield, Users } from "lucide-react"
import { toast } from "sonner"

import { sendChatMessageAction, getChatMessages } from "@/app/actions/chat"
import { ChatComposer } from "@/components/chat/chat-composer"
import { ChatDirectoryList } from "@/components/chat/chat-directory-list"
import { ChatMessageList } from "@/components/chat/chat-message-list"
import {
  adminThreadSubtitle,
  chatInitials,
} from "@/lib/chat"
import { isAdmin } from "@/lib/roles"
import type { ChatDirectoryEntry, ChatMessage } from "@/lib/types/chat"
import type { Profile } from "@/lib/types/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ChatShellProps = {
  currentUser: Pick<Profile, "id" | "full_name" | "email" | "role">
  directory: ChatDirectoryEntry[]
  initialContactId: string | null
  initialThreadId: string | null
  initialMessages: ChatMessage[]
}

export function ChatShell({
  currentUser,
  directory,
  initialContactId,
  initialThreadId,
  initialMessages,
}: ChatShellProps) {
  const admin = isAdmin(currentUser.role)
  const [directoryList, setDirectoryList] = useState(directory)
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    initialContactId
  )
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId
  )
  const [messages, setMessages] = useState(initialMessages)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(
    Boolean(initialThreadId || initialContactId)
  )
  const [pending, startTransition] = useTransition()
  const [notifyMemberByEmail, setNotifyMemberByEmail] = useState(false)

  const selectedEntry = useMemo(
    () =>
      directoryList.find((entry) => entry.contactId === selectedContactId) ??
      (selectedThreadId
        ? directoryList.find((entry) => entry.threadId === selectedThreadId) ??
          null
        : null),
    [directoryList, selectedContactId, selectedThreadId]
  )

  const syncDirectoryPreview = useCallback((message: ChatMessage, contactId: string) => {
    setDirectoryList((prev) => {
      const existing = prev.find((entry) => entry.contactId === contactId)
      const updated: ChatDirectoryEntry = {
        ...(existing ?? {
          contactId,
          contactName: null,
          contactSubtitle: admin ? "Club member" : "Club admin",
          threadId: message.threadId,
        }),
        threadId: message.threadId,
        lastMessageBody: message.body,
        lastMessageAt: message.createdAt,
        lastMessageSenderId: message.senderId,
        updatedAt: message.createdAt,
      }

      const rest = prev.filter((entry) => entry.contactId !== contactId)
      return [updated, ...rest].sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        if (aTime !== bTime) return bTime - aTime
        return (a.contactName ?? "").localeCompare(b.contactName ?? "")
      })
    })
  }, [admin])

  useEffect(() => {
    setNotifyMemberByEmail(false)
  }, [selectedContactId])

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    let cancelled = false
    setLoadingMessages(true)

    void getChatMessages(selectedThreadId).then((next) => {
      if (!cancelled) {
        setMessages(next)
        setLoadingMessages(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [selectedThreadId])

  function handleSelectEntry(entry: ChatDirectoryEntry) {
    setSelectedContactId(entry.contactId)
    setSelectedThreadId(entry.threadId)
    setMobileShowThread(true)
  }

  function handleIncomingMessage(message: ChatMessage, contactId: string) {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev
      return [...prev, message]
    })
    syncDirectoryPreview(message, contactId)
  }

  function handleSend(body: string, options?: { notifyRecipient?: boolean }) {
    startTransition(async () => {
      const result = await sendChatMessageAction(selectedThreadId, body, admin
        ? {
            memberId: selectedContactId,
            notifyRecipient: options?.notifyRecipient ?? false,
          }
        : { adminId: selectedContactId })

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.threadId) {
        setSelectedThreadId(result.threadId)
        setMobileShowThread(true)

        if (selectedContactId) {
          setDirectoryList((prev) =>
            prev.map((entry) =>
              entry.contactId === selectedContactId
                ? { ...entry, threadId: result.threadId! }
                : entry
            )
          )
        }
      }

      if (result.message && selectedContactId) {
        handleIncomingMessage(result.message, selectedContactId)
      }

      if (admin && options?.notifyRecipient) {
        setNotifyMemberByEmail(false)
      }
    })
  }

  const composerProps = {
    disabled: pending,
    placeholder: `Message ${selectedEntry?.contactName || (admin ? "member" : "admin")}…`,
    onSend: handleSend,
    ...(admin
      ? {
          notifyRecipient: notifyMemberByEmail,
          onNotifyRecipientChange: setNotifyMemberByEmail,
        }
      : {}),
  }

  const threadTitle = selectedEntry?.contactName || (admin ? "Member" : "Admin")

  const threadSubtitle = admin
    ? selectedEntry?.contactSubtitle ?? "Pick a member to message"
    : adminThreadSubtitle(selectedEntry?.contactName)

  const showEmptyPicker = !selectedContactId
  const canLoadMessages = Boolean(selectedThreadId)
  const canCompose = Boolean(selectedContactId)

  const chatBarClass =
    "flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80"

  const sidebarTitle = admin ? "Members" : "Admins"
  const sidebarDescription = admin
    ? "Message any club member"
    : "Pick who you want to reach"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "flex min-h-0 w-full flex-col border-b bg-background md:w-80 md:shrink-0 md:border-r md:border-b-0 lg:w-96",
            mobileShowThread && selectedContactId ? "hidden md:flex" : "flex"
          )}
        >
          <div className={chatBarClass}>
            {admin ? (
              <Users className="size-4 shrink-0 text-primary" />
            ) : (
              <Shield className="size-4 shrink-0 text-primary" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">
                {sidebarTitle}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {sidebarDescription}
              </p>
            </div>
          </div>
          <ChatDirectoryList
            entries={directoryList}
            selectedContactId={selectedContactId}
            selectedThreadId={selectedThreadId}
            currentUserId={currentUser.id}
            searchPlaceholder={admin ? "Search members…" : "Search admins…"}
            emptyTitle={admin ? "No members yet" : "No admins listed"}
            emptyDescription={
              admin
                ? "Club members will appear here so you can message them."
                : "Ask a club officer to add admin accounts if this list is empty."
            }
            onSelect={handleSelectEntry}
          />
        </aside>

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            !mobileShowThread ? "hidden md:flex" : "flex"
          )}
        >
          <div className={chatBarClass}>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label={`Back to ${sidebarTitle.toLowerCase()}`}
              onClick={() => setMobileShowThread(false)}
            >
              <ArrowLeft className="size-4" />
            </Button>

            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {chatInitials(
                  selectedEntry?.contactName ?? null,
                  selectedEntry?.contactId ?? "?"
                )}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold leading-tight">
                  {threadTitle}
                </h2>
                {admin && selectedEntry?.contactBadge ? (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {selectedEntry.contactBadge}
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {threadSubtitle}
              </p>
            </div>
          </div>

          {showEmptyPicker ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <MessageSquare className="size-7 text-muted-foreground" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">
                  {admin ? "Choose a member" : "Choose an admin"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {admin
                    ? "Search the roster on the left and send the first message."
                    : "Pick an admin from the list, then send your message below."}
                </p>
              </div>
            </div>
          ) : !canLoadMessages && canCompose ? (
            <>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <p className="text-sm font-medium">
                  Message {selectedEntry?.contactName || "them"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {admin
                    ? "Send a note about practice, board order, or anything they should know."
                    : "Your message goes only to this admin. They typically reply during club hours."}
                </p>
              </div>
              <ChatComposer {...composerProps} />
            </>
          ) : loadingMessages ? (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Loading messages…
            </div>
          ) : (
            <>
              <ChatMessageList
                threadId={selectedThreadId!}
                messages={messages}
                currentUserId={currentUser.id}
                showSenderNames
                onIncomingMessage={(message) => {
                  if (selectedContactId) {
                    handleIncomingMessage(message, selectedContactId)
                  }
                }}
              />
              <ChatComposer {...composerProps} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
