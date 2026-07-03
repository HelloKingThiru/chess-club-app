export type PostKind = "specific" | "mini"
export type EventType = "club_meet" | "league_game" | "tournament" | "fundraiser"
export type MiniKind = "reminder" | "update"

export type Post = {
  id: string
  kind: PostKind
  title: string
  body: string
  event_type: EventType | null
  mini_kind: MiniKind | null
  event_date: string
  location: string | null
  published: boolean
  author_id: string | null
  created_at: string
  updated_at: string
}

export type ProfileSummary = {
  id: string
  full_name: string | null
  email: string
  phone_number: string | null
  board_number: number | null
  role: "admin" | "regular"
}

export const eventTypeLabels: Record<EventType, string> = {
  club_meet: "Club meet",
  league_game: "League game",
  tournament: "Tournament",
  fundraiser: "Fundraiser",
}

export const miniKindLabels: Record<MiniKind, string> = {
  reminder: "Reminder",
  update: "Update",
}
