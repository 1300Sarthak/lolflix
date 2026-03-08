const SHELVES_KEY = "lolflix_shelves_v1"

export interface ShelfItem {
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  poster_path: string | null
  addedAt: number
}

export interface CustomShelf {
  id: string
  name: string
  items: ShelfItem[]
  createdAt: number
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

function saveAll(shelves: CustomShelf[]) {
  const s = getStorage()
  if (!s) return
  s.setItem(SHELVES_KEY, JSON.stringify(shelves))
}

export function getShelves(): CustomShelf[] {
  const s = getStorage()
  if (!s) return []
  return safeParse<CustomShelf[]>(s.getItem(SHELVES_KEY)) || []
}

export function createShelf(name: string): CustomShelf {
  const shelf: CustomShelf = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    name,
    items: [],
    createdAt: Date.now(),
  }
  const all = getShelves()
  all.push(shelf)
  saveAll(all)
  return shelf
}

export function deleteShelf(id: string): void {
  saveAll(getShelves().filter((s) => s.id !== id))
}

export function renameShelf(id: string, name: string): void {
  const all = getShelves()
  const shelf = all.find((s) => s.id === id)
  if (shelf) { shelf.name = name; saveAll(all) }
}

export function addToShelf(shelfId: string, item: ShelfItem): void {
  const all = getShelves()
  const shelf = all.find((s) => s.id === shelfId)
  if (!shelf) return
  if (shelf.items.some((i) => i.tmdbId === item.tmdbId && i.mediaType === item.mediaType)) return
  shelf.items.push(item)
  saveAll(all)
}

export function removeFromShelf(shelfId: string, tmdbId: number, mediaType: "movie" | "tv"): void {
  const all = getShelves()
  const shelf = all.find((s) => s.id === shelfId)
  if (!shelf) return
  shelf.items = shelf.items.filter((i) => !(i.tmdbId === tmdbId && i.mediaType === mediaType))
  saveAll(all)
}

export function isInShelf(shelfId: string, tmdbId: number, mediaType: "movie" | "tv"): boolean {
  const shelf = getShelves().find((s) => s.id === shelfId)
  return shelf?.items.some((i) => i.tmdbId === tmdbId && i.mediaType === mediaType) || false
}
