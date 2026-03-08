"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface JoinRoomDialogProps {
  trigger?: React.ReactNode
}

export function JoinRoomDialog({ trigger }: JoinRoomDialogProps = {}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [userName, setUserName] = useState("")
  const [roomCode, setRoomCode] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("streamparty_username")
    if (stored) setUserName(stored)
  }, [])

  const handleJoin = () => {
    if (!roomCode.trim()) return
    const name = userName.trim() || `User${Math.floor(Math.random() * 9999)}`
    localStorage.setItem("streamparty_username", name)
    setOpen(false)
    router.push(`/watch/${roomCode.trim()}`)
  }

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setOpen(true)}
      className="gap-2"
    >
      <LogIn className="h-4 w-4" />
      Join Room
    </Button>
  )

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? defaultTrigger}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Join a Watch Party</DialogTitle>
            <DialogDescription>
              Enter your name and the room code from your friend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label htmlFor="join-name" className="text-sm font-medium mb-1 block">
                Your Name
              </label>
              <Input
                id="join-name"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={20}
              />
            </div>
            <div>
              <label htmlFor="join-code" className="text-sm font-medium mb-1 block">
                Room Code
              </label>
              <Input
                id="join-code"
                placeholder="e.g. Ab3xK9mQ"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                maxLength={8}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
            </div>
            <Button
              onClick={handleJoin}
              disabled={!roomCode.trim()}
              className="w-full"
            >
              Join Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
