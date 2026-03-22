import type { TMDBMedia } from "@/types"

const RECENT_KEY = "streamparty_recently_played_v1"
const PROGRESS_KEY = "streamparty_progress_v1"

export type HistoryMediaType = "movie" | "tv"

export interface RecentlyPlayedItem {
  tmdbId: number
  mediaType: HistoryMediaType
  title: string
  poster_path: string | null
  backdrop_path: string | null
  genreIds?: number[]
  lastWatchedAt: number
}

export interface ProgressItem {
  tmdbId: number
  mediaType: HistoryMediaType
  season?: number
  episode?: number
  currentTime: number
  progress?: number
  updatedAt: number
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

export function getRecentlyPlayed(limit = 20): RecentlyPlayedItem[] {
  const storage = getStorage()
  if (!storage) return []
  const parsed = safeParse<RecentlyPlayedItem[]>(storage.getItem(RECENT_KEY))
  if (!parsed) return []
  return parsed
    .filter((x) => typeof x?.tmdbId === "number" && (x.mediaType === "movie" || x.mediaType === "tv"))
    .sort((a, b) => (b.lastWatchedAt || 0) - (a.lastWatchedAt || 0))
    .slice(0, limit)
}

export function addRecentlyPlayed(item: RecentlyPlayedItem, limit = 20) {
  const storage = getStorage()
  if (!storage) return
  const current = getRecentlyPlayed(limit)
  const next = [
    item,
    ...current.filter((x) => !(x.tmdbId === item.tmdbId && x.mediaType === item.mediaType)),
  ].slice(0, limit)
  storage.setItem(RECENT_KEY, JSON.stringify(next))
}

export function getProgress(): ProgressItem[] {
  const storage = getStorage()
  if (!storage) return []
  const parsed = safeParse<ProgressItem[]>(storage.getItem(PROGRESS_KEY))
  if (!parsed) return []
  return parsed
    .filter((x) => typeof x?.tmdbId === "number" && (x.mediaType === "movie" || x.mediaType === "tv"))
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

export function upsertProgress(nextItem: ProgressItem, limit = 50) {
  const storage = getStorage()
  if (!storage) return

  const current = getProgress()
  const next = [
    nextItem,
    ...current.filter((x) => {
      if (x.tmdbId !== nextItem.tmdbId) return true
      if (x.mediaType !== nextItem.mediaType) return true
      if ((x.season || 1) !== (nextItem.season || 1)) return true
      if ((x.episode || 1) !== (nextItem.episode || 1)) return true
      return false
    }),
  ].slice(0, limit)

  storage.setItem(PROGRESS_KEY, JSON.stringify(next))
}

export function clearRecentlyPlayed(): void {
  const storage = getStorage()
  if (!storage) return
  storage.removeItem(RECENT_KEY)
}

export function removeRecentlyPlayedItem(tmdbId: number, mediaType: HistoryMediaType): void {
  const storage = getStorage()
  if (!storage) return
  const current = getRecentlyPlayed(100)
  storage.setItem(RECENT_KEY, JSON.stringify(current.filter((x) => !(x.tmdbId === tmdbId && x.mediaType === mediaType))))
}

export function removeProgressItem(tmdbId: number, mediaType: HistoryMediaType): void {
  const storage = getStorage()
  if (!storage) return
  const current = getProgress()
  storage.setItem(PROGRESS_KEY, JSON.stringify(current.filter((x) => !(x.tmdbId === tmdbId && x.mediaType === mediaType))))
}

export function toRecentlyPlayedFromTMDBMedia(args: {
  item: TMDBMedia
  mediaType: HistoryMediaType
  title: string
  genreIds?: number[]
}): RecentlyPlayedItem {
  return {
    tmdbId: args.item.id,
    mediaType: args.mediaType,
    title: args.title,
    poster_path: args.item.poster_path || null,
    backdrop_path: args.item.backdrop_path || null,
    genreIds: args.genreIds,
    lastWatchedAt: Date.now(),
  }
}

