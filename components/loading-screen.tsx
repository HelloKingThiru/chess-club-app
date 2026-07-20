import { cn } from "@/lib/utils"

export function LoadingScreen({
  label = "Loading…",
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        "fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4",
        "bg-background/85 backdrop-blur-sm",
        "pointer-events-auto touch-none select-none",
        className
      )}
    >
      <div className="relative flex size-16 items-center justify-center">
        <span
          className="absolute inset-0 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-hidden
        />
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-lg text-primary-foreground">
          ♞
        </span>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium tracking-tight">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">Please wait</p>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
