"use client"

import { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import { ChevronDownIcon } from "lucide-react"

import {
  clubLocalToIso,
  parseClubDateTimeParts,
} from "@/lib/club-datetime"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimePicker } from "@/components/ui/time-picker"
import { cn } from "@/lib/utils"

type ClubDateTimePickerProps = {
  name: string
  id?: string
  label?: string
  defaultIso?: string
  required?: boolean
  className?: string
  onIsoChange?: (iso: string) => void
}

export function ClubDateTimePicker({
  name,
  id = name,
  label,
  defaultIso,
  required = false,
  className,
  onIsoChange,
}: ClubDateTimePickerProps) {
  const initial = useMemo(() => parseClubDateTimeParts(defaultIso), [defaultIso])
  const [date, setDate] = useState<Date | undefined>(initial?.date)
  const [time, setTime] = useState(initial?.time ?? "15:30")
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const parsed = parseClubDateTimeParts(defaultIso)
    if (!parsed) return
    setDate(parsed.date)
    setTime(parsed.time)
  }, [defaultIso])

  const isoValue = date ? clubLocalToIso(date, time) : ""

  useEffect(() => {
    onIsoChange?.(isoValue)
  }, [isoValue, onIsoChange])

  return (
    <div className={cn("space-y-2", className)}>
      {label ? <p className="text-sm font-medium leading-none">{label}</p> : null}
      <FieldGroup className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <Field className="min-w-0 flex-1">
          <FieldLabel htmlFor={`${id}-date`}>Date</FieldLabel>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                id={`${id}-date`}
                className="h-9 w-full justify-between font-normal"
              >
                {date ? format(date, "PPP") : "Select date"}
                <ChevronDownIcon className="size-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0"
              align="start"
              collisionPadding={16}
            >
              <Calendar
                mode="single"
                selected={date}
                captionLayout="dropdown"
                defaultMonth={date}
                className="w-full min-w-[280px]"
                onSelect={(next) => {
                  setDate(next)
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </Field>
        <Field className="w-full min-w-0 sm:w-36">
          <FieldLabel htmlFor={`${id}-time`}>Time</FieldLabel>
          <TimePicker
            id={`${id}-time`}
            value={time}
            onChange={setTime}
            required={required}
          />
        </Field>
      </FieldGroup>
      <input type="hidden" name={name} value={isoValue} required={required} />
    </div>
  )
}
