"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, Trophy, Flame, Film, Tv, Clock, BarChart3 } from "lucide-react"
import { Logo } from "@/components/Logo"
import {
  getTotalHoursWatched,
  getStreakDays,
  getGenreBreakdown,
  getMostRewatched,
  getMilestoneBadges,
  getYearInReviewData,
  getAllSessions,
} from "@/lib/stats"
// tmdb import available for future director/actor stats features

const GENRE_NAMES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime",
  99: "Documentary", 18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History",
  27: "Horror", 10402: "Music", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi",
  10770: "TV Movie", 53: "Thriller", 10752: "War", 37: "Western",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics",
}

function PieChart({ data }: { data: { genreId: number; percentage: number }[] }) {
  const colors = ["#E50914", "#4CC9F0", "#F72585", "#7209B7", "#3A0CA3", "#4361EE", "#4895EF", "#560BAD"]
  let cumulative = 0
  const slices = data.slice(0, 8).map((d, i) => {
    const start = cumulative
    cumulative += d.percentage
    const startAngle = (start / 100) * 360
    const endAngle = (cumulative / 100) * 360
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    const sr = (startAngle * Math.PI) / 180
    const er = (endAngle * Math.PI) / 180
    const x1 = 50 + 40 * Math.cos(sr - Math.PI / 2)
    const y1 = 50 + 40 * Math.sin(sr - Math.PI / 2)
    const x2 = 50 + 40 * Math.cos(er - Math.PI / 2)
    const y2 = 50 + 40 * Math.sin(er - Math.PI / 2)
    return (
      <path
        key={i}
        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={colors[i % colors.length]}
        opacity={0.9}
      />
    )
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-32 h-32 shrink-0">
        {data.length === 0 ? <circle cx="50" cy="50" r="40" fill="#333" /> : slices}
      </svg>
      <div className="space-y-1">
        {data.slice(0, 8).map((d, i) => (
          <div key={d.genreId} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-white/70">{GENRE_NAMES[d.genreId] || `Genre ${d.genreId}`}</span>
            <span className="text-white/40 ml-auto">{d.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function StatsPage() {
  const [totalHours, setTotalHours] = useState(0)
  const [streak, setStreak] = useState({ current: 0, longest: 0 })
  const [genreBreakdown, setGenreBreakdown] = useState<{ genreId: number; count: number; percentage: number }[]>([])
  const [mostRewatched, setMostRewatched] = useState<{ tmdbId: number; title: string; count: number; mediaType: "movie" | "tv" }[]>([])
  const [badges, setBadges] = useState<{ id: string; label: string; description: string; earned: boolean; progress: number; target: number }[]>([])
  const [yearData, setYearData] = useState<{ totalFilms: number; totalShows: number; totalHours: number; monthlyHours: number[] } | null>(null)
  const [totalSessions, setTotalSessions] = useState(0)

  useEffect(() => {
    setTotalHours(getTotalHoursWatched())
    setStreak(getStreakDays())
    setGenreBreakdown(getGenreBreakdown())
    setMostRewatched(getMostRewatched(5))
    setBadges(getMilestoneBadges())
    setYearData(getYearInReviewData(new Date().getFullYear()))
    setTotalSessions(getAllSessions().length)
  }, [])

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  return (
    <div className="min-h-screen bg-[var(--lolflix-bg,#141414)] text-white">
      <header className="sticky top-0 z-50 bg-[#141414]/95 backdrop-blur border-b border-white/5">
        <div className="flex h-12 items-center px-4 gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <Logo size="sm" />
          </Link>
          <h1 className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#E50914]" /> Your Stats
          </h1>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-4xl mx-auto p-4 md:p-8 space-y-8"
      >
        {totalSessions === 0 ? (
          <div className="text-center py-20">
            <Film className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white/60">No watch data yet</h2>
            <p className="text-sm text-white/40 mt-2">Start watching to build your stats!</p>
          </div>
        ) : (
          <>
            {/* Overview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white/5 rounded-xl p-4 space-y-1">
                <Clock className="h-5 w-5 text-[#E50914]" />
                <p className="text-2xl font-bold">{totalHours.toFixed(1)}</p>
                <p className="text-xs text-white/40">Hours Watched</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-1">
                <Film className="h-5 w-5 text-blue-400" />
                <p className="text-2xl font-bold">{yearData?.totalFilms || 0}</p>
                <p className="text-xs text-white/40">Films This Year</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-1">
                <Tv className="h-5 w-5 text-purple-400" />
                <p className="text-2xl font-bold">{yearData?.totalShows || 0}</p>
                <p className="text-xs text-white/40">Shows This Year</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 space-y-1">
                <Flame className="h-5 w-5 text-orange-400" />
                <p className="text-2xl font-bold">{streak.current}</p>
                <p className="text-xs text-white/40">Day Streak (best: {streak.longest})</p>
              </div>
            </div>

            {/* Genre pie */}
            {genreBreakdown.length > 0 && (
              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Genre Breakdown</h3>
                <PieChart data={genreBreakdown} />
              </div>
            )}

            {/* Most rewatched */}
            {mostRewatched.length > 0 && (
              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Most Rewatched</h3>
                <div className="space-y-2">
                  {mostRewatched.map((item, i) => (
                    <div key={item.tmdbId} className="flex items-center gap-3">
                      <span className="text-white/30 font-mono text-sm w-4">{i + 1}</span>
                      <span className="text-sm text-white flex-1">{item.title}</span>
                      <span className="text-xs text-white/40">{item.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones */}
            <div className="bg-white/5 rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-400" /> Milestones
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {badges.map((badge) => (
                  <div key={badge.id} className={`rounded-lg p-3 text-center space-y-1 ${badge.earned ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-white/5"}`}>
                    <p className={`text-xs font-semibold ${badge.earned ? "text-yellow-400" : "text-white/40"}`}>{badge.label}</p>
                    <p className="text-[10px] text-white/30">{badge.description}</p>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mt-1">
                      <div className="bg-[#E50914] h-1.5 rounded-full transition-all" style={{ width: `${(badge.progress / badge.target) * 100}%` }} />
                    </div>
                    <p className="text-[10px] text-white/30">{badge.progress}/{badge.target}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Year in review monthly */}
            {yearData && yearData.monthlyHours.some((h) => h > 0) && (
              <div className="bg-white/5 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-white">Your Year in Film {new Date().getFullYear()}</h3>
                <div className="flex items-end gap-1 h-32">
                  {yearData.monthlyHours.map((h, i) => {
                    const max = Math.max(...yearData.monthlyHours, 1)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-[#E50914]/60 rounded-t" style={{ height: `${(h / max) * 100}%`, minHeight: h > 0 ? 4 : 0 }} />
                        <span className="text-[9px] text-white/30">{months[i]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
