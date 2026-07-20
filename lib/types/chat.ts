export type ChatThreadSummary = {
  id: string
  memberId: string
  memberName: string | null
  gradeLevel: number | null
  boardNumber: number | null
  lastMessageBody: string | null
  lastMessageAt: string | null
  lastMessageSenderId: string | null
  updatedAt: string
}

export type ChatMessage = {
  id: string
  threadId: string
  senderId: string
  senderName: string | null
  senderRole: "admin" | "regular"
  body: string
  createdAt: string
}

/** Admin view: every player, with optional existing thread */
export type ChatDirectoryEntry = {
  memberId: string
  memberName: string | null
  gradeLevel: number | null
  boardNumber: number | null
  threadId: string | null
  lastMessageBody: string | null
  lastMessageAt: string | null
  lastMessageSenderId: string | null
  updatedAt: string | null
}
