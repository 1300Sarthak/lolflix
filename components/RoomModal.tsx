"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { nanoid } from "nanoid"
import { Users, Plus, LogIn, Play } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loadSettings } from "@/lib/settings"

export function RoomModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tmdbId = searchParams.get("tmdb")
  const type = searchParams.get("type") || "movie"
  const season = searchParams.get("s")
  const episode = searchParams.get("e")

  const [mode, setMode] = useState<"choose" | "join">("choose")
  const [userName, setUserName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const settings = loadSettings()

  useEffect(() => {
    if (!settings.partyMode && tmdbId) {
      const roomId = nanoid(8)
      const params = new URLSearchParams()
      params.set("tmdb", tmdbId)
      params.set("type", type)
      if (season) params.set("s", season)
      if (episode) params.set("e", episode)
      router.replace(`/watch?room=${roomId}&${params.toString()}`)
      return
    }

    const stored = localStorage.getItem("streamparty_username")
    if (stored) setUserName(stored)
  }, [settings.partyMode, tmdbId, type, router])

  const saveNameAndGo = (path: string) => {
    const name = userName.trim() || `User${Math.floor(Math.random() * 9999)}`
    localStorage.setItem("streamparty_username", name)
    router.push(path)
  }

  const handleCreate = () => {
    const roomId = nanoid(8)
    const params = new URLSearchParams()
    if (tmdbId) params.set("tmdb", tmdbId)
    params.set("type", type)
    if (season) params.set("s", season)
    if (episode) params.set("e", episode)
    saveNameAndGo(`/watch?room=${roomId}&${params.toString()}`)
  }

  const handleWatchSolo = () => {
    const roomId = nanoid(8)
    const params = new URLSearchParams()
    if (tmdbId) params.set("tmdb", tmdbId)
    params.set("type", type)
    if (season) params.set("s", season)
    if (episode) params.set("e", episode)
    router.push(`/watch?room=${roomId}&${params.toString()}`)
  }

  const handleJoin = () => {
    if (!roomCode.trim()) return
    saveNameAndGo(`/watch?room=${roomCode.trim()}`)
  }

  if (!settings.partyMode) return null

  return (
    <Dialog open onOpenChange={() => router.push("/")}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Watch Party
          </DialogTitle>
          <DialogDescription>
            Set your name, then create a room, join one, or watch solo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium mb-1.5 block">
              Display Name
            </label>
            <Input
              id="username"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={20}
            />
          </div>

          {mode === "choose" ? (
            <div className="flex flex-col gap-2.5">
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Room
              </Button>
              <Button
                variant="outline"
                onClick={() => setMode("join")}
                className="gap-2"
              >
                <LogIn className="h-4 w-4" />
                Join Existing Room
              </Button>
              <Button
                variant="ghost"
                onClick={handleWatchSolo}
                className="gap-2 text-muted-foreground"
              >
                <Play className="h-4 w-4" />
                Watch Solo
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="roomcode" className="text-sm font-medium mb-1.5 block">
                  Room Code
                </label>
                <Input
                  id="roomcode"
                  placeholder="Enter 8-character room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  maxLength={8}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setMode("choose")}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleJoin}
                  disabled={!roomCode.trim()}
                  className="flex-1"
                >
                  Join Room
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
