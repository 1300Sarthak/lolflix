"use client"

import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import YouTube from "react-youtube"
import { Play, Plus, Check, Info, Volume2, VolumeX } from "lucide-react"
import type { TMDBMedia, TMDBMovie } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

interface ExpandedMediaCardProps {
  item: TMDBMedia
  mediaType: "movie" | "tv"
  trailerKey: string | null
  cardPosition: { top: number; left: number; width: number }
  onClose: () => void
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
  inList: boolean
  onWatchlistToggle: (e: React.MouseEvent) => void
}

export function ExpandedMediaCard({
  item,
  mediaType,
  trailerKey,
  cardPosition,
  onClose,
  onDetailOpen,
  inList,
  onWatchlistToggle,
}: ExpandedMediaCardProps) {
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  const [isMuted, setIsMuted] = useState(false) // Sound ON by default
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const cardRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<{ mute: () => void; unMute: () => void } | null>(null)

  const title = isMovie(item) ? item.title : item.name
  const year = isMovie(item) ? item.release_date?.split("-")[0] : item.first_air_date?.split("-")[0]
  const rating = item.vote_average?.toFixed(1)
  const overview = item.overview?.slice(0, 150) + (item.overview && item.overview.length > 150 ? "…" : "")
  const backdropUrl = item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null
  const hasTrailer = trailerKey !== null

  useEffect(() => {
    setIsMounted(true)

    // Calculate position based on original card position
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const expandedWidth = 380 // Expanded card width
    const expandedHeight = 450 // Approximate expanded height

    // Start from card position
    let top = cardPosition.top - 30 // Slight offset upward
    let left = cardPosition.left - 50 // Expand leftward

    // Prevent overflow on right edge
    if (left + expandedWidth > viewportWidth - 20) {
      left = viewportWidth - expandedWidth - 20
    }

    // Prevent overflow on left edge
    if (left < 20) {
      left = 20
    }

    // Prevent overflow on bottom edge
    if (top + expandedHeight > viewportHeight - 20) {
      top = viewportHeight - expandedHeight - 20
    }

    // Prevent overflow on top edge
    if (top < 80) { // Account for navbar
      top = 80
    }

    setPosition({ top, left })
  }, [cardPosition])

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    router.push(`/watch/new?tmdb=${item.id}&type=${mediaType}`)
  }

  const handleMoreInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDetailOpen?.(item, mediaType)
    onClose()
  }

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
      } else {
        playerRef.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  const onPlayerReady = (event: { target: { mute: () => void; unMute: () => void; playVideo: () => void } }) => {
    playerRef.current = event.target
    // Start with sound ON (unmuted)
    event.target.unMute()
    event.target.playVideo()
  }

  if (!isMounted) return null

  const content = (
    <AnimatePresence>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, scale: 1, y: 0 }}
        animate={{ opacity: 1, scale: 1.5, y: -20 }}
        exit={{ opacity: 0, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        onMouseLeave={onClose}
        className="fixed z-[9999] w-80 bg-[#181818] rounded-lg overflow-hidden shadow-2xl"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Trailer video or backdrop image */}
        <div className="relative w-full aspect-video bg-black">
          {hasTrailer ? (
            <>
              <YouTube
                videoId={trailerKey}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    mute: 0, // Sound ON by default
                    loop: 1,
                    playlist: trailerKey,
                    playsinline: 1,
                    modestbranding: 1,
                    rel: 0,
                  },
                }}
                onReady={onPlayerReady}
                className="absolute inset-0"
              />

              {/* Mute button overlay */}
              <button
                onClick={toggleMute}
                className="absolute bottom-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-colors cursor-pointer z-10"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </>
          ) : (
            <>
              {/* Backdrop image when no trailer */}
              {backdropUrl ? (
                <Image src={backdropUrl} alt={title} fill className="object-cover" sizes="400px" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#2a2a2a]">
                  <span className="text-white/40">No preview available</span>
                </div>
              )}
            </>
          )}

          {/* Gradient overlay for better text readability */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#181818] to-transparent pointer-events-none" />
        </div>

        {/* Info section */}
        <div className="p-4 space-y-3">
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handlePlay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 bg-white text-black font-bold text-sm px-4 py-1.5 rounded cursor-pointer hover:bg-white/90 transition-colors"
            >
              <Play className="h-4 w-4 fill-black" />
              Play
            </motion.button>
            <motion.button
              onClick={onWatchlistToggle}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                inList ? "bg-white text-black" : "bg-[#2a2a2a] border border-white/30 text-white hover:bg-[#3a3a3a] hover:border-white/50"
              }`}
              aria-label={inList ? "Remove from My List" : "Add to My List"}
            >
              {inList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </motion.button>
            <motion.button
              onClick={handleMoreInfo}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[#2a2a2a] border border-white/30 text-white hover:bg-[#3a3a3a] hover:border-white/50 transition-all cursor-pointer"
              aria-label="More Info"
            >
              <Info className="h-4 w-4" />
            </motion.button>
          </div>

          {/* Title and metadata */}
          <div className="space-y-1">
            <h3 className="text-white font-bold text-base line-clamp-1">{title}</h3>
            <div className="flex items-center gap-2 text-xs text-white/70">
              {year && <span>{year}</span>}
              {rating && Number(rating) > 0 && (
                <>
                  <span>•</span>
                  <span className="text-green-400 font-semibold">{rating}</span>
                </>
              )}
              {mediaType === "tv" && (
                <>
                  <span>•</span>
                  <span>TV Show</span>
                </>
              )}
            </div>
          </div>

          {/* Overview */}
          {overview && (
            <p className="text-white/80 text-xs leading-relaxed line-clamp-3">
              {overview}
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )

  // Render via portal to ensure proper z-index above everything
  return createPortal(content, document.body)
}
