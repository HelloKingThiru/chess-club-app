import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AdminActionCardProps = {
  icon: LucideIcon
  title: string
  description: string
  pageHref?: string
  pageLabel?: string
  locked?: boolean
  action?: React.ReactNode
  className?: string
}

export function AdminActionCard({
  icon: Icon,
  title,
  description,
  pageHref,
  pageLabel,
  locked = false,
  action,
  className,
}: AdminActionCardProps) {
  return (
    <Card className={cn("flex h-full flex-col", className)}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {!locked && pageHref && pageLabel ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto shrink-0 px-2 py-1 text-muted-foreground"
              asChild
            >
              <Link href={pageHref}>
                {pageLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        <CardDescription className="text-pretty">{description}</CardDescription>
      </CardHeader>
      {locked ? (
        <CardContent className="flex-1">
          <p className="rounded-lg border border-dashed bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
            Enable admin mode to use this tool.
          </p>
        </CardContent>
      ) : (
        <div className="flex-1" />
      )}
      {!locked && action ? (
        <CardFooter className="mt-auto border-t border-border/60 pt-4">
          {action}
        </CardFooter>
      ) : null}
    </Card>
  )
}
