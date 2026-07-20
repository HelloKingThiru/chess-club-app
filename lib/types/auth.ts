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

export type ActionState = {
  error?: string
  success?: string
}
