"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowLeft, MessageCircle, X } from "lucide-react"
import { Logo } from "@/components/Logo"
import { getSocket, disconnectSocket, hasSocketServer } from "@/lib/socket"
import { loadSettings } from "@/lib/settings"
import { tmdb } from "@/lib/tmdb"
import { addRecentlyPlayed, upsertProgress } from "@/lib/history"
import { VidkingPlayer } from "@/components/VidkingPlayer"
import { EpisodeSelector } from "@/components/EpisodeSelector"
import { ChatSidebar } from "@/components/ChatSidebar"
import { ThemeToggle } from "@/components/ThemeToggle"
import { SettingsDropdown } from "@/components/SettingsDropdown"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { RoomUser, ChatMessage, PlayerEvent, RoomState } from "@/types"
import type { AppSettings } from "@/lib/settings"

const SYNC_TOLERANCE = 3

export default function WatchRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params.roomId as string
  const urlTmdbId = Number(searchParams.get("tmdb") || 0)
  const urlMediaType = (searchParams.get("type") || "movie") as "movie" | "tv"
  const initialSeason = Number(searchParams.get("season") || searchParams.get("s") || 1)
  const initialEpisode = Number(searchParams.get("episode") || searchParams.get("e") || 1)

  const [userName, setUserName] = useState("")
  const [users, setUsers] = useState<RoomUser[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isHost, setIsHost] = useState(false)
  const [tmdbId, setTmdbId] = useState(urlTmdbId)
  const [mediaType, setMediaType] = useState<"movie" | "tv">(urlMediaType)
  const [season, setSeason] = useState(initialSeason)
  const [episode, setEpisode] = useState(initialEpisode)
  const [playerProgress, setPlayerProgress] = useState<number | undefined>(undefined)
  const [mediaInfo, setMediaInfo] = useState<{
    title: string
    overview: string
    poster_path: string | null
    backdrop_path: string | null
    genreIds?: number[]
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mobileChatOpen, setMobileChatOpen] = useState(false)
  const [settings, setSettings] = useState(() => loadSettings())

  const lastEmitRef = useRef(0)
  const socketInitRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem("streamparty_username") || "Guest"
    setUserName(stored)
  }, [])

  useEffect(() => {
    if (!tmdbId) {
      setIsLoading(false)
      return
    }
    const fetchMedia = mediaType === "movie"
      ? tmdb.getMovie(tmdbId).then((d) => ({
        title: d.title,
        overview: d.overview,
        poster_path: d.poster_path || null,
        backdrop_path: d.backdrop_path || null,
        // TMDB details endpoints return `genres: {id,name}[]` (not `genre_ids`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        genreIds: Array.isArray((d as any)?.genres) ? (d as any).genres.map((g: any) => g?.id).filter(Boolean) : undefined,
      }))
      : tmdb.getShow(tmdbId).then((d) => ({
        title: d.name,
        overview: d.overview,
        poster_path: d.poster_path || null,
        backdrop_path: d.backdrop_path || null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        genreIds: Array.isArray((d as any)?.genres) ? (d as any).genres.map((g: any) => g?.id).filter(Boolean) : undefined,
      }))
    fetchMedia
      .then((info) => {
        setMediaInfo({
          title: info.title || "",
          overview: info.overview || "",
          poster_path: info.poster_path,
          backdrop_path: info.backdrop_path,
          genreIds: info.genreIds,
        })
      })
      .finally(() => setIsLoading(false))
  }, [tmdbId, mediaType])

  useEffect(() => {
    if (!tmdbId || !mediaInfo) return
    addRecentlyPlayed({
      tmdbId,
      mediaType,
      title: mediaInfo.title,
      poster_path: mediaInfo.poster_path,
      backdrop_path: mediaInfo.backdrop_path,
      genreIds: mediaInfo.genreIds,
      lastWatchedAt: Date.now(),
    })
  }, [tmdbId, mediaType, mediaInfo])

  useEffect(() => {
    if (!userName || socketInitRef.current || !settings.partyMode || !hasSocketServer()) return
    socketInitRef.current = true

    const socket = getSocket()

    socket.emit("join-room", {
      roomId,
      userName,
      tmdbId: urlTmdbId,
      mediaType: urlMediaType,
      season: initialSeason,
      episode: initialEpisode,
    })

    socket.on("room-state", (state: RoomState) => {
      setUsers(state.users)
      setIsHost(state.hostId === socket.id)
      if (state.currentMedia) {
        if (state.currentMedia.tmdbId) {
          setTmdbId(state.currentMedia.tmdbId)
          setMediaType(state.currentMedia.mediaType)
        }
        setSeason(state.currentMedia.season)
        setEpisode(state.currentMedia.episode)
      }
      if (state.playbackState && state.playbackState.currentTime > 0) {
        setPlayerProgress(state.playbackState.currentTime)
      }
    })

    socket.on("user-joined", ({ users: u }: { user: RoomUser; users: RoomUser[] }) => {
      setUsers(u)
    })

    socket.on("user-left", ({ users: u }: { userId: string; users: RoomUser[] }) => {
      setUsers(u)
    })

    socket.on("host-changed", ({ newHostId }: { newHostId: string }) => {
      setIsHost(socket.id === newHostId)
      setUsers((prev) =>
        prev.map((u) => ({ ...u, isHost: u.id === newHostId }))
      )
    })

    socket.on("chat-message", (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg])
    })

    socket.on("sync-player", (event: PlayerEvent) => {
      setPlayerProgress((prev) => {
        if (prev !== undefined && Math.abs(event.currentTime - prev) < SYNC_TOLERANCE) {
          return prev
        }
        return event.currentTime
      })
    })

    socket.on("sync-action", ({ action, currentTime }: { action: string; currentTime: number; from: string }) => {
      if (action === "play" || action === "pause" || action === "seek") {
        setPlayerProgress(currentTime)
      }
    })

    socket.on("change-episode", ({ season: s, episode: e }: { season: number; episode: number }) => {
      setSeason(s)
      setEpisode(e)
      setPlayerProgress(0)
    })

    return () => {
      disconnectSocket()
      socketInitRef.current = false
    }
  }, [userName, roomId, urlTmdbId, urlMediaType, initialSeason, initialEpisode, settings.partyMode])

  const handlePlayerEvent = useCallback(
    (data: PlayerEvent) => {
      if (data.event === "timeupdate" || data.event === "play" || data.event === "pause" || data.event === "seeked") {
        upsertProgress({
          tmdbId: Number(data.id) || tmdbId,
          mediaType: data.mediaType,
          season: data.season || (mediaType === "tv" ? season : undefined),
          episode: data.episode || (mediaType === "tv" ? episode : undefined),
          currentTime: Math.max(0, Math.floor(data.currentTime || 0)),
          updatedAt: Date.now(),
        })
      }

      if (!settings.partyMode || !hasSocketServer()) return

      const socket = getSocket()
      const now = Date.now()

      if (data.event === "play" || data.event === "pause" || data.event === "seeked") {
        socket.emit("sync-action", {
          roomId,
          action: data.event === "seeked" ? "seek" : data.event,
          currentTime: data.currentTime,
        })
        lastEmitRef.current = now
        return
      }

      if (data.event === "timeupdate" && now - lastEmitRef.current < 5000) return
      lastEmitRef.current = now
      socket.emit("player-event", { roomId, event: data })
    },
    [settings.partyMode, roomId, tmdbId, mediaType, season, episode]
  )

  const handleSendMessage = useCallback(
    (msg: string) => {
      if (!hasSocketServer()) return
      const socket = getSocket()
      socket.emit("chat-message", { roomId, message: msg, userName })
    },
    [roomId, userName]
  )

  const handleEpisodeChange = useCallback(
    (s: number, e: number) => {
      setSeason(s)
      setEpisode(e)
      setPlayerProgress(0)
      if (settings.partyMode && hasSocketServer()) {
        const socket = getSocket()
        socket.emit("change-episode", { roomId, season: s, episode: e })
      }
    },
    [roomId, settings.partyMode]
  )

  const handleSettingsChange = (next: AppSettings) => {
    setSettings(next)
  }

  const showPartyUI = settings.partyMode
  const theaterMode = settings.theaterMode

  return (
    <div className={`min-h-screen flex flex-col ${theaterMode ? "bg-black" : "bg-background"}`}>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center px-4 gap-3">
          <Link href="/" className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            <Logo size="sm" />
          </Link>
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              <h1 className="text-sm font-semibold truncate">
                {mediaInfo?.title || "Watch Room"}
              </h1>
            )}
          </div>
          <div className="flex items-center gap-1">
            {showPartyUI && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileChatOpen(!mobileChatOpen)}
                aria-label="Toggle chat"
              >
                {mobileChatOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <MessageCircle className="h-5 w-5" />
                )}
              </Button>
            )}
            <SettingsDropdown onChange={handleSettingsChange} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={`flex-1 overflow-y-auto space-y-4 ${theaterMode ? "p-0" : "p-4"}`}
        >
          {tmdbId ? (
            <VidkingPlayer
              tmdbId={tmdbId}
              mediaType={mediaType}
              season={season}
              episode={episode}
              startProgress={playerProgress}
              autoplay={settings.autoplay}
              onProgressUpdate={handlePlayerEvent}
            />
          ) : (
            <div className="aspect-video rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              No media selected
            </div>
          )}

          {mediaType === "tv" && tmdbId > 0 && (
            <EpisodeSelector
              tmdbId={tmdbId}
              currentSeason={season}
              currentEpisode={episode}
              isHost={isHost || !showPartyUI}
              onEpisodeChange={handleEpisodeChange}
            />
          )}

          {mediaInfo && (
            <div className={`${showPartyUI ? "lg:hidden" : ""} space-y-2 pb-4`}>
              <h2 className="font-semibold text-lg">{mediaInfo.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {mediaInfo.overview}
              </p>
            </div>
          )}
        </motion.main>

        {showPartyUI && (
          <aside className="hidden lg:flex w-80 shrink-0">
            <ChatSidebar
              userName={userName}
              messages={messages}
              onSendMessage={handleSendMessage}
              users={users}
              roomCode={roomId}
              mediaTitle={mediaInfo?.title}
              mediaOverview={mediaInfo?.overview}
            />
          </aside>
        )}

        {showPartyUI && mobileChatOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="lg:hidden fixed inset-0 z-40 flex"
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileChatOpen(false)}
            />
            <motion.div
              initial={{ x: 320 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative ml-auto w-80 max-w-[85vw] h-full"
            >
              <ChatSidebar
                userName={userName}
                messages={messages}
                onSendMessage={handleSendMessage}
                users={users}
                roomCode={roomId}
                mediaTitle={mediaInfo?.title}
                mediaOverview={mediaInfo?.overview}
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
