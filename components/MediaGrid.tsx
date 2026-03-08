"use client"

import { MediaCard } from "@/components/MediaCard"
import { Skeleton } from "@/components/ui/skeleton"
import type { TMDBMedia } from "@/types"

interface MediaGridProps {
  items: TMDBMedia[]
  mediaType: "movie" | "tv"
  isLoading: boolean
}

function MediaCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl overflow-hidden bg-card border border-border">
      <Skeleton className="aspect-[2/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function MediaGrid({ items, mediaType, isLoading }: MediaGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 18 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p className="text-lg">No results found</p>
        <p className="text-sm mt-1">Try a different search term</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, i) => (
        <MediaCard key={item.id} item={item} mediaType={mediaType} index={i} />
      ))}
    </div>
  )
}
