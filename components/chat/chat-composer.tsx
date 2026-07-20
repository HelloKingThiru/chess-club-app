"use client"

import { useState } from "react"
import { Loader2, Send } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"

type ChatComposerProps = {
  placeholder: string
  disabled?: boolean
  onSend: (body: string) => void
}

export function ChatComposer({
  placeholder,
  disabled,
  onSend,
}: ChatComposerProps) {
  const [value, setValue] = useState("")

  function submit() {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue("")
  }

  return (
    <div className="border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <InputGroup className="h-auto min-h-11 items-end rounded-2xl px-1 py-1">
        <InputGroupTextarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="max-h-32 min-h-10 py-2.5 text-base sm:text-sm"
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
        />
        <InputGroupAddon align="inline-end" className="pb-1.5">
          <InputGroupButton
            type="button"
            size="icon-sm"
            variant="default"
            disabled={disabled || !value.trim()}
            aria-label="Send message"
            onClick={submit}
          >
            {disabled ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}
