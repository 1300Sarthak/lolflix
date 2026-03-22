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
import { MOODS } from "@/components/MoodCollections"
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

// Reserved for future sorting functionality
// const SORT_OPTIONS = [
//   { value: "popularity.desc", label: "Popularity" },
//   { value: "primary_release_date.desc", label: "Newest First" },
//   { value: "primary_release_date.asc", label: "Oldest First" },
//   { value: "vote_average.desc", label: "Highest Rated" },
// ]

export default function HomePage() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie")
  const [results, setResults] = useState<TMDBMedia[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const [cardLayout, setCardLayout] = useState<CardLayout>("comfortable")
  const [homeMediaTypeFilter, setHomeMediaTypeFilter] = useState<"movie" | "tv" | "all">("all")

  // Genre state
  const [genres, setGenres] = useState<TMDBGenre[]>([])
  const [selectedGenre, setSelectedGenre] = useState<TMDBGenre | null>(null)
  const [genreOpen, setGenreOpen] = useState(false)
  const genreDropRef = useRef<HTMLDivElement>(null)

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

  // Genre-specific rails
  const [genrePopular, setGenrePopular] = useState<TMDBMedia[]>([])
  const [genreTopRated, setGenreTopRated] = useState<TMDBMedia[]>([])
  const [genreNewReleases, setGenreNewReleases] = useState<TMDBMedia[]>([])
  const [genreCriticallyAcclaimed, setGenreCriticallyAcclaimed] = useState<TMDBMedia[]>([])
  const [genreLoading, setGenreLoading] = useState(false)

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
    }
    if (genreOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [genreOpen])

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

  const searchMedia = useCallback(async (q: string, type: "movie" | "tv" | "all") => {
    if (!q.trim()) {
      if (type === "all") {
        setIsLoading(true)
        try {
          const [movies, tv] = await Promise.all([tmdb.trendingMovies(), tmdb.trendingTV()])
          setResults([...movies.results, ...tv.results])
        } catch { setResults([]) }
        finally { setIsLoading(false) }
      } else {
        fetchTrending(type)
      }
      return
    }
    setIsLoading(true)
    try {
      if (type === "all") {
        const [movies, tv] = await Promise.all([tmdb.searchMovies(q), tmdb.searchTV(q)])
        const merged = [...movies.results.map(m => ({ ...m, media_type: "movie" as const })), ...tv.results.map(t => ({ ...t, media_type: "tv" as const }))]
        merged.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        setResults(merged)
      } else {
        const data = type === "movie" ? await tmdb.searchMovies(q) : await tmdb.searchTV(q)
        setResults(data.results)
      }
    } catch { setResults([]) }
    finally { setIsLoading(false) }
  }, [fetchTrending])

  useEffect(() => {
    if (!query.trim() && !selectedGenre) { // Only fetch trending if not searching and no genre selected
      if (homeMediaTypeFilter === "all") {
        const fetchAllTrending = async () => {
          setIsLoading(true)
          try {
            const [movies, tv] = await Promise.all([tmdb.trendingMovies(), tmdb.trendingTV()])
            setResults([...movies.results, ...tv.results])
          } catch { setResults([]) }
          finally { setIsLoading(false) }
        }
        fetchAllTrending()
      } else {
        fetchTrending(homeMediaTypeFilter)
      }
    }
  }, [query, selectedGenre, homeMediaTypeFilter, fetchTrending])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchMedia(value, homeMediaTypeFilter), 300)
  }

  const handleTypeChange = (type: "movie" | "tv") => {
    setMediaType(type)
    setSelectedGenre(null)
    setGenrePopular([])
    setGenreTopRated([])
    setGenreNewReleases([])
    setGenreCriticallyAcclaimed([])
    setAdvancedResults([])
    if (query.trim()) searchMedia(query, type)
  }

  const handleHomeClick = () => {
    setQuery("")
    setSelectedGenre(null)
    setGenrePopular([])
    setGenreTopRated([])
    setGenreNewReleases([])
    setGenreCriticallyAcclaimed([])
    setAdvancedResults([])
    setAdvancedOpen(false)
    // setMediaType("movie") // Removed to allow mixed content on home
  }

  // Fetch genres
  useEffect(() => {
    (async () => {
      try {
        const [movieGenresData, tvGenresData] = await Promise.all([
          tmdb.movieGenres(),
          tmdb.tvGenres(),
        ])
        const combinedGenres = [...movieGenresData.genres, ...tvGenresData.genres]
        // Remove duplicates based on id
        const uniqueGenres = Array.from(new Map(combinedGenres.map(genre => [genre.id, genre])).values())
        setGenres(uniqueGenres.sort((a, b) => a.name.localeCompare(b.name)))
      } catch {}
    })()
  }, []) // Removed mediaType from dependencies

  // Fetch genre results
  useEffect(() => {
    if (!selectedGenre) {
      setGenrePopular([]);
      setGenreTopRated([]);
      setGenreNewReleases([]);
      setGenreCriticallyAcclaimed([]);
      return;
    }
    let cancelled = false
    ;(async () => {
      if (!selectedGenre) return
      setGenreLoading(true)
      try {
        const [popularData, topRatedData, newReleaseData, criticallyAcclaimedData] = await Promise.all([
          mediaType === "movie"
            ? tmdb.discoverMovies({ genres: [selectedGenre.id], sortBy: "popularity.desc" })
            : tmdb.discoverTV({ genres: [selectedGenre.id], sortBy: "popularity.desc" }),
          mediaType === "movie"
            ? tmdb.discoverMovies({ genres: [selectedGenre.id], sortBy: "vote_average.desc", voteCountGte: 100 })
            : tmdb.discoverTV({ genres: [selectedGenre.id], sortBy: "vote_average.desc", voteCountGte: 100 }),
          mediaType === "movie"
            ? tmdb.discoverMovies({ genres: [selectedGenre.id], sortBy: "primary_release_date.desc", primaryReleaseDateGte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] })
            : tmdb.discoverTV({ genres: [selectedGenre.id], sortBy: "first_air_date.desc", firstAirDateGte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
          mediaType === "movie"
            ? tmdb.discoverMovies({ genres: [selectedGenre.id], sortBy: "vote_average.desc", voteAverageGte: 7.5, voteCountGte: 500 })
            : tmdb.discoverTV({ genres: [selectedGenre.id], sortBy: "vote_average.desc", voteAverageGte: 7.5, voteCountGte: 500 }),
        ])

        if (!cancelled) {
          setGenrePopular(popularData.results)
          setGenreTopRated(topRatedData.results)
          setGenreNewReleases(newReleaseData.results)
          setGenreCriticallyAcclaimed(criticallyAcclaimedData.results)
        }
      } catch {}
      finally { if (!cancelled) setGenreLoading(false) }
    })()
    return () => { cancelled = true }
  }, [selectedGenre, mediaType])

  // Load homepage rails
  useEffect(() => {
    if (query.trim() || selectedGenre) return // Don't load mixed rails if search or genre is active
    let cancelled = false

    async function loadRails() {
      setRailsLoading(true)
      try {
        // Fetch both movie and TV data for main rails
        const [
          trendingMoviesData, popularMoviesData, topRatedMoviesData, nowPlayingMoviesData, upcomingMoviesData, movieGenresData, hindiMoviesData, punjabiMoviesData, trendingMoviesDailyData, newReleaseMoviesData, hiddenGemMoviesData, criticallyAcclaimedMoviesData,
          trendingTVData, popularTVData, topRatedTVData, onTheAirTVData, airingTodayTVData, tvGenresData, hindiTVData, punjabiTVData, trendingTVDailyData, newReleaseTVData, hiddenGemTVData, criticallyAcclaimedTVData,
        ] = await Promise.all([
          tmdb.trendingMovies(), tmdb.popularMovies(), tmdb.topRatedMovies(), tmdb.nowPlayingMovies(), tmdb.upcomingMovies(), tmdb.movieGenres(), tmdb.discoverHindiMovies(), tmdb.discoverPunjabiMovies(), tmdb.trendingMoviesDaily(), tmdb.newReleaseMovies(), tmdb.hiddenGemMovies(), tmdb.criticallyAcclaimedMovies(),
          tmdb.trendingTV(), tmdb.popularTV(), tmdb.topRatedTV(), tmdb.onTheAirTV(), tmdb.airingTodayTV(), tmdb.tvGenres(), tmdb.discoverHindiTV(), tmdb.discoverPunjabiTV(), tmdb.trendingTVDaily(), tmdb.newReleaseTV(), tmdb.hiddenGemTV(), tmdb.criticallyAcclaimedTV(),
        ])

        // Combine daily trending for Top 10
        const combinedTop10 = [...trendingMoviesDailyData.results, ...trendingTVDailyData.results]
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)) // Sort by vote average for a better "top" list
          .slice(0, 10)

        setTop10Items(combinedTop10)

        // Update listRails with both movie and TV data
        setListRails({
          trending: [...trendingMoviesData.results, ...trendingTVData.results],
          popular: [...popularMoviesData.results, ...popularTVData.results],
          topRated: [...topRatedMoviesData.results, ...topRatedTVData.results],
          primary: [...nowPlayingMoviesData.results, ...onTheAirTVData.results],
          secondary: [...upcomingMoviesData.results, ...airingTodayTVData.results],
        })

        setNewReleases([...newReleaseMoviesData.results, ...newReleaseTVData.results])
        setHiddenGems([...hiddenGemMoviesData.results, ...hiddenGemTVData.results])
        setCriticallyAcclaimed([...criticallyAcclaimedMoviesData.results, ...criticallyAcclaimedTVData.results])
        setIndianRails({
          hindi: [...hindiMoviesData.results, ...hindiTVData.results],
          punjabi: [...punjabiMoviesData.results, ...punjabiTVData.results],
        })

        // Existing logic for continueWatching, recentlyPlayedItems, recommendations, etc.
        const allProgress = getProgress()
        const allRecent = getRecentlyPlayed()

        const mapHistoryToMedia = (items: typeof allRecent): TMDBMedia[] =>
          items.map((item) => {
            const base = { id: item.tmdbId, overview: "", poster_path: item.poster_path || "", backdrop_path: item.backdrop_path || "", vote_average: 0, genre_ids: item.genreIds }
            return item.mediaType === "movie"
              ? { ...base, title: item.title, release_date: "", media_type: "movie" } as TMDBMedia
              : { ...base, name: item.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" } as TMDBMedia
          })

        const recentMedia = mapHistoryToMedia(allRecent)
        const continueMedia: TMDBMedia[] = []
        const continueMetaLocal: { season?: number; episode?: number }[] = []

        allProgress.forEach((p) => {
          const fromRecent = allRecent.find((r) => r.tmdbId === p.tmdbId && r.mediaType === p.mediaType)
          const base = { id: p.tmdbId, overview: "", poster_path: fromRecent?.poster_path || "", backdrop_path: fromRecent?.backdrop_path || "", vote_average: 0, genre_ids: fromRecent?.genreIds }
          if (p.mediaType === "movie") continueMedia.push({ ...base, title: fromRecent?.title || "Continue watching", release_date: "", media_type: "movie" } as TMDBMedia)
          else continueMedia.push({ ...base, name: fromRecent?.title || "Continue watching", first_air_date: "", number_of_seasons: 1, media_type: "tv" } as TMDBMedia)
          continueMetaLocal.push({ season: p.season, episode: p.episode })
        })

        const genreCount: Record<number, number> = {}
        allRecent.forEach((item) => item.genreIds?.forEach((g) => { genreCount[g] = (genreCount[g] || 0) + 1 }))
        const topGenreIds = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => Number(id))

        // Mood rails
        const moodPromises = MOODS.filter((m) => m.genres.length > 0).map(async (mood) => {
          try {
            const movieData = await tmdb.discoverMovies({ genres: [...mood.genres], sortBy: "popularity.desc", voteAverageGte: 6 })
            const tvData = await tmdb.discoverTV({ genres: [...mood.genres], sortBy: "popularity.desc", voteAverageGte: 6 })
            return { id: mood.id, label: mood.label, items: [...movieData.results, ...tvData.results] }
          } catch {
            return { id: mood.id, label: mood.label, items: [] }
          }
        })
        const moodRailsData = await Promise.all(moodPromises)

        let recResults: TMDBMedia[] = []
        const seed = allRecent[0] || allProgress[0]
        if (seed) {
          try {
            const movieRec = await tmdb.movieRecommendations(seed.tmdbId)
            const tvRec = await tmdb.tvRecommendations(seed.tmdbId)
            recResults = [...movieRec.results, ...tvRec.results]
          } catch {}
        }

        const genreMap = new Map<number, string>()
        ;[...movieGenresData.genres, ...tvGenresData.genres].forEach((g) => genreMap.set(g.id, g.name))

        const genreRailsData: { genreId: number; name: string; items: TMDBMedia[] }[] = []
        await Promise.all(topGenreIds.map(async (id) => {
          try {
            const movieData = await tmdb.discoverMoviesByGenre(id)
            const tvData = await tmdb.discoverTVByGenre(id)
            genreRailsData.push({ genreId: id, name: genreMap.get(id) || "Genre", items: [...movieData.results, ...tvData.results] })
          } catch {}
        }))

        const pinned = getPinnedGenres()
        const pinnedRails: { genreId: number; name: string; items: TMDBMedia[] }[] = []
        await Promise.all(pinned.map(async (id) => {
          try {
            const movieData = await tmdb.discoverMoviesByGenre(id)
            const tvData = await tmdb.discoverTVByGenre(id)
            pinnedRails.push({ genreId: id, name: genreMap.get(id) || "Genre", items: [...movieData.results, ...tvData.results] })
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

        // Load watchlist items
        const watchlistData = getWatchlist()
        const watchlistMedia = watchlistData.map((item) => ({
          id: item.tmdbId,
          overview: item.overview || "",
          poster_path: item.poster_path || "",
          backdrop_path: item.backdrop_path || "",
          vote_average: item.vote_average || 0,
          genre_ids: item.genreIds,
          ...(item.mediaType === "movie"
            ? { title: item.title, release_date: "", media_type: "movie" as const }
            : { name: item.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" as const }
          ),
        } as TMDBMedia))

        if (cancelled) return

        setContinueWatching(continueMedia)
        setContinueMeta(continueMetaLocal)
        setRecentlyPlayedItems(recentMedia)
        setRecommendations(recResults)
        setWatchlistItems(watchlistMedia)
        setMoodRails(moodRailsData.filter((r) => r.items.length > 0))
        setGenreRails(genreRailsData.sort((a, b) => {
          const ai = topGenreIds.indexOf(a.genreId)
          const bi = topGenreIds.indexOf(b.genreId)
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
        }))
        setPinnedGenreRails(pinnedRails)
        setShelfRails(shelfRailsData)
        setForgottenFavorites(forgottenMedia)

      } catch (err) {
        console.error("Failed to load homepage rails", err)
      } finally { if (!cancelled) setRailsLoading(false) }
    }

    if (!query.trim() && !selectedGenre) { // Only load mixed rails on home
      loadRails()
    }
    return () => { cancelled = true }
  }, [query, selectedGenre]) // Removed mediaType and fetchTrending from dependencies

  // ML recommendations
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!hasEnoughData()) { setMLRecommendations([]); return }
      try {
        const profile = getUserPreferenceProfile()
        const topGenres = Array.from(profile.genreScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => id)
        if (topGenres.length === 0) { setMLRecommendations([]); return }
        const movieData = await tmdb.discoverMoviesByGenre(topGenres[0])
        const tvData = await tmdb.discoverTVByGenre(topGenres[0])
        const combinedData = [...movieData.results, ...tvData.results]
        if (!cancelled) setMLRecommendations(rankByPreference(combinedData, profile, true).slice(0, 20))
      } catch {}
    })()
    return () => { cancelled = true }
  }, []) // Removed mediaType from dependencies

  // Surprise me
  const handleSurpriseMe = () => {
    const items = getWatchlist()
    const allProgress = getProgress()
    const watched = new Set(
      allProgress
        .filter((p) => (p.progress ?? 0) >= 90 || p.currentTime > 5400)
        .map((p) => `${p.tmdbId}-${p.mediaType}`)
    )
    const unwatched = items.filter((item) =>
      !watched.has(`${item.tmdbId}-${item.mediaType}`)
    )

    if (unwatched.length === 0) {
      toast("No unwatched items in your list!")
      return
    }

    const pick = unwatched[Math.floor(Math.random() * unwatched.length)]
    const media: TMDBMedia = {
      id: pick.tmdbId,
      overview: pick.overview || "",
      poster_path: pick.poster_path || "",
      backdrop_path: pick.backdrop_path || "",
      vote_average: pick.vote_average || 0,
      genre_ids: pick.genreIds,
      ...(pick.mediaType === "movie"
        ? { title: pick.title, release_date: "", media_type: "movie" as const }
        : { name: pick.title, first_air_date: "", number_of_seasons: 1, media_type: "tv" as const }
      ),
    } as TMDBMedia
    openDetail(media, pick.mediaType)
  }

  // Advanced search
  const handleAdvancedSearch = async (params: DiscoverParams) => {
    try {
      const movieData = await tmdb.discoverMovies(params)
      const tvData = await tmdb.discoverTV(params)
      const combinedData = [...movieData.results, ...tvData.results]

      let filtered = combinedData
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
      <Navbar onSearch={handleQueryChange} searchValue={query} onTypeChange={(type) => setHomeMediaTypeFilter(type)} onHomeClick={handleHomeClick} />

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
              <motion.div key={`genre-${selectedGenre?.id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <h2 className="text-base font-semibold text-white/60 px-4 md:px-12">{selectedGenre?.name}</h2>
                {genreLoading && <p className="text-sm text-white/40 px-4 md:px-12">Loading genre content…</p>}

                {genrePopular.length > 0 && <MediaRail title="Popular" items={genrePopular} cardLayout={cardLayout} onDetailOpen={openDetail} />}
                {genreTopRated.length > 0 && <MediaRail title="Top Rated" items={genreTopRated} cardLayout={cardLayout} onDetailOpen={openDetail} />}
                {genreNewReleases.length > 0 && <MediaRail title="New Releases" items={genreNewReleases} cardLayout={cardLayout} onDetailOpen={openDetail} />}
                {genreCriticallyAcclaimed.length > 0 && <MediaRail title="Critically Acclaimed" items={genreCriticallyAcclaimed} cardLayout={cardLayout} onDetailOpen={openDetail} />}

                {!genreLoading && genrePopular.length === 0 && genreTopRated.length === 0 && genreNewReleases.length === 0 && genreCriticallyAcclaimed.length === 0 && (
                  <p className="text-sm text-white/40 px-4 md:px-12">No content found for this genre.</p>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Home view */}
      {!showSearch && !showGenreFilter && (
        <AnimatePresence mode="wait">
          <motion.div key={`home-${mediaType}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">
            {listRails.trending.length > 0 && (homeMediaTypeFilter === "all" || listRails.trending.some(item => item.media_type === homeMediaTypeFilter)) && <HeroBanner items={listRails.trending.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter).slice(0, 6)} onInfoClick={openDetail} />}

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

            {continueWatching.length > 0 && (homeMediaTypeFilter === "all" || continueWatching.some(item => item.media_type === homeMediaTypeFilter)) && (
              <section className="space-y-1">
                <div className="px-4 md:px-12"><h2 className="text-base md:text-lg font-bold text-[#e5e5e5]">Continue Watching</h2></div>
                <div className="flex gap-1 md:gap-1.5 overflow-x-auto pb-4 px-4 md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {continueWatching.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter).map((item, idx) => (
                    <MediaPosterCard key={`cw-${item.media_type}-${item.id}-${idx}`} item={item} mediaType={item.media_type || "movie"} size="lg" index={idx} season={continueMeta[idx]?.season} episode={continueMeta[idx]?.episode} onDetailOpen={openDetail} />
                  ))}
                </div>
              </section>
            )}

            {watchlistItems.length > 0 && (homeMediaTypeFilter === "all" || watchlistItems.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="My List" items={watchlistItems.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {top10Items.length > 0 && (homeMediaTypeFilter === "all" || top10Items.some(item => item.media_type === homeMediaTypeFilter)) && <Top10Rail title={`Top 10 Today`} items={top10Items.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} onDetailOpen={openDetail} />}

            {newReleases.length > 0 && (homeMediaTypeFilter === "all" || newReleases.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="New Releases" items={newReleases.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {recentlyPlayedItems.length > 0 && (homeMediaTypeFilter === "all" || recentlyPlayedItems.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Recently Played" items={recentlyPlayedItems.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {recommendations.length > 0 && (homeMediaTypeFilter === "all" || recommendations.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Because you watched..." items={recommendations.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {mlRecommendations.length > 0 && (homeMediaTypeFilter === "all" || mlRecommendations.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Recommended for You" items={mlRecommendations.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {listRails.trending.length > 0 && (homeMediaTypeFilter === "all" || listRails.trending.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title={`Trending`} items={listRails.trending.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.popular.length > 0 && (homeMediaTypeFilter === "all" || listRails.popular.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Popular" items={listRails.popular.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.topRated.length > 0 && (homeMediaTypeFilter === "all" || listRails.topRated.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Top Rated" items={listRails.topRated.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {hiddenGems.length > 0 && (homeMediaTypeFilter === "all" || hiddenGems.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Hidden Gems" items={hiddenGems.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {criticallyAcclaimed.length > 0 && (homeMediaTypeFilter === "all" || criticallyAcclaimed.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Critically Acclaimed" items={criticallyAcclaimed.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {/* Mood section rails */}
            {moodRails.map((rail) => (homeMediaTypeFilter === "all" || rail.items.some(item => item.media_type === homeMediaTypeFilter)) && (
              <MediaRail key={`mood-${rail.id}`} title={rail.label} items={rail.items.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {listRails.primary.length > 0 && (homeMediaTypeFilter === "all" || listRails.primary.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title={"Now Playing / On The Air"} items={listRails.primary.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {listRails.secondary.length > 0 && (homeMediaTypeFilter === "all" || listRails.secondary.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title={"Upcoming / Airing Today"} items={listRails.secondary.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {pinnedGenreRails.map((rail) => (homeMediaTypeFilter === "all" || rail.items.some(item => item.media_type === homeMediaTypeFilter)) && (
              <MediaRail key={`pinned-${rail.genreId}`} title={`📌 ${rail.name}`} items={rail.items.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {shelfRails.map((rail) => (homeMediaTypeFilter === "all" || rail.items.some(item => item.media_type === homeMediaTypeFilter)) && (
              <MediaRail key={`shelf-${rail.id}`} title={rail.name} items={rail.items.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            {indianRails.hindi.length > 0 && (homeMediaTypeFilter === "all" || indianRails.hindi.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title={`Hindi`} items={indianRails.hindi.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}
            {indianRails.punjabi.length > 0 && (homeMediaTypeFilter === "all" || indianRails.punjabi.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title={`Punjabi`} items={indianRails.punjabi.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {forgottenFavorites.length > 0 && (homeMediaTypeFilter === "all" || forgottenFavorites.some(item => item.media_type === homeMediaTypeFilter)) && <MediaRail title="Remember These?" items={forgottenFavorites.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />}

            {genreRails.map((rail) => (homeMediaTypeFilter === "all" || rail.items.some(item => item.media_type === homeMediaTypeFilter)) && (
              <MediaRail key={rail.genreId} title={rail.name} items={rail.items.filter(item => homeMediaTypeFilter === "all" || item.media_type === homeMediaTypeFilter)} cardLayout={cardLayout} onDetailOpen={openDetail} />
            ))}

            <div className="h-16" />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
