"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import YouTube from "react-youtube"
import { Play, Info, Volume2, VolumeX } from "lucide-react"
import { tmdb } from "@/lib/tmdb"
import type { TMDBMedia, TMDBMovie } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

interface HeroBannerProps {
  items: TMDBMedia[]
  mediaType: "movie" | "tv"
  onInfoClick?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
}

const ROTATE_INTERVAL = 15000 // Increased for video playback

export function HeroBanner({ items, mediaType, onInfoClick }: HeroBannerProps) {
  const router = useRouter()
  const [activeIndex, setActiveIndex] = useState(0)
  const [trailerKey, setTrailerKey] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const playerRef = useRef<any>(null)

  const heroItems = items.slice(0, 6).filter((i) => i.backdrop_path)

  const advance = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % heroItems.length)
  }, [heroItems.length])

  const current = heroItems[activeIndex] || heroItems[0]

  useEffect(() => {
    if (heroItems.length <= 1) return
    const timer = setInterval(advance, ROTATE_INTERVAL)
    return () => clearInterval(timer)
  }, [advance, heroItems.length])

  useEffect(() => {
    if (!current) return
    let isCancelled = false

    const fetchTrailer = async () => {
      setTrailerKey(null)
      try {
        const data =
          mediaType === "movie"
            ? await tmdb.movieVideos(current.id)
            : await tmdb.tvVideos(current.id)

        if (isCancelled) return

        const officialTrailer =
          data.results.find((v) => v.type === "Trailer" && v.official) ||
          data.results.find((v) => v.type === "Trailer") ||
          data.results[0]

        if (officialTrailer) {
          setTrailerKey(officialTrailer.key)
        }
      } catch (error) {
        console.error("Failed to fetch trailer:", error)
        setTrailerKey(null)
      }
    }

    fetchTrailer()

    return () => {
      isCancelled = true
    }
  }, [current, mediaType])

  if (heroItems.length === 0) return null

  const title = isMovie(current) ? current.title : current.name
  const backdropUrl = tmdb.backdropUrl(current.backdrop_path)
  const overview =
    current.overview?.slice(0, 220) +
    (current.overview && current.overview.length > 220 ? "…" : "")

  const handlePlay = () => {
    router.push(`/watch/new?tmdb=${current.id}&type=${mediaType}`)
  }

  const handleInfo = () => {
    onInfoClick?.(current, mediaType)
  }

  const onPlayerReady = (event: any) => {
    playerRef.current = event.target
    if (isMuted) {
      event.target.mute()
    } else {
      event.target.unMute()
    }
    event.target.playVideo()
  }

  const onPlayerStateChange = (event: any) => {
    if (event.data === 0) { // Video ended
      advance()
    }
  }

  const toggleMute = () => {
    if (playerRef.current) {
      if (isMuted) {
        playerRef.current.unMute()
      } else {
        playerRef.current.mute()
      }
      setIsMuted(!isMuted)
    }
  }

  const hasTrailer = trailerKey !== null

  return (
    <div className="relative w-full h-[56vw] min-h-[400px] max-h-[80vh] overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {hasTrailer ? (
            <div className="absolute inset-0 w-full h-full">
               <YouTube
                videoId={trailerKey}
                opts={{
                  height: '100%',
                  width: '100%',
                  playerVars: {
                    autoplay: 1,
                    controls: 0,
                    rel: 0,
                    showinfo: 0,
                    mute: isMuted ? 1 : 0,
                    loop: 0,
                    fs: 0,
                    playsinline: 1,
                    modestbranding: 1,
                  },
                }}
                onReady={onPlayerReady}
                onStateChange={onPlayerStateChange}
                className="youtube-container"
              />
              <style jsx global>{`
                .youtube-container {
                  position: absolute;
                  top: 50%;
                  left: 50%;
                  width: 150%;
                  height: 150%;
                  transform: translate(-50%, -50%);
                  pointer-events: none;
                }
                .youtube-container iframe {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                }
              `}</style>
            </div>
          ) : (
            backdropUrl && (
              <Image
                src={backdropUrl}
                alt={title}
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            )
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

      <AnimatePresence mode="wait">
        <motion.div
          key={`text-${current.id}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute bottom-[15%] left-0 px-4 md:px-12"
        >
          <div className="max-w-xl space-y-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight drop-shadow-2xl">
              {title}
            </h1>

            {overview && (
              <p className="hidden sm:block text-sm md:text-base text-white/80 leading-relaxed line-clamp-3 drop-shadow-lg">
                {overview}
              </p>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 bg-white text-black font-bold text-base px-6 py-2.5 md:px-8 md:py-3 rounded cursor-pointer hover:bg-white/80 active:scale-[0.97] transition-all"
              >
                <Play className="h-5 w-5 md:h-6 md:w-6 fill-black" />
                Play
              </button>
              <button
                onClick={handleInfo}
                className="flex items-center gap-2 bg-[#6d6d6e]/70 text-white font-bold text-base px-6 py-2.5 md:px-8 md:py-3 rounded cursor-pointer hover:bg-[#6d6d6e]/50 active:scale-[0.97] transition-all"
              >
                <Info className="h-5 w-5 md:h-6 md:w-6" />
                More Info
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-[15%] right-4 md:right-12 flex items-center gap-3">
        {hasTrailer && (
          <button
            onClick={toggleMute}
            className="p-2 border-2 border-white/40 rounded-full text-white/60 hover:text-white hover:border-white transition-all cursor-pointer"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        )}
        {heroItems.length > 1 && (
          <div className="flex items-center gap-1.5 bg-black/20 backdrop-blur-sm p-1 rounded-full">
            {heroItems.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-3 h-0.5 rounded-full cursor-pointer transition-all duration-300 ${
                  idx === activeIndex ? "bg-white w-6" : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
