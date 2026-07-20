import { cn } from "@/lib/utils"

export const fieldClassName = cn(
  "rounded-lg border border-input bg-transparent transition-colors outline-none",
  "focus-visible:border-primary",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "aria-invalid:border-destructive dark:aria-invalid:border-destructive/50"
)

export const fieldFocusWithinClassName = cn(
  "rounded-lg border border-input bg-transparent transition-colors",
  "focus-within:border-primary",
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50",
  "has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:focus-within:border-destructive",
  "dark:has-[[aria-invalid=true]]:border-destructive/50"
)

export const fieldSizeClassName = "h-8 w-full px-2.5 text-sm"

export const fieldBackgroundClassName = "bg-background dark:bg-input/30"
