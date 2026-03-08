"use client"

export type ColorScheme = "salmon" | "netflix" | "ocean" | "purple" | "emerald" | "gold"
export type ThemeMode = "dark" | "darker" | "amoled"
export type CardLayout = "compact" | "comfortable" | "cinematic"

export interface AppSettings {
  partyMode: boolean
  autoplay: boolean
  playbackSpeed: number
  colorScheme: ColorScheme
  themeMode: ThemeMode
  cardLayout: CardLayout
  theaterMode: boolean
}

const DEFAULTS: AppSettings = {
  partyMode: false,
  autoplay: true,
  playbackSpeed: 1,
  colorScheme: "netflix",
  themeMode: "dark",
  cardLayout: "comfortable",
  theaterMode: false,
}

const STORAGE_KEY = "pplnetflix_settings"

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export const COLOR_SCHEMES: {
  id: ColorScheme
  label: string
  primary: string
  swatch: string
}[] = [
  { id: "salmon", label: "Salmon", primary: "0 79% 72%", swatch: "hsl(0, 79%, 72%)" },
  { id: "netflix", label: "Netflix Red", primary: "0 100% 44%", swatch: "hsl(0, 100%, 44%)" },
  { id: "ocean", label: "Ocean Blue", primary: "210 100% 56%", swatch: "hsl(210, 100%, 56%)" },
  { id: "purple", label: "Purple", primary: "270 70% 65%", swatch: "hsl(270, 70%, 65%)" },
  { id: "emerald", label: "Emerald", primary: "152 69% 45%", swatch: "hsl(152, 69%, 45%)" },
  { id: "gold", label: "Gold", primary: "45 93% 58%", swatch: "hsl(45, 93%, 58%)" },
]

export const THEME_MODES: { id: ThemeMode; label: string; bg: string }[] = [
  { id: "dark", label: "Dark", bg: "#141414" },
  { id: "darker", label: "Darker", bg: "#0a0a0a" },
  { id: "amoled", label: "AMOLED", bg: "#000000" },
]

export function applyColorScheme(scheme: ColorScheme): void {
  if (typeof document === "undefined") return
  const found = COLOR_SCHEMES.find((s) => s.id === scheme)
  if (!found) return
  document.documentElement.style.setProperty("--primary", found.primary)
  document.documentElement.style.setProperty("--ring", found.primary)
}

export function applyThemeMode(mode: ThemeMode): void {
  if (typeof document === "undefined") return
  const found = THEME_MODES.find((t) => t.id === mode)
  if (!found) return
  document.documentElement.style.setProperty("--lolflix-bg", found.bg)
  document.body.style.backgroundColor = found.bg
}
