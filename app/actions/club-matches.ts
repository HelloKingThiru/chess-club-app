"use server"

import { revalidatePath } from "next/cache"

import { assertAdminTools } from "@/lib/admin-mode"
import type { ClubMatchResult } from "@/lib/club-matches"
import { createClient } from "@/lib/supabase/server"
import type { ActionState } from "@/lib/types/auth"

const RESULTS = new Set<ClubMatchResult>(["white", "black", "draw"])

function isMatchResult(value: string): value is ClubMatchResult {
  return RESULTS.has(value as ClubMatchResult)
}

function missingTableMessage(message: string) {
  if (
    message.includes("club_matches") ||
    message.toLowerCase().includes("schema cache")
  ) {
    return "Club matches are not set up yet. Run supabase/migration-v17.sql in the Supabase SQL editor, then try again."
  }
  return message
}

export async function recordClubMatchAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  const whiteId = String(formData.get("white_id") ?? "").trim()
  const blackId = String(formData.get("black_id") ?? "").trim()
  const result = String(formData.get("result") ?? "").trim()
  const playedOn = String(formData.get("played_on") ?? "").trim()
  const notes = String(formData.get("notes") ?? "").trim()

  if (!whiteId || !blackId) return { error: "Pick both players." }
  if (whiteId === blackId) return { error: "Pick two different players." }
  if (!isMatchResult(result)) return { error: "Pick a result." }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(playedOn)) return { error: "Pick a date." }
  if (notes.length > 500)
    return { error: "Notes must be 500 characters or fewer." }

  const supabase = await createClient()
  const { data: players, error: playerError } = await supabase
    .from("profiles")
    .select("id")
    .in("id", [whiteId, blackId])

  if (playerError) return { error: playerError.message }
  if ((players ?? []).length !== 2) {
    return { error: "Those players are not on the club roster." }
  }

  const { error } = await supabase.from("club_matches").insert({
    white_id: whiteId,
    black_id: blackId,
    result,
    played_on: playedOn,
    notes: notes || null,
    recorded_by: auth.profile.id,
  })

  if (error) return { error: missingTableMessage(error.message) }

  revalidatePath("/club-matches")
  return { success: "Match result saved." }
}

export async function deleteClubMatchAction(
  matchId: string
): Promise<ActionState> {
  const auth = await assertAdminTools()
  if (!auth.ok) return { error: auth.error }

  if (!/^[0-9a-f-]{36}$/i.test(matchId)) {
    return { error: "That match could not be found." }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from("club_matches")
    .delete()
    .eq("id", matchId)

  if (error) return { error: missingTableMessage(error.message) }

  revalidatePath("/club-matches")
  return { success: "Match result removed." }
}
