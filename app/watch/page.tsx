"use client"

import { Suspense } from "react"
import WatchRoomPage from "./WatchRoomClient"

export default function Page() {
  return (
    <Suspense>
      <WatchRoomPage />
    </Suspense>
  )
}
