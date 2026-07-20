"use client"

import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { ArrowLeft, MessageSquare, Shield, Users } from "lucide-react"
import { toast } from "sonner"

import { sendChatMessageAction, getChatMessages } from "@/app/actions/chat"
import { ChatComposer } from "@/components/chat/chat-composer"
import { ChatDirectoryList } from "@/components/chat/chat-directory-list"
import { ChatMessageList } from "@/components/chat/chat-message-list"
import {
  chatInitials,
  memberSubtitle,
  adminThreadSubtitle,
  adminThreadTitle,
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
  directory?: ChatDirectoryEntry[]
  initialMemberId: string | null
  initialThreadId: string | null
  initialMessages: ChatMessage[]
}

export function ChatShell({
  currentUser,
  directory = [],
  initialMemberId,
  initialThreadId,
  initialMessages,
}: ChatShellProps) {
  const admin = isAdmin(currentUser.role)
  const [directoryList, setDirectoryList] = useState(directory)
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(
    initialMemberId
  )
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreadId
  )
  const [messages, setMessages] = useState(initialMessages)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [mobileShowThread, setMobileShowThread] = useState(
    !admin || Boolean(initialThreadId || initialMemberId)
  )
  const [pending, startTransition] = useTransition()

  const selectedEntry = useMemo(
    () =>
      directoryList.find((entry) => entry.memberId === selectedMemberId) ??
      (selectedThreadId
        ? directoryList.find((entry) => entry.threadId === selectedThreadId) ??
          null
        : null),
    [directoryList, selectedMemberId, selectedThreadId]
  )

  const syncDirectoryPreview = useCallback(
    (message: ChatMessage, memberId: string) => {
      setDirectoryList((prev) => {
        const existing = prev.find((entry) => entry.memberId === memberId)
        const updated: ChatDirectoryEntry = {
          ...(existing ?? {
            memberId,
            memberName: null,
            gradeLevel: null,
            boardNumber: null,
            threadId: message.threadId,
          }),
          threadId: message.threadId,
          lastMessageBody: message.body,
          lastMessageAt: message.createdAt,
          lastMessageSenderId: message.senderId,
          updatedAt: message.createdAt,
        }

        const rest = prev.filter((entry) => entry.memberId !== memberId)
        return [updated, ...rest].sort((a, b) => {
          const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
          const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
          if (aTime !== bTime) return bTime - aTime
          return (a.memberName ?? "").localeCompare(b.memberName ?? "")
        })
      })
    },
    []
  )

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
    setSelectedMemberId(entry.memberId)
    setSelectedThreadId(entry.threadId)
    setMobileShowThread(true)
  }

  function handleIncomingMessage(message: ChatMessage, memberId: string) {
    setMessages((prev) => {
      if (prev.some((item) => item.id === message.id)) return prev
      return [...prev, message]
    })
    syncDirectoryPreview(message, memberId)
  }

  function handleSend(body: string) {
    startTransition(async () => {
      const result = await sendChatMessageAction(
        selectedThreadId,
        body,
        admin ? selectedMemberId : null
      )

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.threadId) {
        setSelectedThreadId(result.threadId)
        setMobileShowThread(true)

        if (selectedMemberId) {
          setDirectoryList((prev) =>
            prev.map((entry) =>
              entry.memberId === selectedMemberId
                ? { ...entry, threadId: result.threadId! }
                : entry
            )
          )
        }
      }

      if (result.message && selectedMemberId) {
        handleIncomingMessage(result.message, selectedMemberId)
      } else if (result.message && !admin) {
        handleIncomingMessage(result.message, currentUser.id)
      }
    })
  }

  const threadTitle = admin
    ? selectedEntry?.memberName || "Member"
    : adminThreadTitle()

  const threadSubtitle = admin
    ? selectedEntry
      ? memberSubtitle({
          gradeLevel: selectedEntry.gradeLevel,
          boardNumber: selectedEntry.boardNumber,
        })
      : "Pick a member to message"
    : adminThreadSubtitle()

  const showEmptyAdmin = admin && !selectedMemberId
  const canLoadMessages = Boolean(selectedThreadId)
  const canCompose = admin ? Boolean(selectedMemberId) : true

  const chatBarClass =
    "flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80"

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {admin ? (
          <aside
            className={cn(
              "flex min-h-0 w-full flex-col border-b bg-background md:w-80 md:shrink-0 md:border-r md:border-b-0 lg:w-96",
              mobileShowThread && selectedMemberId ? "hidden md:flex" : "flex"
            )}
          >
            <div className={chatBarClass}>
              <Users className="size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight">Members</p>
                <p className="truncate text-xs text-muted-foreground">
                  Message any club member
                </p>
              </div>
            </div>
            <ChatDirectoryList
              entries={directoryList}
              selectedMemberId={selectedMemberId}
              selectedThreadId={selectedThreadId}
              currentUserId={currentUser.id}
              onSelect={handleSelectEntry}
            />
          </aside>
        ) : null}

        <section
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col",
            admin && !mobileShowThread ? "hidden md:flex" : "flex"
          )}
        >
          <div className={chatBarClass}>
            {admin ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Back to members"
                onClick={() => setMobileShowThread(false)}
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}

            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="bg-primary/10 text-xs text-primary">
                {admin ? (
                  chatInitials(
                    selectedEntry?.memberName ?? null,
                    selectedEntry?.memberId ?? "?"
                  )
                ) : (
                  <Shield className="size-4" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-semibold leading-tight">
                  {threadTitle}
                </h2>
                {admin && selectedEntry?.boardNumber ? (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    Board {selectedEntry.boardNumber}
                  </Badge>
                ) : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {threadSubtitle}
              </p>
            </div>
          </div>

          {showEmptyAdmin ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <MessageSquare className="size-7 text-muted-foreground" />
              </span>
              <div className="space-y-1">
                <p className="font-medium">Choose a member</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Search the roster on the left and send the first message — no
                  need to wait for them to reach out.
                </p>
              </div>
            </div>
          ) : !canLoadMessages && canCompose ? (
            <>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                <p className="text-sm font-medium">
                  {admin
                    ? `Message ${selectedEntry?.memberName || "this member"}`
                    : "Start the conversation"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {admin
                    ? "Send a note about practice, board order, or anything they should know."
                    : "Send a message below. Admins typically reply during club hours."}
                </p>
              </div>
              <ChatComposer
                disabled={pending}
                placeholder={
                  admin
                    ? `Message ${selectedEntry?.memberName || "member"}…`
                    : "Message admins…"
                }
                onSend={handleSend}
              />
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
                showSenderNames={admin}
                onIncomingMessage={(message) => {
                  if (selectedMemberId) {
                    handleIncomingMessage(message, selectedMemberId)
                  }
                }}
              />
              <ChatComposer
                disabled={pending}
                placeholder={
                  admin
                    ? `Message ${selectedEntry?.memberName || "member"}…`
                    : "Message admins…"
                }
                onSend={handleSend}
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
