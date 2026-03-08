"use client"

import { Suspense } from "react"
import { RoomModal } from "@/components/RoomModal"

export default function WatchNewPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Suspense>
        <RoomModal />
      </Suspense>
    </div>
  )
}
