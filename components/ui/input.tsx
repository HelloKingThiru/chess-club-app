import * as React from "react"

import { cn } from "@/lib/utils"
import { fieldClassName, fieldSizeClassName, fieldBackgroundClassName } from "@/lib/field-styles"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClassName,
        fieldSizeClassName,
        "min-w-0 py-1 text-base md:text-sm file:mr-2.5 file:rounded-md file:border file:border-input file:bg-muted/50 file:px-2 file:py-1 file:text-sm file:font-medium file:text-foreground file:transition-colors file:outline-none file:focus-visible:border-primary file:disabled:pointer-events-none placeholder:text-muted-foreground dark:disabled:bg-input/80 dark:file:bg-input/30",
        fieldBackgroundClassName,
        className
      )}
      {...props}
    />
  )
}

export { Input }
