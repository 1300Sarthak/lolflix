"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Star, Play } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { tmdb } from "@/lib/tmdb"
import type { TMDBMedia, TMDBMovie } from "@/types"

interface MediaCardProps {
  item: TMDBMedia
  mediaType: "movie" | "tv"
  index: number
}

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

export function MediaCard({ item, mediaType, index }: MediaCardProps) {
  const router = useRouter()
  const title = isMovie(item) ? item.title : item.name
  const year = isMovie(item)
    ? item.release_date?.split("-")[0]
    : item.first_air_date?.split("-")[0]
  const posterUrl = tmdb.imageUrl(item.poster_path)
  const rating = item.vote_average?.toFixed(1)

  const handleClick = () => {
    router.push(`/watch/new?tmdb=${item.id}&type=${mediaType}`)
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      onClick={handleClick}
      className="group relative flex flex-col rounded-xl overflow-hidden bg-card border border-border hover:border-primary/40 transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-left"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No poster
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-250 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-250 bg-primary/90 rounded-full p-3">
            <Play className="h-6 w-6 text-primary-foreground fill-primary-foreground" />
          </div>
        </div>

        {rating && Number(rating) > 0 && (
          <Badge className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white border-0 gap-1 text-[11px]">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {rating}
          </Badge>
        )}
      </div>
      <div className="p-3 flex-1">
        <h3 className="font-medium text-sm leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-200">
          {title}
        </h3>
        {year && (
          <p className="text-xs text-muted-foreground mt-1">{year}</p>
        )}
      </div>
    </motion.button>
  )
}
