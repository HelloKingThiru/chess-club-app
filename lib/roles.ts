import type { UserRole } from "@/lib/types/auth"

export function roleLabel(role: UserRole) {
  return role === "admin" ? "Admin" : "Member"
}

export function isAdmin(role: UserRole) {
  return role === "admin"
}
