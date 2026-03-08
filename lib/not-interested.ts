const HIDDEN_KEY = "lolflix_not_interested_v1"

export interface NotInterestedItem {
  tmdbId: number
  mediaType: "movie" | "tv"
  hiddenAt: number
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

export function getHiddenList(): NotInterestedItem[] {
  const s = getStorage()
  if (!s) return []
  return safeParse<NotInterestedItem[]>(s.getItem(HIDDEN_KEY)) || []
}

function saveAll(items: NotInterestedItem[]) {
  const s = getStorage()
  if (!s) return
  s.setItem(HIDDEN_KEY, JSON.stringify(items))
}

export function isHidden(tmdbId: number, mediaType: "movie" | "tv"): boolean {
  return getHiddenList().some((x) => x.tmdbId === tmdbId && x.mediaType === mediaType)
}

export function hideTitle(tmdbId: number, mediaType: "movie" | "tv"): void {
  if (isHidden(tmdbId, mediaType)) return
  const all = getHiddenList()
  all.push({ tmdbId, mediaType, hiddenAt: Date.now() })
  saveAll(all)
}

export function unhideTitle(tmdbId: number, mediaType: "movie" | "tv"): void {
  saveAll(getHiddenList().filter((x) => !(x.tmdbId === tmdbId && x.mediaType === mediaType)))
}

export function clearHidden(): void {
  const s = getStorage()
  if (!s) return
  s.removeItem(HIDDEN_KEY)
}

export function filterHidden<T extends { id: number }>(items: T[], mediaType: "movie" | "tv"): T[] {
  const hidden = getHiddenList()
  return items.filter((item) => !hidden.some((h) => h.tmdbId === item.id && h.mediaType === mediaType))
}
