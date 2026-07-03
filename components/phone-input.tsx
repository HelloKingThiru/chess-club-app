import { Input } from "@/components/ui/input"
import { fieldFocusWithinClassName, fieldBackgroundClassName } from "@/lib/field-styles"
import { cn } from "@/lib/utils"

function PhoneInput({
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <div
      className={cn(
        fieldFocusWithinClassName,
        fieldBackgroundClassName,
        "flex h-8 w-full overflow-hidden",
        className
      )}
      data-invalid={ariaInvalid === true || ariaInvalid === "true" ? true : undefined}
    >
      <span className="flex shrink-0 items-center border-r border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
        +1
      </span>
      <Input
        type="tel"
        aria-invalid={ariaInvalid}
        className="h-full rounded-none border-0 bg-transparent shadow-none focus-visible:border-0 dark:bg-transparent"
        {...props}
      />
    </div>
  )
}

function formatPhoneDisplay(phone: string | null | undefined) {
  if (!phone) return "Not set"
  const digits = phone.replace(/\D/g, "")
  const local = digits.startsWith("1") ? digits.slice(1) : digits
  return local ? `+1 ${local}` : "Not set"
}

function phoneInputValue(phone: string | null | undefined) {
  if (!phone) return ""
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits
}

export { PhoneInput, formatPhoneDisplay, phoneInputValue }
