"use server"

import { revalidatePath } from "next/cache"

import { assertAdminTools } from "@/lib/admin-mode"
import { UNKNOWN_PLAYER, isGameResult } from "@/lib/game-logs"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

async function resolveSide(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  typedName: string,
  label: "White" | "Black"
): Promise<{ id: string | null; name: string } | { error: string }> {
  if (id === UNKNOWN_PLAYER) return { id: null, name: typedName }

  const { data } = await supabase
    .from("public_profiles")
    .select("id, full_name")
    .eq("id", id)
    .maybeSingle()

  if (!data) return { error: `Pick a club member for ${label}.` }
  return {
    id: data.id,
    name: data.full_name?.trim() || "Unnamed member",
  }
}

function permissionError(message: string) {
  const lower = message.toLowerCase()
  if (
    lower.includes("white_name") ||
    lower.includes("black_name") ||
    lower.includes("null value")
  ) {
    return "Could not save that game. In Supabase, run supabase/migration-v20.sql, then try again."
  }
  if (
    lower.includes("check constraint") ||
    lower.includes("result_check") ||
    lower.includes("row-level security") ||
    lower.includes("permission denied") ||
    lower.includes("42501")
  ) {
    return "Could not save that game. In Supabase, run supabase/migration-v19.sql, then try again."
  }
  return message
}

export async function createGameLogAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()

  const whiteId = String(formData.get("white_id") ?? "").trim()
  const blackId = String(formData.get("black_id") ?? "").trim()
  const whiteNameInput = String(formData.get("white_name") ?? "").trim()
  const blackNameInput = String(formData.get("black_name") ?? "").trim()
  const result = String(formData.get("result") ?? "").trim()
  const eventName = String(formData.get("event_name") ?? "").trim()
  const playedOn = String(formData.get("played_on") ?? "").trim()
  const boardRaw = String(formData.get("board_number") ?? "").trim()

  if (!whiteId) return { error: "Pick White." }
  if (!blackId) return { error: "Pick Black." }
  if (whiteId !== UNKNOWN_PLAYER && whiteId === blackId) {
    return { error: "Pick two different players." }
  }
  if (whiteId === UNKNOWN_PLAYER && !whiteNameInput) {
    return { error: "Enter White's name." }
  }
  if (blackId === UNKNOWN_PLAYER && !blackNameInput) {
    return { error: "Enter Black's name." }
  }
  if (whiteNameInput.length > 80 || blackNameInput.length > 80) {
    return { error: "Player name is too long." }
  }
  if (!isGameResult(result)) return { error: "Pick a score." }
  if (eventName.length > 80) return { error: "Event name is too long." }
  if (playedOn && !DATE_PATTERN.test(playedOn)) {
    return { error: "Enter a valid date." }
  }

  let boardNumber: number | null = null
  if (boardRaw) {
    const parsed = Number(boardRaw)
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 24) {
      return { error: "Board number must be from 1 to 24." }
    }
    boardNumber = parsed
  }

  const white = await resolveSide(supabase, whiteId, whiteNameInput, "White")
  if ("error" in white) return { error: white.error }
  const black = await resolveSide(supabase, blackId, blackNameInput, "Black")
  if ("error" in black) return { error: black.error }

  const { error } = await supabase.from("game_results").insert({
    player_id: white.id,
    opponent: black.name,
    white_name: white.name,
    black_name: black.name,
    result,
    event_name: eventName || null,
    played_on: playedOn || null,
    board_number: boardNumber,
  })

  if (error) return { error: permissionError(error.message) }

  revalidatePath("/logs")
  return { success: "Game logged." }
}

export async function deleteGameLogAction(id: string): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  const supabase = await createClient()
  const { error } = await supabase.from("game_results").delete().eq("id", id)

  if (error) return { error: permissionError(error.message) }

  revalidatePath("/logs")
  return { success: "Game removed." }
}
