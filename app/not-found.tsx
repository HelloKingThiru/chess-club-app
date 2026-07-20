import Link from "next/link"
import { Crown, Home, LogIn } from "lucide-react"

import { siteConfig } from "@/lib/site-config"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[calc(100svh-3.5rem)] max-w-lg items-center px-4 py-10">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Crown className="size-7" />
          </div>
          <p className="text-5xl font-medium tabular-nums tracking-tight">404</p>
          <CardTitle className="text-xl">Page not found</CardTitle>
          <CardDescription>
            This square is off the board. The page may have moved or no longer
            exists.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {siteConfig.name}
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <Home className="size-4" />
              Back to home
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
