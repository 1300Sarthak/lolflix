const { Server } = require("socket.io")
const http = require("http")

const server = http.createServer()
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
})

const rooms = new Map()

function getRoomOrCreate(roomId, hostId, data = {}) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      hostId,
      users: [],
      currentMedia: {
        tmdbId: data.tmdbId || 0,
        mediaType: data.mediaType || "movie",
        season: data.season || 1,
        episode: data.episode || 1,
      },
      playbackState: {
        currentTime: 0,
        isPlaying: false,
        lastUpdated: Date.now(),
      },
    })
  }
  return rooms.get(roomId)
}

io.on("connection", (socket) => {
  console.log(`Connected: ${socket.id}`)

  socket.on("join-room", ({ roomId, userName, tmdbId, mediaType, season, episode }) => {
    socket.join(roomId)
    const isNew = !rooms.has(roomId)
    const room = getRoomOrCreate(roomId, socket.id, {
      tmdbId,
      mediaType,
      season,
      episode,
    })

    const existingUser = room.users.find((u) => u.id === socket.id)
    if (!existingUser) {
      room.users.push({
        id: socket.id,
        name: userName || "Anonymous",
        isHost: isNew,
        joinedAt: Date.now(),
      })
    }

    socket.roomId = roomId

    socket.emit("room-state", {
      roomId,
      hostId: room.hostId,
      users: room.users,
      currentMedia: room.currentMedia,
      playbackState: room.playbackState,
    })

    socket.to(roomId).emit("user-joined", {
      user: room.users.find((u) => u.id === socket.id),
      users: room.users,
    })

    io.to(roomId).emit("chat-message", {
      id: Date.now(),
      userName: "System",
      message: `${userName || "Someone"} joined the room`,
      timestamp: Date.now(),
      isSystem: true,
    })
  })

  socket.on("player-event", ({ roomId, event }) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.playbackState = {
      currentTime: event.currentTime,
      isPlaying: event.event === "play" || event.event === "timeupdate",
      lastUpdated: Date.now(),
    }

    socket.to(roomId).emit("sync-player", event)
  })

  socket.on("sync-action", ({ roomId, action, currentTime }) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.playbackState.currentTime = currentTime
    room.playbackState.isPlaying = action === "play"
    room.playbackState.lastUpdated = Date.now()

    socket.to(roomId).emit("sync-action", { action, currentTime, from: socket.id })
  })

  socket.on("chat-message", ({ roomId, message, userName }) => {
    io.to(roomId).emit("chat-message", {
      id: Date.now() + Math.random(),
      userName,
      message,
      timestamp: Date.now(),
    })
  })

  socket.on("change-episode", ({ roomId, season, episode }) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.currentMedia.season = season
    room.currentMedia.episode = episode
    room.playbackState.currentTime = 0

    io.to(roomId).emit("change-episode", { season, episode })
    io.to(roomId).emit("chat-message", {
      id: Date.now(),
      userName: "System",
      message: `Episode changed to S${season}E${episode}`,
      timestamp: Date.now(),
      isSystem: true,
    })
  })

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`)
    const roomId = socket.roomId
    if (!roomId) return

    const room = rooms.get(roomId)
    if (!room) return

    const user = room.users.find((u) => u.id === socket.id)
    room.users = room.users.filter((u) => u.id !== socket.id)

    if (room.users.length === 0) {
      rooms.delete(roomId)
      return
    }

    if (room.hostId === socket.id) {
      room.hostId = room.users[0].id
      room.users[0].isHost = true
      io.to(roomId).emit("host-changed", { newHostId: room.hostId })
      io.to(roomId).emit("chat-message", {
        id: Date.now(),
        userName: "System",
        message: `${room.users[0].name} is now the host`,
        timestamp: Date.now(),
        isSystem: true,
      })
    }

    io.to(roomId).emit("user-left", {
      userId: socket.id,
      users: room.users,
    })

    if (user) {
      io.to(roomId).emit("chat-message", {
        id: Date.now() + 1,
        userName: "System",
        message: `${user.name} left the room`,
        timestamp: Date.now(),
        isSystem: true,
      })
    }
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`Socket.io server running on :${PORT}`)
})
