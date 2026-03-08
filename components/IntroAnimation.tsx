"use client"

import { useState, useEffect, useRef } from "react"

export function IntroAnimation({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false)
  const [animationDone, setAnimationDone] = useState(false)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startAnimation = () => {
    setNeedsInteraction(false)
    setShowIntro(true)

    if (audioRef.current) {
      audioRef.current.play().catch(() => {})
    }

    timerRef.current = setTimeout(() => {
      setShowIntro(false)
      sessionStorage.setItem("lolflix_intro_shown", "1")
      setTimeout(() => setAnimationDone(true), 500)
    }, 3400)
  }

  useEffect(() => {
    const shown = sessionStorage.getItem("lolflix_intro_shown")
    if (shown) {
      setAnimationDone(true)
      return
    }

    const audio = new Audio("/lmao.mp3")
    audio.volume = 0.7
    audioRef.current = audio

    const playAttempt = audio.play()
    if (playAttempt !== undefined) {
      playAttempt
        .then(() => {
          setShowIntro(true)
          timerRef.current = setTimeout(() => {
            setShowIntro(false)
            sessionStorage.setItem("lolflix_intro_shown", "1")
            setTimeout(() => setAnimationDone(true), 500)
          }, 3400)
        })
        .catch(() => {
          setNeedsInteraction(true)
        })
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (animationDone) return <>{children}</>

  if (needsInteraction) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
        <button
          onClick={startAnimation}
          className="flex flex-col items-center gap-6 cursor-pointer group"
        >
          <span
            className="font-extrabold uppercase text-5xl sm:text-7xl md:text-8xl tracking-wider select-none transition-all duration-300 group-hover:drop-shadow-[0_0_40px_rgba(229,9,20,0.6)]"
            style={{ color: "#E50914", letterSpacing: "0.06em" }}
          >
            lolflix
          </span>
          <span className="text-white/50 text-sm animate-pulse">Click to enter</span>
        </button>
      </div>
    )
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 ${
          showIntro ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="lolflix-intro-logo">
          <span
            className="font-extrabold uppercase text-5xl sm:text-7xl md:text-8xl tracking-wider select-none"
            style={{
              color: "#E50914",
              letterSpacing: "0.06em",
            }}
          >
            lolflix
          </span>
        </div>
      </div>
      <style jsx>{`
        .lolflix-intro-logo {
          animation: netflixZoom 3.4s ease-out forwards;
        }
        @keyframes netflixZoom {
          0% {
            transform: scale(3);
            opacity: 0;
            filter: brightness(0);
          }
          15% {
            opacity: 1;
            filter: brightness(1.5);
          }
          30% {
            transform: scale(1.1);
            filter: brightness(1);
          }
          45% {
            transform: scale(1);
          }
          70% {
            transform: scale(1);
            opacity: 1;
            filter: drop-shadow(0 0 40px rgba(229, 9, 20, 0.8))
              drop-shadow(0 0 80px rgba(229, 9, 20, 0.4));
          }
          100% {
            transform: scale(0.95);
            opacity: 1;
            filter: drop-shadow(0 0 20px rgba(229, 9, 20, 0.5));
          }
        }
      `}</style>
    </>
  )
}
