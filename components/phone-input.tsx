import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"

function PhoneInput({
  className,
  "aria-invalid": ariaInvalid,
  ...props
}: Omit<React.ComponentProps<"input">, "size">) {
  return (
    <InputGroup
      className={className}
      data-invalid={ariaInvalid === true || ariaInvalid === "true" ? true : undefined}
    >
      <InputGroupAddon align="inline-start">
        <InputGroupText>+1</InputGroupText>
      </InputGroupAddon>
      <InputGroupInput
        type="tel"
        aria-invalid={ariaInvalid}
        {...props}
      />
    </InputGroup>
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
