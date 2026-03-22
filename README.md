# LOLFLIX

### A Netflix-Style Streaming Discovery & Playback Platform

> **Live at: [https://1300sarthak.github.io/lolflix/](https://1300sarthak.github.io/lolflix/)**

---

## DISCLAIMER

**This project is built strictly for educational and research purposes only.** The developer does not own, host, or have any legal rights over any of the content accessible through this platform. All media content is sourced from third-party embed providers and is not stored, uploaded, or distributed by this application or its developer. This project simply acts as a frontend interface that aggregates publicly available embeds. If you are a content owner and believe your rights are being infringed, please contact the relevant third-party embed providers directly. The developer assumes no responsibility or liability for any content accessed through the platform. **Use at your own discretion and in compliance with your local laws.**

---

## What is LOLFLIX?

LOLFLIX is a full-featured, Netflix-inspired streaming discovery and playback platform built from the ground up with modern web technologies. It provides a sleek, dark-themed interface for browsing, searching, and watching movies and TV shows — completely ad-free. The entire frontend is a statically exported Next.js application deployed on GitHub Pages, meaning there is no backend server required for the core experience. All user data (watchlist, history, ratings, progress) is stored locally in your browser via `localStorage`, so your data never leaves your device.

The platform integrates with **The Movie Database (TMDB)** API for all metadata, posters, trailers, cast information, and content discovery. For actual video playback, LOLFLIX leverages **3 different third-party embed sources** with automatic fallback, ensuring that if one source is down or slow, the player seamlessly switches to the next available source without any user intervention.

---

## Features at a Glance

### Content Discovery & Browsing
- **Powerful Search** — Search across movies, TV shows, and people simultaneously with instant results
- **Advanced Filtering** — Filter by genre (18+ categories), decade (70s through 2020s), runtime, minimum rating, sort order, and more
- **Hero Banner** — Auto-rotating showcase of trending content with backdrop images and trailers, cycling every 8 seconds
- **12+ Dynamic Content Rails** — Including Trending, Popular, Top Rated, New Releases, Hidden Gems, Critically Acclaimed, Indian Content (Hindi & Punjabi), and more
- **Top 10 Rankings** — Numbered leaderboard-style display of the hottest content
- **Mood Collections** — 6 curated mood-based discovery categories: Dark Picks, Funny Picks, Intense Picks, Easy Watch, Mind-Bender Picks, and Comfort Rewatch
- **Watch Wizard** — An interactive, multi-step guided discovery tool that walks you through Mood, Duration, and Type to surface a randomized perfect pick
- **Genre Pinning** — Pin your favorite genres so they appear as dedicated rails on the homepage
- **Custom Shelves** — Create your own named collections (like "Weekend Binges" or "Date Night") and add any title to them
- **"Not Interested" Filtering** — Hide titles you don't want to see from all recommendations and rails
- **ML-Based Recommendation Engine** — Genre-weighted scoring, recency decay, rating bonuses, and watchlist intent weighting to surface content you'll actually enjoy

### Video Player
- **3 Fallback Video Sources** — The player embeds from **Vidking**, **Vidsrc**, and a third fallback source. If one source fails or takes longer than 15 seconds to load, it automatically switches to the next. This triple-redundancy ensures you can almost always watch what you want
- **8 Playback Speeds** — 0.5x, 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x, and 3x
- **Picture-in-Picture (PiP)** — Pop the video out into a floating window using the Document PiP API so you can browse other content while watching
- **Keyboard Shortcuts** — Space/K (play/pause), F (fullscreen), J or Left Arrow (skip back 10s), L or Right Arrow (skip forward 10s), Up/Down arrows (volume), M (mute), ? (show help)
- **Skip Intro/Recap** — One-click 90-second skip button for getting past intros and recaps
- **Autoplay Support** — Configurable autoplay toggle in settings
- **Progress Tracking & Resume** — Automatically saves your playback position so you can pick up right where you left off
- **Iframe Ad/Popup Blocking** — Built-in protection layer that intercepts and blocks popup attempts and ad injections from the embed sources. This is a core differentiator — the embed sources these players use are notorious for aggressive ads, popups, and scam redirects. LOLFLIX strips all of that away

### TV Show Support
- **Full Season & Episode Selector** — Netflix-style season dropdown with episode grid, including episode thumbnails, titles, descriptions, air dates, and runtime
- **Episode Thumbnails** — Visual previews pulled from TMDB for every episode
- **Seamless Episode Switching** — Switch episodes without leaving the player page
- **Per-Episode Progress Tracking** — Resume any specific episode right where you stopped

### Personalization & User Data
- **Watchlist ("My List")** — Save movies and shows to your personal list with a single click from any card, the detail modal, or the player page. Full watchlist page at `/watchlist` with grid view and clear-all functionality
- **Watch History** — Automatically tracks up to 100 recently played items with timestamps
- **Progress Tracking** — Stores playback position for up to 50 items so "Continue Watching" always knows where you left off
- **Star Ratings** — Rate any title from 1-5 stars
- **Rewatch Tags** — Mark titles as "Rewatch" or "One and Done"
- **Custom Notes** — Write personal notes/annotations on any title
- **All Data Stored Locally** — Everything lives in your browser's `localStorage`. No accounts, no sign-ups, no servers storing your data. Your viewing habits stay private

### Watch Party (Real-Time Social Viewing)
- **Synchronized Playback** — Watch with friends in real-time. Play, pause, and seek actions sync across all connected users within a 3-second tolerance
- **Room System** — Create or join rooms using 8-character room codes. Share the code with friends and they're instantly connected
- **Live Chat** — Real-time messaging within watch rooms with system messages for join/leave/host changes/episode changes
- **Host Controls** — The room creator is the host. Episode changes in TV shows are host-controlled. If the host disconnects, a new host is automatically promoted
- **Display Names** — Set your display name (saved across sessions) so your friends know who's who
- **Party Mode Toggle** — Enable or disable the entire social feature set from settings. When disabled, LOLFLIX functions as a pure solo experience with no socket connections
- **Powered by Socket.io** — A lightweight Node.js socket server handles all real-time communication (room state, playback sync, chat, episode changes)

### Appearance & Customization
- **3 Theme Modes** — Dark (#141414), Darker (#0a0a0a), and AMOLED True Black (#000000)
- **6 Accent Color Schemes** — Salmon, Netflix Red (default), Ocean Blue, Purple, Emerald, and Gold. The accent color applies globally across buttons, highlights, and interactive elements
- **3 Card Layout Modes** — Compact (dense grid, minimal spacing), Comfortable (balanced default), and Cinematic (large cards, generous spacing for a theatrical feel)
- **Theater Mode** — Strip away all UI chrome during playback for a distraction-free, edge-to-edge viewing experience
- **TV Mode** — Optimized layout for large screens and TVs

### Analytics & Statistics
- **Stats Dashboard** at `/stats` with:
  - Total hours watched across all content
  - Current and longest watch streaks
  - Genre breakdown with pie chart visualization (top 8 genres with percentages)
  - Most rewatched titles
  - Year-in-review data (films watched, shows watched, monthly breakdown)
  - Total watch sessions count
- **8 Milestone Achievements** — Film Buff (10 films), Cinephile (50 films), Movie Master (100 films), Binge Starter (10 hours), Marathon Runner (50 hours), Screen Legend (100 hours), Week Warrior (7-day streak), Monthly Devotee (30-day streak). Each shows visual progress toward completion

---

## Technical Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router, Static Export) |
| **Language** | TypeScript (strict, 40+ interfaces) |
| **Styling** | Tailwind CSS 3.4 + tailwindcss-animate |
| **UI Primitives** | Radix UI (Dialog, Dropdown, Tabs, Tooltip, ScrollArea, Toggle, Avatar, Separator) |
| **Animations** | Framer Motion |
| **Icons** | Lucide React (575+) |
| **Theming** | next-themes + custom CSS variable system |
| **Real-Time** | Socket.io (client + server) |
| **ID Generation** | nanoid |
| **Metadata API** | TMDB (The Movie Database) v3 |
| **Deployment** | GitHub Pages (static HTML export) |

### Project Structure

```
lolflix/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home page — rails, hero, search
│   ├── layout.tsx                # Root layout — providers, fonts, theme
│   ├── globals.css               # Global styles + Tailwind directives
│   ├── watch/
│   │   ├── page.tsx              # Watch room page (query-param routing)
│   │   ├── WatchRoomClient.tsx   # Full watch room client component
│   │   └── new/page.tsx          # Room creation/join modal
│   ├── watchlist/page.tsx        # Personal watchlist grid
│   └── stats/page.tsx            # Analytics & achievements dashboard
├── components/                   # 40+ React components
│   ├── VidkingPlayer.tsx         # Core video player with multi-source fallback
│   ├── HeroBanner.tsx            # Auto-rotating hero with trailers
│   ├── DetailModal.tsx           # Full media detail overlay
│   ├── EpisodeSelector.tsx       # Season/episode picker with thumbnails
│   ├── MediaGrid.tsx             # Responsive content grid
│   ├── MediaRail.tsx             # Horizontal scrolling rail
│   ├── MediaCard.tsx             # Content card component
│   ├── MediaPosterCard.tsx       # Poster-style card variant
│   ├── Top10Rail.tsx             # Numbered ranking rail
│   ├── Navbar.tsx                # Top navigation with search
│   ├── SearchBar.tsx             # Search input component
│   ├── AdvancedSearch.tsx        # Filter modal (genre, decade, runtime, etc.)
│   ├── WatchWizard.tsx           # Interactive mood-based content picker
│   ├── ChatSidebar.tsx           # Watch party chat + user list
│   ├── RoomModal.tsx             # Party room creation/join
│   ├── JoinRoomDialog.tsx        # Quick room join dialog
│   ├── SettingsDropdown.tsx      # App settings menu
│   ├── ThemeToggle.tsx           # Dark/Darker/AMOLED switcher
│   ├── SchemeProvider.tsx        # Accent color CSS variable injection
│   ├── ThemeProvider.tsx         # next-themes wrapper
│   ├── Toast.tsx                 # Notification toast system
│   ├── IntroAnimation.tsx        # App intro splash screen
│   ├── Logo.tsx                  # LOLFLIX branding
│   └── ui/                       # Shared UI primitives (Button, Input, Skeleton, etc.)
├── lib/                          # Utility libraries
│   ├── tmdb.ts                   # TMDB API client (30+ endpoints)
│   ├── settings.ts               # App settings read/write
│   ├── history.ts                # Watch history, progress, sessions, ratings, shelves
│   ├── socket.ts                 # Socket.io client connection manager
│   ├── recommend.ts              # ML-based recommendation scoring engine
│   └── utils.ts                  # Shared utility functions
├── contexts/                     # React Context providers
│   └── TVModeContext.tsx          # TV mode state management
├── types/                        # TypeScript type definitions
│   └── index.ts                  # 40+ interfaces for TMDB, rooms, chat, etc.
├── server/
│   └── socket-server.js          # Node.js Socket.io server for watch parties
├── public/
│   └── .nojekyll                 # GitHub Pages Jekyll bypass
├── next.config.mjs               # Static export + image config
├── tailwind.config.ts            # Tailwind theme extensions
└── tsconfig.json                 # TypeScript configuration
```

### How It Works — Deep Dive

#### Content Discovery Pipeline

When you load LOLFLIX, the homepage fires off parallel requests to the TMDB API to populate all content rails. The `lib/tmdb.ts` module exposes 30+ typed API methods covering search, trending, discover, details, credits, videos, recommendations, and more. Each rail component (`MediaRail`, `Top10Rail`, etc.) independently fetches its own data, so the page loads progressively — you see content appearing rail by rail rather than waiting for everything.

The **Advanced Search** system builds TMDB Discover API queries dynamically based on your selected filters. You can combine genre, decade, runtime, minimum rating, and sort order into a single query. The search also supports filtering to only show items in your watchlist or excluding items you've already watched.

The **Watch Wizard** takes a different approach — it's a guided, multi-step flow that narrows down content based on your current mood, how much time you have, and whether you want a movie or show. It then randomly selects from the top results matching your criteria, making every recommendation feel fresh.

The **Recommendation Engine** (`lib/recommend.ts`) uses a scoring algorithm that considers:
- Genre frequency from your watch history (genre-weighted scoring)
- Watchlist items get a 1.5x intent weight boost
- Recency decay over a 30-day window
- Rating bonus for content rated 7.0+ on TMDB
- Automatic exclusion of recently watched and watchlisted items to keep recommendations novel

#### Video Playback & Source Fallback

The `VidkingPlayer` component is the heart of the playback experience. It manages an iframe-based video player that cycles through **3 different embed sources**:

1. **Source 1 (Vidking)** — The primary embed provider. Supports movies and TV shows with season/episode parameters
2. **Source 2 (Vidsrc)** — First fallback. Activated if Source 1 fails to load within 15 seconds
3. **Source 3 (Additional fallback)** — Second fallback. Activated if Source 2 also fails

The player monitors load state with a 15-second timeout per source. If the current source doesn't respond in time, it automatically advances to the next. Users can also manually cycle sources using the source selector in the player controls.

**Ad & Popup Blocking**: The embed sources used by these players are well-known for aggressive advertising — popup windows, redirect chains, overlay ads, and even scam pages. LOLFLIX implements iframe-level protections that intercept and suppress these behaviors. The result is a clean, ad-free viewing experience even though the underlying sources are ad-supported. **Zero ads. Zero popups. Zero scam redirects. Guaranteed.**

#### Real-Time Watch Party System

The watch party feature is powered by a Socket.io server (`server/socket-server.js`) running on Node.js. Here's the flow:

1. **Room Creation**: A user clicks "Create Room" which generates an 8-character room code via `nanoid`. The user is connected to the Socket.io server and emits a `join-room` event with the room code, display name, and current media info
2. **Room State**: The server maintains room state including connected users, host designation, current media, and playback position. When a new user joins, they receive the full room state to sync up
3. **Playback Sync**: Player events (play, pause, seek, timeupdate) are broadcast to all room members. A 3-second sync tolerance prevents minor buffering differences from causing constant re-syncing. The host's playback state is authoritative
4. **Chat**: Messages are broadcast to all room members in real-time. System messages announce joins, leaves, host changes, and episode switches
5. **Host Management**: The first user to create a room becomes the host. If the host disconnects, the server automatically promotes the next user. Only the host can change episodes in TV show mode
6. **Cleanup**: When all users leave a room, the server cleans up the room state

The entire party system is **opt-in** via the Party Mode toggle in settings. When disabled, no socket connections are made and the app functions as a pure client-side experience.

#### Data Persistence Model

All user data is stored in the browser's `localStorage` under namespaced keys:

| Key | Purpose | Limit |
|-----|---------|-------|
| `pplnetflix_settings` | App settings (theme, scheme, layout, autoplay, speed, party mode) | 1 object |
| `lolflix_watchlist_v1` | Saved movies and shows | Unlimited |
| `streamparty_recently_played_v1` | Recently watched items | 100 items |
| `streamparty_progress_v1` | Playback progress (time, season, episode) | 50 items |
| `lolflix_ratings_v1` | Star ratings, rewatch tags, notes | Unlimited |
| `lolflix_not_interested_v1` | Hidden/dismissed titles | Unlimited |
| `lolflix_shelves_v1` | Custom user-created collections | Unlimited |
| `lolflix_pinned_genres_v1` | Pinned genre IDs for homepage rails | Unlimited |
| `lolflix_watch_sessions_v1` | Session logs for analytics | Unlimited |

No accounts. No sign-ups. No backend database. Your data stays on your device.

#### Static Export & Deployment

LOLFLIX is configured as a fully static Next.js export (`output: "export"` in `next.config.mjs`). The `npm run build` command generates a complete static site in the `out/` directory — pure HTML, CSS, and JavaScript files that can be served from any static hosting provider. The deployment target is GitHub Pages with:

- `trailingSlash: true` for GitHub Pages compatibility
- `images: { unoptimized: true }` since there's no server for Next.js Image Optimization
- A `.nojekyll` file to prevent GitHub Pages from ignoring the `_next/` directory
- Query-parameter-based routing (`/watch?room=abc123`) instead of dynamic path segments for full static compatibility

---

## The 3 Video Sources Explained

LOLFLIX does not host any video content. Instead, it embeds video from 3 independent third-party providers. This multi-source architecture is critical for reliability:

| Priority | Source | Fallback Trigger |
|----------|--------|-----------------|
| 1 (Primary) | **Vidking** | — |
| 2 (First Fallback) | **Vidsrc** | If Source 1 fails to load within 15 seconds |
| 3 (Second Fallback) | **Additional Provider** | If Source 2 also fails within 15 seconds |

- Each source supports both movies and TV shows with full season/episode parameters
- The player automatically cycles through sources on failure — no manual intervention needed
- You can also manually switch sources using the source selector in the player UI
- All 3 sources support the same TMDB ID-based lookup, so switching is seamless with no content mismatch

This triple-redundancy means that even if one or two providers experience downtime, you can still watch your content. It's rare for all 3 to be down simultaneously.

---

## Getting Started — Full Setup Guide

### Prerequisites

- **Node.js** 18+ and **npm** 8+
- A free **TMDB API key** (get one at [themoviedb.org](https://www.themoviedb.org/settings/api))

### Installation

```bash
# Clone the repository
git clone https://github.com/1300Sarthak/lolflix.git
cd lolflix

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_BASE_URL=https://api.themoviedb.org/3
NEXT_PUBLIC_TMDB_IMAGE_BASE=https://image.tmdb.org/t/p

# Optional: Watch Party socket server
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Running Locally

```bash
# Development mode (Next.js + Socket.io server)
npm run dev

# Or run just the Next.js dev server (no watch party)
npm run dev:next

# Or run just the socket server
npm run socket
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### Building for Production

```bash
# Build static export
npm run build

# Output is in the out/ directory — deploy anywhere
```

The `out/` folder contains a complete static site. Upload it to GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, or any static file host.

### Downloading & Self-Hosting All Features

To get the **full feature set** including watch parties:

1. Clone the repo and install dependencies as above
2. Set up all environment variables in `.env.local`
3. Run `npm run dev` which starts both the Next.js app and the Socket.io server concurrently
4. For production, deploy the static build to any hosting provider and run the socket server (`node server/socket-server.js`) on a Node.js host (Railway, Render, Fly.io, your own VPS, etc.)
5. Point `NEXT_PUBLIC_SOCKET_URL` to your deployed socket server URL

Everything is self-contained in this single repository. No external services beyond TMDB are required.

---

## Deployment

LOLFLIX is now live and deployed at:

### **[https://1300sarthak.github.io/lolflix/](https://1300sarthak.github.io/lolflix/)**

The site is deployed as a static HTML export on GitHub Pages. Every push to the `master` branch triggers a rebuild and deploy. The entire app — all 40+ components, all content rails, the full player, watchlist, stats, everything — is served as static files with zero server costs.

---

## Ad-Free Guarantee

**LOLFLIX is 100% ad-free. No exceptions. No compromises.**

The third-party embed sources that power video playback on sites like these are infamous for aggressive, invasive advertising. We're talking full-screen popup ads, redirect chains to scam sites, fake "virus detected" warnings, overlay ads that cover the video, and auto-opening new tabs. It's a terrible user experience and potentially dangerous.

LOLFLIX blocks all of it. The player implements iframe-level protections that intercept and suppress every ad injection, popup attempt, and redirect chain from the embed sources. The result:

- **Zero ads** — No banner ads, no video ads, no overlay ads, nothing
- **Zero popups** — No new windows, no new tabs, no redirect chains
- **Zero scam pages** — No fake virus warnings, no "you've won a prize" pages
- **Zero tracking scripts** — The embed sources can't inject their analytics into your browsing session

This isn't a "we try to block most ads" situation. This is a **confirmed, guaranteed, completely ad-free experience**. Every embed source has been tested and verified. You press play, you watch your content, and nothing else happens. That's it.

---

## What's Next — New Features Are Always Coming

LOLFLIX is under active, continuous development. New features, improvements, and refinements are being shipped regularly. The site at [https://1300sarthak.github.io/lolflix/](https://1300sarthak.github.io/lolflix/) is constantly updated with the latest changes. Some areas of ongoing development include:

- Additional video source providers for even greater redundancy
- Enhanced recommendation algorithms with collaborative filtering
- Expanded analytics and viewing insights
- Performance optimizations and bundle size reductions
- Additional keyboard shortcuts and accessibility improvements
- More theme options and customization controls
- Mobile-optimized touch gestures for the player
- Offline watchlist and history sync
- And much more...

If you have feature requests, ideas, or feedback — open an issue on this repository. Contributions and suggestions are always welcome.

---

## License & Legal

This project is provided as-is for **educational and research purposes only**. The developer does not claim ownership of any media content accessible through the platform. All content is provided by third-party embed services. The developer is not responsible for the content, availability, or legality of any media accessed through those services. Users are solely responsible for ensuring their use of this application complies with all applicable local, state, national, and international laws and regulations.

---

**Made by Sarthak** | [GitHub](https://github.com/1300Sarthak)
