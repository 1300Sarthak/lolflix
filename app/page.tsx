"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Shuffle, Wand2, SlidersHorizontal } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { MediaGrid } from "@/components/MediaGrid"
import { MediaRail } from "@/components/MediaRail"
import { MediaPosterCard } from "@/components/MediaPosterCard"
import { HeroBanner } from "@/components/HeroBanner"
import { VidkingLiveEmbed } from "@/components/VidkingLiveEmbed"
import { JoinRoomDialog } from "@/components/JoinRoomDialog"
import { DetailModal } from "@/components/DetailModal"
import { Top10Rail } from "@/components/Top10Rail"
import { MOODS, getMoodGenres } from "@/components/MoodCollections"
import { WatchWizard } from "@/components/WatchWizard"
import { AdvancedSearch } from "@/components/AdvancedSearch"
import { tmdb } from "@/lib/tmdb"
import { getRecentlyPlayed, getProgress } from "@/lib/history"
import { getWatchlist } from "@/lib/watchlist"
import { getShelves } from "@/lib/shelves"
import { getPinnedGenres } from "@/lib/pinned-genres"
import { getAllRatings } from "@/lib/ratings"
import { getUserPreferenceProfile, rankByPreference, hasEnoughData } from "@/lib/recommendations"
import { loadSettings, type CardLayout } from "@/lib/settings"
import { useToast } from "@/components/Toast"
import type { TMDBMedia, TMDBGenre, DiscoverParams } from "@/types"

const SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "primary_release_date.desc", label: "Newest First" },
  { value: "primary_release_date.asc", label: "Oldest First" },
  { value: "vote_average.desc", label: "Highest Rated" },
]

