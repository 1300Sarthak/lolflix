const SESSIONS_KEY = "lolflix_watch_sessions_v1"

export interface WatchSession {
  tmdbId: number
  mediaType: "movie" | "tv"
  title: string
  duration: number
  date: string
  genreIds?: number[]
}

export interface MilestoneBadge {
  id: string
  label: string
  description: string
  earned: boolean
  progress: number
  target: number
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  return window.localStorage
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try { return JSON.parse(raw) as T } catch { return null }
}

function saveAll(sessions: WatchSession[]) {
  const s = getStorage()
  if (!s) return
  s.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

export function getAllSessions(): WatchSession[] {
  const s = getStorage()
  if (!s) return []
  return safeParse<WatchSession[]>(s.getItem(SESSIONS_KEY)) || []
}

export function logWatchSession(session: WatchSession): void {
  const all = getAllSessions()
  all.push(session)
  saveAll(all)
}

export function getTotalHoursWatched(): number {
  return getAllSessions().reduce((sum, s) => sum + (s.duration || 0), 0) / 3600
}

export function getTopGenres(limit = 5): { genreId: number; count: number }[] {
  const counts: Record<number, number> = {}
  for (const s of getAllSessions()) {
    s.genreIds?.forEach((g) => { counts[g] = (counts[g] || 0) + 1 })
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ genreId: Number(id), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export function getStreakDays(): { current: number; longest: number } {
  const sessions = getAllSessions()
  const dates = Array.from(new Set(sessions.map((s) => s.date))).sort()
  if (dates.length === 0) return { current: 0, longest: 0 }

  let longest = 1
  let current = 1
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1])
    const curr = new Date(dates[i])
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    if (diff === 1) { current++; longest = Math.max(longest, current) }
    else if (diff > 1) { current = 1 }
  }

  const today = new Date().toISOString().split("T")[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const lastDate = dates[dates.length - 1]
  if (lastDate !== today && lastDate !== yesterday) current = 0

  return { current, longest: Math.max(longest, current) }
}

export function getMostRewatched(limit = 5): { tmdbId: number; title: string; count: number; mediaType: "movie" | "tv" }[] {
  const counts: Record<string, { tmdbId: number; title: string; count: number; mediaType: "movie" | "tv" }> = {}
  for (const s of getAllSessions()) {
    const key = `${s.mediaType}-${s.tmdbId}`
    if (!counts[key]) counts[key] = { tmdbId: s.tmdbId, title: s.title, count: 0, mediaType: s.mediaType }
    counts[key].count++
  }
  return Object.values(counts).filter((c) => c.count > 1).sort((a, b) => b.count - a.count).slice(0, limit)
}

export function getGenreBreakdown(): { genreId: number; count: number; percentage: number }[] {
  const counts: Record<number, number> = {}
  let total = 0
  for (const s of getAllSessions()) {
    s.genreIds?.forEach((g) => { counts[g] = (counts[g] || 0) + 1; total++ })
  }
  return Object.entries(counts)
    .map(([id, count]) => ({ genreId: Number(id), count, percentage: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
}

export function getMilestoneBadges(): MilestoneBadge[] {
  const sessions = getAllSessions()
  const totalFilms = new Set(sessions.filter((s) => s.mediaType === "movie").map((s) => s.tmdbId)).size
  const totalHours = getTotalHoursWatched()

  return [
    { id: "films-10", label: "Film Buff", description: "Watched 10 films", earned: totalFilms >= 10, progress: Math.min(totalFilms, 10), target: 10 },
    { id: "films-50", label: "Cinephile", description: "Watched 50 films", earned: totalFilms >= 50, progress: Math.min(totalFilms, 50), target: 50 },
    { id: "films-100", label: "Movie Master", description: "Watched 100 films", earned: totalFilms >= 100, progress: Math.min(totalFilms, 100), target: 100 },
    { id: "hours-10", label: "Binge Starter", description: "10 hours watched", earned: totalHours >= 10, progress: Math.min(Math.floor(totalHours), 10), target: 10 },
    { id: "hours-50", label: "Marathon Runner", description: "50 hours watched", earned: totalHours >= 50, progress: Math.min(Math.floor(totalHours), 50), target: 50 },
    { id: "hours-100", label: "Screen Legend", description: "100 hours watched", earned: totalHours >= 100, progress: Math.min(Math.floor(totalHours), 100), target: 100 },
    { id: "streak-7", label: "Week Warrior", description: "7-day streak", earned: getStreakDays().longest >= 7, progress: Math.min(getStreakDays().longest, 7), target: 7 },
    { id: "streak-30", label: "Monthly Devotee", description: "30-day streak", earned: getStreakDays().longest >= 30, progress: Math.min(getStreakDays().longest, 30), target: 30 },
  ]
}

export function getYearInReviewData(year: number) {
  const sessions = getAllSessions().filter((s) => s.date.startsWith(String(year)))
  const monthlyHours = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, "0")
    const monthSessions = sessions.filter((s) => s.date.startsWith(`${year}-${month}`))
    return monthSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600
  })
  return {
    totalFilms: new Set(sessions.filter((s) => s.mediaType === "movie").map((s) => s.tmdbId)).size,
    totalShows: new Set(sessions.filter((s) => s.mediaType === "tv").map((s) => s.tmdbId)).size,
    totalHours: sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 3600,
    monthlyHours,
    topGenres: getTopGenres(5),
  }
}
