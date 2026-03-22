import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SchemeProvider } from "@/components/SchemeProvider"
import { IntroAnimation } from "@/components/IntroAnimation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ToastProvider } from "@/components/Toast"
import { TVModeProvider } from "@/contexts/TVModeContext"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "lolflix",
  description: "Search movies & TV shows, watch ad-free, and sync playback with friends in real-time.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SchemeProvider>
            <TooltipProvider>
              <ToastProvider>
                <TVModeProvider>
                  <IntroAnimation>
                    {children}
                  </IntroAnimation>
                </TVModeProvider>
              </ToastProvider>
            </TooltipProvider>
          </SchemeProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
