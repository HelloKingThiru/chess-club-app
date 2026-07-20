"use server"

import { revalidatePath } from "next/cache"

import { requireProfile } from "@/lib/auth"
import { isAdmin } from "@/lib/roles"
import { createClient } from "@/lib/supabase/server"
import type { ChatMessage, ChatThreadSummary, ChatDirectoryEntry } from "@/lib/types/chat"
import type { ActionState } from "@/lib/types/auth"

type ThreadRow = {
  id: string
  member_id: string
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
  return {
    id: row.id,
    memberId: row.member_id,
    memberName: member?.full_name ?? null,
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

export async function getChatThreadsForUser(): Promise<ChatThreadSummary[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  let query = supabase
    .from("chat_threads")
    .select(
      "id, member_id, last_message_body, last_message_at, last_message_sender_id, updated_at, member:profiles!chat_threads_member_id_fkey(full_name, grade_level, board_number)"
    )
    .order("updated_at", { ascending: false })

  if (!isAdmin(profile.role)) {
    query = query.eq("member_id", profile.id)
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

export async function getAdminChatDirectory(): Promise<ChatDirectoryEntry[]> {
  const profile = await requireProfile()
  if (!isAdmin(profile.role)) return []

  const supabase = await createClient()

  const [{ data: members, error: membersError }, { data: threads, error: threadsError }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, grade_level, board_number")
        .eq("role", "regular")
        .order("full_name", { ascending: true }),
      supabase
        .from("chat_threads")
        .select(
          "id, member_id, last_message_body, last_message_at, last_message_sender_id, updated_at"
        ),
    ])

  if (membersError?.message.includes("profiles")) return []
  if (threadsError?.message.includes("chat_threads")) {
    return ((members ?? []) as MemberRow[]).map((member) => ({
      memberId: member.id,
      memberName: member.full_name,
      gradeLevel: member.grade_level,
      boardNumber: member.board_number,
      threadId: null,
      lastMessageBody: null,
      lastMessageAt: null,
      lastMessageSenderId: null,
      updatedAt: null,
    }))
  }

  const threadByMember = new Map(
    ((threads ?? []) as Omit<ThreadRow, "member">[]).map((thread) => [
      thread.member_id,
      thread,
    ])
  )

  const directory = ((members ?? []) as MemberRow[]).map((member) => {
    const thread = threadByMember.get(member.id)
    return {
      memberId: member.id,
      memberName: member.full_name,
      gradeLevel: member.grade_level,
      boardNumber: member.board_number,
      threadId: thread?.id ?? null,
      lastMessageBody: thread?.last_message_body ?? null,
      lastMessageAt: thread?.last_message_at ?? null,
      lastMessageSenderId: thread?.last_message_sender_id ?? null,
      updatedAt: thread?.updated_at ?? null,
    } satisfies ChatDirectoryEntry
  })

  return directory.sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    if (aTime !== bTime) return bTime - aTime
    return (a.memberName ?? "").localeCompare(b.memberName ?? "")
  })
}

export async function getChatMessages(threadId: string): Promise<ChatMessage[]> {
  const profile = await requireProfile()
  const supabase = await createClient()

  const { data: thread, error: threadError } = await supabase
    .from("chat_threads")
    .select("id, member_id")
    .eq("id", threadId)
    .maybeSingle()

  if (threadError?.message.includes("chat_threads")) return []
  if (threadError || !thread) return []

  if (!isAdmin(profile.role) && thread.member_id !== profile.id) {
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

  return ((data ?? []) as MessageRow[]).map(mapMessage)
}

async function ensureMemberThread(
  supabase: Awaited<ReturnType<typeof createClient>>,
  memberId: string
) {
  const { data: existing } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("member_id", memberId)
    .maybeSingle()

  if (existing) return existing.id

  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ member_id: memberId })
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
  memberId?: string | null
): Promise<ActionState & { message?: ChatMessage; threadId?: string }> {
  const profile = await requireProfile()
  const supabase = await createClient()
  const trimmed = body.trim()

  if (!trimmed) {
    return { error: "Message cannot be empty." }
  }

  if (trimmed.length > 4000) {
    return { error: "Message is too long (max 4000 characters)." }
  }

  let resolvedThreadId = threadId

  try {
    if (!resolvedThreadId) {
      if (isAdmin(profile.role)) {
        if (!memberId) {
          return { error: "Select a member to message." }
        }
        resolvedThreadId = await ensureMemberThread(supabase, memberId)
      } else {
        resolvedThreadId = await ensureMemberThread(supabase, profile.id)
      }
    } else {
      const { data: thread, error: threadError } = await supabase
        .from("chat_threads")
        .select("id, member_id")
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

      if (!isAdmin(profile.role) && thread.member_id !== profile.id) {
        return { error: "You cannot send messages in this conversation." }
      }
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
