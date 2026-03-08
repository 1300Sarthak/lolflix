"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SlidersHorizontal, X } from "lucide-react"
import type { TMDBGenre, DiscoverParams } from "@/types"

const DECADES = [
  { label: "70s", start: 1970, end: 1979 },
  { label: "80s", start: 1980, end: 1989 },
  { label: "90s", start: 1990, end: 1999 },
  { label: "2000s", start: 2000, end: 2009 },
  { label: "2010s", start: 2010, end: 2019 },
  { label: "2020s", start: 2020, end: 2029 },
]

const RUNTIMES = [
  { label: "<90 min", lte: 90 },
  { label: "90-120 min", gte: 90, lte: 120 },
  { label: "2hr+", gte: 120 },
]

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "primary_release_date.asc", label: "Oldest" },
  { value: "vote_average.desc", label: "Top Rated" },
]

interface AdvancedSearchProps {
  genres: TMDBGenre[]
  onSearch: (params: DiscoverParams) => void
  onClose: () => void
  open: boolean
  alreadyWatchedFilter: boolean
  onAlreadyWatchedToggle: () => void
  watchlistOnly: boolean
  onWatchlistOnlyToggle: () => void
}

export function AdvancedSearch({
  genres, onSearch, onClose, open,
  alreadyWatchedFilter, onAlreadyWatchedToggle,
  watchlistOnly, onWatchlistOnlyToggle,
}: AdvancedSearchProps) {
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [decade, setDecade] = useState<{ start: number; end: number } | null>(null)
  const [runtime, setRuntime] = useState<{ gte?: number; lte?: number } | null>(null)
  const [minRating, setMinRating] = useState(0)
  const [sortBy, setSortBy] = useState("popularity.desc")

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  const handleApply = () => {
    onSearch({
      genres: selectedGenres.length > 0 ? selectedGenres : undefined,
      sortBy,
      decadeStart: decade?.start,
      decadeEnd: decade?.end,
      runtimeGte: runtime?.gte,
      runtimeLte: runtime?.lte,
      voteAverageGte: minRating > 0 ? minRating : undefined,
    })
  }

  const handleReset = () => {
    setSelectedGenres([])
    setDecade(null)
    setRuntime(null)
    setMinRating(0)
    setSortBy("popularity.desc")
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
              </span>
              <button onClick={onClose} className="text-white/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
            </div>

            {/* Genre multi-select */}
            <div>
              <span className="text-xs text-white/50 block mb-1.5">Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                      selectedGenres.includes(g.id) ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Decade */}
            <div>
              <span className="text-xs text-white/50 block mb-1.5">Decade</span>
              <div className="flex flex-wrap gap-1.5">
                {DECADES.map((d) => (
                  <button
                    key={d.label}
                    onClick={() => setDecade(decade?.start === d.start ? null : d)}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                      decade?.start === d.start ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Runtime */}
            <div>
              <span className="text-xs text-white/50 block mb-1.5">Runtime</span>
              <div className="flex flex-wrap gap-1.5">
                {RUNTIMES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRuntime(runtime?.lte === r.lte && runtime?.gte === r.gte ? null : r)}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                      runtime?.lte === r.lte && runtime?.gte === r.gte ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <span className="text-xs text-white/50 block mb-1.5">Min Rating: {minRating > 0 ? minRating : "Any"}</span>
              <input type="range" min="0" max="9" step="0.5" value={minRating} onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/20 cursor-pointer accent-[#E50914]" />
            </div>

            {/* Sort */}
            <div>
              <span className="text-xs text-white/50 block mb-1.5">Sort By</span>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value)}
                    className={`px-2.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                      sortBy === s.value ? "bg-white text-black font-medium" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={alreadyWatchedFilter} onChange={onAlreadyWatchedToggle} className="accent-[#E50914]" />
                <span className="text-xs text-white/60">Hide Already Watched</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={watchlistOnly} onChange={onWatchlistOnlyToggle} className="accent-[#E50914]" />
                <span className="text-xs text-white/60">Watchlist Only</span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={handleApply} className="flex-1 px-4 py-2 bg-[#E50914] text-white text-sm font-medium rounded cursor-pointer hover:bg-[#E50914]/80 transition-colors">Apply Filters</button>
              <button onClick={handleReset} className="px-4 py-2 bg-white/5 text-white/60 text-sm rounded cursor-pointer hover:bg-white/10 transition-colors">Reset</button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
