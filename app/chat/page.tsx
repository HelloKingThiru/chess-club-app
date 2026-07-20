import { redirect } from "next/navigation"

import {
  getAdminChatDirectory,
  getChatMessages,
  getChatThreadsForUser,
} from "@/app/actions/chat"
import { ChatShell } from "@/components/chat/chat-shell"
import { getProfile } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"

type ChatPageProps = {
  searchParams: Promise<{ thread?: string; member?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const profile = await getProfile()
  if (!profile) redirect("/login")

  const { thread: threadParam, member: memberParam } = await searchParams
  const admin = isAdmin(profile.role)

  let directory = undefined
  let initialMemberId: string | null = admin ? null : profile.id
  let initialThreadId: string | null = null

  if (admin) {
    directory = await getAdminChatDirectory()

    if (memberParam && directory.some((entry) => entry.memberId === memberParam)) {
      const entry = directory.find((item) => item.memberId === memberParam)!
      initialMemberId = entry.memberId
      initialThreadId = entry.threadId
    } else if (
      threadParam &&
      directory.some((entry) => entry.threadId === threadParam)
    ) {
      const entry = directory.find((item) => item.threadId === threadParam)!
      initialMemberId = entry.memberId
      initialThreadId = entry.threadId
    }
  } else {
    const threads = await getChatThreadsForUser()
    initialThreadId = threads[0]?.id ?? null
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
        initialMemberId={initialMemberId}
        initialThreadId={initialThreadId}
        initialMessages={initialMessages}
      />
    </div>
  )
}
