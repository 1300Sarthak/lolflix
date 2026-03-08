"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Wand2, Play } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { tmdb } from "@/lib/tmdb"
import type { TMDBMedia, TMDBMovie, TMDBShow } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

const MOODS = [
  { label: "Something Dark", genres: [27, 53] },
  { label: "Make Me Laugh", genres: [35] },
  { label: "Action Packed", genres: [28] },
  { label: "Feel-Good", genres: [35, 10749] },
  { label: "Mind-Bending", genres: [878, 9648] },
  { label: "Drama", genres: [18] },
]

const TIMES = [
  { label: "Under 90 min", lte: 90 },
  { label: "90-120 min", gte: 90, lte: 120 },
  { label: "2+ hours", gte: 120 },
]

const TYPES = [
  { label: "Movie", value: "movie" as const },
  { label: "TV Show", value: "tv" as const },
]

export function WatchWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [mood, setMood] = useState<number[] | null>(null)
  const [time, setTime] = useState<{ gte?: number; lte?: number } | null>(null)
  const [type, setType] = useState<"movie" | "tv">("movie")
  const [result, setResult] = useState<TMDBMedia | null>(null)
  const [loading, setLoading] = useState(false)

  const reset = () => { setStep(0); setMood(null); setTime(null); setType("movie"); setResult(null) }

  const findResult = async () => {
    setLoading(true)
    try {
      const data = await tmdb.discoverMovies({
        genres: mood || undefined,
        runtimeGte: time?.gte,
        runtimeLte: time?.lte,
        sortBy: "popularity.desc",
        voteAverageGte: 6,
      })
      const items = data.results.filter((r) => r.poster_path)
      if (items.length > 0) {
        setResult(items[Math.floor(Math.random() * Math.min(items.length, 10))])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleMood = (genres: number[]) => { setMood(genres); setStep(1) }
  const handleTime = (t: { gte?: number; lte?: number }) => { setTime(t); setStep(2) }
  const handleType = async (t: "movie" | "tv") => { setType(t); setStep(3); await findResult() }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#1a1a1a] rounded-xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 className="h-5 w-5 text-[#E50914]" />What Should I Watch?</h2>
            <button onClick={() => { onClose(); reset() }} className="text-white/40 hover:text-white cursor-pointer"><X className="h-5 w-5" /></button>
          </div>

          {step === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-white/60">What mood are you in?</p>
              <div className="grid grid-cols-2 gap-2">
                {MOODS.map((m) => (
                  <button key={m.label} onClick={() => handleMood(m.genres)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium cursor-pointer transition-colors">{m.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-white/60">How much time do you have?</p>
              <div className="grid grid-cols-1 gap-2">
                {TIMES.map((t) => (
                  <button key={t.label} onClick={() => handleTime(t)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium cursor-pointer transition-colors">{t.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-white/60">Movie or TV Show?</p>
              <div className="grid grid-cols-2 gap-2">
                {TYPES.map((t) => (
                  <button key={t.value} onClick={() => handleType(t.value)} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium cursor-pointer transition-colors">{t.label}</button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-4">
              {loading ? (
                <p className="text-white/40 text-sm py-8">Finding your perfect pick...</p>
              ) : result ? (
                <>
                  <div className="relative w-32 aspect-[2/3] rounded-lg overflow-hidden">
                    {result.poster_path && <Image src={tmdb.imageUrl(result.poster_path, "w342")!} alt="" fill className="object-cover" sizes="128px" />}
                  </div>
                  <p className="text-white font-semibold text-center">{isMovie(result) ? result.title : (result as TMDBShow).name}</p>
                  <button
                    onClick={() => { router.push(`/watch/new?tmdb=${result.id}&type=${type}`); onClose(); reset() }}
                    className="flex items-center gap-2 bg-[#E50914] text-white font-bold px-6 py-2.5 rounded cursor-pointer hover:bg-[#E50914]/80 transition-colors"
                  >
                    <Play className="h-5 w-5 fill-white" /> Watch Now
                  </button>
                  <button onClick={() => { setStep(3); findResult() }} className="text-sm text-white/50 hover:text-white cursor-pointer">Try another</button>
                </>
              ) : (
                <p className="text-white/40 text-sm py-8">No results found. Try different options.</p>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
