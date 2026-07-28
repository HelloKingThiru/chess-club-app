"use client"

import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

export type FormSelectOption = {
  value: string
  label: string
}

type FormSelectProps = {
  id?: string
  name: string
  options: FormSelectOption[]
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  disabled?: boolean
  /** When set, selecting this option submits an empty string for `name`. */
  emptyValue?: string
}

export function FormSelect({
  id,
  name,
  options,
  defaultValue = "",
  value: valueProp,
  onValueChange,
  placeholder = "Select…",
  required,
  className,
  disabled,
  emptyValue,
}: FormSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const value = valueProp ?? internalValue

  function handleChange(next: string) {
    if (valueProp === undefined) setInternalValue(next)
    onValueChange?.(next)
  }

  const submittedValue =
    emptyValue && value === emptyValue ? "" : value

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={submittedValue}
        required={required && !submittedValue}
      />
      <Select
        value={value || undefined}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger id={id} className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

type SimpleSelectProps = {
  id?: string
  options: FormSelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function SimpleSelect({
  id,
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  className,
  disabled,
}: SimpleSelectProps) {
  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
