StreamParty — Product Requirements Document
For Claude Code Implementation

1. Project Overview
   Build a full-stack web application called StreamParty that lets users:

Search for any movie or TV show
Watch it via an embedded Vidking Player (no ads)
Create or join a watch party room to sync playback with friends in real-time — similar to Netflix Party / Teleparty

2. Tech Stack
   LayerTechnologyFrontendNext.js 14 (App Router) + Tailwind CSSBackend / API RoutesNext.js API Routes (Node.js)Real-time SyncSocket.io (WebSocket server embedded in Next.js)Content SearchTMDB API (The Movie Database)Video PlayerVidking Player (iframe embed)DeploymentVercel (frontend) + Railway or Render (Socket.io server)Optional DBRedis (room state persistence) or in-memory Map for MVP

3. Environment Variables Required
   Create a .env.local file at the project root:
   envNEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
   NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
   NEXT_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p/w500
   NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   How to get TMDB API Key:

Go to https://www.themoviedb.org/signup and create a free account
Navigate to Settings → API → Create → Developer
Fill in the form (use "personal project" for type)
Copy the API Read Access Token (v4 auth) OR the API Key (v3 auth)
This app uses the v3 API Key — paste it into NEXT_PUBLIC_TMDB_API_KEY

4. Project Structure
   streamparty/
   ├── app/
   │ ├── page.tsx # Home / Search page
   │ ├── watch/[roomId]/page.tsx # Watch party room page
   │ └── layout.tsx
   ├── components/
   │ ├── SearchBar.tsx
   │ ├── MediaCard.tsx
   │ ├── MediaGrid.tsx
   │ ├── VidkingPlayer.tsx
   │ ├── EpisodeSelector.tsx
   │ ├── WatchPartyControls.tsx
   │ ├── ChatSidebar.tsx
   │ ├── RoomModal.tsx
   │ └── UserBadge.tsx
   ├── lib/
   │ ├── tmdb.ts # TMDB API wrapper
   │ ├── socket.ts # Socket.io client singleton
   │ └── utils.ts # Room ID generation, helpers
   ├── server/
   │ └── socket-server.js # Standalone Socket.io server (Node.js)
   ├── types/
   │ └── index.ts # TypeScript interfaces
   ├── .env.local
   └── package.json

5. Feature Requirements
   5.1 Home / Search Page (/)
   UI Elements:

Large centered logo: "StreamParty"
Search input with magnifying glass icon
Toggle buttons: Movies | TV Shows
Results grid: poster image, title, year, rating
Trending section on initial load (before search)

Behavior:

Debounced search (300ms) — call TMDB search API on every keystroke
If no query, show TMDB trending (movies or TV based on toggle)
Clicking a result card navigates to /watch/new?tmdb={id}&type={movie|tv}

TMDB API Calls:
GET /search/movie?query={q}&api_key={key}
GET /search/tv?query={q}&api_key={key}
GET /trending/movie/week?api_key={key}
GET /trending/tv/week?api_key={key}
GET /tv/{id}/season/{n}?api_key={key} ← for episode list

5.2 Watch Room Page (/watch/[roomId])
This is the main page. It has two zones:
Left/Main Zone (75% width):

Vidking embedded player (iframe)
Below player: Season/Episode selector (TV only)
Media title, description, poster metadata pulled from TMDB

Right Sidebar (25% width):

Watch Party panel (room info, users list, chat)

