import * as React from "react"

import { fieldClassName, fieldSizeClassName } from "@/lib/field-styles"
import { cn } from "@/lib/utils"

function NativeSelect({
  className,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="native-select"
      className={cn(
        fieldClassName,
        fieldSizeClassName,
        "bg-background py-1 dark:bg-input/30",
        className
      )}
      {...props}
    />
  )
}

export { NativeSelect }
