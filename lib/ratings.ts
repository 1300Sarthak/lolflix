const RATINGS_KEY = "lolflix_ratings_v1"

export type RewatchTag = "rewatch" | "one-and-done"
export type WatchedStatus = "watched" | "unwatched"

export interface UserRating {
  tmdbId: number
  mediaType: "movie" | "tv"
  stars?: 1 | 2 | 3 | 4 | 5
  note?: string
  rewatchTag?: RewatchTag
  watchedStatus: WatchedStatus
  ratedAt: number
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

export function getAllRatings(): UserRating[] {
  const s = getStorage()
  if (!s) return []
  return safeParse<UserRating[]>(s.getItem(RATINGS_KEY)) || []
}

function saveAll(items: UserRating[]) {
  const s = getStorage()
  if (!s) return
  s.setItem(RATINGS_KEY, JSON.stringify(items))
}

export function getRating(tmdbId: number, mediaType: "movie" | "tv"): UserRating | null {
  return getAllRatings().find((r) => r.tmdbId === tmdbId && r.mediaType === mediaType) || null
}

export function setRating(data: Partial<UserRating> & { tmdbId: number; mediaType: "movie" | "tv" }): void {
  const all = getAllRatings()
  const idx = all.findIndex((r) => r.tmdbId === data.tmdbId && r.mediaType === data.mediaType)
  const existing = idx >= 0 ? all[idx] : { tmdbId: data.tmdbId, mediaType: data.mediaType, watchedStatus: "unwatched" as WatchedStatus, ratedAt: Date.now() }
  const updated = { ...existing, ...data, ratedAt: Date.now() }
  if (idx >= 0) { all[idx] = updated } else { all.push(updated) }
  saveAll(all)
}

export function deleteRating(tmdbId: number, mediaType: "movie" | "tv"): void {
  saveAll(getAllRatings().filter((r) => !(r.tmdbId === tmdbId && r.mediaType === mediaType)))
}

export function setNote(tmdbId: number, mediaType: "movie" | "tv", note: string): void {
  setRating({ tmdbId, mediaType, note })
}

export function getNote(tmdbId: number, mediaType: "movie" | "tv"): string {
  return getRating(tmdbId, mediaType)?.note || ""
}

export function setWatchedStatus(tmdbId: number, mediaType: "movie" | "tv", status: WatchedStatus): void {
  setRating({ tmdbId, mediaType, watchedStatus: status })
}

export function isWatched(tmdbId: number, mediaType: "movie" | "tv"): boolean {
  return getRating(tmdbId, mediaType)?.watchedStatus === "watched"
}

export function setRewatchTag(tmdbId: number, mediaType: "movie" | "tv", tag: RewatchTag): void {
  setRating({ tmdbId, mediaType, rewatchTag: tag })
}
