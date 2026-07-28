"use client"

import { useMemo, useState } from "react"
import { MessageSquare, Search } from "lucide-react"

import { chatInitials } from "@/lib/chat"
import { ClientThreadPreviewTime } from "@/components/client-thread-preview-time"
import type { ChatDirectoryEntry } from "@/lib/types/chat"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type ChatDirectoryListProps = {
  entries: ChatDirectoryEntry[]
  selectedContactId: string | null
  selectedThreadId: string | null
  currentUserId: string
  searchPlaceholder: string
  emptyTitle: string
  emptyDescription: string
  onSelect: (entry: ChatDirectoryEntry) => void
}

export function ChatDirectoryList({
  entries,
  selectedContactId,
  selectedThreadId,
  currentUserId,
  searchPlaceholder,
  emptyTitle,
  emptyDescription,
  onSelect,
}: ChatDirectoryListProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return entries

    return entries.filter((entry) => {
      const name = entry.contactName?.toLowerCase() ?? ""
      const subtitle = entry.contactSubtitle.toLowerCase()
      return name.includes(trimmed) || subtitle.includes(trimmed)
    })
  }, [entries, query])

  const withMessages = filtered.filter((entry) => entry.threadId && entry.lastMessageAt)
  const notStarted = filtered.filter((entry) => !entry.threadId || !entry.lastMessageAt)

  if (entries.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <MessageSquare className="size-8 text-muted-foreground/70" />
        <p className="text-sm font-medium">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-3 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No matches for your search.
          </p>
        ) : (
          <>
            {withMessages.length > 0 ? (
              <DirectorySection title="Recent">
                {withMessages.map((entry) => (
                  <DirectoryRow
                    key={entry.contactId}
                    entry={entry}
                    selected={
                      selectedContactId === entry.contactId ||
                      (entry.threadId !== null && selectedThreadId === entry.threadId)
                    }
                    currentUserId={currentUserId}
                    onSelect={onSelect}
                  />
                ))}
              </DirectorySection>
            ) : null}

            {notStarted.length > 0 ? (
              <DirectorySection
                title={withMessages.length > 0 ? "Everyone" : "Contacts"}
              >
                {notStarted.map((entry) => (
                  <DirectoryRow
                    key={entry.contactId}
                    entry={entry}
                    selected={selectedContactId === entry.contactId}
                    currentUserId={currentUserId}
                    onSelect={onSelect}
                    isNew
                  />
                ))}
              </DirectorySection>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

function DirectorySection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <p className="px-4 pt-3 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </p>
      <ul className="divide-y">{children}</ul>
    </section>
  )
}

function DirectoryRow({
  entry,
  selected,
  currentUserId,
  onSelect,
  isNew,
}: {
  entry: ChatDirectoryEntry
  selected: boolean
  currentUserId: string
  onSelect: (entry: ChatDirectoryEntry) => void
  isNew?: boolean
}) {
  const needsReply =
    entry.lastMessageSenderId && entry.lastMessageSenderId !== currentUserId

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(entry)}
        className={cn(
          "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
          selected ? "bg-primary/8" : "hover:bg-muted/60 active:bg-muted"
        )}
      >
        <Avatar className="size-11 shrink-0">
          <AvatarFallback
            className={cn(selected ? "bg-primary/15 text-primary" : "bg-muted")}
          >
            {chatInitials(entry.contactName, entry.contactId)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p
              className={cn(
                "truncate text-sm",
                needsReply ? "font-semibold" : "font-medium"
              )}
            >
              {entry.contactName || "Club contact"}
            </p>
            {entry.lastMessageAt ? (
              <ClientThreadPreviewTime
                iso={entry.lastMessageAt}
                className="shrink-0 text-[11px] text-muted-foreground"
              />
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {entry.contactSubtitle}
          </p>
          <p
            className={cn(
              "mt-1 line-clamp-2 text-xs",
              needsReply
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            )}
          >
            {isNew
              ? "Tap to send a message"
              : entry.lastMessageBody || "No messages yet"}
          </p>
        </div>

        {needsReply ? (
          <span
            className="mt-2 size-2 shrink-0 rounded-full bg-primary"
            aria-label="Needs reply"
          />
        ) : (
          <MessageSquare className="mt-2 size-4 shrink-0 text-muted-foreground/70" />
        )}
      </button>
    </li>
  )
}
