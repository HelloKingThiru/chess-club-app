"use client"

import { useId, useRef } from "react"
import { Clock } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"

function toTimeInputValue(time24: string) {
  const [hour, minute, second = "00"] = time24.split(":")
  if (!hour || !minute) return ""
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`
}

function fromTimeInputValue(value: string) {
  if (!value.trim()) return "15:30"
  const [hour, minute] = value.split(":")
  if (!hour || !minute) return "15:30"
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`
}

type TimePickerProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  step?: number
  className?: string
}

export function TimePicker({
  id: idProp,
  value,
  onChange,
  required = false,
  step = 900,
  className,
}: TimePickerProps) {
  const fallbackId = useId()
  const id = idProp ?? fallbackId
  const inputRef = useRef<HTMLInputElement>(null)

  function openNativePicker() {
    const input = inputRef.current ?? document.getElementById(id)
    if (!(input instanceof HTMLInputElement)) return
    if ("showPicker" in input && typeof input.showPicker === "function") {
      try {
        input.showPicker()
        return
      } catch {
        // Some browsers block showPicker without a user gesture.
      }
    }
    input.focus()
  }

  return (
    <InputGroup className={cn("h-9 min-h-9", className)}>
      <InputGroupAddon
        align="inline-start"
        className="cursor-pointer touch-manipulation"
        onClick={openNativePicker}
        title="Open time picker"
      >
        <Clock className="size-4" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="time"
        id={id}
        step={step}
        value={toTimeInputValue(value)}
        onChange={(event) => onChange(fromTimeInputValue(event.target.value))}
        onPointerDown={(event) => event.stopPropagation()}
        required={required}
        className="min-h-9 appearance-none text-base sm:text-sm [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
      />
    </InputGroup>
  )
}