5.3 Vidking Player Integration
Base embed URLs:
Movie: https://www.vidking.net/embed/movie/{tmdbId}
TV Show: https://www.vidking.net/embed/tv/{tmdbId}/{season}/{episode}
URL Parameters to always include:
?color=6d28d9 ← purple brand color (or make it configurable)
&autoPlay=true
&nextEpisode=true ← TV only
&episodeSelector=true ← TV only
&progress={seconds} ← inject this when a guest joins mid-watch
Full example (TV):
https://www.vidking.net/embed/tv/119051/1/8?color=6d28d9&autoPlay=true&nextEpisode=true&episodeSelector=true&progress=120
VidkingPlayer.tsx Component Spec:
tsxinterface VidkingPlayerProps {
tmdbId: number
mediaType: 'movie' | 'tv'
season?: number
episode?: number
startProgress?: number // seconds to seek to on load
color?: string // hex without #
onProgressUpdate?: (data: PlayerEvent) => void
}
Listening to Player Events (postMessage):
typescript// In VidkingPlayer component, add this useEffect:
useEffect(() => {
const handler = (event: MessageEvent) => {
if (typeof event.data !== 'string') return
try {
const parsed = JSON.parse(event.data)
if (parsed.type === 'PLAYER_EVENT') {
onProgressUpdate?.(parsed.data)
}
} catch {}
}
window.addEventListener('message', handler)
return () => window.removeEventListener('message', handler)
}, [onProgressUpdate])
Player Event Data Shape:
typescriptinterface PlayerEvent {
event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked'
currentTime: number // seconds
duration: number // seconds
progress: number // percentage 0-100
id: string // tmdbId
mediaType: 'movie' | 'tv'
season: number
episode: number
timestamp: number // Unix ms
}

5.4 Watch Party / Room System
Room Creation Flow

User lands on /watch/new?tmdb=119051&type=tv
A RoomModal pops up asking:

"Start a new room" → generates a roomId (nanoid, 8 chars) → redirect to /watch/{roomId}?tmdb=...&type=...
"Join existing room" → input field for room code → redirect to /watch/{roomId}

User sets a display name (stored in localStorage)

Room URL Format
/watch/{roomId}?tmdb={id}&type={movie|tv}&s={season}&e={episode}
Shareable Invite Link

Shown in the sidebar: https://yourapp.com/watch/{roomId}?tmdb=...&type=...
Copy button next to it

5.5 Real-time Sync — Socket.io Architecture
Server (server/socket-server.js)
Run this as a separate Node.js process (not inside Next.js):
javascriptconst { Server } = require('socket.io')
const http = require('http')

const server = http.createServer()
const io = new Server(server, {
cors: { origin: '\*', methods: ['GET', 'POST'] }
})

// In-memory room state
const rooms = new Map()
// rooms[roomId] = {
// hostId: socketId,
// users: [{ id, name, avatar }],
// currentMedia: { tmdbId, type, season, episode },
// playbackState: { currentTime, isPlaying, lastUpdated }
// }

io.on('connection', (socket) => {

// User joins a room
socket.on('join-room', ({ roomId, userName, tmdbId, mediaType, season, episode }) => {
socket.join(roomId)
// Add user to room state
// If room doesn't exist, create it and make this user host
// Emit 'room-state' back to the joining user with current playback position
// Broadcast 'user-joined' to all others in the room
})

// Host sends play/pause/seek events
socket.on('player-event', ({ roomId, event }) => {
// Only propagate if sender is host OR sync is enabled for all
// Broadcast 'sync-player' to all OTHER users in the room
socket.to(roomId).emit('sync-player', event)
// Update room's playbackState in memory
})

// Chat message
socket.on('chat-message', ({ roomId, message, userName }) => {
io.to(roomId).emit('chat-message', {
id: Date.now(),
userName,
message,
timestamp: Date.now()
})
})

// Episode change (TV only)
socket.on('change-episode', ({ roomId, season, episode }) => {
io.to(roomId).emit('change-episode', { season, episode })
// Update room state
})

// User leaves
socket.on('disconnect', () => {
// Remove user from all rooms they were in
// If host disconnected, assign new host to first remaining user
// Broadcast 'user-left' to room
})
})

server.listen(4000, () => console.log('Socket server on :4000'))
Client (lib/socket.ts)
typescriptimport { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
if (!socket) {
socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
transports: ['websocket']
})
}
return socket
}
Sync Logic in Watch Room Page
typescript// When host plays/pauses/seeks:
const handlePlayerEvent = (data: PlayerEvent) => {
if (isHost) {
socket.emit('player-event', { roomId, event: data })
}
}

