"use client"

import { useEffect, useMemo, useRef } from "react"

import { getChatMessages } from "@/app/actions/chat"
import {
  chatInitials,
  formatDayDivider,
  formatMessageTime,
} from "@/lib/chat"
import { createClient } from "@/lib/supabase/client"
import type { ChatMessage } from "@/lib/types/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type ChatMessageListProps = {
  threadId: string
  messages: ChatMessage[]
  currentUserId: string
  showSenderNames: boolean
  onIncomingMessage: (message: ChatMessage) => void
}

type MessageGroup = {
  day: string
  items: ChatMessage[]
}

export function ChatMessageList({
  threadId,
  messages,
  currentUserId,
  showSenderNames,
  onIncomingMessage,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const messageIdsRef = useRef(new Set<string>())
  const senderCacheRef = useRef(
    new Map<string, Pick<ChatMessage, "senderName" | "senderRole">>()
  )

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((message) => message.id))
    for (const message of messages) {
      senderCacheRef.current.set(message.senderId, {
        senderName: message.senderName,
        senderRole: message.senderRole,
      })
    }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, threadId])

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`chat-thread-${threadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${threadId}`,
        },
        async (payload) => {
          const row = payload.new as {
            id: string
            thread_id: string
            sender_id: string
            body: string
            created_at: string
          }

          if (messageIdsRef.current.has(row.id)) return

          const cached = senderCacheRef.current.get(row.sender_id)
          if (cached) {
            onIncomingMessage({
              id: row.id,
              threadId: row.thread_id,
              senderId: row.sender_id,
              senderName: cached.senderName,
              senderRole: cached.senderRole,
              body: row.body,
              createdAt: row.created_at,
            })
            return
          }

          const fresh = await getChatMessages(threadId)
          const match = fresh.find((message) => message.id === row.id)
          if (match) {
            onIncomingMessage(match)
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [threadId, onIncomingMessage])

  const groups = useMemo(() => {
    const result: MessageGroup[] = []

    for (const message of messages) {
      const day = formatDayDivider(message.createdAt)
      const last = result[result.length - 1]
      if (!last || last.day !== day) {
        result.push({ day, items: [message] })
      } else {
        last.items.push(message)
      }
    }

    return result
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <p className="text-sm font-medium">Start the conversation</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Send a message below. Admins typically reply during club hours.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4">
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.day} className="space-y-3">
            <div className="flex justify-center">
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {group.day}
              </span>
            </div>

            {group.items.map((message) => {
              const own = message.senderId === currentUserId
              const showName = showSenderNames && !own

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    own ? "justify-end" : "justify-start"
                  )}
                >
                  {!own ? (
                    <Avatar className="size-7 shrink-0">
                      <AvatarFallback className="bg-muted text-[10px]">
                        {chatInitials(message.senderName, message.senderId)}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}

                  <div
                    className={cn(
                      "max-w-[85%] space-y-1 sm:max-w-[70%]",
                      own ? "items-end" : "items-start"
                    )}
                  >
                    {showName ? (
                      <p className="px-1 text-[11px] font-medium text-muted-foreground">
                        {message.senderName || (message.senderRole === "admin" ? "Admin" : "Member")}
                        {message.senderRole === "admin" && message.senderName ? " · Admin" : ""}
                      </p>
                    ) : null}
                    <div
                      className={cn(
                        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm",
                        own
                          ? "rounded-br-md bg-primary text-primary-foreground"
                          : "rounded-bl-md border bg-card"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                    <p
                      className={cn(
                        "px-1 text-[10px] text-muted-foreground",
                        own ? "text-right" : "text-left"
                      )}
                    >
                      {formatMessageTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  )
}
