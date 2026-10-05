"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { Loader2, Plus } from "lucide-react"

import { createGameLogAction } from "@/app/actions/games"
import { useActionToasts } from "@/hooks/use-action-toasts"
import { GAME_RESULTS, UNKNOWN_PLAYER, memberLogName } from "@/lib/game-logs"
import type { ActionState } from "@/lib/types/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FormSelect } from "@/components/ui/form-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const initialState: ActionState = {}

type PlayerOption = {
  id: string
  full_name: string | null
  board_number: number | null
}

export function GameLogForm({
  players,
  defaultPlayerId,
  today,
}: {
  players: PlayerOption[]
  defaultPlayerId?: string
  today: string
}) {
  const [state, formAction, pending] = useActionState(
    createGameLogAction,
    initialState
  )
  const [formKey, setFormKey] = useState(0)
  const lastSuccess = useRef<string | undefined>(undefined)
  useActionToasts(state, pending)

  const playerOptions = players.map((player) => ({
    value: player.id,
    label: memberLogName(player),
  }))
  const defaultWhite = players.some((player) => player.id === defaultPlayerId)
    ? defaultPlayerId
    : (playerOptions[0]?.value ?? UNKNOWN_PLAYER)
  const defaultBlack =
    playerOptions.find((player) => player.value !== defaultWhite)?.value ??
    UNKNOWN_PLAYER

  const [whiteId, setWhiteId] = useState(defaultWhite ?? UNKNOWN_PLAYER)
  const [blackId, setBlackId] = useState(defaultBlack)

  useEffect(() => {
    if (!state.success || state.success === lastSuccess.current) return
    lastSuccess.current = state.success
    setFormKey((key) => key + 1)
    setWhiteId(defaultWhite ?? UNKNOWN_PLAYER)
    setBlackId(defaultBlack)
  }, [defaultBlack, defaultWhite, state.success])

  const unknownOption = {
    value: UNKNOWN_PLAYER,
    label: "Someone we don't know",
  }
  const whiteOptions = [
    ...playerOptions.filter((player) => player.value !== blackId),
    unknownOption,
  ]
  const blackOptions = [
    ...playerOptions.filter((player) => player.value !== whiteId),
    unknownOption,
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log a game</CardTitle>
        <CardDescription>
          1-0 means White won. 0-1 means Black won. 1/2-1/2 is a draw.
        </CardDescription>
      </CardHeader>
      <form action={formAction} key={formKey}>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="white_id">White</Label>
            <FormSelect
              id="white_id"
              name="white_id"
              options={whiteOptions}
              value={
                whiteOptions.some((option) => option.value === whiteId)
                  ? whiteId
                  : UNKNOWN_PLAYER
              }
              onValueChange={(next) => {
                setWhiteId(next)
                if (next !== UNKNOWN_PLAYER && next === blackId) {
                  setBlackId(UNKNOWN_PLAYER)
                }
              }}
              placeholder="Club member"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="black_id">Black</Label>
            <FormSelect
              id="black_id"
              name="black_id"
              options={blackOptions}
              value={
                blackOptions.some((option) => option.value === blackId)
                  ? blackId
                  : UNKNOWN_PLAYER
              }
              onValueChange={(next) => {
                setBlackId(next)
                if (next !== UNKNOWN_PLAYER && next === whiteId) {
                  setWhiteId(UNKNOWN_PLAYER)
                }
              }}
              placeholder="Club member"
              required
            />
          </div>
          {whiteId === UNKNOWN_PLAYER ? (
            <div className="space-y-2">
              <Label htmlFor="white_name">White's name</Label>
              <Input
                id="white_name"
                name="white_name"
                required
                maxLength={80}
                placeholder="Name of the player who isn't in the club"
              />
            </div>
          ) : null}
          {blackId === UNKNOWN_PLAYER ? (
            <div className="space-y-2">
              <Label htmlFor="black_name">Black's name</Label>
              <Input
                id="black_name"
                name="black_name"
                required
                maxLength={80}
                placeholder="Name of the player who isn't in the club"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="result">Score</Label>
            <FormSelect
              id="result"
              name="result"
              options={GAME_RESULTS.map((result) => ({
                value: result.value,
                label: result.label,
              }))}
              defaultValue="1-0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="played_on">Date</Label>
            <Input
              id="played_on"
              name="played_on"
              type="date"
              defaultValue={today}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="event_name">Event</Label>
            <Input
              id="event_name"
              name="event_name"
              maxLength={80}
              placeholder="Optional, like a league match"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="board_number">Board</Label>
            <Input
              id="board_number"
              name="board_number"
              type="number"
              min={1}
              max={24}
              inputMode="numeric"
              placeholder="Optional"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {pending ? "Saving..." : "Add game"}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
