import type { TMDBMedia } from "@/types"

const WATCHLIST_KEY = "lolflix_watchlist_v1"

export type WatchlistMediaType = "movie" | "tv"

export interface WatchlistItem {
  tmdbId: number
  mediaType: WatchlistMediaType
  title: string
  poster_path: string | null
  backdrop_path: string | null
  overview?: string
  vote_average?: number
  release_date?: string
  first_air_date?: string
  genreIds?: number[]
  addedAt: number
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

export function getWatchlist(): WatchlistItem[] {
  const storage = getStorage()
  if (!storage) return []
  const parsed = safeParse<WatchlistItem[]>(storage.getItem(WATCHLIST_KEY))
  if (!parsed) return []
  return parsed
    .filter((x) => typeof x?.tmdbId === "number" && (x.mediaType === "movie" || x.mediaType === "tv"))
    .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
}

export function isInWatchlist(tmdbId: number, mediaType: WatchlistMediaType): boolean {
  const list = getWatchlist()
  return list.some((x) => x.tmdbId === tmdbId && x.mediaType === mediaType)
}

export function addToWatchlist(item: WatchlistItem): void {
  const storage = getStorage()
  if (!storage) return
  
  if (isInWatchlist(item.tmdbId, item.mediaType)) return
  
  const current = getWatchlist()
  const next = [{ ...item, addedAt: item.addedAt || Date.now() }, ...current]
  storage.setItem(WATCHLIST_KEY, JSON.stringify(next))
}

export function removeFromWatchlist(tmdbId: number, mediaType: WatchlistMediaType): void {
  const storage = getStorage()
  if (!storage) return
  
  const current = getWatchlist()
  const next = current.filter((x) => !(x.tmdbId === tmdbId && x.mediaType === mediaType))
  storage.setItem(WATCHLIST_KEY, JSON.stringify(next))
}

export function toggleWatchlist(item: WatchlistItem): boolean {
  if (isInWatchlist(item.tmdbId, item.mediaType)) {
    removeFromWatchlist(item.tmdbId, item.mediaType)
    return false
  } else {
    addToWatchlist(item)
    return true
  }
}

export function clearWatchlist(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(WATCHLIST_KEY)
}

export function getWatchlistCount(): number {
  return getWatchlist().length
}

export function toWatchlistItemFromTMDB(
  item: TMDBMedia,
  mediaType: WatchlistMediaType
): WatchlistItem {
  const title = "title" in item ? item.title : item.name
  const releaseDate = "title" in item ? item.release_date : item.first_air_date
  
  return {
    tmdbId: item.id,
    mediaType,
    title: title || "",
    poster_path: item.poster_path || null,
    backdrop_path: item.backdrop_path || null,
    overview: item.overview,
    vote_average: item.vote_average,
    release_date: releaseDate,
    genreIds: item.genre_ids,
    addedAt: Date.now(),
  }
}