export default function HomePage() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie")
  const [results, setResults] = useState<TMDBMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [cardLayout, setCardLayout] = useState<CardLayout>("comfortable")

  // Genre state
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<TMDBGenre | null>(null)
  const [genreOpen, setGenreOpen] = useState(false)
  const [genreResults, setGenreResults] = useState<TMDBMedia[]>([])
  const [genreLoading, setGenreLoading] = useState(false)
  const genreDropRef = useRef<HTMLDivElement>(null)

  // Sort state
  const [sortBy, setSortBy] = useState("popularity.desc")
  const [sortOpen, setSortOpen] = useState(false)
  const sortDropRef = useRef<HTMLDivElement>(null)

  // Rails state
  const [railsLoading, setRailsLoading] = useState(false)
  const [continueWatching, setContinueWatching] = useState<TMDBMedia[]>([])
  const [continueMeta, setContinueMeta] = useState<{ season?: number; episode?: number }[]>([])
  const [recentlyPlayedItems, setRecentlyPlayedItems] = useState<TMDBMedia[]>([])
  const [recommendations, setRecommendations] = useState<TMDBMedia[]>([])
  const [genreRails, setGenreRails] = useState<{ genreId: number; name: string; items: TMDBMedia[] }[]>([])
  const [listRails, setListRails] = useState<{
    trending: TMDBMedia[]; popular: TMDBMedia[]; topRated: TMDBMedia[]; primary: TMDBMedia[]; secondary: TMDBMedia[]
  }>({ trending: [], popular: [], topRated: [], primary: [], secondary: [] })

  const [watchlistItems, setWatchlistItems] = useState<TMDBMedia[]>([])
  const [mlRecommendations, setMLRecommendations] = useState<TMDBMedia[]>([])

  // Indian section
  const [indianRails, setIndianRails] = useState<{ hindi: TMDBMedia[]; punjabi: TMDBMedia[] }>({ hindi: [], punjabi: [] })

  // New rails
  const [top10Items, setTop10Items] = useState<TMDBMedia[]>([])
  const [newReleases, setNewReleases] = useState<TMDBMedia[]>([])
  const [hiddenGems, setHiddenGems] = useState<TMDBMedia[]>([])
  const [criticallyAcclaimed, setCriticallyAcclaimed] = useState<TMDBMedia[]>([])
  const [forgottenFavorites, setForgottenFavorites] = useState<TMDBMedia[]>([])
  const [pinnedGenreRails, setPinnedGenreRails] = useState<{ genreId: number; name: string; items: TMDBMedia[] }[]>([])
  const [shelfRails, setShelfRails] = useState<{ id: string; name: string; items: TMDBMedia[] }[]>([])

  // Mood section rails
  const [moodRails, setMoodRails] = useState<{ id: string; label: string; items: TMDBMedia[] }[]>([])

  // Detail modal
  const [detailItem, setDetailItem] = useState<TMDBMedia | null>(null)
  const [detailType, setDetailType] = useState<"movie" | "tv">("movie")

  // Watch wizard
  const [wizardOpen, setWizardOpen] = useState(false)

  // Advanced search
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [advancedResults, setAdvancedResults] = useState<TMDBMedia[]>([])
  const [alreadyWatchedFilter, setAlreadyWatchedFilter] = useState(false)
  const [watchlistOnly, setWatchlistOnly] = useState(false)

  // Load card layout from settings
  useEffect(() => {
    setCardLayout(loadSettings().cardLayout)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (genreDropRef.current && !genreDropRef.current.contains(e.target as Node)) setGenreOpen(false)
      if (sortDropRef.current && !sortDropRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    if (genreOpen || sortOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [genreOpen, sortOpen])

  const openDetail = useCallback((item: TMDBMedia, type: "movie" | "tv") => {
    setDetailItem(item)
    setDetailType(type)
  }, [])

  const fetchTrending = useCallback(async (type: "movie" | "tv") => {
    setIsLoading(true)
    try {
      const data = type === "movie" ? await tmdb.trendingMovies() : await tmdb.trendingTV()
      setResults(data.results)
    } catch { setResults([]) }
    finally { setIsLoading(false) }
  }, [])

  const searchMedia = useCallback(async (q: string, type: "movie" | "tv") => {
    if (!q.trim()) { fetchTrending(type); return }
    setIsLoading(true)
    try {
      const data = type === "movie" ? await tmdb.searchMovies(q) : await tmdb.searchTV(q)
      setResults(data.results)
    } catch { setResults([]) }
    finally { setIsLoading(false) }
  }, [fetchTrending])

  useEffect(() => { fetchTrending(mediaType) }, [mediaType, fetchTrending])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchMedia(value, mediaType), 300)
  }

  const handleTypeChange = (type: "movie" | "tv") => {
    setMediaType(type)
    setSelectedGenre(null)
    setGenreResults([])
    setSortBy("popularity.desc")
    setAdvancedResults([])
    if (query.trim()) searchMedia(query, type)
  }

  const handleHomeClick = () => {
    setQuery("")
    setSelectedGenre(null)
    setGenreResults([])
    setSortBy("popularity.desc")
    setAdvancedResults([])
    setAdvancedOpen(false)
    setMediaType("movie")
  }

  // Fetch genres
  useEffect(() => {
    (async () => {
      try {
        const data = mediaType === "movie" ? await tmdb.movieGenres() : await tmdb.tvGenres()
        setGenres(data.genres)
      } catch {}
    })()
  }, [mediaType])

  // Fetch genre results
  useEffect(() => {
    if (!selectedGenre) { setGenreResults([]); return }
    let cancelled = false
    ;(async () => {
      if (!selectedGenre) return
      setGenreLoading(true)
      try {
        const data = mediaType === "movie"
          ? await tmdb.discoverMoviesByGenre(selectedGenre.id, sortBy)
          : await tmdb.discoverTVByGenre(selectedGenre.id, sortBy)
        if (!cancelled) setGenreResults(data.results)
      } catch {}
      finally { if (!cancelled) setGenreLoading(false) }
    })()
    return () => { cancelled = true }
  }, [selectedGenre, mediaType, sortBy])

  // Load homepage rails
  useEffect(() => {
    if (query.trim()) return
    let cancelled = false

    async function loadRails(currentType: "movie" | "tv") {
      setRailsLoading(true)
      try {
        const allProgress = getProgress().filter((p) => p.mediaType === currentType)
        const allRecent = getRecentlyPlayed().filter((r) => r.mediaType === currentType)

        const mapHistoryToMedia = (items: typeof allRecent): TMDBMedia[] =>
          items.map((item) => {
            const base = { id: item.tmdbId, overview: "", poster_path: item.poster_path || "", backdrop_path: item.backdrop_path || "", vote_average: 0, genre_ids: item.genreIds }
            return currentType === "movie"
              ? { ...base, title: item.title, release_date: "", media_type: "movie" } as TMDBMedia
              : { ...base, name: item.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" } as TMDBMedia
          })

        const recentMedia = mapHistoryToMedia(allRecent)
        const continueMedia: TMDBMedia[] = []
        const continueMetaLocal: { season?: number; episode?: number }[] = []

        allProgress.forEach((p) => {
          const fromRecent = allRecent.find((r) => r.tmdbId === p.tmdbId && r.mediaType === p.mediaType)
          const base = { id: p.tmdbId, overview: "", poster_path: fromRecent?.poster_path || "", backdrop_path: fromRecent?.backdrop_path || "", vote_average: 0, genre_ids: fromRecent?.genreIds }
          if (currentType === "movie") continueMedia.push({ ...base, title: fromRecent?.title || "Continue watching", release_date: "", media_type: "movie" } as TMDBMedia)
          else continueMedia.push({ ...base, name: fromRecent?.title || "Continue watching", first_air_date: "", number_of_seasons: 1, media_type: "tv" } as TMDBMedia)
          continueMetaLocal.push({ season: p.season, episode: p.episode })
        })

        const genreCount: Record<number, number> = {}
        allRecent.forEach((item) => item.genreIds?.forEach((g) => { genreCount[g] = (genreCount[g] || 0) + 1 }))
        const topGenreIds = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => Number(id))

        const [trendingData, popularData, topRatedData, primaryData, secondaryData, genresData, hindiData, punjabiData, top10Data, newRelData, hiddenData, criticalData] = await Promise.all([
          currentType === "movie" ? tmdb.trendingMovies() : tmdb.trendingTV(),
          currentType === "movie" ? tmdb.popularMovies() : tmdb.popularTV(),
          currentType === "movie" ? tmdb.topRatedMovies() : tmdb.topRatedTV(),
          currentType === "movie" ? tmdb.nowPlayingMovies() : tmdb.onTheAirTV(),
          currentType === "movie" ? tmdb.upcomingMovies() : tmdb.airingTodayTV(),
          currentType === "movie" ? tmdb.movieGenres() : tmdb.tvGenres(),
          currentType === "movie" ? tmdb.discoverHindiMovies() : tmdb.discoverHindiTV(),
          currentType === "movie" ? tmdb.discoverPunjabiMovies() : tmdb.discoverPunjabiTV(),
          currentType === "movie" ? tmdb.trendingMoviesDaily() : tmdb.trendingTVDaily(),
          currentType === "movie" ? tmdb.newReleaseMovies() : tmdb.newReleaseTV(),
          currentType === "movie" ? tmdb.hiddenGemMovies() : tmdb.hiddenGemTV(),
          currentType === "movie" ? tmdb.criticallyAcclaimedMovies() : tmdb.criticallyAcclaimedTV(),
        ])

        // Mood rails
        const moodPromises = MOODS.filter((m) => m.genres.length > 0).map(async (mood) => {
          try {
            const data = await tmdb.discoverMovies({ genres: [...mood.genres], sortBy: "popularity.desc", voteAverageGte: 6 })
            return { id: mood.id, label: mood.label, items: data.results }
          } catch {
            return { id: mood.id, label: mood.label, items: [] }
          }
        })
        const moodRailsData = await Promise.all(moodPromises)

        let recResults: TMDBMedia[] = []
        const seed = allRecent[0] || allProgress[0]
        if (seed) {
          try {
            const rec = currentType === "movie" ? await tmdb.movieRecommendations(seed.tmdbId) : await tmdb.tvRecommendations(seed.tmdbId)
            recResults = rec.results
          } catch {}
        }

        const genreMap = new Map<number, string>()
        genresData.genres.forEach((g) => genreMap.set(g.id, g.name))

        const genreRailsData: { genreId: number; name: string; items: TMDBMedia[] }[] = []
        await Promise.all(topGenreIds.map(async (id) => {
          try {
            const data = currentType === "movie" ? await tmdb.discoverMoviesByGenre(id) : await tmdb.discoverTVByGenre(id)
            genreRailsData.push({ genreId: id, name: genreMap.get(id) || "Genre", items: data.results })
          } catch {}
        }))

        const pinned = getPinnedGenres()
        const pinnedRails: { genreId: number; name: string; items: TMDBMedia[] }[] = []
        await Promise.all(pinned.map(async (id) => {
          try {
            const data = currentType === "movie" ? await tmdb.discoverMoviesByGenre(id) : await tmdb.discoverTVByGenre(id)
            pinnedRails.push({ genreId: id, name: genreMap.get(id) || "Genre", items: data.results })
          } catch {}
        }))

        const shelves = getShelves()
        const shelfRailsData = shelves.filter((s) => s.items.length > 0).map((s) => ({
          id: s.id, name: s.name,
          items: s.items.map((i) => ({
            id: i.tmdbId, poster_path: i.poster_path || "", backdrop_path: "", overview: "", vote_average: 0,
            ...(i.mediaType === "movie" ? { title: i.title, release_date: "", media_type: "movie" as const } : { name: i.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" as const }),
          } as TMDBMedia)),
        }))

        const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
        const forgotten = allRecent.filter((r) => r.lastWatchedAt < ninetyDaysAgo)
        const forgottenMedia = mapHistoryToMedia(forgotten.slice(0, 10))

        if (cancelled) return

        setContinueWatching(continueMedia)
        setContinueMeta(continueMetaLocal)
        setRecentlyPlayedItems(recentMedia)
        setRecommendations(recResults)
        setListRails({ trending: trendingData.results, popular: popularData.results, topRated: topRatedData.results, primary: primaryData.results, secondary: secondaryData.results })
        setIndianRails({ hindi: hindiData.results, punjabi: punjabiData.results })
        setTop10Items(top10Data.results.slice(0, 10))
        setNewReleases(newRelData.results)
        setHiddenGems(hiddenData.results)
        setCriticallyAcclaimed(criticalData.results)
        setForgottenFavorites(forgottenMedia)
        setPinnedGenreRails(pinnedRails)
        setShelfRails(shelfRailsData)
        setMoodRails(moodRailsData.filter((r) => r.items.length > 0))
        setGenreRails(genreRailsData.sort((a, b) => {
          const ai = topGenreIds.indexOf(a.genreId)
          const bi = topGenreIds.indexOf(b.genreId)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        }))
      } catch (err) {
        console.error("Failed to load homepage rails", err)
      } finally { if (!cancelled) setRailsLoading(false) }
    }

    loadRails(mediaType)
    return () => { cancelled = true }
  }, [mediaType, query])

  // Load watchlist
  useEffect(() => {
    const items = getWatchlist().filter((i) => i.mediaType === mediaType)
    setWatchlistItems(items.map((item) => ({
      id: item.tmdbId, overview: item.overview || "", poster_path: item.poster_path || "", backdrop_path: item.backdrop_path || "", vote_average: item.vote_average || 0, genre_ids: item.genreIds,
      ...(item.mediaType === "movie" ? { title: item.title, release_date: item.release_date, media_type: "movie" as const } : { name: item.title, first_air_date: item.first_air_date, number_of_seasons: 1, media_type: "tv" as const }),
    } as TMDBMedia)))
  }, [mediaType])

  // ML recommendations
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!hasEnoughData()) { setMLRecommendations([]); return }
      try {
        const profile = getUserPreferenceProfile()
        const topGenres = Array.from(profile.genreScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
        if (topGenres.length === 0) { setMLRecommendations([]); return }
        const data = mediaType === "movie" ? await tmdb.discoverMoviesByGenre(topGenres[0]) : await tmdb.discoverTVByGenre(topGenres[0])
        if (!cancelled) setMLRecommendations(rankByPreference(data.results, profile, true).slice(0, 20))
      } catch {}
    })()
    return () => { cancelled = true }
  }, [mediaType])

  // Surprise me
  const handleSurpriseMe = () => {
    const wl = getWatchlist()
    const watched = getAllRatings().filter((r) => r.watchedStatus === "watched")
    const unwatched = wl.filter((item) => !watched.some((w) => w.tmdbId === item.tmdbId && w.mediaType === item.mediaType))
    if (unwatched.length === 0) { toast("No unwatched items in your list!"); return }
    const pick = unwatched[Math.floor(Math.random() * unwatched.length)]
    const media: TMDBMedia = {
      id: pick.tmdbId, overview: pick.overview || "", poster_path: pick.poster_path || "", backdrop_path: pick.backdrop_path || "", vote_average: pick.vote_average || 0, genre_ids: pick.genreIds,
      ...(pick.mediaType === "movie" ? { title: pick.title, release_date: "", media_type: "movie" as const } : { name: pick.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" as const }),
    } as TMDBMedia
    openDetail(media, pick.mediaType)
  }

  // Advanced search
  const handleAdvancedSearch = async (params: DiscoverParams) => {
    try {
      const data = mediaType === "movie" ? await tmdb.discoverMovies(params) : await tmdb.discoverTV(params)
      let filtered = data.results
      if (alreadyWatchedFilter) {
        const watched = getAllRatings().filter((r) => r.watchedStatus === "watched")
        filtered = filtered.filter((item) => !watched.some((w) => w.tmdbId === item.id))
      }
      if (watchlistOnly) {
        const wl = getWatchlist()
        filtered = filtered.filter((item) => wl.some((w) => w.tmdbId === item.id))
      }
      setAdvancedResults(filtered)
    } catch {}
  }

  const showSearch = query.trim().length > 0
  const showGenreFilter = selectedGenre !== null && !showSearch
  const showAdvancedResults = advancedResults.length > 0 && !showSearch && !showGenreFilter

  return (
    <div className="min-h-screen bg-[var(--lolflix-bg,#141414)] text-white">
      <Navbar onSearch={handleQueryChange} searchValue={query} onTypeChange={handleTypeChange} onHomeClick={handleHomeClick} mediaType={mediaType} />

      {detailItem && (
        <DetailModal item={detailItem} mediaType={detailType} onClose={() => setDetailItem(null)} />
      )}

      <WatchWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />

      {/* Search & genre filter results */}
      {(showSearch || showGenreFilter) && (
        <div className="pt-20 px-4 md:px-12">
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <div className="flex md:hidden items-center gap-1 bg-[#2a2a2a] rounded p-1">
              <button onClick={() => handleTypeChange("movie")} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${mediaType === "movie" ? "bg-white text-black" : "text-white/60"}`}>Movies</button>
              <button onClick={() => handleTypeChange("tv")} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${mediaType === "tv" ? "bg-white text-black" : "text-white/60"}`}>TV Shows</button>
            </div>

            {!showSearch && (
              <>
                <div className="relative" ref={genreDropRef}>
                  <button onClick={() => setGenreOpen(!genreOpen)} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${selectedGenre ? "bg-white text-black border border-white" : "bg-[#242424] border border-white/20 text-white hover:border-white/40"}`}>
                    {selectedGenre ? selectedGenre.name : "Genres"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${genreOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {genreOpen && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/20 shadow-2xl py-1 min-w-[180px] max-h-72 overflow-y-auto rounded">
                        <button onClick={() => { setSelectedGenre(null); setGenreOpen(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${!selectedGenre ? "text-white font-semibold bg-white/10" : "text-white/70 hover:bg-white/5"}`}>All Genres</button>
                        {genres.map((g) => (
                          <button key={g.id} onClick={() => { setSelectedGenre(g); setGenreOpen(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${selectedGenre?.id === g.id ? "text-white font-semibold bg-white/10" : "text-white/70 hover:bg-white/5"}`}>{g.name}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {selectedGenre && (
                  <div className="relative" ref={sortDropRef}>
                    <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#242424] border border-white/20 text-white hover:border-white/40 rounded-sm transition-colors cursor-pointer">
                      {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || "Sort"}
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${sortOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {sortOpen && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/20 shadow-2xl py-1 min-w-[160px] rounded">
                          {SORT_OPTIONS.map((opt) => (
                            <button key={opt.value} onClick={() => { setSortBy(opt.value); setSortOpen(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${sortBy === opt.value ? "text-white font-semibold bg-white/10" : "text-white/70 hover:bg-white/5"}`}>{opt.label}</button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}
            <div className="ml-auto"><JoinRoomDialog /></div>
          </div>

          {showSearch && (
            <AnimatePresence mode="wait">
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-base font-semibold text-white/60 mb-4">{`Results for "${query}"`}</h2>
                <MediaGrid items={results} mediaType={mediaType} isLoading={isLoading} />
              </motion.div>
            </AnimatePresence>
          )}

          {showGenreFilter && !showSearch && (
            <AnimatePresence mode="wait">
              <motion.div key={`genre-${selectedGenre?.id}-${sortBy}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <h2 className="text-base font-semibold text-white/60 mb-4">{selectedGenre?.name}</h2>
                <MediaGrid items={genreResults} mediaType={mediaType} isLoading={genreLoading} />
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Home view */}
      {!showSearch && !showGenreFilter && (
        <AnimatePresence mode="wait">
          <motion.div key={`home-${mediaType}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
            {listRails.trending.length > 0 && <HeroBanner items={listRails.trending.slice(0, 6)} mediaType={mediaType} onInfoClick={openDetail} />}

            {/* Filter bar */}
            <div className="px-4 md:px-12 space-y-3 -mt-8 relative z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex md:hidden items-center gap-1 bg-[#2a2a2a] rounded p-1">
                  <button onClick={() => handleTypeChange("movie")} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${mediaType === "movie" ? "bg-white text-black" : "text-white/60"}`}>Movies</button>
                  <button onClick={() => handleTypeChange("tv")} className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${mediaType === "tv" ? "bg-white text-black" : "text-white/60"}`}>TV Shows</button>
                </div>

                <div className="relative" ref={genreDropRef}>
                  <button onClick={() => setGenreOpen(!genreOpen)} className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-sm transition-colors cursor-pointer ${selectedGenre ? "bg-white text-black border border-white" : "bg-[#242424] border border-white/20 text-white hover:border-white/40"}`}>
                    {selectedGenre ? selectedGenre.name : "Genres"}
                    <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-150 ${genreOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {genreOpen && (
                      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }} className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a1a] border border-white/20 shadow-2xl py-1 min-w-[180px] max-h-72 overflow-y-auto rounded">
                        <button onClick={() => { setSelectedGenre(null); setGenreOpen(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${!selectedGenre ? "text-white font-semibold bg-white/10" : "text-white/70 hover:bg-white/5"}`}>All Genres</button>
                        {genres.map((g) => (
                          <button key={g.id} onClick={() => { setSelectedGenre(g); setGenreOpen(false) }} className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer ${selectedGenre?.id === g.id ? "text-white font-semibold bg-white/10" : "text-white/70 hover:bg-white/5"}`}>{g.name}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setAdvancedOpen(!advancedOpen)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#242424] border border-white/20 text-white hover:border-white/40 rounded-sm transition-colors cursor-pointer">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </button>

                <button onClick={handleSurpriseMe} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#242424] border border-white/20 text-white/60 hover:text-white hover:border-white/40 rounded-sm transition-colors cursor-pointer">
                  <Shuffle className="h-3.5 w-3.5" /> Surprise Me
                </button>

                <button onClick={() => setWizardOpen(true)} className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-[#E50914]/20 text-[#E50914] hover:bg-[#E50914]/30 border border-[#E50914]/30 rounded-sm transition-colors cursor-pointer">
                  <Wand2 className="h-3.5 w-3.5" /> Pick For Me
                </button>

                <div className="ml-auto"><JoinRoomDialog /></div>
              </div>

              <AdvancedSearch
                genres={genres}
                onSearch={handleAdvancedSearch}
                onClose={() => setAdvancedOpen(false)}
                open={advancedOpen}
                alreadyWatchedFilter={alreadyWatchedFilter}
                onAlreadyWatchedToggle={() => setAlreadyWatchedFilter(!alreadyWatchedFilter)}
                watchlistOnly={watchlistOnly}
                onWatchlistOnlyToggle={() => setWatchlistOnly(!watchlistOnly)}
              />
            </div>

            {/* Advanced results */}
            {showAdvancedResults && (
              <div className="px-4 md:px-12">
                <h2 className="text-base font-semibold text-white/60 mb-4">Filter Results</h2>
                <MediaGrid items={advancedResults} mediaType={mediaType} isLoading={false} />
              </div>
            )}

            <VidkingLiveEmbed />

            {railsLoading && <p className="text-sm text-white/40 px-4 md:px-12">Loading picks for you…</p>}

            {continueWatching.length > 0 && (
              <section className="space-y-1">
                <div className="px-4 md:px-12"><h2 className="text-base md:text-lg font-bold text-[#e5e5e5]">Continue Watching</h2></div>
                <div className="flex gap-1 md:gap-1.5 overflow-x-auto pb-4 px-4 md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {continueWatching.map((item, idx) => (
                    <MediaPosterCard key={`cw-${mediaType}-${item.id}-${idx}`} item={item} mediaType={mediaType} size="lg" index={idx} season={continueMeta[idx]?.season} episode={continueMeta[idx]?.episode} onDetailOpen={openDetail} />
                  ))}
                </div>
              </section>
            )}

            {watchlistItems.length > 0 && <MediaRail title="My List" items={watchlistItems} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {top10Items.length > 0 && <Top10Rail title={`Top 10 ${mediaType === "movie" ? "Movies" : "Shows"} Today`} items={top10Items} mediaType={mediaType} onDetailOpen={openDetail} />}

            {newReleases.length > 0 && <MediaRail title="New Releases" items={newReleases} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {recentlyPlayedItems.length > 0 && <MediaRail title="Recently Played" items={recentlyPlayedItems} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {recommendations.length > 0 && <MediaRail title="Because you watched..." items={recommendations} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {mlRecommendations.length > 0 && <MediaRail title="Recommended for You" items={mlRecommendations} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {listRails.trending.length > 0 && <MediaRail title={`Trending ${mediaType === "movie" ? "Movies" : "TV Shows"}`} items={listRails.trending} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.popular.length > 0 && <MediaRail title="Popular" items={listRails.popular} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.topRated.length > 0 && <MediaRail title="Top Rated" items={listRails.topRated} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {hiddenGems.length > 0 && <MediaRail title="Hidden Gems" items={hiddenGems} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {criticallyAcclaimed.length > 0 && <MediaRail title="Critically Acclaimed" items={criticallyAcclaimed} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {/* Mood section rails */}
            {moodRails.map((rail) => (
              <MediaRail key={`mood-${rail.id}`} title={rail.label} items={rail.items} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {listRails.primary.length > 0 && <MediaRail title={mediaType === "movie" ? "Now Playing" : "On The Air"} items={listRails.primary} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.secondary.length > 0 && <MediaRail title={mediaType === "movie" ? "Upcoming" : "Airing Today"} items={listRails.secondary} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {pinnedGenreRails.map((rail) => (
              <MediaRail key={`pinned-${rail.genreId}`} title={`📌 ${rail.name}`} items={rail.items} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {shelfRails.map((rail) => (
              <MediaRail key={`shelf-${rail.id}`} title={rail.name} items={rail.items} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {indianRails.hindi.length > 0 && <MediaRail title={`Hindi ${mediaType === "movie" ? "Movies" : "TV Shows"}`} items={indianRails.hindi} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {indianRails.punjabi.length > 0 && <MediaRail title={`Punjabi ${mediaType === "movie" ? "Movies" : "TV Shows"}`} items={indianRails.punjabi} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {forgottenFavorites.length > 0 && <MediaRail title="Remember These?" items={forgottenFavorites} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {genreRails.map((rail) => (
              <MediaRail key={rail.genreId} title={rail.name} items={rail.items} mediaType={mediaType} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            <div className="h-16" />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
