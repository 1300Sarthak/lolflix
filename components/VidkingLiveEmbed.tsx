"use client"

const LIVE_SRC = process.env.NEXT_PUBLIC_VIDKING_LIVE_URL

export function VidkingLiveEmbed() {
  if (!LIVE_SRC) return null

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Live Now</h2>
      </div>
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-border">
        <iframe
          src={LIVE_SRC}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="origin"
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          title="Vidking Livestream"
        />
      </div>
    </section>
  )
}