// When guest receives sync command:
socket.on('sync-player', (event: PlayerEvent) => {
// Rebuild the iframe src with ?progress={event.currentTime}
// to seek the guest's player to match host
setPlayerProgress(event.currentTime)
// Note: You cannot call .play() / .pause() on the iframe directly
// Seeking is done by rebuilding the src URL with the progress param
})
Important note for Claude Code: Because Vidking is a cross-origin iframe, you cannot programmatically call .play() or .pause() on it. The sync mechanism works by:

Tracking the host's currentTime via postMessage events
When a guest joins or falls out of sync, rebuild the iframe src URL with ?progress={currentTime}&autoPlay=true
Add a small tolerance check (±3 seconds) before triggering a re-sync to avoid flicker

5.6 Chat Sidebar
Features:

Real-time chat via Socket.io chat-message events
Messages show username, timestamp, message text
Auto-scroll to bottom on new message
Message input at bottom + Send button (Enter key too)
Emoji support (basic — just allow unicode input)
Show system messages: "Alex joined the room", "Host changed episode"

ChatSidebar Component Spec:
tsxinterface ChatMessage {
id: number
userName: string
message: string
timestamp: number
isSystem?: boolean
}

interface ChatSidebarProps {
roomId: string
userName: string
messages: ChatMessage[]
onSendMessage: (msg: string) => void
users: RoomUser[]
roomCode: string
}

5.7 Episode Selector (TV Shows)

Fetches season list from TMDB: GET /tv/{id}?api_key={key}
Fetches episode list per season: GET /tv/{id}/season/{n}?api_key={key}
UI: Season dropdown + Episode grid (card per episode with thumbnail + title)
Selecting an episode:

Updates the Vidking iframe src
If in a room and user is host → emits change-episode socket event
All guests receive the change and reload their iframe

EpisodeSelector Component Spec:
tsxinterface EpisodeSelectorProps {
tmdbId: number
currentSeason: number
currentEpisode: number
isHost: boolean
onEpisodeChange: (season: number, episode: number) => void
}

6. TypeScript Types (types/index.ts)
   typescriptexport interface TMDBMovie {
   id: number
   title: string
   overview: string
   poster_path: string
   backdrop_path: string
   release_date: string
   vote_average: number
   media_type: 'movie'
   }

export interface TMDBShow {
id: number
name: string
overview: string
poster_path: string
backdrop_path: string
first_air_date: string
vote_average: number
number_of_seasons: number
media_type: 'tv'
}

export type TMDBMedia = TMDBMovie | TMDBShow

export interface TMDBEpisode {
id: number
name: string
episode_number: number
season_number: number
overview: string
still_path: string
air_date: string
}

export interface RoomUser {
id: string // socket ID
name: string
isHost: boolean
joinedAt: number
}

export interface RoomState {
roomId: string
hostId: string
users: RoomUser[]
currentMedia: {
tmdbId: number
mediaType: 'movie' | 'tv'
season: number
episode: number
}
playbackState: {
currentTime: number
isPlaying: boolean
lastUpdated: number
}
}

export interface PlayerEvent {
event: 'timeupdate' | 'play' | 'pause' | 'ended' | 'seeked'
currentTime: number
duration: number
progress: number
id: string
mediaType: 'movie' | 'tv'
season: number
episode: number
timestamp: number
}

7. TMDB API Wrapper (lib/tmdb.ts)
   typescriptconst BASE = process.env.NEXT_PUBLIC_TMDB_BASE_URL
   const KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY
   const IMG = process.env.NEXT_PUBLIC_TMDB_IMAGE_BASE

export const tmdb = {
searchMovies: (query: string) =>
fetch(`${BASE}/search/movie?query=${encodeURIComponent(query)}&api_key=${KEY}`)
.then(r => r.json()),

searchTV: (query: string) =>
fetch(`${BASE}/search/tv?query=${encodeURIComponent(query)}&api_key=${KEY}`)
.then(r => r.json()),

trendingMovies: () =>
fetch(`${BASE}/trending/movie/week?api_key=${KEY}`).then(r => r.json()),

trendingTV: () =>
fetch(`${BASE}/trending/tv/week?api_key=${KEY}`).then(r => r.json()),

getMovie: (id: number) =>
fetch(`${BASE}/movie/${id}?api_key=${KEY}`).then(r => r.json()),

getShow: (id: number) =>
fetch(`${BASE}/tv/${id}?api_key=${KEY}`).then(r => r.json()),

getSeason: (showId: number, season: number) =>
fetch(`${BASE}/tv/${showId}/season/${season}?api_key=${KEY}`).then(r => r.json()),

imageUrl: (path: string) => `${IMG}${path}`,
}

