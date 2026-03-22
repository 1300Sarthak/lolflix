"use client"

import { useState, useEffect } from "react"
import { Settings, Users, Zap, Gauge, Palette, Monitor, LayoutGrid, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  loadSettings,
  saveSettings,
  applyColorScheme,
  applyThemeMode,
  COLOR_SCHEMES,
  THEME_MODES,
  type AppSettings,
  type ColorScheme,
  type ThemeMode,
  type CardLayout,
} from "@/lib/settings"

interface SettingsDropdownProps {
  onChange?: (settings: AppSettings) => void
}

export function SettingsDropdown({ onChange }: SettingsDropdownProps) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const update = (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    saveSettings(next)
    onChange?.(next)
    if (patch.colorScheme) applyColorScheme(patch.colorScheme as ColorScheme)
    if (patch.themeMode) applyThemeMode(patch.themeMode as ThemeMode)
  }

  const CARD_LAYOUTS: { id: CardLayout; label: string }[] = [
    { id: "compact", label: "Compact" },
    { id: "comfortable", label: "Comfortable" },
    { id: "cinematic", label: "Cinematic" },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Settings" className="text-white/80 hover:text-white">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-3 space-y-3 bg-[#1a1a1a] border-white/10">
        {/* Playback */}
        <DropdownMenuLabel className="px-0 text-xs uppercase tracking-wider text-white/40">
          Playback
        </DropdownMenuLabel>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-white">
            <Zap className="h-4 w-4 text-white/50" />
            Autoplay
          </span>
          <button
            role="switch"
            aria-checked={settings.autoplay}
            onClick={() => update({ autoplay: !settings.autoplay })}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
              settings.autoplay ? "bg-[#E50914]" : "bg-white/20"
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${settings.autoplay ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </button>
        </label>

        <div className="space-y-1.5">
          <span className="flex items-center gap-2 text-sm text-white">
            <Gauge className="h-4 w-4 text-white/50" />
            Speed: {settings.playbackSpeed}x
          </span>
          <input
            type="range" min="0.5" max="3" step="0.25"
            value={settings.playbackSpeed}
            onChange={(e) => update({ playbackSpeed: Number(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer accent-[#E50914]"
          />
        </div>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Appearance */}
        <DropdownMenuLabel className="px-0 text-xs uppercase tracking-wider text-white/40">
          <span className="flex items-center gap-2"><Palette className="h-3.5 w-3.5" /> Appearance</span>
        </DropdownMenuLabel>

        <div>
          <span className="text-xs text-white/50 mb-1 block">Accent Color</span>
          <div className="grid grid-cols-6 gap-2">
            {COLOR_SCHEMES.map((scheme) => (
              <button
                key={scheme.id}
                onClick={() => update({ colorScheme: scheme.id })}
                title={scheme.label}
                className={`relative w-8 h-8 rounded-full cursor-pointer transition-transform hover:scale-110 ${
                  settings.colorScheme === scheme.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a] scale-110" : ""
                }`}
                style={{ backgroundColor: scheme.swatch }}
              >
                {settings.colorScheme === scheme.id && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-white/50 mb-1 flex items-center gap-1.5"><Monitor className="h-3 w-3" /> Theme</span>
          <div className="flex gap-1.5">
            {THEME_MODES.map((t) => (
              <button
                key={t.id}
                onClick={() => update({ themeMode: t.id })}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  settings.themeMode === t.id ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/15"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="text-xs text-white/50 mb-1 flex items-center gap-1.5"><LayoutGrid className="h-3 w-3" /> Card Layout</span>
          <div className="flex gap-1.5">
            {CARD_LAYOUTS.map((c) => (
              <button
                key={c.id}
                onClick={() => update({ cardLayout: c.id })}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                  settings.cardLayout === c.id ? "bg-white text-black" : "bg-white/10 text-white/60 hover:bg-white/15"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-white">
            <RefreshCw className="h-4 w-4 text-white/50" />
            Auto Source Switch
          </span>
          <button
            role="switch"
            aria-checked={settings.autoSourceSwitch}
            onClick={() => update({ autoSourceSwitch: !settings.autoSourceSwitch })}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
              settings.autoSourceSwitch ? "bg-[#E50914]" : "bg-white/20"
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${settings.autoSourceSwitch ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </button>
        </label>
        <p className="text-[11px] text-white/40 leading-snug">
          Auto-switch to backup source if player doesn&apos;t load in 15s.
        </p>

        <DropdownMenuSeparator className="bg-white/10" />

        {/* Social */}
        <DropdownMenuLabel className="px-0 text-xs uppercase tracking-wider text-white/40">
          Social
        </DropdownMenuLabel>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-2 text-sm text-white">
            <Users className="h-4 w-4 text-white/50" />
            Party Mode
          </span>
          <button
            role="switch"
            aria-checked={settings.partyMode}
            onClick={() => update({ partyMode: !settings.partyMode })}
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${
              settings.partyMode ? "bg-[#E50914]" : "bg-white/20"
            }`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 mt-0.5 ${settings.partyMode ? "translate-x-4 ml-0.5" : "translate-x-0.5"}`} />
          </button>
        </label>
        <p className="text-[11px] text-white/40 leading-snug">
          When off, chat and room features are hidden.
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
