"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface TVModeContextType {
  isTVMode: boolean
  toggleTVMode: () => void
}

const TVModeContext = createContext<TVModeContextType | undefined>(undefined)

export function TVModeProvider({ children }: { children: ReactNode }) {
  const [isTVMode, setIsTVMode] = useState(false)

  // Load TV mode state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("tvMode")
    if (saved === "true") {
      setIsTVMode(true)
      document.body.setAttribute("data-tv-mode", "true")
    }
  }, [])

  // Toggle TV mode
  const toggleTVMode = () => {
    setIsTVMode((prev) => {
      const newValue = !prev
      localStorage.setItem("tvMode", String(newValue))

      if (newValue) {
        document.body.setAttribute("data-tv-mode", "true")
      } else {
        document.body.removeAttribute("data-tv-mode")
      }

      return newValue
    })
  }

  return (
    <TVModeContext.Provider value={{ isTVMode, toggleTVMode }}>
      {children}
    </TVModeContext.Provider>
  )
}

export function useTVMode() {
  const context = useContext(TVModeContext)
  if (context === undefined) {
    throw new Error("useTVMode must be used within a TVModeProvider")
  }
  return context
}
