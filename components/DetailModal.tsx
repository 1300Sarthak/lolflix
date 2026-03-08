"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  X, Play, Plus, Check, Star, Eye, EyeOff, Ban,
  ChevronDown, FolderPlus, Clock, Tag, Volume2, VolumeX,
} from "lucide-react"
import { tmdb } from "@/lib/tmdb"
import { getRating, setRating as saveRating, setNote, setRewatchTag, setWatchedStatus, isWatched as isItemWatched, type RewatchTag } from "@/lib/ratings"
import { isInWatchlist, toggleWatchlist, toWatchlistItemFromTMDB } from "@/lib/watchlist"
import { hideTitle, isHidden } from "@/lib/not-interested"
import { getShelves, addToShelf, type ShelfItem } from "@/lib/shelves"
import { useToast } from "@/components/Toast"
import type { TMDBMedia, TMDBMovie, TMDBShow, TMDBMovieDetails, TMDBShowDetails, TMDBPerson, TMDBCollection, TMDBSeason, TMDBEpisode } from "@/types"

function isShow(item: TMDBMedia): item is TMDBShow {
  return "name" in item
}

function isMovie(item: TMDBMedia): item is TMDBMovie {
  return "title" in item
}

interface DetailModalProps {
  item: TMDBMedia | null
  mediaType: "movie" | "tv"
  onClose: () => void
}

