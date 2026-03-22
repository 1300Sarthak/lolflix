"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import {
  PictureInPicture2,
  SkipForward,
  ChevronDown,
  Zap,
  ZapOff,
  Maximize,
  Keyboard,
  MonitorPlay,
  Download,
} from "lucide-react"
import { loadSettings } from "@/lib/settings"
import type { PlayerEvent } from "@/types"

interface VidkingPlayerProps {
  tmdbId: number
  mediaType: "movie" | "tv"
  season?: number
  episode?: number
  startProgress?: number
  color?: string
  autoplay?: boolean
  onProgressUpdate?: (data: PlayerEvent) => void
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3]

const SANDBOX_STRICT = "allow-scripts allow-same-origin allow-forms allow-presentation"

const FALLBACK_SOURCES = [
  { name: "vidking", sandbox: SANDBOX_STRICT, buildUrl: (id: number, type: string, s: number, e: number, color: string, autoplay: boolean) =>
    type === "movie"
      ? `https://www.vidking.net/embed/movie/${id}?color=${color}&autoPlay=${autoplay}`
      : `https://www.vidking.net/embed/tv/${id}/${s}/${e}?color=${color}&autoPlay=${autoplay}&nextEpisode=true&episodeSelector=true`
  },
  { name: "vidfast", sandbox: null as string | null, buildUrl: (id: number, type: string, s: number, e: number) =>
    type === "movie"
      ? `https://vidfast.pro/movie/${id}?autoPlay=true`
      : `https://vidfast.pro/tv/${id}/${s}/${e}?autoPlay=true&nextButton=true&autoNext=true`
  },
  { name: "vidsrc", sandbox: SANDBOX_STRICT, buildUrl: (id: number, type: string, s: number, e: number) =>
    type === "movie"
      ? `https://vidsrc.cc/v2/embed/movie/${id}`
      : `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`
  },
]

// Number of initial clicks on the iframe to absorb (ad triggers)
const CLICKS_TO_ABSORB = 2

