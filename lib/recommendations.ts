// Simple ML-based recommendation engine
// Uses weighted genre preferences from watch history and watchlist

import type { TMDBMedia } from "@/types"
import { getRecentlyPlayed } from "./history"
import { getWatchlist } from "./watchlist"

export interface GenreScore {
  genreId: number
  score: number
  weight: number
}

export interface UserPreferenceProfile {
  genreScores: Map<number, number>
  avgRating: number
  recentTitles: Set<number>
  watchlistTitles: Set<number>
}

const GENRE_WEIGHTS = {
  WATCHED: 1.0,
  WATCHLIST: 1.5, // Watchlist means strong intent
  RATING_BONUS: 0.2, // Bonus for high-rated content
  RECENCY_BONUS: 0.1, // Recent content weighted more
}

// TMDB genre IDs for reference (common ones)
export const TMDB_GENRES: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
  // TV-specific
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
}

function computeGenreScores(): Map<number, number> {
  const genreScores = new Map<number, number>()
  
  // Weight from recently watched
  const recentlyPlayed = getRecentlyPlayed(50)
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  
  for (const item of recentlyPlayed) {
    const recencyDays = (now - item.lastWatchedAt) / dayMs
    const recencyWeight = Math.max(0.5, 1 - recencyDays / 30) // Decay over 30 days
    
    if (item.genreIds) {
      for (const genreId of item.genreIds) {
        const current = genreScores.get(genreId) || 0
        genreScores.set(genreId, current + GENRE_WEIGHTS.WATCHED * recencyWeight)
      }
    }
  }
  
  // Weight from watchlist (higher weight - strong intent)
  const watchlist = getWatchlist()
  for (const item of watchlist) {
    if (item.genreIds) {
      for (const genreId of item.genreIds) {
        const current = genreScores.get(genreId) || 0
        genreScores.set(genreId, current + GENRE_WEIGHTS.WATCHLIST)
      }
    }
  }
  
  return genreScores
}

export function getUserPreferenceProfile(): UserPreferenceProfile {
  const recentlyPlayed = getRecentlyPlayed(50)
  const watchlist = getWatchlist()
  
  return {
    genreScores: computeGenreScores(),
    avgRating: 0,
    recentTitles: new Set(recentlyPlayed.map((x) => x.tmdbId)),
    watchlistTitles: new Set(watchlist.map((x) => x.tmdbId)),
  }
}

export function getTopGenres(limit = 5): number[] {
  const scores = computeGenreScores()
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([genreId]) => genreId)
}

export function scoreContent(
  item: TMDBMedia,
  profile: UserPreferenceProfile
): number {
  let score = 0
  
  const genreIds = item.genre_ids || []
  for (const genreId of genreIds) {
    const genreScore = profile.genreScores.get(genreId) || 0
    score += genreScore
  }
  
  // Normalize by number of genres
  if (genreIds.length > 0) {
    score = score / genreIds.length
  }
  
  // Bonus for high rating
  if (item.vote_average && item.vote_average > 7) {
    score += GENRE_WEIGHTS.RATING_BONUS
  }
  
  return score
}

export function rankByPreference(
  items: TMDBMedia[],
  profile: UserPreferenceProfile,
  excludeWatched: boolean = true
): TMDBMedia[] {
  const scored = items
    .filter((item) => {
      if (!excludeWatched) return true
      // Exclude items already in watchlist or recently watched
      return !profile.watchlistTitles.has(item.id) && !profile.recentTitles.has(item.id)
    })
    .map((item) => ({
      item,
      score: scoreContent(item, profile),
    }))
    .sort((a, b) => b.score - a.score)
  
  return scored.map((x) => x.item)
}

export function getRecommendedGenres(): string[] {
  const topGenreIds = getTopGenres(3)
  return topGenreIds.map((id) => TMDB_GENRES[id] || `Genre ${id}`)
}

export function hasEnoughData(): boolean {
  const recentlyPlayed = getRecentlyPlayed(5)
  const watchlist = getWatchlist()
  return recentlyPlayed.length >= 3 || watchlist.length >= 3
}