export function DetailModal({ item, mediaType, onClose }: DetailModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [details, setDetails] = useState<TMDBMovieDetails | TMDBShowDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [inList, setInList] = useState(false)
  const [, setHidden] = useState(false)
  const [userStars, setUserStars] = useState<number>(0)
  const [userNote, setUserNote] = useState("")
  const [rewatchStatus, setRewatchStatus] = useState<RewatchTag | undefined>()
  const [watched, setWatched] = useState(false)
  const [showShelves, setShowShelves] = useState(false)
  const [collection, setCollection] = useState<TMDBCollection | null>(null)
  const [personCredits, setPersonCredits] = useState<{ name: string; movies: TMDBMedia[] } | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null)
  const [selectedEpisode, setSelectedEpisode] = useState<number | null>(null)
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeason | null>(null) // Added state for mute functionality

  const title = item ? (isMovie(item) ? item.title : isShow(item) ? item.name : "") : ""
  const tmdbId = item?.id || 0

  useEffect(() => {
    if (!item) return
    setLoading(true)
    setDetails(null)
    setCollection(null)
    setPersonCredits(null)

    const existing = getRating(item.id, mediaType)
    setUserStars(existing?.stars || 0)
    setUserNote(existing?.note || "")
    setRewatchStatus(existing?.rewatchTag)
    setWatched(existing?.watchedStatus === "watched")
    setInList(isInWatchlist(item.id, mediaType))
    setHidden(isHidden(item.id, mediaType))

    const fetchDetails = async () => {
      try {
        const data = mediaType === "movie"
          ? await tmdb.getMovieDetails(item.id)
          : await tmdb.getShowDetails(item.id)
        setDetails(data)

        if (mediaType === "tv" && (data as TMDBShowDetails).seasons?.length > 0) {
          const firstSeason = (data as TMDBShowDetails).seasons.find(s => s.season_number === 1) || (data as TMDBShowDetails).seasons[0]
          setSelectedSeason(firstSeason.season_number)
        }

        if (mediaType === "movie" && (data as TMDBMovieDetails).belongs_to_collection) {
          try {
            const col = await tmdb.getCollection((data as TMDBMovieDetails).belongs_to_collection!.id)
            setCollection(col)
          } catch {}
        }
      } catch (err) {
        console.error("Failed to load details", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDetails()
  }, [item, mediaType])

  useEffect(() => {
    if (mediaType === "tv" && item && selectedSeason !== null) {
      let isCancelled = false
      const fetchSeason = async () => {
        try {
          const data = await tmdb.getSeason(item.id, selectedSeason)
          if (!isCancelled) {
            setSeasonDetails(data)
            if (data.episodes?.length > 0) {
              setSelectedEpisode(data.episodes[0].episode_number)
            } else {
              setSelectedEpisode(null)
            }
          }
        } catch (err) {
          console.error("Failed to load season details", err)
          if (!isCancelled) {
            setSeasonDetails(null)
            setSelectedEpisode(null)
          }
        }
      }
      fetchSeason()
      return () => { isCancelled = true }
    } else {
      setSeasonDetails(null)
      setSelectedEpisode(null)
    }
  }, [item, mediaType, selectedSeason])

  const handlePlay = () => {
    if (!item) return
    let url = `/watch/new?tmdb=${item.id}&type=${mediaType}`
    if (mediaType === "tv" && selectedSeason !== null && selectedEpisode !== null) {
      url += `&season=${selectedSeason}&episode=${selectedEpisode}`
    }
    router.push(url)
    onClose()
  }

  const handleWatchlistToggle = () => {
    if (!item) return
    const added = toggleWatchlist(toWatchlistItemFromTMDB(item, mediaType))
    setInList(added)
    toast(added ? "Added to My List" : "Removed from My List")
  }

  const handleHide = () => {
    if (!item) return
    hideTitle(item.id, mediaType)
    setHidden(true)
    toast("Hidden from recommendations")
    onClose()
  }

  const handleStarClick = (stars: number) => {
    setUserStars(stars)
    saveRating({ tmdbId, mediaType, stars: stars as 1|2|3|4|5 })
    toast(`Rated ${stars} star${stars > 1 ? "s" : ""}`)
  }

  const handleNoteBlur = () => {
    setNote(tmdbId, mediaType, userNote)
  }

  const handleRewatchTag = (tag: RewatchTag) => {
    setRewatchStatus(tag)
    setRewatchTag(tmdbId, mediaType, tag)
    toast(tag === "rewatch" ? "Tagged as Rewatch" : "Tagged as One & Done")
  }

  const handleWatchedToggle = () => {
    const next = !watched
    setWatched(next)
    setWatchedStatus(tmdbId, mediaType, next ? "watched" : "unwatched")
    toast(next ? "Marked as Watched" : "Marked as Unwatched")
  }

  const handleAddToShelf = (shelfId: string, shelfName: string) => {
    if (!item) return
    const shelfItem: ShelfItem = { tmdbId: item.id, mediaType, title, poster_path: item.poster_path, addedAt: Date.now() }
    addToShelf(shelfId, shelfItem)
    setShowShelves(false)
    toast(`Added to "${shelfName}"`)
  }

  const handlePersonClick = useCallback(async (person: TMDBPerson) => {
    try {
      const data = await tmdb.getPersonDetails(person.id)
      setPersonCredits({
        name: data.name,
        movies: [...(data.movie_credits?.cast || []), ...(data.tv_credits?.cast || [])].slice(0, 20),
      })
    } catch {}
  }, [])

  const toggleMute = () => {
    setIsMuted((prev) => !prev)
  }

  const trailer = details?.videos?.results?.find((v) => v.type === "Trailer" && v.site === "YouTube")
  const runtime = details && "runtime" in details ? (details as TMDBMovieDetails).runtime : (details as TMDBShowDetails)?.episode_run_time?.[0]
  const genres = details?.genres || []
  const cast = details?.credits?.cast?.slice(0, 12) || []
  const directors = details?.credits?.crew?.filter((c) => c.job === "Director") || []
  const similar = details?.similar?.results?.slice(0, 10) || []
  const year = item ? (isMovie(item) ? item.release_date?.split("-")[0] : isShow(item) ? item.first_air_date?.split("-")[0] : "") : ""
  const rating = item?.vote_average?.toFixed(1)

  const warningKeywords = ["gore", "violence", "sexual content", "drug use", "nudity", "suicide", "self-harm", "flashing lights", "blood", "torture", "abuse", "death", "murder", "sexual abuse", "rape", "animal cruelty"]
  const keywords = details && "keywords" in details
    ? ((details as TMDBMovieDetails).keywords?.keywords || (details as TMDBShowDetails).keywords?.results || [])
    : []
  const warnings = keywords.filter((k) => warningKeywords.some((w) => k.name.toLowerCase().includes(w)))

  if (!item) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          className="relative max-w-3xl mx-auto mt-8 mb-16 bg-[#181818] rounded-lg overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-4 right-4 z-20 bg-[#181818] rounded-full p-1.5 cursor-pointer hover:bg-white/20 transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>

          <div className="relative w-full aspect-video bg-black">
            {trailer ? (
              <>
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1`}
                  className="w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Trailer"
                />
                <div className="absolute bottom-4 right-6 z-10">
                  <button
                    onClick={toggleMute}
                    className="p-2 border-2 border-white/40 rounded-full text-white/60 hover:text-white hover:border-white transition-all cursor-pointer"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                </div>
              </>
            ) : item.backdrop_path ? (
              <Image src={tmdb.backdropUrl(item.backdrop_path)!} alt={title} fill className="object-cover" sizes="100vw" />
            ) : null}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#181818] to-transparent" />
            <div className="absolute bottom-4 left-6 right-6 flex items-end gap-3">
              <button onClick={handlePlay} className="flex items-center gap-2 bg-white text-black font-bold px-6 py-2 rounded cursor-pointer hover:bg-white/80 active:scale-[0.97] transition-all">
                <Play className="h-5 w-5 fill-black" /> Play
              </button>
              <button onClick={handleWatchlistToggle} className="p-2 rounded-full border border-white/40 text-white hover:border-white active:scale-[0.97] transition-all cursor-pointer">
                {inList ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </button>
              <button onClick={handleWatchedToggle} className="p-2 rounded-full border border-white/40 text-white hover:border-white active:scale-[0.97] transition-all cursor-pointer" title={watched ? "Mark Unwatched" : "Mark Watched"}>
                {watched ? <Eye className="h-5 w-5 text-green-400" /> : <EyeOff className="h-5 w-5" />}
              </button>
              <button onClick={handleHide} className="p-2 rounded-full border border-white/40 text-white hover:border-white active:scale-[0.97] transition-all cursor-pointer" title="Not Interested">
                <Ban className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {mediaType === "tv" && details && (details as TMDBShowDetails).seasons?.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <select
                      value={selectedSeason || ""}
                      onChange={(e) => setSelectedSeason(Number(e.target.value))}
                      className="appearance-none bg-[#2a2a2a] text-white px-4 py-2 rounded-md pr-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/30"
                    >
                      {(details as TMDBShowDetails).seasons.map((s) => (
                        <option key={s.id} value={s.season_number}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                  </div>
                </div>

                {seasonDetails && seasonDetails.episodes && seasonDetails.episodes.length > 0 && (
                  <div className="space-y-3">
                    {seasonDetails.episodes.map((episode) => (
                      <motion.div
                        key={episode.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-colors ${selectedEpisode === episode.episode_number ? "bg-white/10" : "hover:bg-white/5"}`}
                        onClick={() => setSelectedEpisode(episode.episode_number)}
                      >
                        <span className="text-lg font-bold w-8 text-center">{episode.episode_number}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{episode.name}</h3>
                          <p className="text-sm text-white/70 line-clamp-2">{episode.overview}</p>
                        </div>
                        {episode.still_path && (
                          <Image
                            src={tmdb.imageUrl(episode.still_path, "w185")!}
                            alt={episode.name}
                            width={120}
                            height={67}
                            className="rounded-md object-cover"
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 flex-wrap text-sm">
              {rating && Number(rating) > 0 && <span className="text-green-400 font-semibold">{rating}</span>}
              {year && <span className="text-white/60">{year}</span>}
              {runtime && <span className="text-white/60 flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{runtime}m</span>}
              {genres.map((g) => (
                <span key={g.id} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded">{g.name}</span>
              ))}
            </div>

            {warnings.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                {warnings.map((w) => (
                  <span key={w.id} className="text-xs bg-red-900/30 text-red-300 px-2 py-0.5 rounded flex items-center gap-1">
                    <Tag className="h-3 w-3" />{w.name}
                  </span>
                ))}
              </div>
            )}

            <p className="text-sm text-white/80 leading-relaxed">{item.overview}</p>

            {directors.length > 0 && (
              <p className="text-sm text-white/50">
                Director{directors.length > 1 ? "s" : ""}: <span className="text-white/80">{directors.map((d) => d.name).join(", ")}</span>
              </p>
            )}

            <div className="space-y-2">
              <span className="text-sm font-medium text-white">Your Rating</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleStarClick(s)} className="cursor-pointer p-0.5">
                    <Star className={`h-6 w-6 transition-colors ${s <= userStars ? "text-yellow-400 fill-yellow-400" : "text-white/20"}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => handleRewatchTag("rewatch")} className={`text-xs px-3 py-1.5 rounded cursor-pointer transition-colors ${rewatchStatus === "rewatch" ? "bg-green-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>Rewatch</button>
              <button onClick={() => handleRewatchTag("one-and-done")} className={`text-xs px-3 py-1.5 rounded cursor-pointer transition-colors ${rewatchStatus === "one-and-done" ? "bg-orange-600 text-white" : "bg-white/10 text-white/60 hover:bg-white/15"}`}>One &amp; Done</button>
            </div>

            <div className="space-y-1">
              <span className="text-sm font-medium text-white">Private Note</span>
              <textarea value={userNote} onChange={(e) => setUserNote(e.target.value)} onBlur={handleNoteBlur} placeholder="Add a note..."
                className="w-full bg-white/5 border border-white/10 rounded p-2 text-sm text-white placeholder:text-white/30 resize-none h-16 focus:outline-none focus:border-white/30" />
            </div>

            <div className="relative">
              <button onClick={() => setShowShelves(!showShelves)} className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors cursor-pointer">
                <FolderPlus className="h-4 w-4" /> Add to Shelf
                <ChevronDown className={`h-3 w-3 transition-transform ${showShelves ? "rotate-180" : ""}`} />
              </button>
              {showShelves && (
                <div className="absolute top-full left-0 mt-1 bg-[#222] border border-white/10 rounded-lg py-1 min-w-[200px] z-10 shadow-xl">
                  {getShelves().length === 0 && <p className="px-3 py-2 text-xs text-white/40">No shelves yet. Create one in settings.</p>}
                  {getShelves().map((shelf) => (
                    <button key={shelf.id} onClick={() => handleAddToShelf(shelf.id, shelf.name)} className="w-full text-left px-3 py-2 text-sm text-white/70 hover:bg-white/5 cursor-pointer">{shelf.name}</button>
                  ))}
                </div>
              )}
            </div>

            {cast.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-white">Cast</span>
                <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {cast.map((person) => (
                    <button key={person.id} onClick={() => handlePersonClick(person)} className="flex flex-col items-center gap-1 shrink-0 w-16 cursor-pointer group">
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10">
                        {person.profile_path ? (
                          <Image src={tmdb.imageUrl(person.profile_path, "w185")!} alt={person.name} width={56} height={56} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">{person.name[0]}</div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/60 text-center line-clamp-1 group-hover:text-white transition-colors">{person.name}</span>
                      {person.character && <span className="text-[9px] text-white/30 text-center line-clamp-1">{person.character}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {personCredits && (
              <div className="space-y-2 bg-white/5 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">Films by {personCredits.name}</span>
                  <button onClick={() => setPersonCredits(null)} className="text-white/40 hover:text-white cursor-pointer"><X className="h-4 w-4" /></button>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {personCredits.movies.filter((m) => m.poster_path).map((m) => (
                    <div key={m.id} className="shrink-0 w-24">
                      <div className="relative aspect-[2/3] rounded overflow-hidden bg-white/10">
                        <Image src={tmdb.imageUrl(m.poster_path, "w185")!} alt={isMovie(m) ? m.title : isShow(m) ? m.name : ""} fill className="object-cover" sizes="96px" />
                      </div>
                      <p className="text-[10px] text-white/60 mt-1 truncate">{isMovie(m) ? m.title : isShow(m) ? m.name : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collection && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-white">{collection.name} - Watch Order</span>
                <div className="space-y-1">
                  {collection.parts
                    .sort((a, b) => ((isMovie(a) ? a.release_date : "") || "").localeCompare((isMovie(b) ? b.release_date : "") || ""))
                    .map((part, idx) => {
                      const partTitle = isMovie(part) ? part.title : isShow(part) ? part.name : ""
                      const partYear = isMovie(part) ? part.release_date?.split("-")[0] : ""
                      const partWatched = isItemWatched(part.id, "movie")
                      return (
                        <div key={part.id} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/5">
                          <span className="text-white/40 font-mono text-sm w-6">{idx + 1}</span>
                          {partWatched ? <Check className="h-4 w-4 text-green-400 shrink-0" /> : <div className="w-4 h-4 rounded-full border border-white/20 shrink-0" />}
                          <span className={`text-sm flex-1 ${partWatched ? "text-white/50" : "text-white"}`}>{partTitle}</span>
                          <span className="text-xs text-white/40">{partYear}</span>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {similar.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-white">More Like This</span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {similar.filter((s) => s.poster_path).map((s) => (
                    <div key={s.id} className="relative aspect-[2/3] rounded overflow-hidden bg-white/10">
                      <Image src={tmdb.imageUrl(s.poster_path, "w185")!} alt="" fill className="object-cover" sizes="150px" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {loading && <p className="text-sm text-white/30 text-center py-8">Loading details...</p>}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
