"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { tmdb } from "@/lib/tmdb"
import { useTVMode } from "@/contexts/TVModeContext"
import { ExpandedMediaCard } from "@/components/ExpandedMediaCard"
import { isInWatchlist, addToWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist"
import { useToast } from "@/components/Toast"
import type { TMDBMedia, TMDBMovie, TMDBShow } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

// Individual Top10 item with hover expansion
function Top10Item({
  item,
  index,
  onDetailOpen,
  isTVMode,
  focusedIndex,
  setFocusedIndex,
}: {
  item: TMDBMedia
  index: number
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
  isTVMode: boolean
  focusedIndex: number | null
  setFocusedIndex: (idx: number | null) => void
}) {
  const { toast } = useToast()
  const [showExpanded, setShowExpanded] = useState(false)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [isLoadingTrailer, setIsLoadingTrailer] = useState(false)
  const [cardPosition, setCardPosition] = useState({ top: 0, left: 0, width: 0 })
  const [inList, setInList] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLButtonElement>(null)

  const posterUrl = tmdb.imageUrl(item.poster_path, "w342")
  const itemTitle = isMovie(item) ? item.title : (item as TMDBShow).name

  useEffect(() => {
    setInList(isInWatchlist(item.id, (item.media_type || (isMovie(item) ? "movie" : "tv"))))
  }, [item.id, (item.media_type || (isMovie(item) ? "movie" : "tv"))])

  const fetchTrailer = useCallback(async () => {
    if (trailerKey || isLoadingTrailer) return
    setIsLoadingTrailer(true)
    try {
      const data = (item.media_type || (isMovie(item) ? "movie" : "tv")) === "movie"
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
  }, [item.id, (item.media_type || (isMovie(item) ? "movie" : "tv")), trailerKey, isLoadingTrailer])

  const handleMouseEnter = useCallback(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    if (isTouchDevice) return

    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)

    hoverTimerRef.current = setTimeout(() => {
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
    }, 1000)
  }, [fetchTrailer])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setTimeout(() => setShowExpanded(false), 300)
  }, [])

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const watchlistItem: WatchlistItem = {
      tmdbId: item.id,
      mediaType: (item.media_type || (isMovie(item) ? "movie" : "tv")),
      title: itemTitle,
      poster_path: item.poster_path || null,
      backdrop_path: item.backdrop_path || null,
      overview: item.overview,
      vote_average: item.vote_average,
      genreIds: item.genre_ids,
      addedAt: Date.now(),
    }
    if (inList) {
      removeFromWatchlist(item.id, (item.media_type || (isMovie(item) ? "movie" : "tv")))
      setInList(false)
      toast("Removed from My List")
    } else {
      addToWatchlist(watchlistItem)
      setInList(true)
      toast("Added to My List")
    }
  }

  return (
    <>
      <button
        ref={cardRef}
        onClick={() => onDetailOpen?.(item, (item.media_type || (isMovie(item) ? "movie" : "tv")))}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={() => setFocusedIndex(index)}
        onBlur={() => setFocusedIndex(null)}
        tabIndex={isTVMode ? 0 : -1}
        className={`group relative shrink-0 flex items-end cursor-pointer ${
          isTVMode && focusedIndex === index ? "tv-focus-ring" : ""
        }`}
        aria-label={itemTitle}
      >
        <span
          className="text-[5rem] sm:text-[6rem] font-black leading-none select-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "2px rgba(255,255,255,0.3)",
            marginRight: "-12px",
            zIndex: 1,
          }}
        >
          {index + 1}
        </span>
        <div className="relative w-24 sm:w-28 aspect-[2/3] rounded overflow-hidden bg-[#2a2a2a] group-hover:scale-105 transition-transform duration-300">
          {posterUrl && (
            <Image src={posterUrl} alt={itemTitle} fill sizes="120px" className="object-cover" loading="lazy" />
          )}
        </div>
      </button>

      {showExpanded && (
        <ExpandedMediaCard
          item={item}
          mediaType={(item.media_type || (isMovie(item) ? "movie" : "tv"))}
          trailerKey={trailerKey}
          cardPosition={cardPosition}
          onClose={handleMouseLeave}
          onDetailOpen={onDetailOpen}
          inList={inList}
          onWatchlistToggle={handleWatchlistToggle}
        />
      )}
    </>
  )
}

export function Top10Rail({
  title,
  items,
  onDetailOpen,
}: {
  title: string
  items: TMDBMedia[]
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
}) {
  const { isTVMode } = useTVMode()
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)

  if (!items?.length) return null
  const top10 = items.slice(0, 10)

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-1"
    >
      <div className="px-4 md:px-12">
        <h2 className={`text-base md:text-lg font-bold text-[#e5e5e5] ${isTVMode ? "tv-text-lg" : ""}`}>{title}</h2>
      </div>
      <div className={`px-4 md:px-12 ${
        isTVMode
          ? "tv-grid"
          : "flex gap-2 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      }`}>
        {top10.map((item, idx) => (
          <Top10Item
            key={item.id}
            item={item}
            index={idx}
            onDetailOpen={onDetailOpen}
            isTVMode={isTVMode}
            focusedIndex={focusedIndex}
            setFocusedIndex={setFocusedIndex}
          />
        ))}
      </div>
    </motion.section>
  )
}
