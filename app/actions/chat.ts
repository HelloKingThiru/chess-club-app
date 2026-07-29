"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth"
import { memberSubtitle, isChatThreadUnread } from "@/lib/chat"
import { isAdmin } from "@/lib/roles"
import { createClient } from "@/lib/supabase/server"
import type { ChatMessage, ChatThreadSummary, ChatDirectoryEntry } from "@/lib/types/chat"
import type { ActionState, Profile } from "@/lib/types/auth"

type ThreadRow = {
  id: string
  member_id: string
  admin_id: string
  last_message_body: string | null
  last_message_at: string | null
  last_message_sender_id: string | null
  updated_at: string
  member: {
    full_name: string | null
    grade_level: number | null
    board_number: number | null
  } | {
    full_name: string | null
    grade_level: number | null
    board_number: number | null
  }[] | null
  admin: {
    full_name: string | null
  } | {
    full_name: string | null
  }[] | null
}

type MessageRow = {
  id: string
  thread_id: string
  sender_id: string
  body: string
  created_at: string
  sender: {
    full_name: string | null
    role: string
  } | {
    full_name: string | null
    role: string
  }[] | null
}

function unwrapOne<T>(value: T | T[] | null): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function mapThread(row: ThreadRow): ChatThreadSummary {
  const member = unwrapOne(row.member)
  const admin = unwrapOne(row.admin)
  return {
    id: row.id,
    memberId: row.member_id,
    adminId: row.admin_id,
    memberName: member?.full_name ?? null,
    adminName: admin?.full_name ?? null,
    gradeLevel: member?.grade_level ?? null,
    boardNumber: member?.board_number ?? null,
    lastMessageBody: row.last_message_body,
    lastMessageAt: row.last_message_at,
    lastMessageSenderId: row.last_message_sender_id,
    updatedAt: row.updated_at,
  }
}

function mapMessage(row: MessageRow): ChatMessage {
  const sender = unwrapOne(row.sender)
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    senderName: sender?.full_name ?? null,
    senderRole: sender?.role === "admin" ? "admin" : "regular",
    body: row.body,
    createdAt: row.created_at,
  }
}

function sortDirectory(entries: ChatDirectoryEntry[]) {
  return entries.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    if (aTime !== bTime) return bTime - aTime
    return (a.contactName ?? "").localeCompare(b.contactName ?? "")
  })
}

async function loadThreadReadMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from("chat_thread_reads")
    .select("thread_id, read_at")
    .eq("user_id", userId)

  if (error?.message.includes("chat_thread_reads")) {
    return new Map()
  }

  if (error) {
    console.error("loadThreadReadMap:", error.message)
    return new Map()
  }

  return new Map(
    (data ?? []).map((row) => [
      row.thread_id as string,
      row.read_at as string,
    ])
  )
}

async function markThreadRead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  threadId: string
) {
  const { error } = await supabase.from("chat_thread_reads").upsert(
    {
      thread_id: threadId,
      user_id: userId,
      read_at: new Date().toISOString(),
    },
    { onConflict: "thread_id,user_id" }
  )

  if (error?.message.includes("chat_thread_reads")) return
  if (error) {
    console.error("markThreadRead:", error.message)
  }
}

async function userCanAccessThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profile: Pick<Profile, "id" | "role">,
  threadId: string
) {
  const { data: thread, error } = await supabase
    .from("chat_threads")
    .select("id, member_id, admin_id")
    .eq("id", threadId)
    .maybeSingle()

  if (error?.message.includes("chat_threads") || error || !thread) {
    return false
  }

  return (
    thread.member_id === profile.id ||
    (isAdmin(profile.role) && thread.admin_id === profile.id)
  )
}

export async function hasChatUnreadMessages(): Promise<boolean> {
  const profile = await requireProfile()
  const supabase = await createClient()

  let query = supabase
    .from("chat_threads")
    .select(
      "id, last_message_at, last_message_sender_id"
    )

  if (!isAdmin(profile.role)) {
    query = query.eq("member_id", profile.id)
  } else {
    query = query.eq("admin_id", profile.id)
  }

  const [{ data: threads, error: threadsError }, readMap] = await Promise.all([
    query,
    loadThreadReadMap(supabase, profile.id),
  ])

  if (threadsError?.message.includes("chat_threads")) return false
  if (threadsError) {
    console.error("hasChatUnreadMessages:", threadsError.message)
    return false
  }

  for (const row of threads ?? []) {
    if (
      isChatThreadUnread(
        {
          lastMessageAt: row.last_message_at,
          lastMessageSenderId: row.last_message_sender_id,
          lastReadAt: readMap.get(row.id) ?? null,
        },
        profile.id
      )
    ) {
      return true
    }
  }

  return false
}

export async function markChatThreadReadAction(threadId: string): Promise<void> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const allowed = await userCanAccessThread(supabase, profile, threadId)
  if (!allowed) return

  await markThreadRead(supabase, profile.id, threadId)
  revalidatePath("/", "layout")
  revalidatePath("/chat")
}

