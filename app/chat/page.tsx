import { redirect } from "next/navigation"

import {
  getAdminChatDirectory,
  getChatMessages,
  getMemberChatDirectory,
} from "@/app/actions/chat"
import { ChatShell } from "@/components/chat/chat-shell"
import { getProfile } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"

type ChatPageProps = {
  searchParams: Promise<{ thread?: string; member?: string; admin?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const profile = await getProfile()
  if (!profile) redirect("/login")

  const { thread: threadParam, member: memberParam, admin: adminParam } =
    await searchParams
  const adminUser = isAdmin(profile.role)

  const directory = adminUser
    ? await getAdminChatDirectory()
    : await getMemberChatDirectory()

  let initialContactId: string | null = null
  let initialThreadId: string | null = null

  if (adminUser) {
    if (memberParam && directory.some((entry) => entry.contactId === memberParam)) {
      const entry = directory.find((item) => item.contactId === memberParam)!
      initialContactId = entry.contactId
      initialThreadId = entry.threadId
    } else if (
      threadParam &&
      directory.some((entry) => entry.threadId === threadParam)
    ) {
      const entry = directory.find((item) => item.threadId === threadParam)!
      initialContactId = entry.contactId
      initialThreadId = entry.threadId
    }
  } else {
    if (adminParam && directory.some((entry) => entry.contactId === adminParam)) {
      const entry = directory.find((item) => item.contactId === adminParam)!
      initialContactId = entry.contactId
      initialThreadId = entry.threadId
    } else if (
      threadParam &&
      directory.some((entry) => entry.threadId === threadParam)
    ) {
      const entry = directory.find((item) => item.threadId === threadParam)!
      initialContactId = entry.contactId
      initialThreadId = entry.threadId
    }
  }

  const initialMessages = initialThreadId
    ? await getChatMessages(initialThreadId)
    : []

  return (
    <div className="flex h-[calc(100svh-3.5rem)] flex-col overflow-hidden">
      <ChatShell
        currentUser={{
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
          role: profile.role,
        }}
        directory={directory}
        initialContactId={initialContactId}
        initialThreadId={initialThreadId}
        initialMessages={initialMessages}
      />
    </div>
  )
}
