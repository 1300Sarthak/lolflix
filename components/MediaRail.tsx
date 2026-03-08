"use client"

import { MediaPosterCard } from "@/components/MediaPosterCard"
import type { TMDBMedia } from "@/types"
import type { CardLayout } from "@/lib/settings"

const LAYOUT_TO_SIZE: Record<CardLayout, "sm" | "md" | "lg" | "cinematic"> = {
  compact: "sm",
  comfortable: "md",
  cinematic: "cinematic",
}

const LAYOUT_TO_GAP: Record<CardLayout, string> = {
  compact: "gap-1",
  comfortable: "gap-1 md:gap-1.5",
  cinematic: "gap-2 md:gap-3",
}

export function MediaRail({
  title,
  items,
  mediaType,
  size,
  cardLayout,
  emptyMessage,
  isLoading = false,
  onDetailOpen,
}: {
  title: string
  items: TMDBMedia[]
  mediaType: "movie" | "tv"
  size?: "sm" | "md" | "lg" | "cinematic"
  cardLayout?: CardLayout
  emptyMessage?: string
  isLoading?: boolean
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
}) {
  const resolvedSize = size || (cardLayout ? LAYOUT_TO_SIZE[cardLayout] : "md")
  const gapClass = cardLayout ? LAYOUT_TO_GAP[cardLayout] : "gap-1 md:gap-1.5"

  if (isLoading) {
    return (
      <section className="space-y-1">
        <div className="px-4 md:px-12">
          <h2 className="text-base md:text-lg font-bold text-[#e5e5e5]">{title}</h2>
        </div>
        <div className={`flex ${gapClass} px-4 md:px-12`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shrink-0 w-32 sm:w-36 aspect-[2/3] rounded bg-white/5 animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (!items?.length) {
    if (!emptyMessage) return null
    return (
      <section className="space-y-2 px-4 md:px-12">
        <h2 className="text-base md:text-lg font-bold text-white">{title}</h2>
        <p className="text-sm text-white/50">{emptyMessage}</p>
      </section>
    )
  }

  return (
    <section className="space-y-1">
      <div className="px-4 md:px-12">
        <h2 className="text-base md:text-lg font-bold text-[#e5e5e5] hover:text-white transition-colors cursor-default">
          {title}
        </h2>
      </div>
      <div className={`flex ${gapClass} overflow-x-auto pb-4 px-4 md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
        {items.map((item, idx) => (
          <MediaPosterCard
            key={`${mediaType}-${item.id}`}
            item={item}
            mediaType={mediaType}
            index={idx}
            size={resolvedSize}
            onDetailOpen={onDetailOpen}
          />
        ))}
      </div>
    </section>
  )
}