8. UI / Design Spec
   Color Palette:

Background: #0f0f0f (near black)
Surface: #1a1a1a
Border: #2a2a2a
Primary: #6d28d9 (purple — matches Vidking color param)
Primary hover: #7c3aed
Text primary: #f9fafb
Text secondary: #9ca3af
Red accent (for live indicator): #ef4444

Typography: Inter font (Google Fonts)
Layout:

Watch room is a flex row: player area (flex-1) + sidebar (w-80, fixed)
Sidebar has three tabs at top: Users, Chat, Info
Player area has the iframe + episode selector below it

Responsive: Mobile shows player full width, chat hidden (accessible via floating button)

9. Key Implementation Notes for Claude Code

Socket.io server runs separately from Next.js. Create server/socket-server.js and add a script in package.json: "socket": "node server/socket-server.js". Run both with concurrently.
iframe sync limitation — You cannot .play() or .pause() a cross-origin iframe. The sync strategy is: rebuild the src URL with the updated ?progress=X param when needed. Use a key prop on the iframe to force React to remount it.
Host vs Guest — The first person in a room is host. Only the host's player events propagate to others. Guests can chat and change episodes (if you want — optionally lock episode control to host).
Room persistence — For MVP, use an in-memory Map in the socket server. Rooms expire when the last user leaves.
Progress tracking throttle — Only emit player-event on timeupdate every 5 seconds (not every tick) to avoid flooding the socket.
TMDB images — Use https://image.tmdb.org/t/p/w500{poster_path} for posters and https://image.tmdb.org/t/p/original{backdrop_path} for backgrounds.
nanoid — Use nanoid(8) to generate room IDs. Install: npm install nanoid.
Room code display — Show the 8-char room code prominently in the sidebar so users can share it verbally. Also provide the full URL copy button.
localStorage — Persist userName in localStorage so users don't have to re-enter it on every visit.
No auth required — This is intentionally anonymous. Username is all that's needed.

10. Package Dependencies
    json{
    "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "react-dom": "18.x",
    "socket.io": "^4.7.0",
    "socket.io-client": "^4.7.0",
    "nanoid": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "lucide-react": "latest"
    },
    "devDependencies": {
    "concurrently": "^8.2.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0"
    },
    "scripts": {
    "dev": "concurrently \"next dev\" \"node server/socket-server.js\"",
    "socket": "node server/socket-server.js",
    "build": "next build",
    "start": "next start"
    }
    }

11. Pages & Routes Summary
    RouteDescription/Home search page — search movies/TV, see trending/watch/[roomId]Watch room — player + party sidebar/watch/newRedirect stub — creates room, redirects to /watch/{roomId}
    Query params on /watch/[roomId]:

tmdb — TMDB ID
type — movie or tv
s — season number (TV)
e — episode number (TV)

12. MVP Scope vs. Future
    MVP (build this first):

Search + browse movies/TV
Vidking player embed with full params
Room creation + joining via code
Real-time play/pause/seek sync (host-driven)
Episode selector for TV shows
Live chat sidebar
User list showing who's in the room

Future (skip for MVP):

User avatars / profile pictures
Reactions (thumbs up, laughing emoji)
Queue / watchlist
Redis-backed room persistence
Account system + watch history
Mobile app (React Native)

13. Deployment
    Frontend (Vercel):

Push to GitHub, connect to Vercel
Add env vars in Vercel dashboard

Socket Server (Railway):

Deploy server/socket-server.js as a standalone service
Set NEXT_PUBLIC_SOCKET_URL in Vercel to the Railway URL

End of PRD — StreamParty v1.0
