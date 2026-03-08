"use client"

import { Crown } from "lucide-react"
import type { RoomUser } from "@/types"

interface UserBadgeProps {
  user: RoomUser
}

export function UserBadge({ user }: UserBadgeProps) {
  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors duration-150">
      <div className="relative h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
        {initials}
        {user.isHost && (
          <Crown className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
        )}
      </div>
      <span className="text-sm font-medium truncate">{user.name}</span>
      {user.isHost && (
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-primary">
          Host
        </span>
      )}
    </div>
  )
}
