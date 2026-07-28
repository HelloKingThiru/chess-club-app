export type ChatThreadSummary = {
  id: string
  memberId: string
  adminId: string
  memberName: string | null
  adminName: string | null
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

/** Sidebar row for admin (member) or member (admin) chat picker */
export type ChatDirectoryEntry = {
  contactId: string
  contactName: string | null
  contactSubtitle: string
  contactBadge?: string | null
  threadId: string | null
  lastMessageBody: string | null
  lastMessageAt: string | null
  lastMessageSenderId: string | null
  updatedAt: string | null
}
