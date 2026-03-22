"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Search, X, BarChart3, Clock, List, Tv } from "lucide-react"
import { Logo } from "@/components/Logo"
import { SettingsDropdown } from "@/components/SettingsDropdown"
import { useTVMode } from "@/contexts/TVModeContext"
import { getRecentlyPlayed } from "@/lib/history"
import { tmdb } from "@/lib/tmdb"

interface NavbarProps {
  onSearch?: (query: string) => void
  searchValue?: string
  onTypeChange?: (type: "movie" | "tv" | "all") => void // Added "all" type
  onHomeClick?: () => void
}

export function Navbar({
  onSearch,
  searchValue = "",
  onTypeChange,
  onHomeClick,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchValue)
  const [recentItems, setRecentItems] = useState<{ tmdbId: number; title: string; poster_path: string | null; mediaType: "movie" | "tv" }[]>([])
  const pathname = usePathname()
  const isWatch = pathname?.startsWith("/watch")
  const isStats = pathname?.startsWith("/stats")
  const isWatchlist = pathname?.startsWith("/watchlist")
  const isSubPage = isWatch || isStats || isWatchlist
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const [currentMediaTypeFilter, setCurrentMediaTypeFilter] = useState<"movie" | "tv" | "all">("all")
  const { isTVMode, toggleTVMode } = useTVMode()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => { setLocalQuery(searchValue) }, [searchValue])

  useEffect(() => {
    if (searchFocused && !localQuery) {
      const recent = getRecentlyPlayed(5)
      setRecentItems(recent.map((r) => ({ tmdbId: r.tmdbId, title: r.title, poster_path: r.poster_path, mediaType: r.mediaType })))
    }
  }, [searchFocused, localQuery])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false)
      }
    }
    if (searchFocused) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [searchFocused])

  const handleSearchChange = (val: string) => { setLocalQuery(val); onSearch?.(val) }
  const handleSearchClose = () => { setSearchOpen(false); setSearchFocused(false); setLocalQuery(""); onSearch?.("") }

  const handleHomeButtonClick = () => {
    setCurrentMediaTypeFilter("all")
    onHomeClick?.()
    onTypeChange?.("all") // Notify parent about the filter change
  }

  const handleMovieButtonClick = () => {
    setCurrentMediaTypeFilter("movie")
    onTypeChange?.("movie")
  }

  const handleTvButtonClick = () => {
    setCurrentMediaTypeFilter("tv")
    onTypeChange?.("tv")
  }

  const showRecent = searchFocused && !localQuery && recentItems.length > 0

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 w-full transition-all duration-500 ${scrolled || isSubPage ? "bg-[#141414]" : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"}`}>
      <div className="flex h-16 items-center px-4 md:px-12 gap-4">
        <Link href="/" className="flex-shrink-0 mr-2 md:mr-8 cursor-pointer"><Logo size="sm" /></Link>

        {!isSubPage && (
          <nav className="hidden md:flex items-center gap-5 mr-auto">
            <button onClick={handleHomeButtonClick} className={`text-sm font-medium transition-colors cursor-pointer ${currentMediaTypeFilter === "all" ? "text-white font-semibold" : "text-white/70 hover:text-white/50"}`}>Home</button>
            <button onClick={handleTvButtonClick} className={`text-sm font-medium transition-colors cursor-pointer ${currentMediaTypeFilter === "tv" ? "text-white font-semibold" : "text-white/70 hover:text-white/50"}`}>TV Shows</button>
            <button onClick={handleMovieButtonClick} className={`text-sm font-medium transition-colors cursor-pointer ${currentMediaTypeFilter === "movie" ? "text-white font-semibold" : "text-white/70 hover:text-white/50"}`}>Movies</button>
            <Link href="/watchlist" className="text-sm font-medium text-white/70 hover:text-white/50 transition-colors">My List</Link>
          </nav>
        )}

        <div className="flex-1" />

        {!isSubPage && onSearch && (
          <>
            <div className="hidden md:flex items-center relative" ref={searchContainerRef}>
              {searchOpen ? (
                <div className="relative">
                  <div className="flex items-center gap-2 bg-black/80 border border-white/30 px-3 py-1.5 w-64">
                    <Search className="h-4 w-4 text-white/60 shrink-0" />
                    <input autoFocus type="text" value={localQuery}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      placeholder="Titles, people, genres"
                      className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-white/40" />
                    <button onClick={handleSearchClose} className="cursor-pointer"><X className="h-4 w-4 text-white/60 hover:text-white" /></button>
                  </div>
                  {showRecent && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl py-2 z-50">
                      <p className="px-3 py-1 text-[10px] text-white/30 uppercase tracking-wider flex items-center gap-1"><Clock className="h-3 w-3" />Recently Viewed</p>
                      {recentItems.map((item) => (
                        <button key={`${item.mediaType}-${item.tmdbId}`} onClick={() => { handleSearchChange(item.title); setSearchFocused(false) }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-white/5 cursor-pointer">
                          {item.poster_path && (
                            <div className="w-8 h-11 rounded overflow-hidden shrink-0 bg-white/5">
                              <Image src={tmdb.imageUrl(item.poster_path, "w92")!} alt="" width={32} height={44} className="object-cover w-full h-full" />
                            </div>
                          )}
                          <span className="text-sm text-white/80 truncate">{item.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="p-2 text-white/80 hover:text-white transition-colors cursor-pointer" aria-label="Search">
                  <Search className="h-5 w-5" />
                </button>
              )}
            </div>

            <button onClick={() => setSearchOpen(!searchOpen)} className="md:hidden p-2 text-white/80 hover:text-white transition-colors cursor-pointer" aria-label="Search">
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
          </>
        )}

        <Link href="/watchlist" className="md:hidden p-2 text-white/80 hover:text-white transition-colors" title="My List"><List className="h-5 w-5" /></Link>
        <Link href="/stats" className="hidden md:flex p-2 text-white/80 hover:text-white transition-colors" title="Stats"><BarChart3 className="h-5 w-5" /></Link>
        <button
          onClick={toggleTVMode}
          className={`p-2 transition-colors ${isTVMode ? "text-[#E50914]" : "text-white/80 hover:text-white"}`}
          title={isTVMode ? "Exit TV Mode" : "Enter TV Mode"}
          aria-label={isTVMode ? "Exit TV Mode" : "Enter TV Mode"}
        >
          <Tv className="h-5 w-5" />
        </button>
        <SettingsDropdown />
      </div>

      {!isSubPage && searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center gap-2 bg-black/80 border border-white/30 px-3 py-2.5">
            <Search className="h-4 w-4 text-white/60 shrink-0" />
            <input autoFocus type="text" value={localQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Titles, people, genres"
              className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-white/40" />
            {localQuery && <button onClick={() => handleSearchChange("")} className="cursor-pointer"><X className="h-4 w-4 text-white/60" /></button>}
          </div>
        </div>
      )}
    </header>
  )
}
