const PINNED_KEY = "lolflix_pinned_genres_v1"

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

export function getPinnedGenres(): number[] {
  const s = getStorage()
  if (!s) return []
  return safeParse<number[]>(s.getItem(PINNED_KEY)) || []
}

export function pinGenre(genreId: number): void {
  const s = getStorage()
  if (!s) return
  const pinned = getPinnedGenres()
  if (pinned.includes(genreId)) return
  pinned.push(genreId)
  s.setItem(PINNED_KEY, JSON.stringify(pinned))
}

export function unpinGenre(genreId: number): void {
  const s = getStorage()
  if (!s) return
  s.setItem(PINNED_KEY, JSON.stringify(getPinnedGenres().filter((id) => id !== genreId)))
}

export function isPinned(genreId: number): boolean {
  return getPinnedGenres().includes(genreId)
}
