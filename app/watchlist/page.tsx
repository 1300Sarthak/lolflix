"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { MediaPosterCard } from "@/components/MediaPosterCard"
import { DetailModal } from "@/components/DetailModal"
import { getWatchlist, removeFromWatchlist, clearWatchlist } from "@/lib/watchlist"
import { useToast } from "@/components/Toast"
import type { TMDBMedia } from "@/types"

export default function WatchlistPage() {
  const { toast } = useToast()
  const [items, setItems] = useState<(TMDBMedia & { _mediaType: "movie" | "tv" })[]>([])
  const [detailItem, setDetailItem] = useState<TMDBMedia | null>(null)
  const [detailType, setDetailType] = useState<"movie" | "tv">("movie")

  const loadItems = useCallback(() => {
    const wl = getWatchlist()
    setItems(
      wl.map((w) => ({
        id: w.tmdbId,
        overview: w.overview || "",
        poster_path: w.poster_path || "",
        backdrop_path: w.backdrop_path || "",
        vote_average: w.vote_average || 0,
        genre_ids: w.genreIds,
        _mediaType: w.mediaType,
        ...(w.mediaType === "movie"
          ? { title: w.title, release_date: w.release_date || "", media_type: "movie" as const }
          : { name: w.title, first_air_date: w.first_air_date || "", number_of_seasons: 1, media_type: "tv" as const }),
      } as TMDBMedia & { _mediaType: "movie" | "tv" }))
    )
  }, [])

  useEffect(() => { loadItems() }, [loadItems])

  const openDetail = useCallback((item: TMDBMedia, type: "movie" | "tv") => {
    setDetailItem(item)
    setDetailType(type)
  }, [])

  const handleRemove = (tmdbId: number, mediaType: "movie" | "tv") => {
    removeFromWatchlist(tmdbId, mediaType)
    loadItems()
    toast("Removed from My List")
  }

  const handleClearAll = () => {
    clearWatchlist()
    loadItems()
    toast("Watchlist cleared")
  }

  return (
    <div className="min-h-screen bg-[var(--lolflix-bg,#141414)] text-white">
      <Navbar />

      {detailItem && (
        <DetailModal item={detailItem} mediaType={detailType} onClose={() => { setDetailItem(null); loadItems() }} />
      )}

      <div className="pt-24 px-4 md:px-12 pb-16">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">My List</h1>
          {items.length > 0 && (
            <button onClick={handleClearAll} className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors cursor-pointer">
              <Trash2 className="h-4 w-4" /> Clear All
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg mb-2">Your list is empty</p>
            <p className="text-white/30 text-sm">Add movies and TV shows to keep track of what you want to watch.</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-2 md:gap-3"
          >
            {items.map((item) => (
              <div key={`${item._mediaType}-${item.id}`} className="relative group/card">
                <MediaPosterCard item={item} mediaType={item._mediaType} size="md" onDetailOpen={openDetail} />
                <button
                  onClick={() => handleRemove(item.id, item._mediaType)}
                  className="absolute top-1 left-1 z-10 p-1.5 rounded-full bg-black/60 text-white/60 hover:text-red-400 hover:bg-black/80 opacity-0 group-hover/card:opacity-100 transition-all cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}
