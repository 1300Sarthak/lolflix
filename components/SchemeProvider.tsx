"use client"

import { useEffect } from "react"
import { loadSettings, applyColorScheme } from "@/lib/settings"

export function SchemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const settings = loadSettings()
    applyColorScheme(settings.colorScheme)
  }, [])

  return <>{children}</>
}
