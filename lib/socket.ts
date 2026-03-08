"use client"

import { io, Socket } from "socket.io-client"

let socket: Socket | null = null

export const getSocket = (): Socket => {
  const url = process.env.NEXT_PUBLIC_SOCKET_URL
  if (!url) {
    throw new Error("Party mode is not available (no server configured).")
  }
  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
    })
  }
  return socket
}

export const hasSocketServer = (): boolean => !!process.env.NEXT_PUBLIC_SOCKET_URL

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
