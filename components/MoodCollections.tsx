"use client"

export const MOODS = [
  { id: "dark", label: "Dark Picks", genres: [27, 53], emoji: "🌑" },
  { id: "funny", label: "Funny Picks", genres: [35], emoji: "😂" },
  { id: "intense", label: "Intense Picks", genres: [28, 53], emoji: "🔥" },
  { id: "easy", label: "Easy Watch", genres: [35, 10749], emoji: "☀️" },
  { id: "mindbender", label: "Mind-Bender Picks", genres: [878, 9648], emoji: "🧠" },
  { id: "comfort", label: "Comfort Rewatch", genres: [], emoji: "🛋️" },
] as const

export type MoodId = typeof MOODS[number]["id"]

export function getMoodGenres(moodId: MoodId): number[] {
  const mood = MOODS.find((m) => m.id === moodId)
  return mood ? [...mood.genres] : []
}
