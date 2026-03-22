"use client"

import { useEffect, useRef } from "react"
import { useTVMode } from "@/contexts/TVModeContext"

interface UseKeyboardNavOptions {
  enabled?: boolean
  onSelect?: () => void
  onBack?: () => void
}

/**
 * Hook for keyboard navigation in TV mode
 * Handles arrow keys, Enter, and Escape
 */
export function useKeyboardNav(options: UseKeyboardNavOptions = {}) {
  const { isTVMode } = useTVMode()
  const { enabled = true, onSelect, onBack } = options
  const elementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isTVMode || !enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentElement = document.activeElement as HTMLElement

      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight": {
          e.preventDefault()

          // Get all focusable elements
          const focusableElements = Array.from(
            document.querySelectorAll('[tabindex="0"], button:not([disabled]), a[href]')
          ) as HTMLElement[]

          if (focusableElements.length === 0) return

          const currentIndex = focusableElements.indexOf(currentElement)
          let nextIndex = currentIndex

          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            nextIndex = currentIndex + 1
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            nextIndex = currentIndex - 1
          }

          // Wrap around
          if (nextIndex >= focusableElements.length) nextIndex = 0
          if (nextIndex < 0) nextIndex = focusableElements.length - 1

          const nextElement = focusableElements[nextIndex]
          if (nextElement) {
            nextElement.focus()
            nextElement.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          break
        }

        case "Enter": {
          e.preventDefault()
          if (onSelect) {
            onSelect()
          } else {
            currentElement.click()
          }
          break
        }

        case "Escape": {
          e.preventDefault()
          if (onBack) {
            onBack()
          }
          break
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isTVMode, enabled, onSelect, onBack])

  return { elementRef, isTVMode }
}