export async function getChatThreadsForUser(): Promise<ChatThreadSummary[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  let query = supabase
    .from("chat_threads")
    .select(
      "id, member_id, admin_id, last_message_body, last_message_at, last_message_sender_id, updated_at, member:profiles!chat_threads_member_id_fkey(full_name, grade_level, board_number), admin:profiles!chat_threads_admin_id_fkey(full_name)"
    )
    .order("updated_at", { ascending: false })

  if (!isAdmin(profile.role)) {
    query = query.eq("member_id", profile.id)
  } else {
    query = query.eq("admin_id", profile.id)
  }

  const { data, error } = await query

  if (error?.message.includes("chat_threads")) {
    return []
  }

  if (error) {
    console.error("getChatThreadsForUser:", error.message)
    return []
  }

  return ((data ?? []) as ThreadRow[]).map(mapThread)
}

type MemberRow = {
  id: string
  full_name: string | null
  grade_level: number | null
  board_number: number | null
}

type AdminRow = {
  id: string
  full_name: string | null
}

export async function getAdminChatDirectory(): Promise<ChatDirectoryEntry[]> {
  const profile = await requireProfile()
  if (!isAdmin(profile.role)) return []

  const supabase = await createClient()

  const [{ data: members, error: membersError }, { data: threads, error: threadsError }, readMap] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, grade_level, board_number")
        .eq("role", "regular")
        .order("full_name", { ascending: true }),
      supabase
        .from("chat_threads")
        .select(
          "id, member_id, admin_id, last_message_body, last_message_at, last_message_sender_id, updated_at"
        )
        .eq("admin_id", profile.id),
      loadThreadReadMap(supabase, profile.id),
    ])

  if (membersError?.message.includes("profiles")) return []
  if (threadsError?.message.includes("chat_threads")) {
    return sortDirectory(
      ((members ?? []) as MemberRow[]).map((member) => ({
        contactId: member.id,
        contactName: member.full_name,
        contactSubtitle: memberSubtitle({
          gradeLevel: member.grade_level,
          boardNumber: member.board_number,
        }),
        contactBadge: member.board_number ? `Board ${member.board_number}` : null,
        threadId: null,
        lastMessageBody: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        updatedAt: null,
      }))
    )
  }

  const threadByMember = new Map(
    ((threads ?? []) as Omit<ThreadRow, "member" | "admin">[]).map((thread) => [
      thread.member_id,
      thread,
    ])
  )

  const directory = ((members ?? []) as MemberRow[]).map((member) => {
    const thread = threadByMember.get(member.id)
    return {
      contactId: member.id,
      contactName: member.full_name,
      contactSubtitle: memberSubtitle({
        gradeLevel: member.grade_level,
        boardNumber: member.board_number,
      }),
      contactBadge: member.board_number ? `Board ${member.board_number}` : null,
      threadId: thread?.id ?? null,
      lastMessageBody: thread?.last_message_body ?? null,
      lastMessageAt: thread?.last_message_at ?? null,
      lastMessageSenderId: thread?.last_message_sender_id ?? null,
      updatedAt: thread?.updated_at ?? null,
      lastReadAt: thread?.id ? readMap.get(thread.id) ?? null : null,
    } satisfies ChatDirectoryEntry
  })

  return sortDirectory(directory)
}

export async function getMemberChatDirectory(): Promise<ChatDirectoryEntry[]> {
  const profile = await requireProfile()
  if (isAdmin(profile.role)) return []

  const supabase = await createClient()

  const [{ data: admins, error: adminsError }, { data: threads, error: threadsError }, readMap] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "admin")
        .order("full_name", { ascending: true }),
      supabase
        .from("chat_threads")
        .select(
          "id, member_id, admin_id, last_message_body, last_message_at, last_message_sender_id, updated_at"
        )
        .eq("member_id", profile.id),
      loadThreadReadMap(supabase, profile.id),
    ])

  if (adminsError?.message.includes("profiles")) return []
  if (threadsError?.message.includes("chat_threads")) {
    return sortDirectory(
      ((admins ?? []) as AdminRow[]).map((admin) => ({
        contactId: admin.id,
        contactName: admin.full_name,
        contactSubtitle: "Club admin",
        threadId: null,
        lastMessageBody: null,
        lastMessageAt: null,
        lastMessageSenderId: null,
        updatedAt: null,
      }))
    )
  }

  const threadByAdmin = new Map(
    ((threads ?? []) as Omit<ThreadRow, "member" | "admin">[]).map((thread) => [
      thread.admin_id,
      thread,
    ])
  )

  const directory = ((admins ?? []) as AdminRow[]).map((admin) => {
    const thread = threadByAdmin.get(admin.id)
    return {
      contactId: admin.id,
      contactName: admin.full_name,
      contactSubtitle: "Club admin",
      threadId: thread?.id ?? null,
      lastMessageBody: thread?.last_message_body ?? null,
      lastMessageAt: thread?.last_message_at ?? null,
      lastMessageSenderId: thread?.last_message_sender_id ?? null,
      updatedAt: thread?.updated_at ?? null,
      lastReadAt: thread?.id ? readMap.get(thread.id) ?? null : null,
    } satisfies ChatDirectoryEntry
  })

  return sortDirectory(directory)
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("id, member_id, admin_id")
    .eq("id", threadId)
    .maybeSingle()

  if (threadError?.message.includes("chat_threads")) return []
  if (threadError || !thread) return []

  const canAccess =
    thread.member_id === profile.id ||
    (isAdmin(profile.role) && thread.admin_id === profile.id)

  if (!canAccess) {
    return []
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, thread_id, sender_id, body, created_at, sender:profiles!chat_messages_sender_id_fkey(full_name, role)"
    )
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })

  if (error?.message.includes("chat_messages")) return []
  if (error) {
    console.error("getChatMessages:", error.message)
    return []
  }

  await markThreadRead(supabase, profile.id, threadId)
  revalidatePath("/", "layout")
  revalidatePath("/chat")

  return ((data ?? []) as MessageRow[]).map(mapMessage)
}

