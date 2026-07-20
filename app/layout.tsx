import { Geist_Mono, Inter } from "next/font/google"
import type { Metadata } from "next"

import "./globals.css"
import { AppLoadingProvider } from "@/components/app-loading-provider"
import { NavigationLoading } from "@/components/navigation-loading"
import { SiteHeader } from "@/components/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { themeInitScript } from "@/lib/theme-script"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
          suppressHydrationWarning
        />
      </head>
      <body className="min-h-svh" suppressHydrationWarning>
        <ThemeProvider>
          <AppLoadingProvider>
            <SiteHeader />
            <main className="min-h-[calc(100svh-3.5rem)]">{children}</main>
            <NavigationLoading />
            <Toaster richColors closeButton duration={4000} position="top-center" />
          </AppLoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
