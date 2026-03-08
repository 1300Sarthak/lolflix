"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { tmdb } from "@/lib/tmdb"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { TMDBEpisode, TMDBSeason } from "@/types"

interface EpisodeSelectorProps {
  tmdbId: number
  currentSeason: number
  currentEpisode: number
  isHost: boolean
  onEpisodeChange: (season: number, episode: number) => void
}

export function EpisodeSelector({
  tmdbId,
  currentSeason,
  currentEpisode,
  isHost,
  onEpisodeChange,
}: EpisodeSelectorProps) {
  const [seasons, setSeasons] = useState<TMDBSeason[]>([])
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([])
  const [selectedSeason, setSelectedSeason] = useState(currentSeason)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    tmdb.getShow(tmdbId).then((show) => {
      const validSeasons = (show.seasons || []).filter(
        (s: TMDBSeason) => s.season_number > 0
      )
      setSeasons(validSeasons)
    })
  }, [tmdbId])

  useEffect(() => {
    setLoading(true)
    tmdb
      .getSeason(tmdbId, selectedSeason)
      .then((data) => {
        setEpisodes(data.episodes || [])
      })
      .finally(() => setLoading(false))
  }, [tmdbId, selectedSeason])

  useEffect(() => {
    setSelectedSeason(currentSeason)
  }, [currentSeason])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label htmlFor="season-select" className="text-sm font-medium text-foreground">
          Season
        </label>
        <select
          id="season-select"
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
        >
          {seasons.map((s) => (
            <option key={s.season_number} value={s.season_number}>
              Season {s.season_number}
            </option>
          ))}
        </select>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="shrink-0 w-48">
                  <Skeleton className="w-48 h-27 rounded-lg" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </div>
              ))
            : episodes.map((ep) => {
                const isActive =
                  selectedSeason === currentSeason &&
                  ep.episode_number === currentEpisode
                return (
                  <button
                    key={ep.id}
                    onClick={() => {
                      if (isHost) {
                        onEpisodeChange(selectedSeason, ep.episode_number)
                      }
                    }}
                    disabled={!isHost}
                    className={`shrink-0 w-48 rounded-lg overflow-hidden border text-left transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 disabled:cursor-not-allowed ${
                      isActive
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="relative aspect-video bg-muted">
                      {ep.still_path ? (
                        <Image
                          src={tmdb.imageUrl(ep.still_path)!}
                          alt={ep.name}
                          fill
                          sizes="192px"
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                          No preview
                        </div>
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        E{ep.episode_number}
                      </span>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium line-clamp-1 text-foreground">
                        {ep.name}
                      </p>
                    </div>
                  </button>
                )
              })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
