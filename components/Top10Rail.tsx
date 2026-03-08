"use client"

import Image from "next/image"
import { tmdb } from "@/lib/tmdb"
import type { TMDBMedia, TMDBMovie, TMDBShow } from "@/types"

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

export function Top10Rail({
  title,
  items,
  mediaType,
  onDetailOpen,
}: {
  title: string
  items: TMDBMedia[]
  mediaType: "movie" | "tv"
  onDetailOpen?: (item: TMDBMedia, mediaType: "movie" | "tv") => void
}) {
  if (!items?.length) return null
  const top10 = items.slice(0, 10)

  return (
    <section className="space-y-1">
      <div className="px-4 md:px-12">
        <h2 className="text-base md:text-lg font-bold text-[#e5e5e5]">{title}</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-4 px-4 md:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {top10.map((item, idx) => {
          const posterUrl = tmdb.imageUrl(item.poster_path, "w342")
          const itemTitle = isMovie(item) ? item.title : (item as TMDBShow).name
          return (
            <button
              key={item.id}
              onClick={() => onDetailOpen?.(item, mediaType)}
              className="group relative shrink-0 flex items-end cursor-pointer"
              aria-label={itemTitle}
            >
              <span
                className="text-[5rem] sm:text-[6rem] font-black leading-none select-none"
                style={{
                  color: "transparent",
                  WebkitTextStroke: "2px rgba(255,255,255,0.3)",
                  marginRight: "-12px",
                  zIndex: 1,
                }}
              >
                {idx + 1}
              </span>
              <div className="relative w-24 sm:w-28 aspect-[2/3] rounded overflow-hidden bg-[#2a2a2a] group-hover:scale-105 transition-transform duration-300">
                {posterUrl && (
                  <Image src={posterUrl} alt={itemTitle} fill sizes="120px" className="object-cover" loading="lazy" />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
