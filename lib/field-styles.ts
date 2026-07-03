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

/** Input/select + button on one row — use default Button (h-8), not size="sm". */
export const inlineFieldRowClassName =
  "flex flex-col gap-2 sm:flex-row sm:items-stretch"

export const inlineFieldButtonClassName = "w-full shrink-0 sm:w-auto"
