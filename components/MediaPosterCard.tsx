"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Play, Plus, Check } from "lucide-react"
import { tmdb } from "@/lib/tmdb"
import { isInWatchlist, addToWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist"
import { getProgress } from "@/lib/history"
import { useToast } from "@/components/Toast"
import { ExpandedMediaCard } from "@/components/ExpandedMediaCard"
import { useTVMode } from "@/contexts/TVModeContext"
import type { TMDBMedia, TMDBMovie } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

export function MediaPosterCard({
  item,
  mediaType,
  index = 0,
  size = "md",
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  season,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  episode,
  showWatchlistButton = true,
  onDetailOpen,
}: {
  item: TMDBMedia
  mediaType: "movie" | "tv"
  index?: number
  size?: "sm" | "md" | "lg" | "cinematic"
  season?: number
  episode?: number
  showWatchlistButton?: boolean
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
}) {
  const { toast } = useToast()
  const { isTVMode } = useTVMode()
  const [inList, setInList] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [progress, setProgress] = useState(0)

  // Hover expansion state
  const [showExpanded, setShowExpanded] = useState(false)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false)
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0, width: 0 })
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const title = isMovie(item) ? item.title : item.name
  const year = isMovie(item) ? item.release_date?.split("-")[0] : item.first_air_date?.split("-")[0]
  const rating = item.vote_average?.toFixed(1)

  // Use backdrop in TV mode, poster otherwise
  const imageUrl = isTVMode && item.backdrop_path
    ? tmdb.imageUrl(item.backdrop_path, "w780")
    : tmdb.imageUrl(item.poster_path, "w342")

  const showProgress = season !== undefined || episode !== undefined // Continue watching indicator

  // Check if content is new (last 30 days)
  const isNew = () => {
    const releaseDate = isMovie(item) ? item.release_date : item.first_air_date
    if (!releaseDate) return false
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return new Date(releaseDate) > thirtyDaysAgo
  }

  const wClass =
    size === "sm" ? "w-28 sm:w-32"
    : size === "cinematic" ? "w-40 sm:w-52"
    : size === "lg" ? "w-36 sm:w-44"
    : "w-32 sm:w-36"

  useEffect(() => {
    setIsHydrated(true)
    setInList(isInWatchlist(item.id, mediaType))

    // Get progress for Continue Watching
    if (showProgress) {
      const allProgress = getProgress()
      const itemProgress = allProgress.find(p => p.tmdbId === item.id && p.mediaType === mediaType)
      if (itemProgress) {
        setProgress(itemProgress.progress ?? 0)
      }
    }
  }, [item.id, mediaType, showProgress])

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const watchlistItem: WatchlistItem = {
      tmdbId: item.id, mediaType, title: title || "",
      poster_path: item.poster_path || null, backdrop_path: item.backdrop_path || null,
      overview: item.overview, vote_average: item.vote_average, genreIds: item.genre_ids, addedAt: Date.now(),
    }
    if (inList) { removeFromWatchlist(item.id, mediaType); setInList(false); toast("Removed from My List") }
    else { addToWatchlist(watchlistItem); setInList(true); toast("Added to My List") }
  }

  const handleCardClick = () => {
    if (onDetailOpen) { onDetailOpen(item, mediaType) }
  }

  // Fetch trailer for hover expansion
  const fetchTrailer = useCallback(async () => {
    if (trailerKey || isLoadingTrailer) return
    setIsLoadingTrailer(true)
    try {
      const data = mediaType === "movie"
        ? await tmdb.movieVideos(item.id)
        : await tmdb.tvVideos(item.id)

      // Try to find best trailer in order of preference
      const trailer =
        data.results.find(v => v.type === "Trailer" && v.official && v.site === "YouTube") ||
        data.results.find(v => v.type === "Trailer" && v.site === "YouTube") ||
        data.results.find(v => v.type === "Teaser" && v.site === "YouTube") ||
        data.results.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser")) ||
        data.results.find(v => v.site === "YouTube") // Any YouTube video

      if (trailer) setTrailerKey(trailer.key)
    } catch (error) {
      console.error("Failed to fetch trailer:", error)
    } finally {
      setIsLoadingTrailer(false)
    }
  }, [item.id, mediaType, trailerKey, isLoadingTrailer])

  // Hover handlers with 1-second delay
  const handleMouseEnter = useCallback(() => {
    // Disable on mobile/touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

    hoverTimerRef.current = setTimeout(() => {
      // Calculate card position before showing expansion
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect()
        setCardPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width
        })
      }
      setShowExpanded(true)
      fetchTrailer()
    }, 1000) // Changed from 5000 to 1000 (1 second)
  }, [fetchTrailer])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setTimeout(() => setShowExpanded(false), 300)
  }, [])

  // Cleanup hover timer on unmount
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.25), ease: "easeOut" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      tabIndex={isTVMode ? 0 : -1}
      className={`group relative ${wClass} shrink-0 rounded overflow-hidden bg-[#181818] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] text-left ${
        isTVMode
          ? `tv-card ${isFocused ? "tv-focus-ring" : ""}`
          : "hover:scale-105 hover:z-20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
      }`}
    >
      <button onClick={handleCardClick} className="w-full h-full cursor-pointer" aria-label={`View ${title}`}>
        <div className={`relative w-full bg-[#2a2a2a] ${isTVMode ? "aspect-video" : "aspect-[2/3]"}`}>
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill sizes={isTVMode ? "400px" : "200px"} className="object-cover" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-xs px-2 text-center">
              {isTVMode ? "No backdrop" : "No poster"}
            </div>
          )}

          {/* NEW badge for recent content */}
          {isNew() && (
            <div className="absolute top-2 left-2 bg-[#E50914] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              NEW
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex flex-col items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white rounded-full p-2"><Play className="h-5 w-5 text-black fill-black" /></div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <p className="text-white text-xs font-semibold truncate">{title}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-white/70 mt-0.5">
              {year && <span>{year}</span>}
              {rating && Number(rating) > 0 && (<><span>·</span><span className="text-green-400 font-semibold">{rating}</span></>)}
            </div>
          </div>

          {/* Progress bar for Continue Watching */}
          {showProgress && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-[#E50914]"
              />
            </div>
          )}
        </div>
      </button>
      {showWatchlistButton && isHydrated && (
        <button
          onClick={handleWatchlistToggle}
          className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 cursor-pointer ${
            inList ? "bg-white text-black" : "bg-[#2a2a2a]/80 border border-white/30 text-white hover:bg-[#2a2a2a] hover:border-white/50"
          }`}
          aria-label={inList ? "Remove from My List" : "Add to My List"}
        >
          {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        </button>
      )}

      {/* Expanded card with trailer on 1+ second hover */}
      {showExpanded && (
        <ExpandedMediaCard
          item={item}
          mediaType={mediaType}
          trailerKey={trailerKey}
          cardPosition={cardPosition}
          onClose={handleMouseLeave}
          onDetailOpen={onDetailOpen}
          inList={inList}
          onWatchlistToggle={handleWatchlistToggle}
        />
      )}
    </motion.div>
  )
}