async function ensureChatThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string,
  adminId: string
) {
  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("member_id", memberId)
    .eq("admin_id", adminId)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ member_id: memberId, admin_id: adminId })
    .select("id")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data.id as string
}

export async function sendChatMessageAction(
  threadId: string | null,
  body: string,
  options?: {
    memberId?: string | null
    adminId?: string | null
    notifyRecipient?: boolean
  }
): Promise<ActionState & { message?: ChatMessage; threadId?: string }> {
  const profile = await requireProfile()
  const supabase = await createClient()
  const trimmed = body.trim()
  const memberId = options?.memberId ?? null
  const adminId = options?.adminId ?? null
  const notifyRecipient = options?.notifyRecipient ?? false

  if (!trimmed) {
    return { error: "Message cannot be empty." }
  }

  if (trimmed.length > 4000) {
    return { error: "Message is too long (max 4000 characters)." }
  }

  let resolvedThreadId = threadId
  let threadMemberId: string
  let threadAdminId: string

  try {
    if (!resolvedThreadId) {
      if (isAdmin(profile.role)) {
        if (!memberId) {
          return { error: "Select a member to message." }
        }
        resolvedThreadId = await ensureChatThread(
          supabase,
          memberId,
          profile.id
        )
        threadMemberId = memberId
        threadAdminId = profile.id
      } else {
        if (!adminId) {
          return { error: "Select an admin to message." }
        }
        resolvedThreadId = await ensureChatThread(
          supabase,
          profile.id,
          adminId
        )
        threadMemberId = profile.id
        threadAdminId = adminId
      }
    } else {
      const { data: thread, error: threadError } = await supabase
        .from("chat_threads")
        .select("id, member_id, admin_id")
        .eq("id", resolvedThreadId)
        .maybeSingle()

      if (threadError?.message.includes("chat_threads")) {
        return {
          error:
            "Chat is not set up yet. Run migration-v8.sql in Supabase SQL Editor.",
        }
      }

      if (threadError || !thread) {
        return { error: "Conversation not found." }
      }

      const canAccess =
        thread.member_id === profile.id ||
        (isAdmin(profile.role) && thread.admin_id === profile.id)

      if (!canAccess) {
        return { error: "You cannot send messages in this conversation." }
      }

      threadMemberId = thread.member_id
      threadAdminId = thread.admin_id
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        thread_id: resolvedThreadId,
        sender_id: profile.id,
        body: trimmed,
      })
      .select(
        "id, thread_id, sender_id, body, created_at, sender:profiles!chat_messages_sender_id_fkey(full_name, role)"
      )
      .single()

    if (error?.message.includes("chat_messages")) {
      return {
        error:
          "Chat is not set up yet. Run migration-v8.sql in Supabase SQL Editor.",
      }
    }

    if (error) {
      return { error: error.message }
    }

    const message = mapMessage(data as MessageRow)

    const senderName =
      profile.full_name?.trim() || profile.email || "Someone"
    const senderIsMember = !isAdmin(profile.role)
    const finalThreadId = resolvedThreadId as string

    void import("@/lib/notifications/dispatch").then(({ notifyChatMessage }) => {
      if (senderIsMember) {
        void notifyChatMessage({
          recipientUserId: threadAdminId,
          senderName,
          body: trimmed,
          threadId: finalThreadId,
          recipientKind: "admin",
        })
        return
      }

      if (notifyRecipient) {
        void notifyChatMessage({
          recipientUserId: threadMemberId,
          senderName,
          body: trimmed,
          threadId: finalThreadId,
          recipientKind: "member",
        })
      }
    })

    revalidatePath("/chat")
    return {
      success: "Sent",
      message,
      threadId: resolvedThreadId as string,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to send message.",
    }
  }
}
