export type UserRole = "admin" | "regular"

export type Profile = {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  board_number: number | null
  grade_level: number | null
  bio: string | null
  role: UserRole
  created_at: string
}

export type Post = {
  id: string
  title: string
  body: string
  author_id: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export type GameResult = {
  id: string
  player_id: string
  opponent: string
  result: "win" | "loss" | "draw"
  event_name: string | null
  played_on: string | null
  board_number: number | null
  created_at: string
}

export type ActionState = {
  error?: string
  success?: string
}