export function VidkingPlayer({
  tmdbId,
  mediaType,
  season = 1,
  episode = 1,
  startProgress,
  color = "E50914",
  autoplay = true,
  onProgressUpdate,
}: VidkingPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const iframeContainerRef = useRef<HTMLDivElement>(null)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [currentSpeed, setCurrentSpeed] = useState(1)
  const [autoplayOn, setAutoplayOn] = useState(autoplay)
  const [inPiP, setInPiP] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [sourceIndex, setSourceIndex] = useState(0)
  const [showSourceMenu, setShowSourceMenu] = useState(false)
  const [showDownload, setShowDownload] = useState(false)
  const [clickShieldActive, setClickShieldActive] = useState(true)
  const clickCountRef = useRef(0)
  const speedMenuRef = useRef<HTMLDivElement>(null)
  const sourceMenuRef = useRef<HTMLDivElement>(null)
  const pipRef = useRef(false)
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Reset click shield when source changes
  useEffect(() => {
    clickCountRef.current = 0
    setClickShieldActive(true)
  }, [sourceIndex])

  // Click shield handler — absorbs first N clicks to eat ad triggers,
  // then removes itself so the real player controls work
  const handleShieldClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    clickCountRef.current += 1
    if (clickCountRef.current >= CLICKS_TO_ABSORB) {
      setClickShieldActive(false)
    }
  }, [])

  // Block popups/ads at the page level
  useEffect(() => {
    const origOpen = window.open
    window.open = function (...args: Parameters<typeof window.open>) {
      if (pipRef.current) {
        return origOpen.apply(this, args)
      }
      return null
    }

    // Detect and refocus when iframe tries to open popup/new tab
    const handleBlur = () => {
      if (pipRef.current) return
      setTimeout(() => window.focus(), 50)
    }
    window.addEventListener("blur", handleBlur)

    // Block beforeunload navigations triggered by ad scripts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pipRef.current) return
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.open = origOpen
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(e.target as Node)) {
        setShowSpeedMenu(false)
      }
      if (sourceMenuRef.current && !sourceMenuRef.current.contains(e.target as Node)) {
        setShowSourceMenu(false)
      }
    }
    if (showSpeedMenu || showSourceMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showSpeedMenu, showSourceMenu])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const iframe = iframeRef.current
      const container = iframeContainerRef.current
      if (!iframe || !container) return

      switch (e.key.toLowerCase()) {
        case " ":
        case "k":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "TOGGLE_PLAY" }), "*")
          break
        case "f":
          e.preventDefault()
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            container.requestFullscreen()
          }
          break
        case "arrowleft":
        case "j":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "SEEK", offset: -10 }), "*")
          break
        case "arrowright":
        case "l":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "SEEK", offset: 10 }), "*")
          break
        case "arrowup":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "VOLUME", delta: 0.1 }), "*")
          break
        case "arrowdown":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "VOLUME", delta: -0.1 }), "*")
          break
        case "m":
          e.preventDefault()
          iframe.contentWindow?.postMessage(JSON.stringify({ type: "TOGGLE_MUTE" }), "*")
          break
        case "?":
          e.preventDefault()
          setShowShortcuts((prev) => !prev)
          break
        case "escape":
          setShowShortcuts(false)
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Multi-source fallback: if no PLAYER_EVENT within 15s, try next source (only if enabled)
  useEffect(() => {
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
    const { autoSourceSwitch } = loadSettings()
    if (!autoSourceSwitch) return
    fallbackTimerRef.current = setTimeout(() => {
      if (sourceIndex < FALLBACK_SOURCES.length - 1) {
        setSourceIndex((prev) => prev + 1)
      }
    }, 15000)
    return () => { if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current) }
  }, [sourceIndex])

  // Clear fallback timer on player events
  const handleMessageWithFallback = useCallback(
    (event: MessageEvent) => {
      if (typeof event.data !== "string") return
      try {
        const parsed = JSON.parse(event.data)
        if (parsed.type === "PLAYER_EVENT") {
          if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current)
          // Player is working — drop the shield if still up
          setClickShieldActive(false)
          onProgressUpdate?.(parsed.data)
        }
      } catch {}
    },
    [onProgressUpdate]
  )

  useEffect(() => {
    window.addEventListener("message", handleMessageWithFallback)
    return () => window.removeEventListener("message", handleMessageWithFallback)
  }, [handleMessageWithFallback])

  const currentSource = FALLBACK_SOURCES[sourceIndex]
  let src = currentSource.buildUrl(tmdbId, mediaType, season, episode, color, autoplayOn)
  if (startProgress && startProgress > 0) {
    src += `${src.includes("?") ? "&" : "?"}progress=${Math.floor(startProgress)}`
  }

  const downloadUrl = mediaType === "movie"
    ? `https://vidvault.ru/movie/${tmdbId}`
    : `https://vidvault.ru/tv/${tmdbId}/${season}/${episode}`

  const handleSkipRecap = () => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify({ type: "SEEK", offset: 60 }), "*")
  }

  const handlePiP = async () => {
    const iframe = iframeRef.current
    const container = iframeContainerRef.current
    if (!iframe || !container) return

    try {
      if ("documentPictureInPicture" in window) {
        pipRef.current = true
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pipWindow = await (window as unknown as Record<string, any>).documentPictureInPicture.requestWindow({
          width: 640,
          height: 360,
        })
        pipRef.current = false

        const style = pipWindow.document.createElement("style")
        style.textContent = `
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { background: #000; overflow: hidden; width: 100vw; height: 100vh; }
          iframe { width: 100%; height: 100%; border: none; display: block; }
        `
        pipWindow.document.head.appendChild(style)

        iframe.style.position = "static"
        iframe.style.width = "100%"
        iframe.style.height = "100%"
        pipWindow.document.body.appendChild(iframe)
        setInPiP(true)

        pipWindow.addEventListener("pagehide", () => {
          iframe.style.position = "absolute"
          iframe.style.inset = "0"
          iframe.style.width = "100%"
          iframe.style.height = "100%"
          container.appendChild(iframe)
          setInPiP(false)
        })
      } else {
        pipRef.current = true
        window.open(src, "_blank", "width=800,height=450,menubar=no,toolbar=no")
        pipRef.current = false
      }
    } catch (err) {
      pipRef.current = false
      console.error("PiP failed:", err)
    }
  }

  const handleSkipIntro = () => {
    onProgressUpdate?.({
      event: "seeked",
      currentTime: (startProgress || 0) + 90,
      duration: 0,
      progress: 0,
      id: String(tmdbId),
      mediaType,
      season,
      episode,
      timestamp: Date.now(),
    })
  }

  const handleSpeedChange = (speed: number) => {
    setCurrentSpeed(speed)
    setShowSpeedMenu(false)
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: "SET_PLAYBACK_RATE", rate: speed }),
        "*"
      )
    }
  }

  const handleFullscreen = () => {
    const container = iframeContainerRef.current
    if (!container) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  return (
    <div className="w-full">
      <div ref={iframeContainerRef} className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-black">
        {inPiP && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60 z-10">
            <PictureInPicture2 className="h-8 w-8" />
            <p className="text-sm font-medium">Playing in Picture-in-Picture</p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          key={src}
          src={src}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; web-share; accelerometer; gyroscope"
          {...(currentSource.sandbox ? { sandbox: currentSource.sandbox } : {})}
          referrerPolicy="origin"
          title="Video Player"
        />

        {/* Click shield — sits on top of iframe, absorbs first N clicks (ad triggers) */}
        {clickShieldActive && (
          <div
            className="absolute inset-0 z-10 cursor-pointer"
            onClick={handleShieldClick}
          />
        )}

        {/* Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div
            className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
            onClick={() => setShowShortcuts(false)}
          >
            <div className="bg-[#181818] rounded-lg p-6 max-w-sm">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Keyboard className="h-5 w-5" />
                Keyboard Shortcuts
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-white/60">Space / K</div>
                <div className="text-white">Play/Pause</div>
                <div className="text-white/60">F</div>
                <div className="text-white">Fullscreen</div>
                <div className="text-white/60">M</div>
                <div className="text-white">Mute</div>
                <div className="text-white/60">&larr; / J</div>
                <div className="text-white">Seek -10s</div>
                <div className="text-white/60">&rarr; / L</div>
                <div className="text-white">Seek +10s</div>
                <div className="text-white/60">&uarr; / &darr;</div>
                <div className="text-white">Volume Up/Down</div>
                <div className="text-white/60">?</div>
                <div className="text-white">Show this help</div>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="mt-4 w-full py-2 bg-[#E50914] text-white rounded font-medium hover:bg-[#E50914]/90 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-[#0c0c0c] border-t border-white/[0.06] rounded-b-xl px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoplayOn(!autoplayOn)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
              autoplayOn
                ? "text-[#E50914] bg-[#E50914]/10"
                : "text-white/50 hover:text-white/70 hover:bg-white/5"
            }`}
            aria-label={autoplayOn ? "Autoplay on" : "Autoplay off"}
          >
            {autoplayOn ? <Zap className="h-3.5 w-3.5" /> : <ZapOff className="h-3.5 w-3.5" />}
            Autoplay
          </button>

          {mediaType === "tv" && (
            <>
              <button
                onClick={handleSkipIntro}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                aria-label="Skip intro"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip Intro
              </button>
              <button
                onClick={handleSkipRecap}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors duration-150 cursor-pointer"
                aria-label="Skip recap"
              >
                <SkipForward className="h-3.5 w-3.5" />
                Skip Recap
              </button>
            </>
          )}

          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            aria-label="Show keyboard shortcuts"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Download button */}
          <button
            onClick={() => setShowDownload(!showDownload)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer text-white/50 hover:text-white/70 hover:bg-white/5"
            aria-label="Download"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>

          {/* Source selector */}
          <div className="relative" ref={sourceMenuRef}>
            <button
              onClick={() => setShowSourceMenu(!showSourceMenu)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer text-white/50 hover:text-white/70 hover:bg-white/5"
              aria-label="Switch source"
            >
              <MonitorPlay className="h-3.5 w-3.5" />
              {currentSource.name}
              <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showSourceMenu ? "rotate-180" : ""}`} />
            </button>
            {showSourceMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 bg-[#1a1a1a] rounded-lg border border-white/10 py-1 min-w-[100px] shadow-xl z-30">
                {FALLBACK_SOURCES.map((source, idx) => (
                  <button
                    key={source.name}
                    onClick={() => { setSourceIndex(idx); setShowSourceMenu(false) }}
                    className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      sourceIndex === idx
                        ? "text-[#E50914] bg-[#E50914]/10 font-semibold"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {source.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer ${
                currentSpeed !== 1
                  ? "text-[#E50914] bg-[#E50914]/10"
                  : "text-white/50 hover:text-white/70 hover:bg-white/5"
              }`}
              aria-label="Playback speed"
            >
              {currentSpeed}x
              <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${showSpeedMenu ? "rotate-180" : ""}`} />
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full right-0 mb-1.5 bg-[#1a1a1a] rounded-lg border border-white/10 py-1 min-w-[72px] shadow-xl z-30">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`w-full px-3 py-1.5 text-xs text-left transition-colors cursor-pointer ${
                      currentSpeed === s
                        ? "text-[#E50914] bg-[#E50914]/10 font-semibold"
                        : "text-white/70 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleFullscreen}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            aria-label="Fullscreen"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handlePiP}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-white/50 hover:text-white/70 hover:bg-white/5 transition-colors duration-150 cursor-pointer"
            aria-label="Picture in picture"
          >
            <PictureInPicture2 className="h-3.5 w-3.5" />
            PiP
          </button>
        </div>
      </div>

      {/* Download overlay */}
      {showDownload && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-[#0c0c0c] border-b border-white/10">
            <span className="text-sm font-medium text-white">Download via VidVault</span>
            <button
              onClick={() => setShowDownload(false)}
              className="text-white/60 hover:text-white text-sm px-3 py-1 bg-white/10 rounded cursor-pointer hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
          <div className="flex-1 relative">
            <iframe
              src={downloadUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-downloads"
              referrerPolicy="origin"
              title="Download"
            />
          </div>
        </div>
      )}
    </div>
  )
}
