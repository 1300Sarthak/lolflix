"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Play, Plus, Check } from "lucide-react"
import { tmdb } from "@/lib/tmdb"
import { isInWatchlist, addToWatchlist, removeFromWatchlist, type WatchlistItem } from "@/lib/watchlist"
import { useToast } from "@/components/Toast"
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
  const [inList, setInList] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  const title = isMovie(item) ? item.title : item.name
  const year = isMovie(item) ? item.release_date?.split("-")[0] : item.first_air_date?.split("-")[0]
  const rating = item.vote_average?.toFixed(1)
  const posterUrl = tmdb.imageUrl(item.poster_path, "w342")

  const wClass =
    size === "sm" ? "w-28 sm:w-32"
    : size === "cinematic" ? "w-40 sm:w-52"
    : size === "lg" ? "w-36 sm:w-44"
    : "w-32 sm:w-36"

  useEffect(() => {
    setIsHydrated(true)
    setInList(isInWatchlist(item.id, mediaType))
  }, [item.id, mediaType])

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.25), ease: "easeOut" }}
      className={`group relative ${wClass} shrink-0 rounded overflow-hidden bg-[#181818] transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E50914] text-left hover:scale-105 hover:z-20 hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]`}
    >
      <button onClick={handleCardClick} className="w-full h-full cursor-pointer" aria-label={`View ${title}`}>
        <div className="relative aspect-[2/3] w-full bg-[#2a2a2a]">
          {posterUrl ? (
            <Image src={posterUrl} alt={title} fill sizes="200px" className="object-cover" loading="lazy" />
          ) : (
            <div className="flex items-center justify-center h-full text-white/40 text-xs px-2 text-center">No poster</div>
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
    </motion.div>
  )
}
